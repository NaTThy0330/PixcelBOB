
# FR-03: Upload to Google Drive - Technical Specification

## 1. Overview
This feature handles the upload of images received from LINE to the user's Google Drive, including token management, file upload, and activity logging.

## 2. Architecture Components

### 2.1 Backend (Express.js)
- **Upload Service**: `/services/googleDrive.service.js`
- **Token Manager**: `/services/tokenManager.service.js`
- **Upload Controller**: `/controllers/upload.controller.js`
- **Upload Queue Worker**: `/workers/uploadQueue.worker.js`

### 2.2 External APIs
- **Google Drive API v3**: File upload and management
- **Google OAuth2 API**: Token refresh

## 3. Detailed Implementation

### 3.1 Upload Flow Sequence
```
1. Receive image binary from LINE webhook
2. Retrieve user's Google credentials from database
3. Check access token validity
4. Refresh token if expired
5. Upload file to Google Drive
6. Store upload metadata in database
7. Send confirmation to user via LINE
```

### 3.2 Core Service Functions

#### uploadToDrive Function
```typescript
interface UploadParams {
  imageBinary: Buffer;
  userId: string;
  fileName?: string;
  mimeType: string;
}

interface UploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  webViewLink: string;
  webContentLink: string;
}

async function uploadToDrive(params: UploadParams): Promise<UploadResult>
```

#### Token Refresh Logic
```typescript
interface TokenRefreshResult {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string; // May return new refresh token
}

async function refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult>
```

### 3.3 Google Drive API Integration

#### File Upload Implementation
```javascript
const uploadFile = async (drive, fileMetadata, media) => {
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, size, webViewLink, webContentLink'
  });
  return response.data;
};
```

#### File Metadata Structure
```javascript
{
  name: `LINE_IMG_${timestamp}.jpg`,
  parents: [folderId || 'root'],
  mimeType: 'image/jpeg',
  description: `Uploaded from LINE on ${new Date().toISOString()}`
}
```

### 3.4 Token Management

#### Access Token Lifecycle
1. **Token Validation**
   - Check token expiry before each request
   - Buffer time: Refresh if expires in < 5 minutes

2. **Token Refresh Flow**
   ```
   POST https://oauth2.googleapis.com/token
   {
     client_id: GOOGLE_CLIENT_ID,
     client_secret: GOOGLE_CLIENT_SECRET,
     refresh_token: user_refresh_token,
     grant_type: 'refresh_token'
   }
   ```

3. **Token Storage**
   - Cache access tokens in Redis with TTL
   - Update refresh tokens if rotated
   - Encrypt tokens at rest

### 3.5 Upload Queue Management

#### Queue Structure
```javascript
{
  jobId: string,
  userId: string,
  imageData: {
    binary: Buffer,
    mimeType: string,
    originalFileName: string
  },
  retryCount: number,
  priority: number
}
```

#### Queue Configuration
- **Concurrency**: 5 parallel uploads
- **Rate limiting**: 10 uploads/second per user
- **Retry strategy**: Exponential backoff (3 attempts)
- **Job timeout**: 30 seconds

### 3.6 Error Handling

| Error Code | Description | User Action |
|------------|-------------|-------------|
| UPLOAD001 | Invalid refresh token | Re-authenticate with Google |
| UPLOAD002 | Quota exceeded | Wait or upgrade Google storage |
| UPLOAD003 | File too large | Maximum 10MB per image |
| UPLOAD004 | Network timeout | Automatic retry |
| UPLOAD005 | Invalid file format | Only JPEG/PNG supported |
| UPLOAD006 | Folder not found | Reset folder selection |

### 3.7 Database Schema

```sql
-- Upload records
CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_id TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  google_drive_link TEXT,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upload queue status
CREATE TABLE upload_queue (
  id SERIAL PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_created_at ON uploads(created_at);
CREATE INDEX idx_upload_queue_status ON upload_queue(status);
```

