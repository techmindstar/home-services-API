const twilio = require('twilio');
const appConfig = require('../config/app.config');
const { logger } = require('./logger.util');
const { ValidationError, AppError } = require('./error.util');

// Initialize Twilio client
const client = new twilio(appConfig.twilio_account_sid, appConfig.twilio_auth_token);

// Get Verify service
const getVerifyService = () => {
  const serviceSid = appConfig.twilio_service_sid;
  if (!serviceSid) {
    throw new AppError('Twilio Verify Service SID is not configured', 500);
  }
  return client.verify.v2.services(serviceSid);
};

const formatPhoneNumber = (phoneNumber) => {
  try {
    // Convert to string if not already
    const phoneStr = String(phoneNumber);
    
    // Remove any non-digit characters
    const cleaned = phoneStr.replace(/\D/g, '');
    
    // Handle different phone number formats
    if (cleaned.startsWith('91')) {
      // If number starts with 91, add + prefix
      return `+${cleaned}`;
    } else if (cleaned.length === 10) {
      // If it's a 10-digit number, add +91 prefix
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // If it's a 12-digit number starting with 91, add + prefix
      return `+${cleaned}`;
    } else {
      throw new ValidationError('Invalid phone number format. Must be a 10-digit number or start with 91');
    }
  } catch (error) {
    logger.error('Error formatting phone number:', {
      error: error.message,
      phoneNumber: phoneNumber
    });
    throw new ValidationError('Invalid phone number format');
  }
};

const sendOtp = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new ValidationError("Phone number is required");
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    logger.info('Attempting to send OTP', {
      to: formattedNumber,
      originalNumber: phoneNumber
    });

    const verifyService = getVerifyService();
    const verification = await verifyService.verifications.create({
      to: formattedNumber,
      channel: 'sms'
    });
    
    logger.info('OTP sent successfully', {
      to: formattedNumber,
      status: verification.status
    });
    
    return verification;
  } catch (error) {
    logger.error('Failed to send OTP', {
      error: error.message,
      code: error.code,
      to: phoneNumber,
      formattedNumber: formatPhoneNumber(phoneNumber)
    });

    if (error instanceof ValidationError) {
      throw error;
    }

    // Handle Twilio-specific errors
    if (error.code === 20404) {
      throw new AppError('Twilio Verify Service is not configured correctly. Please check your Service SID.', 500);
    }

    if (error.code) {
      throw new AppError(`Twilio Error ${error.code}: ${error.message}`, 500);
    }

    throw new AppError('Failed to send OTP', 500);
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  try {
    if (!phoneNumber || !otp) {
      throw new ValidationError("Phone number and OTP are required");
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    logger.info('Verifying OTP', {
      to: formattedNumber,
      originalNumber: phoneNumber
    });

    const verifyService = getVerifyService();
    const verificationCheck = await verifyService.verificationChecks.create({
      to: formattedNumber,
      code: otp
    });

    logger.info('OTP verification result', {
      to: formattedNumber,
      status: verificationCheck.status
    });

    return verificationCheck.status === 'approved';
  } catch (error) {
    logger.error('Failed to verify OTP', {
      error: error.message,
      code: error.code,
      to: phoneNumber,
      formattedNumber: formatPhoneNumber(phoneNumber)
    });

    if (error instanceof ValidationError) {
      throw error;
    }

    // Handle Twilio-specific errors
    if (error.code === 20404) {
      throw new AppError('Twilio Verify Service is not configured correctly. Please check your Service SID.', 500);
    }

    if (error.code) {
      throw new AppError(`Twilio Error ${error.code}: ${error.message}`, 500);
    }

    throw new AppError('Failed to verify OTP', 500);
  }
};

// Keep the regular SMS function for non-OTP messages
const sendSms = async (phoneNumber, message) => {
  try {
    if (!phoneNumber) {
      throw new ValidationError("Phone number is required");
    }
    
    if (!message) {
      throw new ValidationError("Message content is required");
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    logger.info('Attempting to send SMS', {
      to: formattedNumber,
      originalNumber: phoneNumber,
      messageLength: message.length
    });

    const sentMessage = await client.messages.create({
      body: message,
      from: appConfig.twilio_phone_number,
      to: formattedNumber,
    });
    
    logger.info('SMS sent successfully', {
      to: formattedNumber,
      messageId: sentMessage.sid
    });
    return sentMessage;
  } catch (error) {
    logger.error('Failed to send SMS', {
      error: error.message,
      code: error.code,
      to: phoneNumber,
      formattedNumber: formatPhoneNumber(phoneNumber)
    });

    if (error instanceof ValidationError) {
      throw error;
    }

    // Handle Twilio-specific errors
    if (error.code) {
      throw new AppError(`Twilio Error ${error.code}: ${error.message}`, 500);
    }

    throw new AppError('Failed to send message', 500);
  }
};

module.exports = { sendSms, sendOtp, verifyOtp, formatPhoneNumber };
