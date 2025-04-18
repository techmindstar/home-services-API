const User = require("../models/user.model");
const { logger } = require("../utils/logger.util");
const { NotFoundError, DatabaseError, ValidationError, AuthenticationError } = require("../utils/error.util");
const jwt = require("jsonwebtoken");
const appConfig = require("../config/app.config");

class AdminService {
  async login(email, password) {
    try {
      logger.info('Admin login attempt', { email });

      // Find admin user
      const admin = await User.findOne({ email, role: 'admin' }).select('+password');
      if (!admin) {
        throw new AuthenticationError('Invalid email or password');
      }
      
      if (admin.password !== password) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate token
      const token = jwt.sign(
        { 
          id: admin._id,
          role: admin.role,
          email: admin.email
        },
        appConfig.JWT_SECRET,
      );

      logger.info('Admin logged in successfully', { adminId: admin._id });
      return { admin, token };
    } catch (error) {
      logger.error('Admin login failed', {
        error: error.message,
        email
      });

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new DatabaseError('Failed to login');
    }
  }

  async createAdmin(adminData, createdBy) {
    try {
      logger.info('Creating new admin', { createdBy });

      // Validate required fields
      const requiredFields = ['name', 'email', 'password'];
      const missingFields = requiredFields.filter(field => !adminData[field]);
      
      if (missingFields.length > 0) {
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Check if email already exists
      const existingAdmin = await User.findOne({ email: adminData.email });
      if (existingAdmin) {
        throw new ValidationError('Email already exists');
      }

      // Set admin role and created by
      adminData.role = 'admin';
      adminData.createdBy = createdBy;

      const admin = await User.create(adminData);
      logger.info('Admin created successfully', { adminId: admin._id });
      return admin;
    } catch (error) {
      logger.error('Error creating admin', {
        error: error.message,
        createdBy
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to create admin');
    }
  }

  async getAllAdmins(page = 1, limit = appConfig.pagination.defaultLimit) {
    try {
      logger.info('Fetching all admins', { page, limit });

      const skip = (page - 1) * limit;
      const admins = await User.find({ role: 'admin' })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments({ role: 'admin' });

      logger.info('Admins fetched successfully', {
        count: admins.length,
        total,
        page,
        limit
      });

      return {
        admins,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching admins', {
        error: error.message,
        page,
        limit
      });
      throw new DatabaseError('Failed to fetch admins');
    }
  }

  async getAdmin(adminId) {
    try {
      logger.info('Fetching admin by ID', { adminId });

      const admin = await User.findOne({ _id: adminId, role: 'admin' })
        .select('-password');

      if (!admin) {
        logger.warn('Admin not found', { adminId });
        throw new NotFoundError('Admin not found');
      }

      logger.info('Admin fetched successfully', { adminId });
      return admin;
    } catch (error) {
      logger.error('Error fetching admin', {
        error: error.message,
        adminId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch admin');
    }
  }

  async updateAdmin(adminId, updateData) {
    try {
      logger.info('Updating admin', { adminId });

      // Filter allowed fields
      const allowedFields = ['name', 'email', 'isActive'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      const admin = await User.findOneAndUpdate(
        { _id: adminId, role: 'admin' },
        { $set: filteredData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!admin) {
        logger.warn('Admin not found for update', { adminId });
        throw new NotFoundError('Admin not found');
      }

      logger.info('Admin updated successfully', { adminId });
      return admin;
    } catch (error) {
      logger.error('Error updating admin', {
        error: error.message,
        adminId,
        updateData
      });

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to update admin');
    }
  }

  async deleteAdmin(adminId, currentAdminId) {
    try {
      logger.info('Attempting to delete admin', { adminId, currentAdminId });

      // Check if current admin is a super admin
      const currentAdmin = await User.findOne({ _id: currentAdminId });
     
      // Prevent self-deletion
      if (adminId === currentAdminId) {
        logger.warn('Admin attempted to delete themselves', { adminId });
        throw new ValidationError('Cannot delete your own admin account');
      }

      const admin = await User.findOneAndDelete({ _id: adminId, role: 'admin' });

      if (!admin) {
        logger.warn('Admin not found for deletion', { adminId });
        throw new NotFoundError('Admin not found');
      }

      logger.info('Admin deleted successfully', { adminId });
      return admin;
    } catch (error) {
      logger.error('Error deleting admin', {
        error: error.message,
        adminId,
        currentAdminId
      });

      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }

      throw new DatabaseError('Failed to delete admin');
    }
  }

  async getAllUsers(page = 1, limit = appConfig.pagination.defaultLimit) {
    try {
      logger.info('Fetching all users', { page, limit });

      const skip = (page - 1) * limit;
      const users = await User.find({ role: 'user' })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments({ role: 'user' });

      logger.info('Users fetched successfully', {
        count: users.length,
        total,
        page,
        limit
      });

      return {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching users', {
        error: error.message,
        page,
        limit
      });
      throw new DatabaseError('Failed to fetch users');
    }
  }

  async getUser(userId) {
    try {
      logger.info('Fetching user by ID', { userId });

      const user = await User.findOne({ _id: userId, role: 'user' })
        .select('-password');

      if (!user) {
        logger.warn('User not found', { userId });
        throw new NotFoundError('User not found');
      }

      logger.info('User fetched successfully', { userId });
      return user;
    } catch (error) {
      logger.error('Error fetching user', {
        error: error.message,
        userId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch user');
    }
  }

  async updateUser(userId, updateData) {
    try {
      logger.info('Updating user', { userId });

      // Filter allowed fields
      const allowedFields = ['name', 'email', 'isActive'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      const user = await User.findOneAndUpdate(
        { _id: userId, role: 'user' },
        { $set: filteredData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        logger.warn('User not found for update', { userId });
        throw new NotFoundError('User not found');
      }

      logger.info('User updated successfully', { userId });
      return user;
    } catch (error) {
      logger.error('Error updating user', {
        error: error.message,
        userId,
        updateData
      });

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to update user');
    }
  }

  async deleteUser(userId) {
    try {
      logger.info('Deleting user', { userId });

      const user = await User.findOneAndDelete({ _id: userId, role: 'user' });

      if (!user) {
        logger.warn('User not found for deletion', { userId });
        throw new NotFoundError('User not found');
      }

      logger.info('User deleted successfully', { userId });
      return user;
    } catch (error) {
      logger.error('Error deleting user', {
        error: error.message,
        userId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to delete user');
    }
  }
}

module.exports = AdminService; 