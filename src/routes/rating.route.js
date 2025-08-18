const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// User routes (require authentication)
router.post('/booking/:bookingId', verifyToken, ratingController.createRating);
router.get('/my-ratings', verifyToken, ratingController.getUserRatings);
router.get('/my-ratings/:ratingId', verifyToken, ratingController.getRating);
router.put('/my-ratings/:ratingId', verifyToken, ratingController.updateRating);
router.delete('/my-ratings/:ratingId', verifyToken, ratingController.deleteRating);

// Public routes for average ratings (no authentication required)
router.get('/average/subservice/:subserviceId', ratingController.getAverageRatingForSubservice);
router.get('/average/all-subservices', ratingController.getAverageRatingsForAllSubservices);

// Admin routes
router.get('/pending', verifyToken, isAdmin, ratingController.getPendingRatings);
router.get('/all', verifyToken, isAdmin, ratingController.getAllRatings);
router.put('/:ratingId/review', verifyToken, isAdmin, ratingController.reviewRating);

module.exports = router; 