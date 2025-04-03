const { logger } = require('../utils/logger.util');
const { AuthenticationError } = require('../utils/error.util');

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

module.exports = { isAdmin }; 