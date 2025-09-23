# FR-04: Mapping LINE User ↔ Google Account - Technical Specification

## 1. Overview
This feature enables the binding of LINE user IDs with Google Accounts, allowing the system to automatically identify which Google Drive to use when receiving images from specific LINE users.

## 2. Architecture Components

### 2.1 Frontend (Next.js)
- **Binding Page**: `/pages/user/bind.tsx`
- **Account Link Component**: `/components/AccountLink.tsx`
- **Status Display**: `/components/LinkStatus.tsx`

### 2.2 Backend (Express.js)
- **User Routes**: `/routes/user.routes.js`
- **Binding Controller**: `/controllers/binding.controller.js`
- **User Service**: `/services/user.service.js`
- **Validation Middleware**: `/middleware/userValidation.middleware.js`

### 2.3 Database
- **User mappings table**: Store LINE-Google associations

## 3. Detailed Implementation

### 3.1 User Binding Flow
```
1. User receives binding link via LINE message
2. Link contains unique token with LINE userId
3. User clicks link → Opens web page
4. Web page prompts Google login if not authenticated
5. After Google auth, system binds accounts
6. Confirmation sent via LINE message
7. Future image uploads use this mapping
```

### 3.2 API Endpoints

#### POST `/api/user/bind`
- **Purpose**: Bind LINE userId with Google account
- **Authentication**: Requires valid Google OAuth token
- **Request Body**:
  ```json
  {
    "lineUserId": "U1234567890abcdef",
    "bindingToken": "unique-binding-token"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "lineUserId": "U1234567890abcdef",
      "googleEmail": "user@gmail.com",
      "bindingStatus": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
  ```

#### GET `/api/user/binding/status/:lineUserId`
- **Purpose**: Check binding status
- **Response**:
  ```json
  {
    "bound": true,
    "googleEmail": "user@gmail.com",
    "lastUsed": "2024-01-15T09:00:00Z",
    "uploadCount": 42
  }
  ```

#### DELETE `/api/user/binding/:lineUserId`
- **Purpose**: Unbind accounts
- **Authentication**: Requires Google OAuth or LINE admin token
- **Response**: 204 No Content

#### POST `/api/user/binding/initiate`
- **Purpose**: Generate binding link for LINE user
- **Request Body**:
  ```json
  {
    "lineUserId": "U1234567890abcdef"
  }
  ```
- **Response**:
  ```json
  {
    "bindingUrl": "https://app.domain.com/bind?token=xxx",
    "expiresAt": "2024-01-15T11:00:00Z"
  }
  ```

### 3.3 Binding Token Management

#### Token Generation
```javascript
const generateBindingToken = (lineUserId) => {
  const payload = {
    lineUserId,
    purpose: 'account_binding',
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  };
  
  return jwt.sign(payload, process.env.BINDING_SECRET, {
    expiresIn: '1h'
  });
};
```

#### Token Validation
- Check expiration
- Verify signature
- Validate nonce hasn't been used
- Confirm LINE userId matches

### 3.4 Security Implementation

1. **CSRF Protection**
   - Use state parameter in OAuth flow
   - Validate origin headers
   - Implement double-submit cookies

2. **Token Security**
   - One-time use tokens
   - Short expiration (1 hour)
   - Secure random generation
   - Store used tokens to prevent replay

3. **Rate Limiting**
   - Max 5 binding attempts per hour per IP
   - Max 3 binding links per LINE user per day

### 3.5 Database Schema

```sql
-- User bindings
CREATE TABLE user_bindings (
  id SERIAL PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  google_user_id TEXT NOT NULL,
  google_email TEXT NOT NULL,
  google_refresh_token TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  CONSTRAINT uk_line_google UNIQUE (line_user_id, google_user_id)
);

-- Binding tokens
CREATE TABLE binding_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  line_user_id TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Binding audit log
CREATE TABLE binding_audit (
  id SERIAL PRIMARY KEY,
  line_user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'bind', 'unbind', 'rebind'
  google_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_bindings_line_user_id ON user_bindings(line_user_id);
CREATE INDEX idx_binding_tokens_token ON binding_tokens(token);
CREATE INDEX idx_binding_tokens_expires ON binding_tokens(expires_at) WHERE used = FALSE;
```

### 3.6 User Flow Implementation

#### Web Binding Page
```typescript
interface BindingPageProps {
  token: string;
  lineUserId: string;
}

const BindingPage: React.FC<BindingPageProps> = ({ token, lineUserId }) => {
  // 1. Check if user is Google authenticated
  // 2. If not, redirect to Google OAuth
  // 3. If yes, show binding confirmation
  // 4. On confirm, call bind API
  // 5. Show success/error message
};
```

