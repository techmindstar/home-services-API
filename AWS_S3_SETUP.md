# AWS S3 Setup Guide

## Environment Variables Required

Add these environment variables to your `.env` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## AWS S3 Bucket Setup

### 1. Create S3 Bucket
1. Go to AWS S3 Console
2. Click "Create bucket"
3. Choose a unique bucket name
4. Select your preferred region
5. Configure options as needed (versioning, encryption, etc.)

### 2. Configure Bucket Permissions
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowServiceProviderUploads",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

### 3. IAM User Setup
Create an IAM user with the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

## File Upload Flow

### 1. Frontend Form
```html
<form enctype="multipart/form-data" method="POST" action="/api/service-providers">
  <input type="file" name="aadhaarCardImage" accept="image/*" required>
  <input type="file" name="panCardImage" accept="image/*" required>
  <input type="file" name="passportPhoto" accept="image/*" required>
  <!-- other fields -->
</form>
```

### 2. Backend Processing
1. **File Upload**: Multer middleware processes uploaded files
2. **S3 Upload**: Files are uploaded to S3 bucket
3. **URL Storage**: S3 URLs and keys are stored in database
4. **Response**: Success response with provider details

### 3. File Structure in S3
```
your-bucket/
├── aadhaarCard/
│   ├── 1705123456789-abc123.jpg
│   └── 1705123456790-def456.jpg
├── panCard/
│   ├── 1705123456791-ghi789.jpg
│   └── 1705123456792-jkl012.jpg
└── passportPhoto/
    ├── 1705123456793-mno345.jpg
    └── 1705123456794-pqr678.jpg
```

## Security Considerations

### 1. File Validation
- File type: Only JPEG, PNG, WebP allowed
- File size: Maximum 5MB per file
- File dimensions: Minimum 100x100 pixels (optional)

### 2. Access Control
- Files are stored as private by default
- Signed URLs can be generated for temporary access
- Admin authentication required for all operations

### 3. Cleanup
- Old files are automatically deleted when updated
- S3 keys are stored for proper file management

## Error Handling

### Common Upload Errors
```json
{
  "success": false,
  "message": "File upload failed: Only JPEG, PNG, and WebP images are allowed"
}
```

### File Size Errors
```json
{
  "success": false,
  "message": "File upload failed: File too large. Maximum size is 5MB"
}
```

## Testing

### 1. Install Dependencies
```bash
npm install aws-sdk multer multer-s3
```

### 2. Test Upload
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "aadhaarCardImage=@/path/to/aadhaar.jpg" \
  -F "panCardImage=@/path/to/pan.jpg" \
  -F "passportPhoto=@/path/to/photo.jpg" \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "phoneNumber=9876543210" \
  http://localhost:3000/api/service-providers
```

## Monitoring

### 1. Logs
- File upload success/failure logs
- S3 operation logs
- File size and type validation logs

### 2. Metrics
- Upload success rate
- File size distribution
- Storage usage tracking

## Cost Optimization

### 1. Storage Classes
- Use S3 Standard for frequently accessed files
- Consider S3-IA for older documents
- Implement lifecycle policies for cost management

### 2. CDN Integration
- Use CloudFront for global access
- Reduce S3 request costs
- Improve user experience 