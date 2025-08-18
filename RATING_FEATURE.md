# Rating and Feedback Feature

## Overview
The Rating and Feedback feature allows users to provide ratings (1-5 stars) and feedback for completed bookings. The system automatically calculates and displays average ratings for subservices, helping other users make informed decisions.

## Features

### For Users
- **Rate Completed Bookings**: Users can rate their completed bookings with 1-5 stars
- **Provide Feedback**: Users can write detailed feedback (10-500 characters)
- **Manage Ratings**: Users can update or delete their pending ratings
- **View Average Ratings**: Users can see average ratings for all subservices

### For Admins
- **Review Ratings**: Admins can approve or reject user ratings
- **View All Ratings**: Admins can view all ratings with pagination
- **Manage Pending Ratings**: Admins can see and review pending ratings

## Database Schema

### Rating Model
```javascript
{
  booking: ObjectId,        // Reference to booking
  user: ObjectId,          // Reference to user who rated
  subservice: ObjectId,    // Reference to subservice
  service: ObjectId,       // Reference to service
  rating: Number,          // 1-5 stars
  feedback: String,        // 10-500 characters
  status: String,          // 'pending', 'approved', 'rejected'
  reviewedBy: ObjectId,    // Admin who reviewed (optional)
  reviewedAt: Date,        // When reviewed (optional)
  reviewNote: String,      // Admin's review note (optional)
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### User Endpoints (Require Authentication)

#### 1. Create Rating for Completed Booking
```
POST /api/ratings/booking/:bookingId
Authorization: Bearer <token>

Request Body:
{
  "rating": 5,
  "feedback": "Excellent service! The staff was very professional and the quality was outstanding."
}

