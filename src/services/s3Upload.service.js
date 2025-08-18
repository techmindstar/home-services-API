const multer = require('multer');
const multerS3 = require('multer-s3-v3');
const { logger } = require('../utils/logger.util');
const { ValidationError } = require('../utils/error.util');
const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const appConfig = require("../config/app.config");
// Configure AWS
const s3 = new S3Client({
  region: 'eu-west-2',
  credentials: {
    accessKeyId: appConfig.access_key,
    secretAccessKey: appConfig.secret_access_key,
  }
});



// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'homeservice27',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${file.fieldname}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 3 // Allow 3 files total
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  }
});

class S3UploadService {
  // Upload single image
  async uploadImage(file, fieldName) {
    try {
      logger.info('Uploading image to S3', { 
        fieldName, 
        originalName: file.originalname,
        size: file.size 
      });

      // Validate file
      if (!file) {
        throw new ValidationError('No file provided');
      }

      // For multer-s3-v3, the file is already uploaded to S3
      // We just need to return the file information
      logger.info('Image uploaded successfully to S3', { 
        fieldName, 
        s3Key: file.key,
        s3Url: file.location 
      });

      return {
        url: file.location,
        key: file.key,
        bucket: file.bucket,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      logger.error('Failed to upload image to S3', {
        error: error.message,
        fieldName,
        originalName: file?.originalname
      });
      throw error;
    }
  }

  // Upload multiple images
  async uploadMultipleImages(files, fieldNames) {
    try {
      logger.info('Uploading multiple images to S3', { 
        count: files.length,
        fieldNames 
      });

      const uploadPromises = files.map(file => this.uploadImage(file, file.fieldname));
      const results = await Promise.all(uploadPromises);

      logger.info('Multiple images uploaded successfully', { 
        count: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Failed to upload multiple images to S3', {
        error: error.message,
        count: files.length
      });
      throw error;
    }
  }

  // Delete image from S3
  async deleteImage(s3Key) {
    try {
      logger.info('Deleting image from S3', { s3Key });

      const deleteParams = {
        Bucket: 'homeservice27',
        Key: s3Key
      };

      // Use AWS SDK v3 deleteObject
      await s3.send(new DeleteObjectCommand(deleteParams));

      logger.info('Image deleted successfully from S3', { s3Key });
      return true;
    } catch (error) {
      logger.error('Failed to delete image from S3', {
        error: error.message,
        s3Key
      });
      throw error;
    }
  }

  // Get signed URL for private images
  async getSignedUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: 'homeservice27',
        Key: s3Key,
        Expires: expiresIn
      };

      // Use AWS SDK v3 getSignedUrl
      const command = new GetObjectCommand(params);
      const signedUrl = await getSignedUrl(s3, command, { expiresIn });
      
      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL', {
        error: error.message,
        s3Key
      });
      throw error;
    }
    }
}

// Export multer middleware for use in routes
const uploadMiddleware = {
  // Single image upload
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple images upload
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  
  // Multiple fields upload
  fields: (fields) => upload.fields(fields)
};

module.exports = {
  S3UploadService,
  uploadMiddleware
};