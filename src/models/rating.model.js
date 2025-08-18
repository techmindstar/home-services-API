const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  subservice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subservice',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNote: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Index for efficient queries
RatingSchema.index({ user: 1, status: 1 });
RatingSchema.index({ subservice: 1 });
RatingSchema.index({ service: 1 });
RatingSchema.index({ booking: 1 }, { unique: true });
RatingSchema.index({ rating: 1 });
RatingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Rating', RatingSchema); 