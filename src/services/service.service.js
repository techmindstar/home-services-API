const Service = require("../models/service.model");
const { logger } = require("../utils/logger.util");
const { NotFoundError, DatabaseError, ValidationError } = require("../utils/error.util");
const appConfig = require("../config/app.config");
const Subservice = require("../models/subservice.model");
class ServiceService {
  async getAllServices(page = 1, limit = appConfig.pagination.defaultLimit) {
    try {
      logger.info('Fetching all services', { page, limit });

      const skip = (page - 1) * limit;
      const services = await Service.find()
        .populate('subservices')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Service.countDocuments();

      logger.info('Services fetched successfully', {
        count: services.length,
        total,
        page,
        limit
      });

      return {
        services,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching services', {
        error: error.message,
        page,
        limit
      });
      throw new DatabaseError('Failed to fetch services');
    }
  }

  async getService(serviceId) {
    try {
      logger.info('Fetching service by ID', { serviceId });

      const service = await Service.findById(serviceId)
        .populate('subservices');

      if (!service) {
        logger.warn('Service not found', { serviceId });
        throw new NotFoundError('Service not found');
      }

      logger.info('Service fetched successfully', { serviceId });
      return service;
    } catch (error) {
      logger.error('Error fetching service', {
        error: error.message,
        serviceId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch service');
    }
  }

  async createService(serviceData) {
    try {
      logger.info('Creating new service', { serviceData });

    
      const service = await Service.create(serviceData);
      logger.info('Service created successfully', { serviceId: service._id });
      return service;
    } catch (error) {
      logger.error('Error creating service', {
        error: error.message,
        serviceData
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to create service');
    }
  }

  async updateService(serviceId, updateData) {
    try {
      logger.info('Updating service', { serviceId, updateData });

     

      const service = await Service.findByIdAndUpdate(
        serviceId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('subservices');

      if (!service) {
        logger.warn('Service not found for update', { serviceId });
        throw new NotFoundError('Service not found');
      }

      logger.info('Service updated successfully', { serviceId });
      return service;
    } catch (error) {
      logger.error('Error updating service', {
        error: error.message,
        serviceId,
        updateData
      });

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to update service');
    }
  }

  async deleteService(serviceId) {
    try {
      logger.info('Deleting service', { serviceId });

      const service = await Service.findByIdAndDelete(serviceId);

      if (!service) {
        logger.warn('Service not found for deletion', { serviceId });
        throw new NotFoundError('Service not found');
      }

      logger.info('Service deleted successfully', { serviceId });
      return service;
    } catch (error) {
      logger.error('Error deleting service', {
        error: error.message,
        serviceId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to delete service');
    }
  }
}

module.exports = ServiceService; 