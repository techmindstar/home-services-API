const ServiceProviderService = require('../services/serviceProvider.service');
const { S3UploadService } = require('../services/s3Upload.service');
const { logger } = require('../utils/logger.util');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/error.util');

const serviceProviderService = new ServiceProviderService();
const s3UploadService = new S3UploadService();

// Create new service provider (Admin only)
const createServiceProvider = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const providerData = req.body;
    
    logger.info('Creating service provider request', { 
      adminId,
      providerName: providerData.name 
    });


    console.log(providerData);  

    // Validate required fields
    // const requiredFields = [
    //   'name', 
    //   'phoneNumber', 
    //   'email', 
    //   'address', 
    //   'services', 
    //   'subservices'
    // ];
    
    // for (const field of requiredFields) {
    //   if (!providerData[field]) {
    //     return res.status(400).json({
    //       success: false,
    //       message: `${field} is required`
    //     });
    //   }
    // }

    // Process uploaded files if they exist
    if (req.files) {
      try {
        // Handle Aadhaar card image
        if (req.files.aadhaarCardImage && req.files.aadhaarCardImage[0]) {
          const aadhaarResult = await s3UploadService.uploadImage(req.files.aadhaarCardImage[0], 'aadhaarCard');
          providerData.aadhaarCard = {
            number: providerData.aadhaarCard,
            image: aadhaarResult.url,
            s3Key: aadhaarResult.key
          };
        }

        // Handle PAN card image
        if (req.files.panCardImage && req.files.panCardImage[0]) {
          const panResult = await s3UploadService.uploadImage(req.files.panCardImage[0], 'panCard');
          providerData.panCard = {
            number: providerData.panCard,
            image: panResult.url,
            s3Key: panResult.key
          };
        }

        // Handle passport photo
        if (req.files.passportPhoto && req.files.passportPhoto[0]) {
          const passportResult = await s3UploadService.uploadImage(req.files.passportPhoto[0], 'passportPhoto');
          providerData.passportPhoto = passportResult.url;
          providerData.passportPhotoS3Key = passportResult.key;
        }

        logger.info('Files processed successfully', {
          aadhaarCard: !!providerData.aadhaarCard?.image,
          panCard: !!providerData.panCard?.image,
          passportPhoto: !!providerData.passportPhoto
        });
      } catch (uploadError) {
        logger.error('Failed to process uploaded files', {
          error: uploadError.message,
          adminId
        });
        return res.status(400).json({
          success: false,
          message: `File upload failed: ${uploadError.message}`
        });
      }
    }
