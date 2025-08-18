const BookingService = require("../services/booking.service");
const ServiceProviderService = require("../services/serviceProvider.service");
const { logger } = require("../utils/logger.util");
const { ValidationError, NotFoundError } = require("../utils/error.util");
const appConfig = require("../config/app.config");

const bookingService = new BookingService();
const serviceProviderService = new ServiceProviderService();

// Admin routes
const getAllBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    logger.info('Getting all bookings', { page, limit });

    const result = await bookingService.getAllBookings(page, limit);

    res.status(200).json({
      status: 'success',
      results: result.bookings.length,
      pagination: result.pagination,
      data: { bookings: result.bookings }
    });
  } catch (error) {
    next(error);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Getting booking by ID', { bookingId: id });

    const booking = await bookingService.getBooking(id);

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// User routes
const getUserBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user.id;

    logger.info('Getting user bookings', { userId, page, limit });

    const result = await bookingService.getUserBookings(userId, page, limit);

    res.status(200).json({
      status: 'success',
      results: result.bookings.length,
      pagination: result.pagination,
      data: { bookings: result.bookings }
    });
  } catch (error) {
    next(error);
  }
};

const getUserBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    logger.info('Getting user booking', { userId, bookingId: id });

    const booking = await bookingService.getUserBooking(userId, id);

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const bookingData = req.body;
    const userId = req.user.id;
    logger.info('Creating new booking', { userId });

    const booking = await bookingService.createBooking(bookingData, userId);

    res.status(201).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    logger.info('Updating booking', { bookingId: id, userId, isAdmin });

    const booking = await bookingService.updateBooking(id, updateData, userId, isAdmin);

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    logger.info('Deleting booking', { bookingId: id, userId, isAdmin });

    await bookingService.deleteBooking(id, userId, isAdmin);

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, newTime } = req.body;
    console.log(newDate, newTime);
    const userId = req.user.id;
    logger.info('Rescheduling booking', { bookingId: id, userId });

    const booking = await bookingService.rescheduleBooking(id, newDate, newTime, userId);

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    logger.info('Cancelling booking', { bookingId: id, userId });

    const booking = await bookingService.cancelBooking(id, userId, reason);

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

const getBookingsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    logger.info('Getting bookings by service', { serviceId });

    const bookings = await bookingService.getBookingsByService(serviceId);

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

const getBookingsBySubservice = async (req, res, next) => {
  try {
    const { subserviceId } = req.params;
    logger.info('Getting bookings by subservice', { subserviceId });

    const bookings = await bookingService.getBookingsBySubservice(subserviceId);

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

// Assign service provider to booking (Admin only)
const assignServiceProvider = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { providerId } = req.body;
    const adminId = req.user.id;
    
    logger.info('Assigning service provider to booking', { 
      bookingId, 
      providerId, 
      adminId 
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID is required'
      });
    }

    const booking = await serviceProviderService.assignToBooking(providerId, bookingId, adminId);
    
    logger.info('Service provider assigned to booking successfully', { 
      bookingId, 
      providerId 
    });

    res.status(200).json({
      success: true,
      message: 'Service provider assigned to booking successfully',
      data: {
        booking: {
          id: booking._id,
          serviceProviderId: booking.serviceProviderId,
          assignedAt: booking.assignedAt,
          assignedBy: booking.assignedBy,
          status: booking.status
        }
      }
    });
  } catch (error) {
    logger.error('Failed to assign service provider to booking', {
      error: error.message,
      bookingId: req.params.bookingId,
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

module.exports = {
  // Admin routes
  getAllBookings,
  getBooking,
  // User routes
  getUserBookings,
  getUserBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  rescheduleBooking,
  cancelBooking,
  // Public routes
  getBookingsByService,
  getBookingsBySubservice,
  // Admin assignment
  assignServiceProvider
}; 