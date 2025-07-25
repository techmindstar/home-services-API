const generateOTP = (length = 4) => {
    const chars = '0123456789'; // Numeric OTP
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return otp;
  };
  
  module.exports = { generateOTP };
  