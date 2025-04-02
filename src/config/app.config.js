const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  port: process.env.PORT,
  JWT_SECRET:process.env.JWT_SECRET,
  jwt_expiry:process.env.JWT_EXPIRY,
  brcrypt_salt_rounds:process.env.BCRYPT_SALT_ROUNDS,
  twilio_sid:process.env.TWILIO_SID,
  twilio_auth_token:process.env.TWILIO_AUTH_TOKEN,
  twilio_phone_number:process.env.TWILIO_PHONE_NUMBER,
  otp_expiry:process.env.OTP_EXPIRY,  
};

