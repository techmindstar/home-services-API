const Rating = require('../models/rating.model');
const Booking = require('../models/booking.model');
const Subservice = require('../models/subservice.model');
const ServiceProvider = require('../models/serviceProvider.model');
const { logger } = require('../utils/logger.util');
const { ValidationError, NotFoundError, DatabaseError } = require('../utils/error.util');

class RatingService {
  // Create rating for completed booking
  async createRating(bookingId, userId, ratingData) {
    try {
      logger.info('Creating rating for booking', { bookingId, userId });

      const booking = await Booking.findById(bookingId)
        .populate('subservices')
        .populate('services');

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // if (booking.status !== 'completed') {
      //   throw new ValidationError('Rating can only be created for completed bookings');
      // }

      if (booking.userId.toString() !== userId) {
        throw new ValidationError('You can only rate your own bookings');
      }

      // Check if rating already exists for this booking
      const existingRating = await Rating.findOne({ booking: bookingId });
      if (existingRating) {
        throw new ValidationError('Rating already exists for this booking');
      }

      const { rating, feedback } = ratingData;

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      // Validate feedback
      if (!feedback || feedback.length < 10) {
        throw new ValidationError('Feedback must be at least 10 characters long');
      }

      if (feedback.length > 500) {
        throw new ValidationError('Feedback must not exceed 500 characters');
      }

      const ratings = [];

      // Create ratings for each subservice
      for (const subserviceId of booking.subservices) {
        const subservice = await Subservice.findById(subserviceId);
        if (!subservice) {
          logger.warn('Subservice not found for rating creation', { subserviceId });
          continue;
        }

        const ratingDoc = new Rating({
          booking: bookingId,
          user: userId,
          serviceProvider: booking.serviceProviderId,
          subservice: subserviceId,
          service: subservice.serviceId,
          rating: rating,
          feedback: feedback,
          status: 'pending'
        });

        await ratingDoc.save();
        ratings.push(ratingDoc);

        logger.info('Rating created successfully', {
          bookingId,
          subserviceId,
          rating,
          feedbackLength: feedback.length
        });
      }

      return ratings;
    } catch (error) {
      logger.error('Failed to create rating for booking', {
        error: error.message,
        bookingId,
        userId
      });
      throw error;
    }
  }

