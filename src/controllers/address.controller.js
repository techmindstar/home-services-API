const AddressService = require("../services/address.service");
const { logger } = require("../utils/logger.util");
const appConfig = require("../config/app.config");

const addressService = new AddressService();

// Add new address
const createAddress = async (req, res, next) => {
  try {
    const addressData = req.body;
    const userId = req.user.id;
    logger.info('Creating new address', { userId });

    const address = await addressService.createAddress(addressData, userId);

    res.status(201).json({
      status: 'success',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// Get all addresses for a user
const getAllAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    logger.info('Getting all addresses', { userId, page, limit });

    const result = await addressService.getAllAddresses(userId, page, limit);

    res.status(200).json({
      status: 'success',
      results: result.addresses.length,
      pagination: result.pagination,
      data: { addresses: result.addresses }
    });
  } catch (error) {
    next(error);
  }
};

// Get single address
const getAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;
    logger.info('Getting address by ID', { addressId: addressId, userId });

    const address = await addressService.getAddress(addressId, userId);

    res.status(200).json({
      status: 'success',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// Update address
const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    logger.info('Updating address', { addressId: addressId, userId });

    const address = await addressService.updateAddress(addressId, userId, updateData);

    res.status(200).json({
      status: 'success',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// Delete address
const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;
    logger.info('Deleting address', { addressId: addressId, userId });

   const response = await addressService.deleteAddress(addressId, userId);

    res.status(200).json({
      status: 'success',
      data: response
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAddress,
  getAllAddresses,
  getAddress,
  updateAddress,
  deleteAddress
}; 