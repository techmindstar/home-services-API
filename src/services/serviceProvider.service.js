const ServiceProvider = require('../models/serviceProvider.model');
const Booking = require('../models/booking.model');
const Service = require('../models/service.model');
const Subservice = require('../models/subservice.model');
const { logger } = require('../utils/logger.util');
const { ValidationError, NotFoundError, DatabaseError, ConflictError } = require('../utils/error.util');

class ServiceProviderService {
  // Create new service provider
  async createServiceProvider(providerData, adminId) {
    try {
      logger.info('Creating new service provider', { adminId });

      // Check if phone number already exists
      const existingPhone = await ServiceProvider.findOne({ phoneNumber: providerData.phoneNumber });
      if (existingPhone) {
        throw new ConflictError('Phone number already registered');
      }

      // Check if email already exists
      const existingEmail = await ServiceProvider.findOne({ email: providerData.email });
      if (existingEmail) {
        throw new ConflictError('Email already registered');
      }

      // Check if Aadhaar number already exists
      if(providerData.aadhaarCard){
      const existingAadhaar = await ServiceProvider.findOne({ 'aadhaarCard.number': providerData.aadhaarCard.number });
      if (existingAadhaar) {
        throw new ConflictError('Aadhaar number already registered');
      }
    }

      // Check if PAN number already exists
      if(providerData.panCard){
      const existingPAN = await ServiceProvider.findOne({ 'panCard.number': providerData.panCard.number });
      if (existingPAN) {
        throw new ConflictError('PAN number already registered');
      }
    }
      // Validate services and subservices exist
      // if (providerData.services && providerData.services.length > 0) {
      //   const services = await Service.find({ _id: { $in: providerData.services } });
      //   if (services.length !== providerData.services.length) {
      //     throw new ValidationError('One or more services not found');
      //   }
      // }

      // if (providerData.subservices && providerData.subservices.length > 0) {
      //   const subservices = await Subservice.find({ _id: { $in: providerData.subservices } });
      //   if (subservices.length !== providerData.subservices.length) {
      //     throw new ValidationError('One or more subservices not found');
      //   }
      // }

      const serviceProvider = new ServiceProvider({
        ...providerData,
        createdBy: adminId,
        status: 'verification_pending'
      });

      await serviceProvider.save();
      console.log(serviceProvider);
      logger.info('Service provider created successfully', {
        providerId: serviceProvider._id,
        name: serviceProvider.name
      });

      return serviceProvider;
    } catch (error) {
      logger.error('Failed to create service provider', {
        error: error.message,
        adminId
      });
      throw error;
    }
  }

