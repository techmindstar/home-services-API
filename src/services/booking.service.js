const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const Subservice = require("../models/subservice.model");
const { logger } = require("../utils/logger.util");
const { NotFoundError, DatabaseError, ValidationError, AuthenticationError } = require("../utils/error.util");
const appConfig = require("../config/app.config");
const { sendSms } = require("../utils/twilio.util");

class BookingService {
  // Admin only methods
  async getAllBookings(page = 1, limit = appConfig.pagination.defaultLimit) {
    try {
      logger.info('Admin: Fetching all bookings', { page, limit });

      const skip = (page - 1) * limit;
      const bookings = await Booking.find()
        .populate('services', 'name description')
        .populate('subservices', 'name description price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Booking.countDocuments();

      logger.info('Admin: Bookings fetched successfully', {
        count: bookings.length,
        total,
        page,
        limit
      });

      return {
        bookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching bookings', {
        error: error.message,
        page,
        limit
      });
      throw new DatabaseError('Failed to fetch bookings');
    }
  }

  async getBooking(bookingId) {
    try {
      logger.info('Admin: Fetching booking by ID', { bookingId });

      const booking = await Booking.findById(bookingId)
        .populate('services', 'name description')
        .populate('subservices', 'name description price');

      if (!booking) {
        logger.warn('Booking not found', { bookingId });
        throw new NotFoundError('Booking not found');
      }

      logger.info('Admin: Booking fetched successfully', { bookingId });
      return booking;
    } catch (error) {
      logger.error('Error fetching booking', {
        error: error.message,
        bookingId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch booking');
    }
  }

  // User methods
  async getUserBookings(userId, page = 1, limit = appConfig.pagination.defaultLimit) {
    try {
      logger.info('User: Fetching user bookings', { userId, page, limit });

      const skip = (page - 1) * limit;
      const bookings = await Booking.find({ userId })
        .populate('services', 'name description')
        .populate('subservices', 'name description price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Booking.countDocuments({ userId });

      logger.info('User: Bookings fetched successfully', {
        count: bookings.length,
        total,
        page,
        limit,
        userId
      });

      return {
        bookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching user bookings', {
        error: error.message,
        userId,
        page,
        limit
      });
      throw new DatabaseError('Failed to fetch user bookings');
    }
  }

  async getUserBooking(userId, bookingId) {
    try {
      logger.info('User: Fetching user booking', { userId, bookingId });

      const booking = await Booking.findOne({ _id: bookingId, userId })
        .populate('services', 'name description')
        .populate('subservices', 'name description price');

      if (!booking) {
        logger.warn('Booking not found or unauthorized', { userId, bookingId });
        throw new NotFoundError('Booking not found');
      }

      logger.info('User: Booking fetched successfully', { userId, bookingId });
      return booking;
    } catch (error) {
      logger.error('Error fetching user booking', {
        error: error.message,
        userId,
        bookingId
      });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to fetch booking');
    }
  }

  async createBooking(bookingData, userId) {
    try {
      logger.info('User: Creating new booking', { userId });
  
      // Validate all service IDs
      if (!Array.isArray(bookingData.services) || bookingData.services.length === 0) {
        throw new ValidationError('At least one service must be provided');
      }
  
      const foundServices = await Service.find({ _id: { $in: bookingData.services } });
      if (foundServices.length !== bookingData.services.length) {
        throw new NotFoundError('One or more services not found');
      }
  
      // Validate all subservice IDs
      if (!Array.isArray(bookingData.subservices) || bookingData.subservices.length === 0) {
        throw new ValidationError('At least one subservice must be provided');
      }
  
      const foundSubservices = await Subservice.find({ _id: { $in: bookingData.subservices } });
      if (foundSubservices.length !== bookingData.subservices.length) {
        throw new NotFoundError('One or more subservices not found');
      }
  
      // Set additional booking fields
      bookingData.userId = userId;
      bookingData.status = 'pending';
  
      const booking = await Booking.create(bookingData);
  
      logger.info('User: Booking created successfully', {
        bookingId: booking._id,
        userId
      });
  
      return booking;
    } catch (error) {
      logger.error('Error creating booking', {
        error: error.message,
        userId
      });
  
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
  
      throw new DatabaseError('Failed to create booking');
    }
  }
  

  async updateBooking(bookingId, updateData, userId, isAdmin = false) {
    try {
      logger.info('User: Updating booking', { bookingId, userId, isAdmin });

      // Check if booking exists and user has permission
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      if (!isAdmin && existingBooking.userId.toString() !== userId) {
        throw new AuthenticationError('Not authorized to update this booking');
      }

      // Filter allowed fields based on user role
      
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('services', 'name description')
       .populate('subservices', 'name description price');

      logger.info('User: Booking updated successfully', { bookingId, userId });
      return booking;
    } catch (error) {
      logger.error('Error updating booking', {
        error: error.message,
        bookingId,
        userId
      });

      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }

      throw new DatabaseError('Failed to update booking');
    }
  }

  async deleteBooking(bookingId, userId, isAdmin = false) {
    try {
      logger.info('User: Deleting booking', { bookingId, userId, isAdmin });

      // Check if booking exists and user has permission
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      if (!isAdmin && existingBooking.userId.toString() !== userId) {
        throw new AuthenticationError('Not authorized to delete this booking');
      }

      const booking = await Booking.findByIdAndDelete(bookingId);
      logger.info('User: Booking deleted successfully', { bookingId, userId });
      return booking;
    } catch (error) {
      logger.error('Error deleting booking', {
        error: error.message,
        bookingId,
        userId
      });

      if (error instanceof NotFoundError || error instanceof AuthenticationError) {
        throw error;
      }

      throw new DatabaseError('Failed to delete booking');
    }
  }

  async rescheduleBooking(bookingId, newDate, newTime, userId) {
    try {
      logger.info('User: Rescheduling booking', { bookingId, userId });

      // Check if booking exists and user has permission
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      if (existingBooking.userId.toString() !== userId) {
        throw new AuthenticationError('Not authorized to reschedule this booking');
      }

      // Validate new date and time
      if (!newDate || !newTime) {
        throw new ValidationError('New date and time are required for rescheduling');
      }

      // Check if new date is in the past
      const newBookingDateTime = new Date(`${newDate}T${newTime}`);
      if (newBookingDateTime < new Date()) {
        throw new ValidationError('Cannot reschedule to a past date and time');
      }
console.log(newDate, newTime)
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { 
          $set: { 
            date: newDate,
            time: newTime,
          }
        },
        { new: true, runValidators: true }
      ).populate('services', 'name description')
       .populate('subservices', 'name description price');

      // // Send SMS notification for rescheduling
      // const message = `Your booking for ${booking.serviceId.name} has been rescheduled to ${newDate} at ${newTime}.`;
      // await sendSms(booking.customerPhone, message);

      logger.info('User: Booking rescheduled successfully', { bookingId, userId });
      return booking;
    } catch (error) {
      logger.error('Error rescheduling booking', {
        error: error.message,
        bookingId,
        userId
      });

      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }

      throw new DatabaseError('Failed to reschedule booking');
    }
  }

  async cancelBooking(bookingId, userId, reason) {
    try {
      logger.info('User: Cancelling booking', { bookingId, userId });

      // Check if booking exists and user has permission
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      if (existingBooking.userId.toString() !== userId) {
        throw new AuthenticationError('Not authorized to cancel this booking');
      }

      // Check if booking can be cancelled (not already cancelled or completed)
      if (existingBooking.status === 'cancelled') {
        throw new ValidationError('Booking is already cancelled');
      }

      if (existingBooking.status === 'completed') {
        throw new ValidationError('Cannot cancel a completed booking');
      }

      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { 
          $set: { 
            status: 'cancelled',
            cancellationReason: reason,
            cancelledAt: new Date()
          }
        },
        { new: true, runValidators: true }
      ).populate('services', 'name description')
       .populate('subservices', 'name description price');

      // Send SMS notification for cancellation
      // const message = `Your booking for ${booking.serviceId.name} has been cancelled. Reason: ${reason || 'Not provided'}`;
      // await sendSms(booking.customerPhone, message);

      logger.info('User: Booking cancelled successfully', { bookingId, userId });
      return booking;
    } catch (error) {
      logger.error('Error cancelling booking', {
        error: error.message,
        bookingId,
        userId
      });

      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }

      throw new DatabaseError('Failed to cancel booking');
    }
  }

  // Admin only methods
  async getBookingsByService(serviceId) {
    try {
      logger.info('Admin: Fetching bookings by service', { serviceId });

      const bookings = await Booking.find({ services: serviceId })
  .populate('services', 'name description originalPrice discountedPrice')
  .sort({ createdAt: -1 });

      logger.info('Admin: Bookings fetched successfully', {
        count: bookings.length,
        serviceId
      });

      return bookings;
    } catch (error) {
      logger.error('Error fetching bookings by service', {
        error: error.message,
        serviceId
      });
      throw new DatabaseError('Failed to fetch bookings');
    }
  }

  async getBookingsBySubservice(subserviceId) {
    try {
      logger.info('Admin: Fetching bookings by subservice', { subserviceId });

      const bookings = await Booking.find({ subservices: subserviceId })
      .populate('subservices', 'name description originalPrice discountedPrice')
      .sort({ createdAt: -1 });
    

      logger.info('Admin: Bookings fetched successfully', {
        count: bookings.length,
        subserviceId
      });

      return bookings;
    } catch (error) {
      logger.error('Error fetching bookings by subservice', {
        error: error.message,
        subserviceId
      });
      throw new DatabaseError('Failed to fetch bookings');
    }
  }
}

module.exports = BookingService; 