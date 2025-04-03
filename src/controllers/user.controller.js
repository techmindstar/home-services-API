const UserService = require("../services/user.service");
const { logger } = require("../utils/logger.util");
const { ValidationError } = require("../utils/error.util");

const userService = new UserService();

// Get user profile
const getUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info('Getting user profile', { userId });

    const user = await userService.getUser(userId);
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    logger.info('Updating user profile', { 
      userId,
      fields: Object.keys(updateData)
    });

    // Validate update data
    if (!Object.keys(updateData).length) {
      throw new ValidationError('No update data provided');
    }

    const user = await userService.updateUser(userId, updateData);
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUser,
  updateUser
};
