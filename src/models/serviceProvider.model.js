const mongoose = require('mongoose');

const ServiceProviderSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Services
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],
  subservices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subservice',
    required: true
  }],
  
  // Address
  address: {
    street: { type: String,  },
    city: { type: String,  },
    state: { type: String,  },
    pincode: { type: String, },
    country: { type: String, default: 'India' }
  },
  
  // Identity Documents
  aadhaarCard: {
    number: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String, // S3 bucket URL
      required: true
    },
    s3Key: {
      type: String, // S3 object key for file management
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  panCard: {
    number: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String, // S3 bucket URL
      required: true
    },
    s3Key: {
      type: String, // S3 object key for file management
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  passportPhoto: {
    type: String, // S3 bucket URL
    required: true
  },
  passportPhotoS3Key: {
    type: String, // S3 object key for file management
    required: true
  },
  
  // Professional Information
  specializations: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    min: 0,
    default: 0
  },
  experienceUnit: {
    type: String,
    enum: ['months', 'years'],
    default: 'years'
  },
  qualification: {
    type: String,
    trim: true
  },
  certifications: [{
    name: { type: String, required: true },
    issuingAuthority: { type: String, required: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    certificateNumber: { type: String }
  }],
  
  // Availability
  availability: {
    monday: { start: String, end: String, available: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
    thursday: { start: String, end: String, available: { type: Boolean, default: true } },
    friday: { start: String, end: String, available: { type: Boolean, default: true } },
    saturday: { start: String, end: String, available: { type: Boolean, default: true } },
    sunday: { start: String, end: String, available: { type: Boolean, default: true } }
  },
  
  // Status and Verification
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending', 'verification_pending'],
    default: 'verification_pending'
  },
  
  // Rating System
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    ratingDistribution: {
      '1': { type: Number, default: 0 },
      '2': { type: Number, default: 0 },
      '3': { type: Number, default: 0 },
      '4': { type: Number, default: 0 },
      '5': { type: Number, default: 0 }
    }
  },
  
  // Additional Documents
  documents: [{
    type: { type: String, required: true }, // 'certificate', 'address_proof', etc.
    name: { type: String, required: true },
    url: { type: String, required: true }, // S3 bucket URL
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],
  
  // Financial Information
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String },
    bankName: { type: String }
  },
  commission: {
    type: Number,
    min: 0,
    max: 100,
    default: 10 // Default 10% commission
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ServiceProviderSchema.index({ phoneNumber: 1 });
ServiceProviderSchema.index({ email: 1 });
ServiceProviderSchema.index({ 'aadhaarCard.number': 1 });
ServiceProviderSchema.index({ 'panCard.number': 1 });
ServiceProviderSchema.index({ status: 1 });
ServiceProviderSchema.index({ services: 1 });
ServiceProviderSchema.index({ subservices: 1 });
ServiceProviderSchema.index({ 'rating.average': -1 });
ServiceProviderSchema.index({ createdAt: -1 });

// Virtual for full address
ServiceProviderSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.pincode}, ${this.address.country}`;
});

// Virtual for experience display
ServiceProviderSchema.virtual('experienceDisplay').get(function() {
  if (this.experience === 0) return 'Fresher';
  return `${this.experience} ${this.experienceUnit}`;
});

// Virtual for verification status
ServiceProviderSchema.virtual('isFullyVerified').get(function() {
  return this.aadhaarCard.verified && this.panCard.verified;
});

// Method to update rating statistics
ServiceProviderSchema.methods.updateRatingStats = function(newRating) {
  const oldRating = this.rating.ratingDistribution[newRating.toString()] || 0;
  this.rating.ratingDistribution[newRating.toString()] = oldRating + 1;
  this.rating.totalRatings += 1;
  
  // Calculate new average
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 5; i++) {
    total += i * this.rating.ratingDistribution[i.toString()];
    count += this.rating.ratingDistribution[i.toString()];
  }
  this.rating.average = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
};

// Method to check if provider is available on given day and time
ServiceProviderSchema.methods.isAvailable = function(day, time) {
  const daySchedule = this.availability[day.toLowerCase()];
  if (!daySchedule || !daySchedule.available) return false;
  
  const timeStr = time.toString();
  return timeStr >= daySchedule.start && timeStr <= daySchedule.end;
};

// Method to check if provider can handle service
ServiceProviderSchema.methods.canHandleService = function(serviceId, subserviceId) {
  const canHandleService = this.services.includes(serviceId);
  const canHandleSubservice = this.subservices.includes(subserviceId);
  return canHandleService && canHandleSubservice;
};

// Method to update verification status
ServiceProviderSchema.methods.updateVerificationStatus = function() {
  if (this.aadhaarCard.verified && this.panCard.verified) {
    if (this.status === 'verification_pending') {
      this.status = 'pending';
    }
  }
};

// Pre-save middleware to update verification status
ServiceProviderSchema.pre('save', function(next) {
  this.updateVerificationStatus();
  next();
});

module.exports = mongoose.model('ServiceProvider', ServiceProviderSchema); 