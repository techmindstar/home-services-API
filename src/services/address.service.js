const Address = require("../models/address.model");
const { logger } = require("../utils/logger.util");
const { NotFoundError, DatabaseError, ValidationError } = require("../utils/error.util");
const appConfig = require("../config/app.config");

class AddressService {
  async createAddress(addressData, userId) {
    try {
      logger.info('Creating new address', { userId });

      // Validate required fields
      const requiredFields = ['street', 'city', 'state', 'pincode'];
      const missingFields = requiredFields.filter(field => !addressData[field]);
      
      if (missingFields.length > 0) {
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Set user reference
      addressData.user = userId;

      const address = await Address.create(addressData);
      logger.info('Address created successfully', { addressId: address._id, userId });
      return address;
    } catch (error) {
      logger.error('Error creating address', {
        error: error.message,
        userId
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to create address');
    }
  }

  async getAllAddresses(userId, page = 1, limit = appConfig.pagination.defaultLimit) {
    try {
      logger.info('Fetching all addresses', { userId, page, limit });

      const skip = (page - 1) * limit;
      const addresses = await Address.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Address.countDocuments({ user: userId });

      logger.info('Addresses fetched successfully', {
        count: addresses.length,
        total,
        page,
        limit,
        userId
      });

      return {
        addresses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching addresses', {
        error: error.message,
        userId,
        page,
        limit
      });
      throw new DatabaseError('Failed to fetch addresses');
    }
  }

  async getAddress(addressId, userId) {
    try {
      logger.info('Fetching address by ID', { addressId, userId });

      const address = await Address.findOne({ _id: addressId, user: userId });

      if (!address) {
        logger.warn('Address not found', { addressId, userId });
        throw new NotFoundError('Address not found');
      }

      logger.info('Address fetched successfully', { addressId, userId });
      return address;
    } catch (error) {
      logger.error('Error fetching address', {
        error: error.message,
        addressId,
        userId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch address');
    }
  }

  async updateAddress(addressId, userId, updateData) {
    try {
      logger.info('Updating address', { addressId, userId });

      // Filter allowed fields
      const allowedFields = ['street', 'city', 'state', 'pincode', 'isDefault'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      const address = await Address.findOneAndUpdate(
        { _id: addressId, user: userId },
        { $set: filteredData },
        { new: true, runValidators: true }
      );

      if (!address) {
        logger.warn('Address not found for update', { addressId, userId });
        throw new NotFoundError('Address not found');
      }

      logger.info('Address updated successfully', { addressId, userId });
      return address;
    } catch (error) {
      logger.error('Error updating address', {
        error: error.message,
        addressId,
        userId,
        updateData
      });

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to update address');
    }
  }

  async deleteAddress(addressId, userId) {
    try {
      logger.info('Deleting address', { addressId, userId });

      const address = await Address.findOneAndDelete({ _id: addressId, user: userId });

      if (!address) {
        logger.warn('Address not found for deletion', { addressId, userId });
        throw new NotFoundError('Address not found');
      }

      logger.info('Address deleted successfully', { addressId, userId });
      return address;
    } catch (error) {
      logger.error('Error deleting address', {
        error: error.message,
        addressId,
        userId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to delete address');
    }
  }
}

module.exports = AddressService; 