# FR-02: LINE Webhook Integration - Technical Specification

## 1. Overview
This feature enables the system to receive images from LINE Official Account (OA) through webhook integration, validate message authenticity, and retrieve image content via LINE Content API.

## 2. Architecture Components

### 2.1 Backend (Express.js)
- **Webhook Route**: `/routes/line.routes.js`
- **Webhook Controller**: `/controllers/line.controller.js`
- **LINE Service**: `/services/line.service.js`
- **Signature Validation Middleware**: `/middleware/lineSignature.middleware.js`
- **Message Processor**: `/services/messageProcessor.service.js`

### 2.2 External APIs
- **LINE Messaging API**: Webhook events
- **LINE Content API**: Image content retrieval

## 3. Detailed Implementation

### 3.1 Webhook Flow Sequence
```
1. User sends image to LINE OA
2. LINE sends webhook event to `/line/webhook`
3. System validates signature
4. System extracts message ID from image event
5. System calls LINE Content API to get image binary
6. System stores image temporarily for processing
7. System responds with 200 OK to LINE
```

### 3.2 API Endpoints

#### POST `/api/line/webhook`
- **Purpose**: Receive webhook events from LINE
- **Headers**:
  - `x-line-signature`: HMAC signature for validation
- **Request Body**:
  ```json
  {
    "events": [{
      "type": "message",
      "mode": "active",
      "timestamp": 1234567890,
      "source": {
        "type": "user",
        "userId": "U1234567890abcdef"
      },
      "message": {
        "type": "image",
        "id": "123456789",
        "contentProvider": {
          "type": "line"
        }
      }
    }]
  }
  ```
- **Response**: 200 OK (must respond within 1 second)

### 3.3 Security Implementation

#### Signature Validation
```javascript
// Middleware for signature validation
const validateLineSignature = (req, res, next) => {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const signature = req.headers['x-line-signature'];
  const body = req.rawBody; // Raw request body
  
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
    
  if (signature !== hash) {
    return res.status(403).json({ error: 'Invalid signature' });
  }
  
  next();
};
```

### 3.4 Message Processing

#### Event Handler Structure
```javascript
interface LineEvent {
  type: string;
  mode: string;
  timestamp: number;
  source: {
    type: string;
    userId: string;
  };
  message?: {
    type: string;
    id: string;
    contentProvider?: {
      type: string;
    };
  };
}
```

#### Image Content Retrieval
- **Endpoint**: `https://api-data.line.me/v2/bot/message/{messageId}/content`
- **Headers**:
  - `Authorization: Bearer {channel_access_token}`
- **Response**: Binary image data
- **Supported formats**: JPEG, PNG
- **Max file size**: 10MB

### 3.5 Error Handling

| Error Code | Description | Action |
|------------|-------------|---------|
| WEBHOOK001 | Invalid signature | Return 403, log attempt |
| WEBHOOK002 | Malformed request body | Return 400 |
| WEBHOOK003 | Unsupported event type | Log and ignore, return 200 |
| WEBHOOK004 | Content API failure | Retry with exponential backoff |
| WEBHOOK005 | Image size exceeds limit | Notify user via LINE message |

### 3.6 Data Processing Pipeline

```
1. Event Reception
   - Validate signature
   - Parse event data
   - Filter for image messages

2. Image Retrieval
   - Call Content API with message ID
   - Stream image data to temporary storage
   - Validate image format and size

3. Queue Processing
   - Add to processing queue with metadata
   - Include user ID, timestamp, message ID
   - Set priority based on user tier

4. Response
   - Always return 200 OK immediately
   - Process asynchronously
```

### 3.7 Environment Variables

```env
# LINE API Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CONTENT_API_BASE=https://api-data.line.me

# Processing Configuration
MAX_IMAGE_SIZE_MB=10
SUPPORTED_IMAGE_FORMATS=jpeg,jpg,png
TEMP_STORAGE_PATH=/tmp/line-images
```

## 4. Implementation Details

### 4.1 Express Middleware Setup
```javascript
// Raw body preservation for signature validation
app.use('/api/line/webhook', 
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    req.body = JSON.parse(req.body.toString('utf8'));
    next();
  }
);
```

### 4.2 Asynchronous Processing
- Use message queue (Redis/RabbitMQ) for reliability
- Implement retry logic with exponential backoff
- Dead letter queue for failed processings
- Processing status tracking

### 4.3 Rate Limiting
- LINE API limits: 500 requests/second
- Implement request throttling
- Queue overflow handling

## 5. Testing Requirements

### 5.1 Unit Tests
- Signature validation logic
- Event parsing and filtering
- Error handling scenarios
- Content API integration

### 5.2 Integration Tests
- Complete webhook flow
- Signature validation with real signatures
- Content retrieval simulation
- Error response handling

### 5.3 Load Tests
- Handle burst of 1000 messages/minute
- Concurrent image processing
- Queue performance under load

## 6. Monitoring & Logging

### 6.1 Metrics
- Webhook requests per minute
- Signature validation success/failure rate
- Image retrieval success rate
- Processing queue length
- Average processing time

### 6.2 Logs
- All webhook events (sanitized)
- Signature validation failures
- Content API errors
- Processing pipeline status

### 6.3 Alerts
- Signature validation failure spike
- Content API downtime
- Queue overflow
- Processing delays > 5 minutes

## 7. Dependencies

### NPM Packages
- `@line/bot-sdk`: Official LINE SDK
- `express`: Web framework
- `axios`: HTTP client for Content API
- `bull`: Queue management
- `winston`: Logging
- `joi`: Request validation

## 8. Database Schema

```sql
-- Webhook events log
CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE,
  user_id TEXT NOT NULL,
  message_id TEXT,
  event_type TEXT NOT NULL,
  raw_event JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image processing queue
CREATE TABLE image_queue (
  id SERIAL PRIMARY KEY,
  message_id TEXT UNIQUE,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX idx_webhook_events_user_id ON webhook_events(user_id);
CREATE INDEX idx_image_queue_status ON image_queue(status);
```

## 9. Security Considerations

1. **Webhook URL**: Use unpredictable URL path
2. **IP Whitelisting**: Optional LINE server IPs
3. **Request timeout**: Max 1 second processing
4. **Data sanitization**: Clean user inputs
5. **File validation**: Check magic bytes
6. **Storage security**: Encrypt temporary files

## 10. Performance Requirements

- Webhook response time: < 1 second
- Concurrent webhooks: 100/second
- Image retrieval: < 5 seconds
- Total processing time: < 30 seconds per image