# Service Provider & Booking API - Complete Testing Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Service Provider APIs (Admin Only)

### 1. Create Service Provider
**POST** `/service-providers`

**Request Body (multipart/form-data):**
```json
{
  "name": "John Doe",
  "phoneNumber": "+919876543210",
  "email": "john.doe@example.com",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "services": ["64f1a2b3c4d5e6f7a8b9c0d1"],
  "subservices": ["64f1a2b3c4d5e6f7a8b9c0d2"],
  "aadhaarCard": {
    "number": "123456789012"
  },
  "panCard": {
    "number": "ABCDE1234F"
  },
  "experience": "5 years",
  "specialization": "Plumbing",
  "hourlyRate": 500
}
```

**Files to upload:**
- `aadhaarCardImage` (image file)
- `panCardImage` (image file) 
- `passportPhoto` (image file)

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/service-providers \
  -H "Authorization: Bearer <your_token>" \
  -F "name=John Doe" \
  -F "phoneNumber=+919876543210" \
  -F "email=john@example.com" \
  -F "aadhaarCardImage=@aadhaar.jpg" \
  -F "panCardImage=@pan.jpg" \
  -F "passportPhoto=@photo.jpg"
```

### 2. Get All Service Providers
**GET** `/service-providers?page=1&limit=10`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/service-providers?page=1&limit=10" \
  -H "Authorization: Bearer <your_token>"
```

### 3. Get Service Provider by ID
**GET** `/service-providers/:providerId`

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>"
```

### 4. Update Service Provider
**PUT** `/service-providers/:providerId`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "hourlyRate": 600,
  "specialization": "Plumbing & Electrical"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "hourlyRate": 600
  }'
```

### 5. Delete Service Provider
**DELETE** `/service-providers/:providerId`

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>"
```

### 6. Verify Service Provider
**PUT** `/service-providers/:providerId/verify`

**Request Body:**
```json
{
  "verificationStatus": "verified",
  "verificationNotes": "All documents verified successfully"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1/verify \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationStatus": "verified",
    "verificationNotes": "All documents verified successfully"
  }'
```

### 7. Suspend Service Provider
**PUT** `/service-providers/:providerId/suspend`

**Request Body:**
```json
{
  "suspensionReason": "Violation of terms",
  "suspensionDuration": "30 days"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1/suspend \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "suspensionReason": "Violation of terms",
    "suspensionDuration": "30 days"
  }'
```

### 8. Verify Documents
**PUT** `/service-providers/:providerId/verify-documents`

**Request Body:**
```json
{
  "aadhaarCardVerified": true,
  "panCardVerified": true,
  "passportPhotoVerified": true,
  "verificationNotes": "All documents are authentic"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1/verify-documents \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaarCardVerified": true,
    "panCardVerified": true,
    "passportPhotoVerified": true,
    "verificationNotes": "All documents are authentic"
  }'
```

### 9. Get Available Providers
**POST** `/service-providers/available`

**Request Body:**
```json
{
  "serviceId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subserviceId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "location": "Mumbai",
  "date": "2024-01-15",
  "time": "10:00"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/service-providers/available \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "subserviceId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "location": "Mumbai",
    "date": "2024-01-15",
    "time": "10:00"
  }'
```

### 10. Assign Provider to Booking
**PUT** `/service-providers/:providerId/assign/:bookingId`

**Request Body:**
```json
{
  "assignmentNotes": "Provider assigned based on availability and rating"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1/assign/64f1a2b3c4d5e6f7a8b9c0d2 \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentNotes": "Provider assigned based on availability and rating"
  }'
```

### 11. Get Provider Statistics
**GET** `/service-providers/:providerId/stats`

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/service-providers/64f1a2b3c4d5e6f7a8b9c0d1/stats \
  -H "Authorization: Bearer <your_token>"
```

---

## Booking APIs

### User Routes (Require User Authentication)

### 1. Create Booking
**POST** `/booking`

