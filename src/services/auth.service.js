const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const appConfig = require("../config/app.config");
const { generateOTP } = require('../utils/generateOtp.util.js'); // Import OTP generator
const { sendOtp, verifyOtp } = require('../utils/twilio.util');
// const { generateToken } = require('../utils/twilio.util');
const { logger } = require("../utils/logger.util");
const { NotFoundError, DatabaseError, ValidationError, AuthenticationError } = require("../utils/error.util");

const SALT_ROUNDS = appConfig.brcrypt_salt_rounds;
const JWT_SECRET = appConfig.JWT_SECRET;
const JWT_EXPIRY = appConfig.jwt_expiry;
const OTP_EXPIRY = parseInt(appConfig.otp_expiry); // Convert to number




class AuthService {

  async generateAndSendOtp(userDetails) {
    try {
      // Extract phone number from the object
      console.log(userDetails);
      const phoneNumber = userDetails.phoneNumber;
      
      if (!phoneNumber) {
        throw new ValidationError('Phone number is required');
      }

      // Clean the phone number (remove non-digits)
      const cleanedPhoneNumber = String(phoneNumber).replace(/\D/g, '');
      
      if (cleanedPhoneNumber.length !== 10) {
        throw new ValidationError('Phone number must be 10 digits');
      }
      console.log(cleanedPhoneNumber);
      // Check if user exists - pass the cleaned phone number directly
      const user = await User.findOne({ phoneNumber: cleanedPhoneNumber });
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Send OTP via Twilio Verify
      await sendOtp(cleanedPhoneNumber);

      logger.info('OTP sent successfully', {
        phoneNumber: cleanedPhoneNumber
      });

      return { message: 'OTP sent successfully' };
    } catch (error) {
      logger.error('Failed to send OTP', {
        error: error.message,
        phoneNumber: userDetails?.phoneNumber
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to send OTP');
    }
  }

  async verifyOtp(userDetails) {
    try {
      // Extract phone number and OTP from the object
      const { phoneNumber, otp } = userDetails;

      if (!phoneNumber || !otp) {
        throw new ValidationError('Phone number and OTP are required');
      }

      // Clean the phone number (remove non-digits)
      const cleanedPhoneNumber = String(phoneNumber).replace(/\D/g, '');
      
      if (cleanedPhoneNumber.length !== 10) {
        throw new ValidationError('Phone number must be 10 digits');
      }

      // Verify OTP with Twilio
      const isValid = await verifyOtp(cleanedPhoneNumber, otp);
      if (!isValid) {
        throw new ValidationError('Invalid OTP');
      }

      // Get user - pass the cleaned phone number directly
      const user = await User.findOne({ phoneNumber: cleanedPhoneNumber });
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, phoneNumber: user.phoneNumber },
        JWT_SECRET,
      );

      logger.info('OTP verified successfully', {
        phoneNumber: cleanedPhoneNumber,
        userId: user._id
      });

      return {
        message: 'OTP verified successfully',
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email
        },
        token
      };
    } catch (error) {
      logger.error('Failed to verify OTP', {
        error: error.message,
        phoneNumber: userDetails?.phoneNumber
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError('Failed to verify OTP');
    }
  }
}

module.exports = AuthService;
