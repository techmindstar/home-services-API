const twilio = require('twilio');
const appConfig = require('../config/app.config');
const { logger } = require('./logger.util');
const { ValidationError, AppError } = require('./error.util');

const client = new twilio(appConfig.twilio_sid, appConfig.twilio_auth_token);

const formatPhoneNumber = (phoneNumber) => {
  try {
    // Convert to string if not already
    const phoneStr = String(phoneNumber);
    
    // Remove any non-digit characters
    const cleaned = phoneStr.replace(/\D/g, '');
    
    // If number doesn't start with country code, add it (assuming Indian numbers)
    if (!cleaned.startsWith('91')) {
      return `+91${cleaned}`;
    }
    
    // If number already has country code, just add +
    return `+${cleaned}`;
  } catch (error) {
    logger.error('Error formatting phone number:', {
      error: error.message,
      phoneNumber: phoneNumber
    });
    throw new ValidationError('Invalid phone number format');
  }
};

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
      to: phoneNumber
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

module.exports = { sendSms };
