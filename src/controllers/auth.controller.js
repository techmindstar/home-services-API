const AuthService = require("../services/auth.service.js");
const { logger } = require("../utils/logger.util");
const { ValidationError, DatabaseError } = require("../utils/error.util");

// Instantiate the auth service
const authService = new AuthService();

const generateAndSendOtp = async (req, res) => {
  try {
    // Extract phone number from request body
    const phoneNumber = req.body.phoneNumber;
    logger.info('OTP generation request', { phoneNumber });
    
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Pass the phone number directly, not as an object
    const result = await authService.generateAndSendOtp({ phoneNumber: String(phoneNumber) });

    logger.info('OTP sent successfully', { phoneNumber });
    res.status(200).json(result);
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

    // Pass the phone number directly, not as an object
    const result = await authService.verifyOtp({ 
      phoneNumber: String(phoneNumber),
      otp: String(otp)
    });

    logger.info('OTP verified successfully', { phoneNumber });
    return res.status(200).json(result);

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

    return res.status(500).json({
      message: error.message || "OTP verification failed"
    });
  }
};

module.exports = {
  generateAndSendOtp,
  verifyOtp
};