  // Get all service providers with pagination and filters
  async getAllServiceProviders(page = 1, limit = 10, filters = {}) {
    try {
      logger.info('Fetching all service providers', { page, limit, filters });

      const query = {};
      
      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.service) {
        query.services = filters.service;
      }
      
      if (filters.subservice) {
        query.subservices = filters.subservice;
      }

      // Filter by verification status
      if (filters.verificationStatus === 'verified') {
        query.$and = [
          { 'aadhaarCard.verified': true },
          { 'panCard.verified': true }
        ];
      } else if (filters.verificationStatus === 'pending') {
        query.$or = [
          { 'aadhaarCard.verified': false },
          { 'panCard.verified': false }
        ];
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { phoneNumber: { $regex: filters.search, $options: 'i' } },
          { 'aadhaarCard.number': { $regex: filters.search, $options: 'i' } },
          { 'panCard.number': { $regex: filters.search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const serviceProviders = await ServiceProvider.find(query)
        .populate('services', 'name description')
        .populate('subservices', 'name description price')
        .populate('createdBy', 'name')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ServiceProvider.countDocuments(query);

      logger.info('Service providers fetched successfully', {
        count: serviceProviders.length,
        total,
        page,
        limit
      });

      return {
        serviceProviders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to fetch service providers', {
        error: error.message,
        page,
        limit
      });
      throw error;
    }
  }

  // Get service provider by ID
  async getServiceProvider(providerId) {
    try {
      logger.info('Fetching service provider', { providerId });

      const serviceProvider = await ServiceProvider.findById(providerId)
        .populate('services', 'name description')
        .populate('subservices', 'name description price')
        .populate('createdBy', 'name')
        .populate('verifiedBy', 'name');

      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      logger.info('Service provider fetched successfully', { providerId });
      return serviceProvider;
    } catch (error) {
      logger.error('Failed to fetch service provider', {
        error: error.message,
        providerId
      });
      throw error;
    }
  }

  // Update service provider
  async updateServiceProvider(providerId, updateData, adminId) {
    try {
      logger.info('Updating service provider', { providerId, adminId });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      // Check for duplicate phone number if being updated
      if (updateData.phoneNumber && updateData.phoneNumber !== serviceProvider.phoneNumber) {
        const existingPhone = await ServiceProvider.findOne({ 
          phoneNumber: updateData.phoneNumber,
          _id: { $ne: providerId }
        });
        if (existingPhone) {
          throw new ConflictError('Phone number already registered');
        }
      }

      // Check for duplicate email if being updated
      if (updateData.email && updateData.email !== serviceProvider.email) {
        const existingEmail = await ServiceProvider.findOne({ 
          email: updateData.email,
          _id: { $ne: providerId }
        });
        if (existingEmail) {
          throw new ConflictError('Email already registered');
        }
      }

      // Check for duplicate Aadhaar number if being updated
      if (updateData.aadhaarCard && updateData.aadhaarCard.number && 
          updateData.aadhaarCard.number !== serviceProvider.aadhaarCard.number) {
        const existingAadhaar = await ServiceProvider.findOne({ 
          'aadhaarCard.number': updateData.aadhaarCard.number,
          _id: { $ne: providerId }
        });
        if (existingAadhaar) {
          throw new ConflictError('Aadhaar number already registered');
        }
      }

      // Check for duplicate PAN number if being updated
      if (updateData.panCard && updateData.panCard.number && 
          updateData.panCard.number !== serviceProvider.panCard.number) {
        const existingPAN = await ServiceProvider.findOne({ 
          'panCard.number': updateData.panCard.number,
          _id: { $ne: providerId }
        });
        if (existingPAN) {
          throw new ConflictError('PAN number already registered');
        }
      }

      // // Validate services and subservices if being updated
      // if (updateData.services && updateData.services.length > 0) {
      //   const services = await Service.find({ _id: { $in: updateData.services } });
      //   if (services.length !== updateData.services.length) {
      //     throw new ValidationError('One or more services not found');
      //   }
      // }

      // if (updateData.subservices && updateData.subservices.length > 0) {
      //   const subservices = await Subservice.find({ _id: { $in: updateData.subservices } });
      //   if (subservices.length !== updateData.subservices.length) {
      //     throw new ValidationError('One or more subservices not found');
      //   }
      // }

      const updatedProvider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('services', 'name description')
       .populate('subservices', 'name description price')
       .populate('createdBy', 'name')
       .populate('verifiedBy', 'name');

      logger.info('Service provider updated successfully', { providerId });
      return updatedProvider;
    } catch (error) {
      logger.error('Failed to update service provider', {
        error: error.message,
        providerId,
        adminId
      });
      throw error;
    }
  }

  // Delete service provider
  async deleteServiceProvider(providerId, adminId) {
    try {
      logger.info('Deleting service provider', { providerId, adminId });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      // Check if provider has active bookings
      const activeBookings = await Booking.find({
        serviceProviderId: providerId,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (activeBookings.length > 0) {
        throw new ValidationError('Cannot delete service provider with active bookings');
      }

      await ServiceProvider.findByIdAndDelete(providerId);

      logger.info('Service provider deleted successfully', { providerId });
      return { message: 'Service provider deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete service provider', {
        error: error.message,
        providerId,
        adminId
      });
      throw error;
    }
  }

  // Verify service provider
  async verifyServiceProvider(providerId, adminId, verificationData = {}) {
    try {
      logger.info('Verifying service provider', { providerId, adminId });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      // If verifyDocuments is provided, verify specific documents
      if (verificationData.verifyDocuments) {
        if (verificationData.verifyDocuments.aadhaarCard) {
          serviceProvider.aadhaarCard.verified = verificationData.verifyDocuments.aadhaarCard;
        }
        if (verificationData.verifyDocuments.panCard) {
          serviceProvider.panCard.verified = verificationData.verifyDocuments.panCard;
        }
      }

      // Update status based on verification
      if (serviceProvider.aadhaarCard.verified && serviceProvider.panCard.verified) {
        serviceProvider.status = 'active';
      } else {
        serviceProvider.status = 'verification_pending';
      }

      serviceProvider.verifiedBy = adminId;
      serviceProvider.verifiedAt = new Date();
      
      if (verificationData.notes) {
        serviceProvider.notes = verificationData.notes;
      }

      await serviceProvider.save();

      logger.info('Service provider verified successfully', { providerId });
      return serviceProvider;
    } catch (error) {
      logger.error('Failed to verify service provider', {
        error: error.message,
        providerId,
        adminId
      });
      throw error;
    }
  }

  // Verify specific documents
  async verifyDocuments(providerId, adminId, documentType, verified, notes) {
    try {
      logger.info('Verifying service provider documents', { 
        providerId, 
        adminId, 
        documentType, 
        verified 
      });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      // Verify specific document type
      if (documentType === 'aadhaarCard') {
        serviceProvider.aadhaarCard.verified = verified;
      } else if (documentType === 'panCard') {
        serviceProvider.panCard.verified = verified;
      } else {
        throw new ValidationError('Invalid document type. Must be "aadhaarCard" or "panCard"');
      }

      // Update status based on verification
      if (serviceProvider.aadhaarCard.verified && serviceProvider.panCard.verified) {
        serviceProvider.status = 'active';
      } else {
        serviceProvider.status = 'verification_pending';
      }

      serviceProvider.verifiedBy = adminId;
      serviceProvider.verifiedAt = new Date();
      
      if (notes) {
        serviceProvider.notes = notes;
      }

      await serviceProvider.save();

      logger.info('Service provider documents verified successfully', { 
        providerId, 
        documentType, 
        verified 
      });
      return serviceProvider;
    } catch (error) {
      logger.error('Failed to verify service provider documents', {
        error: error.message,
        providerId,
        adminId,
        documentType
      });
      throw error;
    }
  }

  // Suspend service provider
  async suspendServiceProvider(providerId, adminId, reason) {
    try {
      logger.info('Suspending service provider', { providerId, adminId });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      serviceProvider.status = 'suspended';
      serviceProvider.notes = reason || 'Suspended by admin';
      await serviceProvider.save();

      logger.info('Service provider suspended successfully', { providerId });
      return serviceProvider;
    } catch (error) {
      logger.error('Failed to suspend service provider', {
        error: error.message,
        providerId,
        adminId
      });
      throw error;
    }
  }

  // Get available service providers for a booking
  async getAvailableProviders(bookingData) {
    try {
      logger.info('Finding available service providers', { 
        services: bookingData.services,
        subservices: bookingData.subservices,
        date: bookingData.date,
        time: bookingData.time
      });

      const dayOfWeek = new Date(bookingData.date).toLocaleDateString('en-US', { weekday: 'lowercase' });
      
      // const query = {
      //   status: 'active'
      //   // services: { $in: bookingData.services },
      //   // subservices: { $in: bookingData.subservices },
      //   // [`availability.${dayOfWeek}.available`]: true
      // };

      const serviceProviders = await ServiceProvider.find()
        // .populate('services', 'name description')
        // .populate('subservices', 'name description price')
        .sort({ 'rating.average': -1, 'rating.totalRatings': -1 });
      console.log(serviceProviders);
      // Filter by time availability
      // const availableProviders = serviceProviders.filter(provider => {
      //   const slots = provider.availability[dayOfWeek] || [];
      //   return slots.some(slot => 
      //     bookingData.time >= slot.start && bookingData.time <= slot.end
      //   );
      // });

      logger.info('Available service providers found', {
        count: serviceProviders.length,
        totalFound: serviceProviders.length
      });

      return serviceProviders;
    } catch (error) {
      logger.error('Failed to find available service providers', {
        error: error.message,
        bookingData
      });
      throw error;
    }
  }

  // Assign service provider to booking
  async assignToBooking(providerId, bookingId, adminId) {
    try {
      logger.info('Assigning service provider to booking', { 
        providerId, 
        bookingId, 
        adminId 
      });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // // Check if provider can handle the booking services
      // const canHandleServices = booking.services.every(serviceId => 
      //   serviceProvider.services.includes(serviceId)
      // );
      
      // const canHandleSubservices = booking.subservices.every(subserviceId => 
      //   serviceProvider.subservices.includes(subserviceId)
      // );

      // if (!canHandleServices || !canHandleSubservices) {
      //   throw new ValidationError('Service provider cannot handle all required services');
      // }

      // // Check availability
      // const dayOfWeek = new Date(booking.date).toLocaleDateString('en-US', { weekday: 'lowercase' });
      // const isAvailable = serviceProvider.isAvailable(dayOfWeek, booking.time);
      
      // if (!isAvailable) {
      //   throw new ValidationError('Service provider is not available at the specified time');
      // }

      // Update booking
      booking.serviceProviderId = providerId;
      booking.assignedAt = new Date();
      booking.assignedBy = adminId;
      await booking.save();

      logger.info('Service provider assigned to booking successfully', {
        providerId,
        bookingId
      });

      return booking;
    } catch (error) {
      logger.error('Failed to assign service provider to booking', {
        error: error.message,
        providerId,
        bookingId,
        adminId
      });
      throw error;
    }
  }

  // Get service provider statistics
  async getProviderStats(providerId) {
    try {
      logger.info('Getting service provider statistics', { providerId });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      // Get booking statistics
      const bookingStats = await Booking.aggregate([
        { $match: { serviceProviderId: serviceProvider._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get total earnings (completed bookings)
      const earnings = await Booking.aggregate([
        { 
          $match: { 
            serviceProviderId: serviceProvider._id,
            status: 'completed'
          } 
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$finalPrice' },
            totalBookings: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        provider: serviceProvider,
        bookings: {
          total: bookingStats.reduce((sum, stat) => sum + stat.count, 0),
          byStatus: bookingStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        },
        earnings: earnings.length > 0 ? earnings[0] : { totalEarnings: 0, totalBookings: 0 }
      };

      logger.info('Service provider statistics calculated successfully', { providerId });
      return stats;
    } catch (error) {
      logger.error('Failed to get service provider statistics', {
        error: error.message,
        providerId
      });
      throw error;
    }
  }

  // Update provider rating when new rating is approved
  async updateProviderRating(providerId, newRating) {
    try {
      logger.info('Updating service provider rating', { providerId, newRating });

      const serviceProvider = await ServiceProvider.findById(providerId);
      if (!serviceProvider) {
        throw new NotFoundError('Service provider not found');
      }

      serviceProvider.updateRatingStats(newRating);
      await serviceProvider.save();

      logger.info('Service provider rating updated successfully', { 
        providerId, 
        newAverage: serviceProvider.rating.average 
      });

      return serviceProvider;
    } catch (error) {
      logger.error('Failed to update service provider rating', {
        error: error.message,
        providerId,
        newRating
      });
      throw error;
    }
  }
}

module.exports = ServiceProviderService; 