const express = require('express');
const adminController = require('../controllers/admin.controller');
const  authenticate  = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/login', adminController.login);

// Protected routes - Admin only
router.use(authenticate.verifyToken, authenticate.isAdmin);

// Admin management routes
router.post('/admins', adminController.createAdmin);
router.get('/admins', adminController.getAllAdmins);
router.get('/admins/:id', adminController.getAdmin);
router.put('/admins/:id', adminController.updateAdmin);
router.delete('/admins/:id', adminController.deleteAdmin);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router; 