**Request Body:**
```json
{
  "serviceId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subserviceId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "addressId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "10:00",
  "description": "Need plumbing service for bathroom",
  "preferredProviderId": "64f1a2b3c4d5e6f7a8b9c0d4"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/booking \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "subserviceId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "scheduledDate": "2024-01-15",
    "scheduledTime": "10:00",
    "description": "Need plumbing service for bathroom"
  }'
```

### 2. Get User Bookings
**GET** `/booking/my-bookings?page=1&limit=10`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/booking/my-bookings?page=1&limit=10" \
  -H "Authorization: Bearer <your_token>"
```

### 3. Get User Booking by ID
**GET** `/booking/my-bookings/:id`

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/booking/my-bookings/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>"
```

### 4. Update User Booking
**PUT** `/booking/my-bookings/:id`

**Request Body:**
```json
{
  "scheduledDate": "2024-01-16",
  "scheduledTime": "11:00",
  "description": "Updated description"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/booking/my-bookings/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledDate": "2024-01-16",
    "scheduledTime": "11:00",
    "description": "Updated description"
  }'
```

### 5. Delete User Booking
**DELETE** `/booking/my-bookings/:id`

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/booking/my-bookings/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>"
```

### 6. Reschedule Booking
**PATCH** `/booking/my-bookings/:id/reschedule`

**Request Body:**
```json
{
  "scheduledDate": "2024-01-17",
  "scheduledTime": "14:00"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:5000/api/booking/my-bookings/64f1a2b3c4d5e6f7a8b9c0d1/reschedule \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledDate": "2024-01-17",
    "scheduledTime": "14:00"
  }'
```

### 7. Cancel Booking
**PATCH** `/booking/my-bookings/:id/cancel`

**Request Body:**
```json
{
  "cancellationReason": "Change of plans"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:5000/api/booking/my-bookings/64f1a2b3c4d5e6f7a8b9c0d1/cancel \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cancellationReason": "Change of plans"
  }'
```

---

### Admin Routes (Require Admin Authentication)

### 8. Get All Bookings
**GET** `/booking?page=1&limit=10`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/booking?page=1&limit=10" \
  -H "Authorization: Bearer <your_token>"
```

### 9. Get Booking by ID
**GET** `/booking/:id`

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/booking/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>"
```

### 10. Get Bookings by Service
**GET** `/booking/service/:serviceId`

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/booking/service/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>"
```

### 11. Get Bookings by Subservice
**GET** `/booking/subservice/:subserviceId`

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/booking/subservice/64f1a2b3c4d5e6f7a8b9c0d1 \
  -H "Authorization: Bearer <your_token>"
```

### 12. Assign Service Provider to Booking
**PUT** `/booking/:bookingId/assign-provider`

**Request Body:**
```json
{
  "providerId": "64f1a2b3c4d5e6f7a8b9c0d4",
  "assignmentNotes": "Provider assigned based on availability"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/booking/64f1a2b3c4d5e6f7a8b9c0d1/assign-provider \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "64f1a2b3c4d5e6f7a8b9c0d4",
    "assignmentNotes": "Provider assigned based on availability"
  }'
```

---

## Testing Notes

### 1. Authentication
- You'll need to login first to get a JWT token
- Use the token in the `Authorization: Bearer <token>` header for all requests

### 2. Admin Access
- Service provider management requires admin privileges
- User routes require regular user authentication

### 3. File Uploads
- Use `multipart/form-data` for endpoints with file uploads
- Supported image formats: JPEG, PNG, WebP
- Maximum file size: 5MB

### 4. IDs
- Replace placeholder IDs (like `64f1a2b3c4d5e6f7a8b9c0d1`) with actual IDs from your database
- Use the IDs returned from create operations for subsequent requests

### 5. Pagination
- Use `page` and `limit` query parameters for list endpoints
- Default values: `page=1`, `limit=10`

### 6. Error Handling
- All endpoints return consistent error responses
- Check the `success` field in responses
- Error messages are descriptive and helpful

### 7. Testing Tools
- Use Postman, Insomnia, or cURL for testing
- For file uploads, ensure you're using the correct content type
- Test both successful and error scenarios

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error 