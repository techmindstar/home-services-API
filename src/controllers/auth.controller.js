const AuthService = require("../services/auth.service.js");
const { logger } = require("../utils/logger.util");
const { ValidationError, DatabaseError } = require("../utils/error.util");

// Instantiate the auth service
const authService = new AuthService();

const generateAndSendOtp = async (req, res) => {
  try {
    logger.info('OTP generation request', { phoneNumber: req.body.phoneNumber });
    
    const result = await authService.generateAndSendOtp(req.body);

    if (!result) {
      logger.warn('OTP generation failed', { phoneNumber: req.body.phoneNumber });
      return res.status(400).json({ message: "Registration failed" });
    }

    logger.info('OTP generated successfully', { phoneNumber: req.body.phoneNumber });
    res.status(201).json({
      message: "User registered successfully",
      user: result
    });
  } catch (error) {
    logger.error("Register Controller Error:", {
      error: error.message,
      phoneNumber: req.body.phoneNumber
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof DatabaseError) {
      return res.status(500).json({ message: "Internal server error" });
    }

    res.status(500).json({
      message: "Internal server error"
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    logger.info('OTP verification request', { phoneNumber });

    if (!phoneNumber || !otp) {
      logger.warn('Missing required fields', { phoneNumber });
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    // Call the service to verify OTP and get user + token
    const { user, token } = await authService.verifyOtp(phoneNumber, otp);
  
    // Return user and JWT token
    if (!user) {
      logger.warn('User not found', { phoneNumber });
      return res.status(400).json({ message: "User not found" });
    }
    if (!token) {
      logger.warn('Token generation failed', { phoneNumber });
      return res.status(400).json({ message: "Token generation failed" });
    }

    logger.info('OTP verified successfully', { userId: user.id });
    return res.status(200).json({
      message: "OTP verified successfully",
      user,  // User data
      token  // JWT Token
    });

  } catch (error) {
    logger.error("Verify OTP Controller Error:", {
      error: error.message,
      phoneNumber: req.body.phoneNumber
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof DatabaseError) {
      return res.status(500).json({ message: "Internal server error" });
    }

    return res.status(400).json({
      message: error.message || "OTP verification failed",
    });
  }
};

module.exports = {
  generateAndSendOtp,
  verifyOtp
};