console.log("providerData",providerData);  
    // Validate Aadhaar card structure
    if (!providerData.aadhaarCard?.number || !providerData.aadhaarCard?.image) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar card number and image are required'
      });
    }

    // Validate PAN card structure
    if (!providerData.panCard?.number || !providerData.panCard?.image) {
      return res.status(400).json({
        success: false,
        message: 'PAN card number and image are required'
      });
    }

    // Validate passport photo
    if (!providerData.passportPhoto) {
      return res.status(400).json({
        success: false,
        message: 'Passport photo is required'
      });
    }

    const serviceProvider = await serviceProviderService.createServiceProvider(providerData, adminId);
    
    logger.info('Service provider created successfully', { 
      providerId: serviceProvider._id 
    });

    res.status(201).json({
      success: true,
      message: 'Service provider created successfully',
      data: {
        serviceProvider: {
          id: serviceProvider._id,
          name: serviceProvider.name,
          email: serviceProvider.email,
          phoneNumber: serviceProvider.phoneNumber,
          status: serviceProvider.status,
          services: serviceProvider.services,
          subservices: serviceProvider.subservices,
          aadhaarCard: {
            number: serviceProvider.aadhaarCard.number,
            verified: serviceProvider.aadhaarCard.verified
          },
          panCard: {
            number: serviceProvider.panCard.number,
            verified: serviceProvider.panCard.verified
          },
          passportPhoto: serviceProvider.passportPhoto,
          createdAt: serviceProvider.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Failed to create service provider', {
      error: error.message,
      adminId: req.user.id
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof ConflictError) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Get all service providers (Admin only)
const getAllServiceProviders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, service, subservice, search, verificationStatus } = req.query;
    const filters = { status, service, subservice, search, verificationStatus };
    
    logger.info('Fetching all service providers request', { 
      page, 
      limit, 
      filters,
      adminId: req.user.id 
    });

    const result = await serviceProviderService.getAllServiceProviders(
      parseInt(page), 
      parseInt(limit), 
      filters
    );
    
    logger.info('Service providers fetched successfully', {
      count: result.serviceProviders.length,
      total: result.pagination.total
    });

    res.status(200).json({
      success: true,
      message: 'Service providers fetched successfully',
      data: {
        serviceProviders: result.serviceProviders.map(provider => ({
          id: provider._id,
          name: provider.name,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          address: provider.address,
          services: provider.services,
          subservices: provider.subservices,
          specializations: provider.specializations,
          experience: provider.experience,
          experienceUnit: provider.experienceUnit,
          qualification: provider.qualification,
          status: provider.status,
          rating: provider.rating,
          availability: provider.availability,
          aadhaarCard: {
            number: provider.aadhaarCard.number,
            verified: provider.aadhaarCard.verified
          },
          panCard: {
            number: provider.panCard.number,
            verified: provider.panCard.verified
          },
          passportPhoto: provider.passportPhoto,
          createdBy: provider.createdBy,
          verifiedBy: provider.verifiedBy,
          verifiedAt: provider.verifiedAt,
          createdAt: provider.createdAt
        })),
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error('Failed to fetch service providers', {
      error: error.message,
      adminId: req.user.id
    });
    next(error);
  }
};

// Get service provider by ID
const getServiceProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    
    logger.info('Fetching service provider request', { 
      providerId,
      userId: req.user.id 
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID is required'
      });
    }

    const serviceProvider = await serviceProviderService.getServiceProvider(providerId);
    
    logger.info('Service provider fetched successfully', { providerId });

    res.status(200).json({
      success: true,
      message: 'Service provider fetched successfully',
      data: {
        serviceProvider: {
          id: serviceProvider._id,
          name: serviceProvider.name,
          email: serviceProvider.email,
          phoneNumber: serviceProvider.phoneNumber,
          address: serviceProvider.address,
          services: serviceProvider.services,
          subservices: serviceProvider.subservices,
          specializations: serviceProvider.specializations,
          experience: serviceProvider.experience,
          experienceUnit: serviceProvider.experienceUnit,
          qualification: serviceProvider.qualification,
          certifications: serviceProvider.certifications,
          status: serviceProvider.status,
          rating: serviceProvider.rating,
          availability: serviceProvider.availability,
          aadhaarCard: {
            number: serviceProvider.aadhaarCard.number,
            image: serviceProvider.aadhaarCard.image,
            verified: serviceProvider.aadhaarCard.verified
          },
          panCard: {
            number: serviceProvider.panCard.number,
            image: serviceProvider.panCard.image,
            verified: serviceProvider.panCard.verified
          },
          passportPhoto: serviceProvider.passportPhoto,
          documents: serviceProvider.documents,
          bankDetails: serviceProvider.bankDetails,
          commission: serviceProvider.commission,
          createdBy: serviceProvider.createdBy,
          verifiedBy: serviceProvider.verifiedBy,
          verifiedAt: serviceProvider.verifiedAt,
          notes: serviceProvider.notes,
          createdAt: serviceProvider.createdAt,
          updatedAt: serviceProvider.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch service provider', {
      error: error.message,
      providerId: req.params.providerId
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

// Update service provider (Admin only)
const updateServiceProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const adminId = req.user.id;
    const updateData = req.body;
    
    logger.info('Updating service provider request', { 
      providerId, 
      adminId 
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID is required'
      });
    }

    // Process uploaded files if they exist
    if (req.files) {
      try {
        // Handle Aadhaar card image update
        if (req.files.aadhaarCardImage && req.files.aadhaarCardImage[0]) {
          const aadhaarResult = await s3UploadService.uploadImage(req.files.aadhaarCardImage[0], 'aadhaarCard');
          updateData.aadhaarCard = {
            number:updateData.aadhaarCard,
            image: aadhaarResult.url,
            s3Key: aadhaarResult.key
          };
        }

        // Handle PAN card image update
        if (req.files.panCardImage && req.files.panCardImage[0]) {
          const panResult = await s3UploadService.uploadImage(req.files.panCardImage[0], 'panCard');
          updateData.panCard = {
           number:updateData.panCard,
            image: panResult.url,
            s3Key: panResult.key
          };
        }

        // Handle passport photo update
        if (req.files.passportPhoto && req.files.passportPhoto[0]) {
          const passportResult = await s3UploadService.uploadImage(req.files.passportPhoto[0], 'passportPhoto');
          updateData.passportPhoto = passportResult.url;
          updateData.passportPhotoS3Key = passportResult.key;
        }

        logger.info('Update files processed successfully', {
          aadhaarCard: !!updateData.aadhaarCard?.image,
          panCard: !!updateData.panCard?.image,
          passportPhoto: !!updateData.passportPhoto
        });
      } catch (uploadError) {
        logger.error('Failed to process update uploaded files', {
          error: uploadError.message,
          providerId,
          adminId
        });
        return res.status(400).json({
          success: false,
          message: `File upload failed: ${uploadError.message}`
        });
      }
    }

    const updatedProvider = await serviceProviderService.updateServiceProvider(
      providerId, 
      updateData, 
      adminId
    );
    
    logger.info('Service provider updated successfully', { providerId });

    res.status(200).json({
      success: true,
      message: 'Service provider updated successfully',
      data: {
        serviceProvider: {
          id: updatedProvider._id,
          name: updatedProvider.name,
          email: updatedProvider.email,
          phoneNumber: updatedProvider.phoneNumber,
          address: updatedProvider.address,
          services: updatedProvider.services,
          subservices: updatedProvider.subservices,
          specializations: updatedProvider.specializations,
          experience: updatedProvider.experience,
          experienceUnit: updatedProvider.experienceUnit,
          qualification: updatedProvider.qualification,
          certifications: updatedProvider.certifications,
          status: updatedProvider.status,
          rating: updatedProvider.rating,
          availability: updatedProvider.availability,
          aadhaarCard: {
            number: updatedProvider.aadhaarCard.number,
            image: updatedProvider.aadhaarCard.image,
            verified: updatedProvider.aadhaarCard.verified
          },
          panCard: {
            number: updatedProvider.panCard.number,
            image: updatedProvider.panCard.image,
            verified: updatedProvider.panCard.verified
          },
          passportPhoto: updatedProvider.passportPhoto,
          documents: updatedProvider.documents,
          bankDetails: updatedProvider.bankDetails,
          commission: updatedProvider.commission,
          notes: updatedProvider.notes,
          updatedAt: updatedProvider.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Failed to update service provider', {
      error: error.message,
      providerId: req.params.providerId,
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

    if (error instanceof ConflictError) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Delete service provider (Admin only)
const deleteServiceProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const adminId = req.user.id;
    
    logger.info('Deleting service provider request', { 
      providerId, 
      adminId 
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID is required'
      });
    }

    const result = await serviceProviderService.deleteServiceProvider(providerId, adminId);
    
    logger.info('Service provider deleted successfully', { providerId });

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to delete service provider', {
      error: error.message,
      providerId: req.params.providerId,
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

// Verify service provider (Admin only)
const verifyServiceProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const adminId = req.user.id;
    const { notes, verifyDocuments } = req.body;
    
    logger.info('Verifying service provider request', { 
      providerId, 
      adminId,
      verifyDocuments
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID is required'
      });
    }

    const serviceProvider = await serviceProviderService.verifyServiceProvider(
      providerId, 
      adminId, 
      { notes, verifyDocuments }
    );
    
    logger.info('Service provider verified successfully', { providerId });

    res.status(200).json({
      success: true,
      message: 'Service provider verified successfully',
      data: {
        serviceProvider: {
          id: serviceProvider._id,
          name: serviceProvider.name,
          status: serviceProvider.status,
          aadhaarCard: {
            verified: serviceProvider.aadhaarCard.verified
          },
          panCard: {
            verified: serviceProvider.panCard.verified
          },
          verifiedBy: serviceProvider.verifiedBy,
          verifiedAt: serviceProvider.verifiedAt,
          notes: serviceProvider.notes
        }
      }
    });
  } catch (error) {
    logger.error('Failed to verify service provider', {
      error: error.message,
      providerId: req.params.providerId,
      adminId: req.user.id
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

// Suspend service provider (Admin only)
const suspendServiceProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;
    
    logger.info('Suspending service provider request', { 
      providerId, 
      adminId,
      reason 
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID is required'
      });
    }

    const serviceProvider = await serviceProviderService.suspendServiceProvider(
      providerId, 
      adminId, 
      reason
    );
    
    logger.info('Service provider suspended successfully', { providerId });

    res.status(200).json({
      success: true,
      message: 'Service provider suspended successfully',
      data: {
        serviceProvider: {
          id: serviceProvider._id,
          name: serviceProvider.name,
          status: serviceProvider.status,
          notes: serviceProvider.notes
        }
      }
    });
  } catch (error) {
    logger.error('Failed to suspend service provider', {
      error: error.message,
      providerId: req.params.providerId,
      adminId: req.user.id
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

// Get available service providers for booking (Admin only)
const getAvailableProviders = async (req, res, next) => {
  try {
    const bookingData = req.body;
    
    logger.info('Finding available service providers request', { 
      bookingData,
      adminId: req.user.id 
    });

    // Validate required fields
    // if (!bookingData.services || !bookingData.subservices || !bookingData.date || !bookingData.time) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Services, subservices, date, and time are required'
    //   });
    // }

    const availableProviders = await serviceProviderService.getAvailableProviders(bookingData);
    
    logger.info('Available service providers found', {
      count: availableProviders.length
    });

    res.status(200).json({
      success: true,
      message: 'Available service providers fetched successfully',
      data: {
        serviceProviders: availableProviders.map(provider => ({
          id: provider._id,
          name: provider.name,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          services: provider.services,
          subservices: provider.subservices,
          rating: provider.rating,
          experience: provider.experience,
          experienceUnit: provider.experienceUnit,
          availability: provider.availability
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to find available service providers', {
      error: error.message,
      adminId: req.user.id
    });
    next(error);
  }
};

// Assign service provider to booking (Admin only)
const assignToBooking = async (req, res, next) => {
  try {
    const { providerId, bookingId } = req.params;
    const adminId = req.user.id;
    
    logger.info('Assigning service provider to booking request', { 
      providerId, 
      bookingId, 
      adminId 
    });

    if (!providerId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID and booking ID are required'
      });
    }

    const booking = await serviceProviderService.assignToBooking(providerId, bookingId, adminId);
    
    logger.info('Service provider assigned to booking successfully', { 
      providerId, 
      bookingId 
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
      providerId: req.params.providerId,
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

// Get service provider statistics (Admin only)
const getProviderStats = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    
    logger.info('Getting service provider statistics request', { 
      providerId,
      adminId: req.user.id 
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID is required'
      });
    }

    const stats = await serviceProviderService.getProviderStats(providerId);
    
    logger.info('Service provider statistics fetched successfully', { providerId });

    res.status(200).json({
      success: true,
      message: 'Service provider statistics fetched successfully',
      data: {
        provider: {
          id: stats.provider._id,
          name: stats.provider.name,
          email: stats.provider.email,
          phoneNumber: stats.provider.phoneNumber,
          status: stats.provider.status,
          rating: stats.provider.rating
        },
        bookings: stats.bookings,
        earnings: stats.earnings
      }
    });
  } catch (error) {
    logger.error('Failed to get service provider statistics', {
      error: error.message,
      providerId: req.params.providerId,
      adminId: req.user.id
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

// Verify specific documents (Admin only)
const verifyDocuments = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const adminId = req.user.id;
    const { documentType, verified, notes } = req.body;
    
    logger.info('Verifying service provider documents request', { 
      providerId, 
      adminId,
      documentType,
      verified
    });

    if (!providerId || !documentType) {
      return res.status(400).json({
        success: false,
        message: 'Service provider ID and document type are required'
      });
    }

    const serviceProvider = await serviceProviderService.verifyDocuments(
      providerId, 
      adminId, 
      documentType, 
      verified, 
      notes
    );
    
    logger.info('Service provider documents verified successfully', { providerId, documentType });

    res.status(200).json({
      success: true,
      message: 'Documents verified successfully',
      data: {
        serviceProvider: {
          id: serviceProvider._id,
          name: serviceProvider.name,
          aadhaarCard: {
            verified: serviceProvider.aadhaarCard.verified
          },
          panCard: {
            verified: serviceProvider.panCard.verified
          },
          status: serviceProvider.status,
          notes: serviceProvider.notes
        }
      }
    });
  } catch (error) {
    logger.error('Failed to verify service provider documents', {
      error: error.message,
      providerId: req.params.providerId,
      adminId: req.user.id
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

module.exports = {
  createServiceProvider,
  getAllServiceProviders,
  getServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
  verifyServiceProvider,
  suspendServiceProvider,
  getAvailableProviders,
  assignToBooking,
  getProviderStats,
  verifyDocuments
}; 