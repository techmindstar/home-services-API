const User = require('../models/user.model.js');
const { logger } = require('../utils/logger.util');
const { NotFoundError, ValidationError, DatabaseError } = require('../utils/error.util');

class UserService {
  async getUser(userId) {
    try {
      logger.info('Fetching user profile', { userId });
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        logger.warn('User not found', { userId });
        throw new NotFoundError('User not found');
      }

      logger.info('User profile fetched successfully', { userId });
      return user;
    } catch (error) {
      logger.error('Error fetching user profile', {
        error: error.message,
        userId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch user profile');
    }
  }

  async updateUser(userId, updateData) {
    try {
      logger.info('Updating user profile', { userId, fields: Object.keys(updateData) });
      
      // Filter allowed fields
      const allowedFields = ['name', 'email', 'avatar', 'role'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        logger.warn('No valid fields to update', { userId, updateData });
        throw new ValidationError('No valid fields to update');
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: filteredData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        logger.warn('User not found for update', { userId });
        throw new NotFoundError('User not found');
      }

      logger.info('User profile updated successfully', { userId });
      return user;
    } catch (error) {
      logger.error('Error updating user profile', {
        error: error.message,
        userId,
        updateData: Object.keys(updateData)
      });

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to update user profile');
    }
  }
}

module.exports = UserService;
