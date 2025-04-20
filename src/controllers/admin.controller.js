const AdminService = require("../services/admin.service");
const { logger } = require("../utils/logger.util");
const appConfig = require("../config/app.config");

const adminService = new AdminService();

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.info('Admin login attempt', { email });

    const result = await adminService.login(email, password);

    res.status(200).json({
      status: 'success',
      data: {
        admin: result.admin,
        token: result.token
      }
    });
  } catch (error) {
    next(error);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const adminData = req.body;
    const createdBy = req.user._id;
    logger.info('Creating new admin', { createdBy });

    const admin = await adminService.createAdmin(adminData, createdBy);

    res.status(201).json({
      status: 'success',
      data: { admin }
    });
  } catch (error) {
    next(error);
  }
};

const getAllAdmins = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    logger.info('Getting all admins', { page, limit });

    const result = await adminService.getAllAdmins(page, limit);

    res.status(200).json({
      status: 'success',
      results: result.admins.length,
      pagination: result.pagination,
      data: { admins: result.admins }
    });
  } catch (error) {
    next(error);
  }
};

const getAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Getting admin by ID', { adminId: id });

    const admin = await adminService.getAdmin(id);

    res.status(200).json({
      status: 'success',
      data: { admin }
    });
  } catch (error) {
    next(error);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    logger.info('Updating admin', { adminId: id });

    const admin = await adminService.updateAdmin(id, updateData);

    res.status(200).json({
      status: 'success',
      data: { admin }
    });
  } catch (error) {
    next(error);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.user._id;
    logger.info('Deleting admin', { adminId: id, currentAdminId });

    await adminService.deleteAdmin(id, currentAdminId);

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10 ;
    logger.info('Getting all users', { page, limit });

    const result = await adminService.getAllUsers(page, limit);

    res.status(200).json({
      status: 'success',
      results: result.users.length,
      pagination: result.pagination,
      data: { users: result.users }
    });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Getting user by ID', { userId: id });

    const user = await adminService.getUser(id);

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    logger.info('Updating user', { userId: id });

    const user = await adminService.updateUser(id, updateData);

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Deleting user', { userId: id });

    await adminService.deleteUser(id);

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  createAdmin,
  getAllAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
}; 