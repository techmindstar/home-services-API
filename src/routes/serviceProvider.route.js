const express = require('express');
const router = express.Router();
const serviceProviderController = require('../controllers/serviceProvider.controller');
const { uploadMiddleware } = require('../services/s3Upload.service');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// All service provider routes require admin authentication
router.use(verifyToken, isAdmin);

// CRUD operations with file upload support
router.post('/', 
  uploadMiddleware.fields([
    { name: 'aadhaarCardImage', maxCount: 1 },
    { name: 'panCardImage', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 }
  ]), 
  serviceProviderController.createServiceProvider
);

router.get('/', serviceProviderController.getAllServiceProviders);
router.get('/:providerId', serviceProviderController.getServiceProvider);

router.put('/:providerId', 
  uploadMiddleware.fields([
    { name: 'aadhaarCardImage', maxCount: 1 },
    { name: 'panCardImage', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 }
  ]), 
  serviceProviderController.updateServiceProvider
);

router.delete('/:providerId', serviceProviderController.deleteServiceProvider);

// Admin management operations
router.put('/:providerId/verify', serviceProviderController.verifyServiceProvider);
router.put('/:providerId/suspend', serviceProviderController.suspendServiceProvider);

// Document verification operations
router.put('/:providerId/verify-documents', serviceProviderController.verifyDocuments);

// Booking assignment operations
router.post('/available', serviceProviderController.getAvailableProviders);
router.put('/:providerId/assign/:bookingId', serviceProviderController.assignToBooking);

// Statistics
router.get('/:providerId/stats', serviceProviderController.getProviderStats);

module.exports = router; 