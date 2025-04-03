const SubserviceService = require("../services/subservice.service");
const { logger } = require("../utils/logger.util");
const appConfig = require("../config/app.config");

const subserviceService = new SubserviceService();

const getAllSubservices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || appConfig.pagination.defaultLimit;

    logger.info('Getting all subservices', { page, limit });

    const result = await subserviceService.getAllSubservices(page, limit);

    res.status(200).json({
      status: 'success',
      results: result.subservices.length,
      pagination: result.pagination,
      data: { subservices: result.subservices }
    });
  } catch (error) {
    next(error);
  }
};

const getSubservice = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Getting subservice by ID', { subserviceId: id });

    const subservice = await subserviceService.getSubservice(id);

    res.status(200).json({
      status: 'success',
      data: { subservice }
    });
  } catch (error) {
    next(error);
  }
};

const createSubservice = async (req, res, next) => {
  try {
    const subserviceData = req.body;
    logger.info('Creating new subservice');

    const subservice = await subserviceService.createSubservice(subserviceData);

    res.status(201).json({
      status: 'success',
      data: { subservice }
    });
  } catch (error) {
    next(error);
  }
};

const updateSubservice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    logger.info('Updating subservice', { subserviceId: id });

    const subservice = await subserviceService.updateSubservice(id, updateData);

    res.status(200).json({
      status: 'success',
      data: { subservice }
    });
  } catch (error) {
    next(error);
  }
};

const deleteSubservice = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Deleting subservice', { subserviceId: id });

    await subserviceService.deleteSubservice(id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const getSubservicesByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    logger.info('Getting subservices by service', { serviceId });

    const subservices = await subserviceService.getSubservicesByService(serviceId);

    res.status(200).json({
      status: 'success',
      results: subservices.length,
      data: { subservices }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSubservices,
  getSubservice,
  createSubservice,
  updateSubservice,
  deleteSubservice,
  getSubservicesByService
}; 