Response:
{
  "success": true,
  "message": "Rating submitted successfully",
  "data": {
    "bookingId": "booking_id",
    "ratings": [
      {
        "id": "rating_id",
        "rating": 5,
        "feedback": "Excellent service!...",
        "status": "pending",
        "subservice": "subservice_id",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### 2. Get User's Ratings
```
GET /api/ratings/my-ratings?status=approved
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Ratings fetched successfully",
  "data": {
    "ratings": [
      {
        "id": "rating_id",
        "rating": 5,
        "feedback": "Excellent service!...",
        "status": "approved",
        "subservice": { "name": "Service Name", "description": "..." },
        "service": { "name": "Service Category" },
        "booking": { "date": "2024-01-01", "time": "10:00" },
        "reviewedBy": { "name": "Admin Name" },
        "reviewedAt": "2024-01-02T00:00:00.000Z",
        "reviewNote": "Approved",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### 3. Get Specific Rating
```
GET /api/ratings/my-ratings/:ratingId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Rating fetched successfully",
  "data": {
    "rating": {
      "id": "rating_id",
      "rating": 5,
      "feedback": "Excellent service!...",
      "status": "approved",
      "subservice": { "name": "Service Name", "description": "..." },
      "service": { "name": "Service Category" },
      "booking": { "date": "2024-01-01", "time": "10:00" },
      "user": { "name": "User Name", "phoneNumber": "1234567890" },
      "reviewedBy": { "name": "Admin Name" },
      "reviewedAt": "2024-01-02T00:00:00.000Z",
      "reviewNote": "Approved",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 4. Update Rating
```
PUT /api/ratings/my-ratings/:ratingId
Authorization: Bearer <token>

Request Body:
{
  "rating": 4,
  "feedback": "Updated feedback message..."
}

Response:
{
  "success": true,
  "message": "Rating updated successfully",
  "data": {
    "rating": {
      "id": "rating_id",
      "rating": 4,
      "feedback": "Updated feedback message...",
      "status": "pending",
      "subservice": { "name": "Service Name", "description": "..." },
      "service": { "name": "Service Category" },
      "booking": { "date": "2024-01-01", "time": "10:00" },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 5. Delete Rating
```
DELETE /api/ratings/my-ratings/:ratingId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Rating deleted successfully"
}
```

### Public Endpoints (No Authentication Required)

#### 6. Get Average Rating for Subservice
```
GET /api/ratings/average/subservice/:subserviceId

Response:
{
  "success": true,
  "message": "Average rating statistics fetched successfully",
  "data": {
    "subserviceId": "subservice_id",
    "averageRating": 4.5,
    "totalRatings": 25,
    "ratingDistribution": {
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 8,
      "5": 11
    }
  }
}
```

#### 7. Get Average Ratings for All Subservices
```
GET /api/ratings/average/all-subservices

Response:
{
  "success": true,
  "message": "Average rating statistics fetched successfully",
  "data": {
    "subservices": [
      {
        "subserviceId": "subservice_id_1",
        "subserviceName": "Service Name 1",
        "averageRating": 4.5,
        "totalRatings": 25,
        "ratingDistribution": {
          "1": 1, "2": 2, "3": 3, "4": 8, "5": 11
        }
      },
      {
        "subserviceId": "subservice_id_2",
        "subserviceName": "Service Name 2",
        "averageRating": 4.2,
        "totalRatings": 15,
        "ratingDistribution": {
          "1": 0, "2": 1, "3": 2, "4": 6, "5": 6
        }
      }
    ]
  }
}
```

### Admin Endpoints (Require Admin Authentication)

#### 8. Get Pending Ratings
```
GET /api/ratings/pending?page=1&limit=10
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Pending ratings fetched successfully",
  "data": {
    "ratings": [
      {
        "id": "rating_id",
        "rating": 5,
        "feedback": "Excellent service!...",
        "status": "pending",
        "subservice": { "name": "Service Name", "description": "..." },
        "service": { "name": "Service Category" },
        "user": { "name": "User Name", "phoneNumber": "1234567890" },
        "booking": { "date": "2024-01-01", "time": "10:00" },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

#### 9. Get All Ratings
```
GET /api/ratings/all?page=1&limit=10&status=approved
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "All ratings fetched successfully",
  "data": {
    "ratings": [
      {
        "id": "rating_id",
        "rating": 5,
        "feedback": "Excellent service!...",
        "status": "approved",
        "subservice": { "name": "Service Name", "description": "..." },
        "service": { "name": "Service Category" },
        "user": { "name": "User Name", "phoneNumber": "1234567890" },
        "booking": { "date": "2024-01-01", "time": "10:00" },
        "reviewedBy": { "name": "Admin Name" },
        "reviewedAt": "2024-01-02T00:00:00.000Z",
        "reviewNote": "Approved",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

#### 10. Review Rating (Approve/Reject)
```
PUT /api/ratings/:ratingId/review
Authorization: Bearer <admin_token>

Request Body:
{
  "status": "approved",
  "reviewNote": "Good feedback, approved"
}

Response:
{
  "success": true,
  "message": "Rating approved successfully",
  "data": {
    "rating": {
      "id": "rating_id",
      "rating": 5,
      "feedback": "Excellent service!...",
      "status": "approved",
      "reviewedBy": "admin_id",
      "reviewedAt": "2024-01-02T00:00:00.000Z",
      "reviewNote": "Good feedback, approved"
    }
  }
}
```

## Business Rules

### Rating Creation
- Only completed bookings can be rated
- Users can only rate their own bookings
- One rating per booking (prevents duplicate ratings)
- Rating must be between 1-5 stars
- Feedback must be 10-500 characters

### Rating Management
- Users can only update/delete their own ratings
- Only pending ratings can be updated/deleted
- Approved/rejected ratings cannot be modified by users

### Admin Review Process
- All new ratings start with 'pending' status
- Admins can approve or reject ratings
- Admins can add review notes (optional, max 200 characters)
- Only approved ratings are included in average calculations

### Average Rating Calculation
- Only approved ratings are considered
- Average is calculated to 2 decimal places
- Rating distribution shows count of each star rating (1-5)
- Subservices are sorted by average rating (highest first)

## Error Handling

### Common Error Responses

#### Validation Errors (400)
```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

#### Not Found Errors (404)
```json
{
  "success": false,
  "message": "Rating not found"
}
```

#### Authorization Errors (403)
```json
{
  "success": false,
  "message": "Access denied. You can only view your own ratings."
}
```

#### Server Errors (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Examples

### Frontend Integration

#### Display Average Rating
```javascript
// Fetch average rating for a subservice
const response = await fetch('/api/ratings/average/subservice/123');
const data = await response.json();

// Display rating
const rating = data.data.averageRating;
const totalRatings = data.data.totalRatings;

// Show stars
for (let i = 1; i <= 5; i++) {
  if (i <= rating) {
    // Show filled star
  } else if (i - rating < 1) {
    // Show partial star
  } else {
    // Show empty star
  }
}
```

#### Submit Rating
```javascript
// Submit rating for completed booking
const response = await fetch('/api/ratings/booking/123', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    rating: 5,
    feedback: 'Excellent service! Very professional staff.'
  })
});

const result = await response.json();
if (result.success) {
  // Show success message
  alert('Rating submitted successfully!');
}
```

## Security Features

1. **Authentication Required**: All user operations require valid JWT token
2. **Authorization**: Users can only access their own ratings
3. **Admin Protection**: Admin endpoints require admin role
4. **Input Validation**: All inputs are validated for type, length, and range
5. **Rate Limiting**: API endpoints are protected by rate limiting
6. **Logging**: All operations are logged for audit purposes

## Performance Considerations

1. **Indexed Queries**: Database indexes on frequently queried fields
2. **Pagination**: Large result sets are paginated
3. **Aggregation**: Average calculations use MongoDB aggregation pipeline
4. **Population**: Related data is populated efficiently
5. **Caching**: Consider caching average ratings for frequently accessed subservices

## Future Enhancements

1. **Rating Photos**: Allow users to upload photos with ratings
2. **Rating Categories**: Rate different aspects (quality, service, value)
3. **Rating Analytics**: Advanced analytics and reporting
4. **Rating Notifications**: Notify admins of new ratings
5. **Rating Moderation**: AI-powered content moderation
6. **Rating Incentives**: Reward users for providing helpful ratings 