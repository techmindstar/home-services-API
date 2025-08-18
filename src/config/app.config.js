const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  port: process.env.PORT,
  JWT_SECRET:process.env.JWT_SECRET,
  jwt_expiry:process.env.JWT_EXPIRY,
  brcrypt_salt_rounds:process.env.BCRYPT_SALT_ROUNDS,
  twilio_account_sid:process.env.TWILIO_ACCOUNT_SID,
  twilio_auth_token:process.env.TWILIO_AUTH_TOKEN,
  twilio_phone_number:process.env.TWILIO_PHONE_NUMBER,
  twilio_service_sid:process.env.TWILIO_SERVICE_SID,
  otp_expiry:process.env.OTP_EXPIRY,  
  access_key: process.env.ACCESS_KEY,
  secret_access_key: process.env.SECRET_ACCESS_KEY,
};