  // Get user's ratings
  async getUserRatings(userId, status = null) {
    try {
      logger.info('Fetching user ratings', { userId, status });

      const query = { user: userId };
      if (status) {
        query.status = status;
      }

      const ratings = await Rating.find(query)
        .populate('subservice', 'name description')
        .populate('service', 'name')
        .populate('booking', 'date time')
        .sort({ createdAt: -1 });

      logger.info('User ratings fetched successfully', {
        userId,
        count: ratings.length
      });

      return ratings;
    } catch (error) {
      logger.error('Failed to fetch user ratings', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Get rating by ID
  async getRating(ratingId) {
    try {
      logger.info('Fetching rating', { ratingId });

      const rating = await Rating.findById(ratingId)
        .populate('subservice', 'name description')
        .populate('service', 'name')
        .populate('booking', 'date time')
        .populate('user', 'name phoneNumber')
        .populate('reviewedBy', 'name');

      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      logger.info('Rating fetched successfully', { ratingId });
      return rating;
    } catch (error) {
      logger.error('Failed to fetch rating', {
        error: error.message,
        ratingId
      });
      throw error;
    }
  }

  // Update rating (user can update their own rating)
  async updateRating(ratingId, userId, updateData) {
    try {
      logger.info('Updating rating', { ratingId, userId });

      const rating = await Rating.findById(ratingId);
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      if (rating.user.toString() !== userId) {
        throw new ValidationError('You can only update your own ratings');
      }

      if (rating.status !== 'pending') {
        throw new ValidationError('Cannot update approved or rejected ratings');
      }

      const { rating: newRating, feedback } = updateData;

      // Validate rating
      if (newRating && (newRating < 1 || newRating > 5)) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      // Validate feedback
      if (feedback) {
        if (feedback.length < 10) {
          throw new ValidationError('Feedback must be at least 10 characters long');
        }
        if (feedback.length > 500) {
          throw new ValidationError('Feedback must not exceed 500 characters');
        }
      }

      const updatedRating = await Rating.findByIdAndUpdate(
        ratingId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('subservice', 'name description')
       .populate('service', 'name')
       .populate('booking', 'date time');

      logger.info('Rating updated successfully', { ratingId });
      return updatedRating;
    } catch (error) {
      logger.error('Failed to update rating', {
        error: error.message,
        ratingId,
        userId
      });
      throw error;
    }
  }

  // Delete rating (user can delete their own rating)
  async deleteRating(ratingId, userId) {
    try {
      logger.info('Deleting rating', { ratingId, userId });

      const rating = await Rating.findById(ratingId);
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      if (rating.user.toString() !== userId) {
        throw new ValidationError('You can only delete your own ratings');
      }

      if (rating.status !== 'pending') {
        throw new ValidationError('Cannot delete approved or rejected ratings');
      }

      await Rating.findByIdAndDelete(ratingId);

      logger.info('Rating deleted successfully', { ratingId });
      return { message: 'Rating deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete rating', {
        error: error.message,
        ratingId,
        userId
      });
      throw error;
    }
  }

  // Approve/Reject rating (Admin only)
  async reviewRating(ratingId, adminId, reviewData) {
    try {
      logger.info('Reviewing rating', { ratingId, adminId });

      const rating = await Rating.findById(ratingId);
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      const { status, reviewNote } = reviewData;

      if (!['approved', 'rejected'].includes(status)) {
        throw new ValidationError('Status must be either approved or rejected');
      }

      if (reviewNote && reviewNote.length > 200) {
        throw new ValidationError('Review note must not exceed 200 characters');
      }

      rating.status = status;
      rating.reviewedBy = adminId;
      rating.reviewedAt = new Date();
      if (reviewNote) {
        rating.reviewNote = reviewNote;
      }

      await rating.save();

      // Update service provider rating if rating is approved
      if (status === 'approved' && rating.serviceProvider) {
        try {
          const serviceProvider = await ServiceProvider.findById(rating.serviceProvider);
          if (serviceProvider) {
            serviceProvider.updateRatingStats(rating.rating);
            await serviceProvider.save();
            logger.info('Service provider rating updated', {
              providerId: rating.serviceProvider,
              newRating: rating.rating
            });
          }
        } catch (error) {
          logger.error('Failed to update service provider rating', {
            error: error.message,
            providerId: rating.serviceProvider,
            ratingId: ratingId
          });
        }
      }

      logger.info('Rating reviewed successfully', { ratingId, status });
      return rating;
    } catch (error) {
      logger.error('Failed to review rating', {
        error: error.message,
        ratingId,
        adminId
      });
      throw error;
    }
  }

  // Get average rating for subservice
  async getAverageRatingForSubservice(subserviceId) {
    try {
      logger.info('Calculating average rating for subservice', { subserviceId });

      const result = await Rating.aggregate([
        { 
          $match: { 
            subservice: new require('mongoose').Types.ObjectId(subserviceId),
            status: 'approved'
          } 
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      if (result.length === 0) {
        return {
          subserviceId,
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
          }
        };
      }

      const stats = result[0];
      
      // Calculate rating distribution
      const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      stats.ratingDistribution.forEach(rating => {
        distribution[rating.toString()]++;
      });

      const finalStats = {
        subserviceId,
        averageRating: Math.round(stats.averageRating * 100) / 100,
        totalRatings: stats.totalRatings,
        ratingDistribution: distribution
      };

      logger.info('Average rating calculated successfully', {
        subserviceId,
        averageRating: finalStats.averageRating,
        totalRatings: finalStats.totalRatings
      });

      return finalStats;
    } catch (error) {
      logger.error('Failed to calculate average rating for subservice', {
        error: error.message,
        subserviceId
      });
      throw error;
    }
  }

  // Get average ratings for all subservices
  async getAverageRatingsForAllSubservices() {
    try {
      logger.info('Calculating average ratings for all subservices');

      const result = await Rating.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$subservice',
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        },
        {
          $lookup: {
            from: 'subservices',
            localField: '_id',
            foreignField: '_id',
            as: 'subservice'
          }
        },
        {
          $unwind: '$subservice'
        },
        {
          $project: {
            subserviceId: '$_id',
            subserviceName: '$subservice.name',
            averageRating: { $round: ['$averageRating', 2] },
            totalRatings: 1,
            ratingDistribution: 1
          }
        },
        { $sort: { averageRating: -1 } }
      ]);

      // Calculate rating distribution for each subservice
      const finalResult = result.map(stat => {
        const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        stat.ratingDistribution.forEach(rating => {
          distribution[rating.toString()]++;
        });
        
        return {
          ...stat,
          ratingDistribution: distribution
        };
      });

      logger.info('Average ratings calculated successfully', {
        subserviceCount: finalResult.length
      });

      return finalResult;
    } catch (error) {
      logger.error('Failed to calculate average ratings for all subservices', {
        error: error.message
      });
      throw error;
    }
  }

  // Get pending ratings (Admin only)
  async getPendingRatings(page = 1, limit = 10) {
    try {
      logger.info('Fetching pending ratings', { page, limit });

      const skip = (page - 1) * limit;
      const ratings = await Rating.find({ status: 'pending' })
        .populate('subservice', 'name description')
        .populate('service', 'name')
        .populate('user', 'name phoneNumber')
        .populate('booking', 'date time')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Rating.countDocuments({ status: 'pending' });

      logger.info('Pending ratings fetched successfully', {
        count: ratings.length,
        total,
        page,
        limit
      });

      return {
        ratings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to fetch pending ratings', {
        error: error.message,
        page,
        limit
      });
      throw error;
    }
  }

  // Get all ratings (Admin only)
  async getAllRatings(page = 1, limit = 10, status = null) {
    try {
      logger.info('Fetching all ratings', { page, limit, status });

      const query = {};
      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;
      const ratings = await Rating.find(query)
        .populate('subservice', 'name description')
        .populate('service', 'name')
        .populate('user', 'name phoneNumber')
        .populate('booking', 'date time')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Rating.countDocuments(query);

      logger.info('All ratings fetched successfully', {
        count: ratings.length,
        total,
        page,
        limit
      });

      return {
        ratings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to fetch all ratings', {
        error: error.message,
        page,
        limit
      });
      throw error;
    }
  }
}

module.exports = RatingService; 