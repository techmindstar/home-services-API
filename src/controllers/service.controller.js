const ServiceService = require("../services/service.service");
const { logger } = require("../utils/logger.util");
const appConfig = require("../config/app.config");

const serviceService = new ServiceService();

const getAllServices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    logger.info('Getting all services', { page, limit });

    const result = await serviceService.getAllServices(page, limit);

    res.status(200).json({
      status: 'success',
      results: result.services.length,
      pagination: result.pagination,
      data: { services: result.services }
    });
  } catch (error) {
    next(error);
  }
};

const getService = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Getting service by ID', { serviceId: id });

    const service = await serviceService.getService(id);

    res.status(200).json({
      status: 'success',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const serviceData = req.body;
    logger.info('Creating new service');

    const service = await serviceService.createService(serviceData);

    res.status(201).json({
      status: 'success',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    logger.info('Updating service', { serviceId: id });

    const service = await serviceService.updateService(id, updateData);

    res.status(200).json({
      status: 'success',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Deleting service', { serviceId: id });

    await serviceService.deleteService(id);

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  getService,
  createService,
  updateService,
  deleteService
}; 