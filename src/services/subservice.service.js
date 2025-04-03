const Subservice = require("../models/subservice.model");
const Service = require("../models/service.model");
const { logger } = require("../utils/logger.util");
const { NotFoundError, DatabaseError, ValidationError } = require("../utils/error.util");
const appConfig = require("../config/app.config");

class SubserviceService {
  async getAllSubservices(page = 1, limit = appConfig.pagination.defaultLimit) {
    try {
      logger.info('Fetching all subservices', { page, limit });

      const skip = (page - 1) * limit;
      const subservices = await Subservice.find()
        .populate('serviceId', 'name description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Subservice.countDocuments();

      logger.info('Subservices fetched successfully', {
        count: subservices.length,
        total,
        page,
        limit
      });

      return {
        subservices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching subservices', {
        error: error.message,
        page,
        limit
      });
      throw new DatabaseError('Failed to fetch subservices');
    }
  }

  async getSubservice(subserviceId) {
    try {
      logger.info('Fetching subservice by ID', { subserviceId });

      const subservice = await Subservice.findById(subserviceId)
        .populate('serviceId', 'name description');

      if (!subservice) {
        logger.warn('Subservice not found', { subserviceId });
        throw new NotFoundError('Subservice not found');
      }

      logger.info('Subservice fetched successfully', { subserviceId });
      return subservice;
    } catch (error) {
      logger.error('Error fetching subservice', {
        error: error.message,
        subserviceId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch subservice');
    }
  }

  async createSubservice(subserviceData) {
    try {
      logger.info('Creating new subservice', { subserviceData });

      // Validate required fields
      const requiredFields = ['name', 'serviceId', 'originalPrice', 'discountedPrice', 'duration'];
      const missingFields = requiredFields.filter(field => !subserviceData[field]);
      
      if (missingFields.length > 0) {
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Check if service exists
      const service = await Service.findById(subserviceData.serviceId);
      if (!service) {
        throw new NotFoundError('Service not found');
      }

      const subservice = await Subservice.create(subserviceData);
      logger.info('Subservice created successfully', { subserviceId: subservice._id });
      return subservice;
    } catch (error) {
      logger.error('Error creating subservice', {
        error: error.message,
        subserviceData
      });

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to create subservice');
    }
  }

  async updateSubservice(subserviceId, updateData) {
    try {
      logger.info('Updating subservice', { subserviceId, updateData });

      // Filter allowed fields
      const allowedFields = [
        'name', 'description', 'process', 'originalPrice', 
        'discountedPrice', 'duration'
      ];
      
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      const subservice = await Subservice.findByIdAndUpdate(
        subserviceId,
        { $set: filteredData },
        { new: true, runValidators: true }
      ).populate('serviceId', 'name description');

      if (!subservice) {
        logger.warn('Subservice not found for update', { subserviceId });
        throw new NotFoundError('Subservice not found');
      }

      logger.info('Subservice updated successfully', { subserviceId });
      return subservice;
    } catch (error) {
      logger.error('Error updating subservice', {
        error: error.message,
        subserviceId,
        updateData
      });

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to update subservice');
    }
  }

  async deleteSubservice(subserviceId) {
    try {
      logger.info('Deleting subservice', { subserviceId });

      const subservice = await Subservice.findByIdAndDelete(subserviceId);

      if (!subservice) {
        logger.warn('Subservice not found for deletion', { subserviceId });
        throw new NotFoundError('Subservice not found');
      }

      logger.info('Subservice deleted successfully', { subserviceId });
      return subservice;
    } catch (error) {
      logger.error('Error deleting subservice', {
        error: error.message,
        subserviceId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to delete subservice');
    }
  }

  async getSubservicesByService(serviceId) {
    try {
      logger.info('Fetching subservices by service', { serviceId });

      const subservices = await Subservice.find({ serviceId })
        .sort({ createdAt: -1 });

      logger.info('Subservices fetched successfully', {
        count: subservices.length,
        serviceId
      });

      return subservices;
    } catch (error) {
      logger.error('Error fetching subservices by service', {
        error: error.message,
        serviceId
      });
      throw new DatabaseError('Failed to fetch subservices');
    }
  }
}

module.exports = SubserviceService; 