#### LINE Rich Menu Integration
```javascript
// Rich menu action
{
  type: "uri",
  label: "Link Google Account",
  uri: "https://app.domain.com/bind/initiate?userId=${userId}"
}
```

### 3.7 Validation Rules

1. **LINE User Validation**
   - Must be active LINE user
   - Must have sent at least one message
   - Cannot bind if already bound (unless unbinding first)

2. **Google Account Validation**
   - Must have valid OAuth token
   - Must have Drive API access granted
   - Email must be verified

3. **Business Rules**
   - One LINE user → One Google account
   - Google account can be linked to multiple LINE users
   - Binding can be updated (rebind to different Google account)

### 3.8 Error Handling

| Error Code | Description | User Message |
|------------|-------------|--------------|
| BIND001 | Invalid binding token | "This link has expired. Please request a new one." |
| BIND002 | Already bound | "Your account is already linked. Unlink first to change." |
| BIND003 | Google auth failed | "Google login failed. Please try again." |
| BIND004 | LINE user not found | "Invalid LINE user. Please contact support." |
| BIND005 | Token already used | "This link has already been used." |

## 4. Implementation Details

### 4.1 Lookup Optimization
```javascript
// Cache binding lookups in Redis
const getCachedBinding = async (lineUserId) => {
  const cacheKey = `binding:${lineUserId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const binding = await db.getUserBinding(lineUserId);
  if (binding) {
    await redis.setex(cacheKey, 3600, JSON.stringify(binding));
  }
  
  return binding;
};
```

### 4.2 Webhook Integration
```javascript
// In webhook handler
const processImageMessage = async (event) => {
  const { userId } = event.source;
  
  // Lookup user binding
  const binding = await getCachedBinding(userId);
  
  if (!binding) {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Please link your Google account first: [link]'
    });
    return;
  }
  
  // Continue with upload process
  await uploadToGoogleDrive(event, binding);
};
```

## 5. Testing Requirements

### 5.1 Unit Tests
- Token generation and validation
- Binding logic with various states
- Cache operations
- Error scenarios

### 5.2 Integration Tests
- Complete binding flow
- Webhook lookup integration
- Token expiration handling
- Concurrent binding attempts

### 5.3 E2E Tests
- User binding journey
- Rebinding flow
- Unbinding flow
- Error message display

## 6. Monitoring & Analytics

### 6.1 Metrics
- Daily new bindings
- Binding success/failure rate
- Average time to complete binding
- Unbinding rate
- Token expiration rate

### 6.2 Logging
```javascript
// Binding success
{
  level: 'info',
  event: 'user_binding_success',
  lineUserId: 'xxx',
  googleEmail: 'xxx@gmail.com',
  timestamp: new Date()
}

// Binding failure
{
  level: 'warn',
  event: 'user_binding_failed',
  lineUserId: 'xxx',
  error: 'BIND002',
  timestamp: new Date()
}
```

## 7. User Communication

### 7.1 LINE Messages
```javascript
// Binding initiation
{
  type: 'flex',
  altText: 'Link your Google Account',
  contents: {
    // Flex message with binding link button
  }
}

// Binding success
{
  type: 'text',
  text: '✅ Successfully linked to Google account: user@gmail.com'
}

// Binding required
{
  type: 'text',
  text: '❗ Please link your Google account first to upload images.'
}
```

### 7.2 Web UI Messages
- Clear instructions for first-time users
- Status display for existing bindings
- Error messages with actionable steps
- Success confirmation with next steps

## 8. Dependencies

### NPM Packages
- `jsonwebtoken`: Token generation
- `express-validator`: Request validation
- `ioredis`: Caching layer
- `@line/bot-sdk`: LINE messaging
- `winston`: Logging

## 9. Environment Variables

```env
# Binding Configuration
BINDING_SECRET=your_binding_secret
BINDING_TOKEN_EXPIRY=3600
BINDING_URL_BASE=https://app.domain.com

# Cache Configuration
REDIS_BINDING_TTL=3600
BINDING_CACHE_PREFIX=binding:

# Security
MAX_BINDING_ATTEMPTS=5
BINDING_RATE_WINDOW=3600
```

## 10. Migration Considerations

1. **Existing Users**
   - Prompt for binding on next upload attempt
   - Send notification about new feature
   - Provide bulk binding option for admins

2. **Data Migration**
   - Map existing email-based users
   - Handle duplicate accounts
   - Preserve upload history