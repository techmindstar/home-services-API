# Authentication Service

A Node.js authentication service that provides OTP-based phone number verification using Twilio SMS.

## Features

- Phone number verification using OTP
- JWT token generation
- User registration and authentication
- Secure password handling
- Comprehensive error handling and logging

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Twilio Account (for SMS)

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd auth-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# MongoDB Configuration
DB_USER=your_mongodb_username
DB_PASSWORD=your_mongodb_password
DB_NAME=your_database_name

# JWT Configuration
JWT_SECRET=your_jwt_secret
jwt_expiry=24h

# Twilio Configuration
twilio_sid=your_twilio_sid
twilio_auth_token=your_twilio_auth_token
twilio_phone_number=your_twilio_phone_number

# OTP Configuration
otp_expiry=300000  # 5 minutes in milliseconds
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Generate OTP
```http
POST /api/auth/generate-otp
Content-Type: application/json

{
    "phoneNumber": "1234567890"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
    "phoneNumber": "1234567890",
    "otp": "123456"
}
```

## Response Format

### Success Response
```json
{
    "message": "Success message",
    "data": {
        // Response data
    }
}
```

### Error Response
```json
{
    "message": "Error message",
    "error": "Detailed error information"
}
```

## Error Handling

The service includes comprehensive error handling for:
- Invalid phone numbers
- Expired OTPs
- Invalid OTPs
- Database errors
- SMS sending failures

## Logging

All operations are logged using Winston logger with the following levels:
- INFO: Normal operations
- WARN: Potential issues
- ERROR: Critical errors

## Security

- Phone numbers are validated
- OTPs expire after 5 minutes
- JWT tokens are used for authentication
- Passwords are hashed using bcrypt
- Rate limiting on OTP generation 