# Authentication Service

A robust Node.js authentication service that provides OTP-based phone number verification using Twilio SMS. This service is part of a larger service booking application but can be used independently.

## Features

- 🔐 Phone number verification using OTP
- 📱 SMS notifications via Twilio
- 🔑 JWT token generation and validation
- 👤 User registration and authentication
- ⚡ Rate limiting on OTP requests
- 📝 Comprehensive logging
- 🛡️ Secure error handling
- 🧩 Modular and extensible architecture

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Twilio Account (for SMS)
- npm or yarn package manager

## Installation

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

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── database/         # Database connection
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── app.js           # Application entry point
```

## API Routes

### Authentication Routes

#### 1. Generate OTP
```http
POST /api/auth/generate-otp
Content-Type: application/json

Request Body:
{
    "phoneNumber": "1234567890"  // Required: 10-digit phone number
}

Response:
{
    "message": "OTP sent successfully"
}
```

#### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

Request Body:
{
    "phoneNumber": "1234567890",  // Required: 10-digit phone number
    "otp": "123456"               // Required: 6-digit OTP
}

Response:
{
    "message": "OTP verified successfully",
    "user": {
        "id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
    },
    "token": "jwt_token"
}
```

### User Routes

#### 1. Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <jwt_token>

Response:
{
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "phoneNumber": "1234567890",
    "addresses": [
        {
            "id": "address_id",
            "street": "123 Main St",
            "city": "City",
            "state": "State",
            "pincode": "123456"
        }
    ]
}
```

#### 2. Update User Profile
```http
PATCH /api/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
    "name": "New Name",           // Optional
    "email": "new@email.com"      // Optional
}

Response:
{
    "message": "Profile updated successfully",
    "user": {
        "id": "user_id",
        "name": "New Name",
        "email": "new@email.com"
    }
}
```

### Address Routes

#### 1. Add Address
```http
POST /api/users/addresses
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
    "street": "123 Main St",      // Required
    "city": "City",               // Required
    "state": "State",             // Required
    "pincode": "123456",          // Required
    "isDefault": true             // Optional, defaults to false
}

Response:
{
    "message": "Address added successfully",
    "address": {
        "id": "address_id",
        "street": "123 Main St",
        "city": "City",
        "state": "State",
        "pincode": "123456",
        "isDefault": true
    }
}
```

#### 2. Update Address
```http
PATCH /api/users/addresses/:addressId
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
    "street": "456 New St",       // Optional
    "city": "New City",           // Optional
    "state": "New State",         // Optional
    "pincode": "654321",          // Optional
    "isDefault": true             // Optional
}

Response:
{
    "message": "Address updated successfully",
    "address": {
        "id": "address_id",
        "street": "456 New St",
        "city": "New City",
        "state": "New State",
        "pincode": "654321",
        "isDefault": true
    }
}
```

#### 3. Delete Address
```http
DELETE /api/users/addresses/:addressId
Authorization: Bearer <jwt_token>

Response:
{
    "message": "Address deleted successfully"
}
```

### Service Routes

#### 1. Get All Services
```http
GET /api/services
Authorization: Bearer <jwt_token>

Response:
{
    "services": [
        {
            "id": "service_id",
            "name": "Service Name",
            "description": "Service Description",
            "price": 100,
            "duration": 60,
            "category": "Category Name"
        }
    ]
}
```

#### 2. Get Service by ID
```http
GET /api/services/:serviceId
Authorization: Bearer <jwt_token>

Response:
{
    "id": "service_id",
    "name": "Service Name",
    "description": "Service Description",
    "price": 100,
    "duration": 60,
    "category": "Category Name",
    "subservices": [
        {
            "id": "subservice_id",
            "name": "Subservice Name",
            "price": 50
        }
    ]
}
```

### Booking Routes

#### 1. Create Booking
```http
POST /api/bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
    "serviceId": "service_id",        // Required
    "subserviceId": "subservice_id",  // Optional
    "addressId": "address_id",        // Required
    "date": "2024-04-10",            // Required: YYYY-MM-DD
    "time": "14:00",                  // Required: HH:mm
    "notes": "Special instructions"   // Optional
}

Response:
{
    "message": "Booking created successfully",
    "booking": {
        "id": "booking_id",
        "service": {
            "name": "Service Name",
            "price": 100
        },
        "date": "2024-04-10",
        "time": "14:00",
        "status": "pending"
    }
}
```

#### 2. Get User Bookings
```http
GET /api/bookings
Authorization: Bearer <jwt_token>

Response:
{
    "bookings": [
        {
            "id": "booking_id",
            "service": {
                "name": "Service Name",
                "price": 100
            },
            "date": "2024-04-10",
            "time": "14:00",
            "status": "pending"
        }
    ]
}
```

#### 3. Cancel Booking
```http
PATCH /api/bookings/:bookingId/cancel
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
    "reason": "Cancellation reason"   // Required
}

Response:
{
    "message": "Booking cancelled successfully",
    "booking": {
        "id": "booking_id",
        "status": "cancelled"
    }
}
```

#### 4. Reschedule Booking
```http
PATCH /api/bookings/:bookingId/reschedule
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
    "date": "2024-04-15",    // Required: YYYY-MM-DD
    "time": "15:00"          // Required: HH:mm
}

Response:
{
    "message": "Booking rescheduled successfully",
    "booking": {
        "id": "booking_id",
        "date": "2024-04-15",
        "time": "15:00"
    }
}
```

## Error Handling

The service includes comprehensive error handling for various scenarios:

- **Validation Errors (400)**
  - Invalid phone number format
  - Missing required fields
  - Invalid OTP
  - OTP expired
  - Too many OTP requests

- **Authentication Errors (401)**
  - Invalid token
  - Token expired

- **Database Errors (500)**
  - Connection issues
  - Query failures

## Logging

The service uses Winston logger with the following log levels:

- **INFO**: Normal operations
  - OTP generation
  - User creation
  - Successful verifications

- **WARN**: Potential issues
  - Rate limiting
  - Invalid inputs
  - Expired OTPs

- **ERROR**: Critical errors
  - Database failures
  - SMS sending failures
  - System errors

## Security Features

- Phone number validation and formatting
- OTP expiration (5 minutes)
- Rate limiting on OTP generation
- JWT token authentication
- Secure password handling
- Input validation
- Error message sanitization

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT handling
- **twilio**: SMS service
- **winston**: Logging
- **dotenv**: Environment variables
- **bcryptjs**: Password hashing

## Development

To run the service in development mode:
```bash
npm run dev
```

To run in production mode:
```bash
npm start
```

## Testing

The service includes comprehensive error handling and logging for testing purposes. You can test the endpoints using tools like Postman or curl.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 