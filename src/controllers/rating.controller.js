const RatingService = require('../services/rating.service');
const { logger } = require('../utils/logger.util');
const { ValidationError, NotFoundError } = require('../utils/error.util');

const ratingService = new RatingService();

// Create rating for completed booking
const createRating = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const { rating, feedback } = req.body;
    console.log(req.body);  
    logger.info('Creating rating request', { 
      bookingId, 
      userId,
      rating 
    });

    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking ID is required' 
      });
    }

    if (!rating || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Rating and feedback are required'
      });
    }

    const ratings = await ratingService.createRating(bookingId, userId, { rating, feedback });
    
    logger.info('Rating created successfully', { 
      bookingId, 
      ratingCount: ratings.length 
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        bookingId,
        ratings: ratings.map(rating => ({
          id: rating._id,
          rating: rating.rating,
          feedback: rating.feedback,
          status: rating.status,
          subservice: rating.subservice,
          createdAt: rating.createdAt
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to create rating', {
      error: error.message,
      bookingId: req.params.bookingId,
      userId: req.user.id
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Get user's ratings
const getUserRatings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    logger.info('Fetching user ratings request', { 
      userId, 
      status 
    });

    const ratings = await ratingService.getUserRatings(userId, status);
    
    logger.info('User ratings fetched successfully', { 
      userId, 
      count: ratings.length 
    });

    res.status(200).json({
      success: true,
      message: 'Ratings fetched successfully',
      data: {
        ratings: ratings.map(rating => ({
          id: rating._id,
          rating: rating.rating,
          feedback: rating.feedback,
          status: rating.status,
          subservice: rating.subservice,
          service: rating.service,
          booking: rating.booking,
          reviewedBy: rating.reviewedBy,
          reviewedAt: rating.reviewedAt,
          reviewNote: rating.reviewNote,
          createdAt: rating.createdAt
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch user ratings', {
      error: error.message,
      userId: req.user.id
    });
    next(error);
  }
};

// Get rating by ID
const getRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;
    
    logger.info('Fetching rating request', { 
      ratingId, 
      userId 
    });

    if (!ratingId) {
      return res.status(400).json({
        success: false,
        message: 'Rating ID is required'
      });
    }

    const rating = await ratingService.getRating(ratingId);
    
    // Check if user owns this rating or is admin
    if (rating.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own ratings.'
      });
    }
    
    logger.info('Rating fetched successfully', { ratingId });

    res.status(200).json({
      success: true,
      message: 'Rating fetched successfully',
      data: {
        rating: {
          id: rating._id,
          rating: rating.rating,
          feedback: rating.feedback,
          status: rating.status,
          subservice: rating.subservice,
          service: rating.service,
          booking: rating.booking,
          user: rating.user,
          reviewedBy: rating.reviewedBy,
          reviewedAt: rating.reviewedAt,
          reviewNote: rating.reviewNote,
          createdAt: rating.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch rating', {
      error: error.message,
      ratingId: req.params.ratingId
    });

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Update rating
const updateRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;
    const { rating, feedback } = req.body;
    
    logger.info('Updating rating request', { 
      ratingId, 
      userId 
    });

    if (!ratingId) {
      return res.status(400).json({
        success: false,
        message: 'Rating ID is required'
      });
    }

    if (!rating && !feedback) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (rating or feedback) is required'
      });
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (feedback !== undefined) updateData.feedback = feedback;

    const updatedRating = await ratingService.updateRating(ratingId, userId, updateData);
    
    logger.info('Rating updated successfully', { ratingId });

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        rating: {
          id: updatedRating._id,
          rating: updatedRating.rating,
          feedback: updatedRating.feedback,
          status: updatedRating.status,
          subservice: updatedRating.subservice,
          service: updatedRating.service,
          booking: updatedRating.booking,
          createdAt: updatedRating.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Failed to update rating', {
      error: error.message,
      ratingId: req.params.ratingId,
      userId: req.user.id
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Delete rating
const deleteRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;
    
    logger.info('Deleting rating request', { 
      ratingId, 
      userId 
    });

    if (!ratingId) {
      return res.status(400).json({
        success: false,
        message: 'Rating ID is required'
      });
    }

    const result = await ratingService.deleteRating(ratingId, userId);
    
    logger.info('Rating deleted successfully', { ratingId });

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to delete rating', {
      error: error.message,
      ratingId: req.params.ratingId,
      userId: req.user.id
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Review rating (Admin only)
const reviewRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const adminId = req.user.id;
    const { status, reviewNote } = req.body;
    
    logger.info('Reviewing rating request', { 
      ratingId, 
      adminId,
      status 
    });

    if (!ratingId) {
      return res.status(400).json({
        success: false,
        message: 'Rating ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const reviewedRating = await ratingService.reviewRating(ratingId, adminId, { status, reviewNote });
    
    logger.info('Rating reviewed successfully', { ratingId, status });

    res.status(200).json({
      success: true,
      message: `Rating ${status} successfully`,
      data: {
        rating: {
          id: reviewedRating._id,
          rating: reviewedRating.rating,
          feedback: reviewedRating.feedback,
          status: reviewedRating.status,
          reviewedBy: reviewedRating.reviewedBy,
          reviewedAt: reviewedRating.reviewedAt,
          reviewNote: reviewedRating.reviewNote
        }
      }
    });
  } catch (error) {
    logger.error('Failed to review rating', {
      error: error.message,
      ratingId: req.params.ratingId,
      adminId: req.user.id
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Get average rating for subservice
const getAverageRatingForSubservice = async (req, res, next) => {
  try {
    const { subserviceId } = req.params;
    
    logger.info('Fetching average rating for subservice request', { 
      subserviceId 
    });

    if (!subserviceId) {
      return res.status(400).json({
        success: false,
        message: 'Subservice ID is required'
      });
    }

    const stats = await ratingService.getAverageRatingForSubservice(subserviceId);
    
    logger.info('Average rating for subservice fetched successfully', { 
      subserviceId 
    });

    res.status(200).json({
      success: true,
      message: 'Average rating statistics fetched successfully',
      data: {
        subserviceId: stats.subserviceId,
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
        ratingDistribution: stats.ratingDistribution
      }
    });
  } catch (error) {
    logger.error('Failed to fetch average rating for subservice', {
      error: error.message,
      subserviceId: req.params.subserviceId
    });
    next(error);
  }
};

// Get average ratings for all subservices
const getAverageRatingsForAllSubservices = async (req, res, next) => {
  try {
    logger.info('Fetching average ratings for all subservices request');

    const stats = await ratingService.getAverageRatingsForAllSubservices();
    
    logger.info('Average ratings for all subservices fetched successfully', {
      subserviceCount: stats.length
    });

    res.status(200).json({
      success: true,
      message: 'Average rating statistics fetched successfully',
      data: {
        subservices: stats.map(stat => ({
          subserviceId: stat.subserviceId,
          subserviceName: stat.subserviceName,
          averageRating: stat.averageRating,
          totalRatings: stat.totalRatings,
          ratingDistribution: stat.ratingDistribution
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch average ratings for all subservices', {
      error: error.message
    });
    next(error);
  }
};

// Get pending ratings (Admin only)
const getPendingRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    logger.info('Fetching pending ratings request', { 
      page, 
      limit,
      adminId: req.user.id 
    });

    const result = await ratingService.getPendingRatings(parseInt(page), parseInt(limit));
    
    logger.info('Pending ratings fetched successfully', {
      count: result.ratings.length,
      total: result.pagination.total
    });

    res.status(200).json({
      success: true,
      message: 'Pending ratings fetched successfully',
      data: {
        ratings: result.ratings.map(rating => ({
          id: rating._id,
          rating: rating.rating,
          feedback: rating.feedback,
          status: rating.status,
          subservice: rating.subservice,
          service: rating.service,
          user: rating.user,
          booking: rating.booking,
          createdAt: rating.createdAt
        })),
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error('Failed to fetch pending ratings', {
      error: error.message,
      adminId: req.user.id
    });
    next(error);
  }
};

// Get all ratings (Admin only)
const getAllRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    logger.info('Fetching all ratings request', { 
      page, 
      limit,
      status,
      adminId: req.user.id 
    });

    const result = await ratingService.getAllRatings(parseInt(page), parseInt(limit), status);
    
    logger.info('All ratings fetched successfully', {
      count: result.ratings.length,
      total: result.pagination.total
    });

    res.status(200).json({
      success: true,
      message: 'All ratings fetched successfully',
      data: {
        ratings: result.ratings.map(rating => ({
          id: rating._id,
          rating: rating.rating,
          feedback: rating.feedback,
          status: rating.status,
          subservice: rating.subservice,
          service: rating.service,
          user: rating.user,
          booking: rating.booking,
          reviewedBy: rating.reviewedBy,
          reviewedAt: rating.reviewedAt,
          reviewNote: rating.reviewNote,
          createdAt: rating.createdAt
        })),
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error('Failed to fetch all ratings', {
      error: error.message,
      adminId: req.user.id
    });
    next(error);
  }
};

module.exports = {
  createRating,
  getUserRatings,
  getRating,
  updateRating,
  deleteRating,
  reviewRating,
  getAverageRatingForSubservice,
  getAverageRatingsForAllSubservices,
  getPendingRatings,
  getAllRatings
}; 