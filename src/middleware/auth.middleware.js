const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger.util');
const { AuthenticationError, ValidationError } = require('../utils/error.util');
const appConfig = require('../config/app.config');
const User = require('../models/user.model');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, appConfig.JWT_SECRET);

    // Add user to request
    req.user = decoded;
    logger.info('User authenticated', { userId: decoded.id });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error.message,
      path: req.path
    });

    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
      return;
    }

    next(error);
  }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    if (req.user.role !== 'admin') {
      logger.warn('Access denied: User is not an admin', {
        userId: req.user.id,
        role: req.user.role
      });
      throw new AuthenticationError('Access denied: Admin privileges required');
    }

    logger.info('Admin access granted', { userId: req.user.id });
    next();
  } catch (error) {
    logger.error('Role check failed', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

// Verify current password
const verifyCurrentPassword = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    if (!currentPassword) {
      throw new ValidationError('Current password is required');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    next();
  } catch (error) {
    logger.error('Password verification failed', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    appConfig.JWT_SECRET,
    { expiresIn: appConfig.jwt_expires_in }
  );
};

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = {
  verifyToken,
  isAdmin,
  verifyCurrentPassword,
  generateToken,
  hashPassword
}; 