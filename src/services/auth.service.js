const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const appConfig = require("../config/app.config");
const { generateOTP } = require('../utils/generateOtp.util.js'); // Import OTP generator
const { sendSms } = require('../utils/twilio.util.js'); // Import Twilio SMS utility
const Otp = require('../models/otp.model.js'); // Your OTP model
const { logger } = require("../utils/logger.util");
const { NotFoundError, DatabaseError, ValidationError, AuthenticationError } = require("../utils/error.util");

const SALT_ROUNDS = appConfig.brcrypt_salt_rounds;
const JWT_SECRET = appConfig.JWT_SECRET;
const JWT_EXPIRY = appConfig.jwt_expiry;
const OTP_EXPIRY = parseInt(appConfig.otp_expiry); // Convert to number




class AuthService {

  async generateAndSendOtp(userDetails){
    try {
      const { phoneNumber } = userDetails;
      logger.info('Generating OTP', { phoneNumber });
  
      if (!phoneNumber) {
        logger.warn('Missing phone number');
        throw new ValidationError("Phone number is required.");
      }
  
      const recentOtpRequest = await Otp.findOne({ phoneNumber }).sort({ createdAt: -1 });
      if (recentOtpRequest && (Date.now() - new Date(recentOtpRequest.createdAt)) < 60000) {
        logger.warn('Too many OTP requests', { phoneNumber });
        throw new ValidationError("Too many OTP requests. Please try again later.");
      }
  
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        logger.info('Creating new user', { phoneNumber });
        user = new User({ phoneNumber });
        await user.save();
      }
  
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY);
  
      await Otp.findOneAndDelete({ phoneNumber });
      const newOtp = await new Otp({ phoneNumber, otp, expiresAt }).save();
      
      logger.info('OTP generated', {
        phoneNumber,
        otpId: newOtp._id,
        expiresAt: newOtp.expiresAt
      });
  
      const message = `Your OTP is ${otp}. Valid for 5 minutes.`;
      await sendSms(phoneNumber, message);
  
      logger.info('OTP sent successfully', { phoneNumber });
      return { message: "OTP sent successfully" };
    } catch (error) {
      logger.error('Error generating OTP', {
        error: error.message,
        phoneNumber: userDetails.phoneNumber
      });
  
      if (error instanceof ValidationError) {
        throw error;
      }
  
      throw new DatabaseError('Failed to generate and send OTP');
    }
  };
  
  async verifyOtp (phoneNumber, otp){
    try {
      logger.info('Verifying OTP', { phoneNumber });
      
      const otpRecord = await Otp.findOne({ phoneNumber });
      if (!otpRecord) {
        logger.warn('OTP not found', { phoneNumber });
        throw new ValidationError("OTP not found.");
      }
  
      // Check if OTP has expired
      const now = new Date();
      const expiryDate = new Date(otpRecord.expiresAt);
      if (now > expiryDate) {
        logger.warn('OTP expired', { phoneNumber });
        throw new ValidationError("OTP has expired.");
      }
  
      // Convert both OTPs to strings for comparison
      const receivedOtp = String(otp);
      const storedOtp = String(otpRecord.otp);
      
      if (receivedOtp !== storedOtp) {
        logger.warn('Invalid OTP', { phoneNumber });
        throw new ValidationError("Invalid OTP.");
      }
  
      // OTP is valid, find or create the user
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        logger.info('Creating new user', { phoneNumber });
        user = new User({ phoneNumber });
        await user.save();
      }
  
      const token = jwt.sign(
        { id: user._id, phoneNumber: user.phoneNumber },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );
  
      // Delete the used OTP
      await Otp.deleteOne({ _id: otpRecord._id });
  
      logger.info('OTP verified successfully', { userId: user._id });
      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      logger.error('Error verifying OTP', {
        error: error.message,
        phoneNumber
      });
  
      if (error instanceof ValidationError) {
        throw error;
      }
  
      throw new DatabaseError('Failed to verify OTP');
    }
  };
}

module.exports = AuthService;