## 4. Implementation Details

### 4.1 File Naming Convention
```javascript
const generateFileName = (originalName, timestamp) => {
  const date = new Date(timestamp);
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  const extension = path.extname(originalName) || '.jpg';
  return `LINE_${dateStr}_${timeStr}${extension}`;
};
```

### 4.2 Folder Structure
- Default: Root folder
- User-specified: Custom folder ID
- Auto-organization: Create monthly folders (optional)

### 4.3 Memory Management
- Stream large files instead of loading into memory
- Chunk uploads for files > 5MB
- Clean up temporary files after upload

## 5. Performance Optimization

### 5.1 Caching Strategy
- Cache Google Drive service instances
- Cache access tokens with appropriate TTL
- Pre-warm connections to Google APIs

### 5.2 Batch Processing
- Group multiple small files into batch requests
- Implement parallel upload pipelines
- Use connection pooling

### 5.3 Resource Limits
```javascript
{
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxConcurrentUploads: 5,
  uploadTimeout: 30000, // 30 seconds
  retryDelayBase: 1000, // 1 second
  maxRetries: 3
}
```

## 6. Monitoring & Logging

### 6.1 Metrics
- Upload success/failure rate
- Average upload time
- Token refresh frequency
- Queue length and processing time
- Storage quota usage per user

### 6.2 Logging
```javascript
// Success log
{
  level: 'info',
  action: 'upload_success',
  userId: 'xxx',
  fileId: 'xxx',
  fileName: 'xxx',
  fileSize: 12345,
  uploadTime: 1234,
  timestamp: new Date()
}

// Error log
{
  level: 'error',
  action: 'upload_failed',
  userId: 'xxx',
  error: 'UPLOAD002',
  details: {...},
  timestamp: new Date()
}
```

## 7. Testing Requirements

### 7.1 Unit Tests
- Token refresh logic
- File naming generation
- Error handling scenarios
- Queue management logic

### 7.2 Integration Tests
- Full upload flow with mock Google API
- Token expiry handling
- Retry mechanism
- Concurrent upload handling

### 7.3 Load Tests
- 100 concurrent uploads
- Large file handling (10MB)
- Token refresh under load
- Queue overflow scenarios

## 8. Security Considerations

1. **Token Security**
   - Encrypt refresh tokens at rest
   - Use secure token storage (not in logs)
   - Implement token rotation

2. **File Validation**
   - Check file headers (magic bytes)
   - Scan for malicious content
   - Validate MIME types

3. **Rate Limiting**
   - Per-user upload limits
   - Global rate limiting
   - DDoS protection

## 9. Dependencies

### NPM Packages
- `googleapis`: Official Google APIs client
- `multer`: Multipart file handling
- `bull`: Queue management
- `ioredis`: Redis client for caching
- `file-type`: File type detection
- `sharp`: Image processing (optional)

## 10. Environment Variables

```env
# Google API
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Upload Configuration
MAX_FILE_SIZE_BYTES=10485760
UPLOAD_TIMEOUT_MS=30000
MAX_CONCURRENT_UPLOADS=5

# Redis Configuration
REDIS_URL=redis://localhost:6379
TOKEN_CACHE_TTL=3300

# Encryption
ENCRYPTION_KEY=your_encryption_key
```

## 11. API Response Examples

### Successful Upload
```json
{
  "success": true,
  "data": {
    "fileId": "1abc...xyz",
    "fileName": "LINE_2024-01-15_14-30-45.jpg",
    "fileSize": 2048576,
    "webViewLink": "https://drive.google.com/file/d/1abc...xyz/view",
    "uploadedAt": "2024-01-15T14:30:45Z"
  }
}
```

### Failed Upload
```json
{
  "success": false,
  "error": {
    "code": "UPLOAD002",
    "message": "Google Drive storage quota exceeded",
    "details": {
      "quotaUsed": 15000000000,
      "quotaLimit": 15000000000
    }
  }
}
```