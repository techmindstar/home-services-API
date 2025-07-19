const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const appConfig = require("../config/app.config");
const Otp = require("../models/otp.model.js");
const { generateOTP } = require("../utils/generateOtp.util.js"); // Import OTP generator
const { sendOtp, verifyOtp } = require("../utils/twilio.util");
// const { generateToken } = require('../utils/twilio.util');
const { logger } = require("../utils/logger.util");
const {
  NotFoundError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
} = require("../utils/error.util");

const SALT_ROUNDS = appConfig.brcrypt_salt_rounds;
const JWT_SECRET = appConfig.JWT_SECRET;
const JWT_EXPIRY = appConfig.jwt_expiry;
const OTP_EXPIRY = parseInt(appConfig.otp_expiry); // Convert to number

class AuthService {
  async generateAndSendOtp(userDetails) {
    try {
      // 1. Validate input
      logger.info("Starting OTP generation", { userDetails });

      const phoneNumber = userDetails?.phoneNumber;
      if (!phoneNumber) {
        throw new ValidationError("Phone number is required");
      }

      const cleanedPhoneNumber = String(phoneNumber).replace(/\D/g, "");
      if (cleanedPhoneNumber.length !== 10) {
        throw new ValidationError("Phone number must be 10 digits");
      }

      logger.info("Cleaned phone number", { cleanedPhoneNumber });

      // 2. Find existing user
      const user = await User.findOne({ phoneNumber: cleanedPhoneNumber });

      // 3. Generate OTP and construct message
      const otp = generateOTP(); // implement this function separately
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      const message = `One-Time Password for confirming your phone number is ${otp}. Please do not share this OTP with anyone - SR Enterprise. Visit our website - https://www.subidha.net.in`;

      const OtpParams = new URLSearchParams({
        username: "srenterotp.trans",
        password: "rm5d2",
        unicode: "false",
        from: "SREN",
        to: `${cleanedPhoneNumber}`, // Use correct Indian phone format
        text: message,
        dltContentId: "1707175247294315575",
      });

      const apiUrl = `https://omni.myctrlbox.com/fe/api/v1/send?${OtpParams.toString()}`;

      // 4. Save OTP to DB (remove old, insert new)
      await Otp.findOneAndDelete({ phoneNumber: cleanedPhoneNumber });
      await new Otp({ phoneNumber: cleanedPhoneNumber, otp, expiresAt }).save();

      logger.info("OTP saved to database", {
        phoneNumber: cleanedPhoneNumber,
        expiresAt,
      });

      // 5. Send OTP using the SMS API
      logger.info("Sending OTP via SMS", {
        phoneNumber: cleanedPhoneNumber,
        otp,
      });

      const response = await fetch(apiUrl, { method: "POST" });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to send OTP. API responded with status ${response.status}: ${errorText}`
        );
      }

      const responseData = await response.json();
      logger.info("OTP API response received", { responseData });

      // 6. Create new user if doesn't exists
      if (!user) {
         const newUser = await new User({
          phoneNumber: cleanedPhoneNumber,
          addresses: [],
          password: "Not Required",
          role: "client",
        }).save();

        logger.info("New user created", {
          phoneNumber: cleanedPhoneNumber,
          userId: newUser._id,
        });
      }

      return { message: "OTP sent successfully" };
    } catch (error) {
      logger.error("Error in generateAndSendOtp", {
        error: error.message,
        phoneNumber: userDetails?.phoneNumber,
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError("Failed to send OTP");
    }
  }

  async verifyOtp(userDetails) {
    try {
      // 1. Extract and validate inputs
      const { phoneNumber, otp } = userDetails;

      logger.info("Verifying OTP", { inputPhoneNumber: phoneNumber });

      if (!phoneNumber || !otp) {
        throw new ValidationError("Phone number and OTP are required");
      }

      const cleanedPhoneNumber = String(phoneNumber).replace(/\D/g, "");
      if (cleanedPhoneNumber.length !== 10) {
        throw new ValidationError("Phone number must be 10 digits");
      }

      // 2. Check for OTP record
      const otpRecord = await Otp.findOne({
        phoneNumber: cleanedPhoneNumber,
        otp,
      });

      if (!otpRecord) {
        throw new ValidationError("Invalid OTP");
      }

      // 3. Check OTP expiry
      if (otpRecord.expiresAt < new Date()) {
        logger.warn("Expired OTP attempt", {
          phoneNumber: cleanedPhoneNumber,
          attemptedOtp: otp,
        });

        await Otp.findOneAndDelete({ phoneNumber: cleanedPhoneNumber }); // Clean expired
        throw new ValidationError("OTP has expired");
      }

      // 4. Find or create user
      let user = await User.findOne({ phoneNumber: cleanedPhoneNumber });

      if (!user) {
        throw new ValidationError("User not found");
      }

      // 5. Generate JWT token
      const token = jwt.sign(
        { id: user._id, phoneNumber: user.phoneNumber },
        JWT_SECRET
      );

      logger.info("OTP verified successfully", {
        phoneNumber: cleanedPhoneNumber,
        userId: user._id,
      });

      // 6. Delete used OTP
      await Otp.findOneAndDelete({ phoneNumber: cleanedPhoneNumber });

      return {
        message: "OTP verified successfully",
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
        },
        token,
      };
    } catch (error) {
      logger.error("Failed to verify OTP", {
        error: error.message,
        phoneNumber: userDetails?.phoneNumber,
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError("Failed to verify OTP");
    }
  }
}

module.exports = AuthService;
