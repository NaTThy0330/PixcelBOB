# FR-01: User Authentication (Google OAuth2) - Technical Specification

## 1. Overview
This feature enables users to authenticate using their Google Account via OAuth2 flow to authorize file uploads to their own Google Drive.

## 2. Architecture Components

### 2.1 Frontend (Next.js)
- **Login Page Component**: `/pages/auth/login.tsx`
- **Callback Handler**: `/pages/auth/google/callback.tsx`
- **Auth Context Provider**: `/contexts/AuthContext.tsx`

### 2.2 Backend (Express.js)
- **Auth Routes**: `/routes/auth.routes.js`
- **Auth Controller**: `/controllers/auth.controller.js`
- **Auth Service**: `/services/auth.service.js`
- **OAuth Middleware**: `/middleware/oauth.middleware.js`

### 2.3 Database (PostgreSQL)
- **Users Table**: Stores user authentication data

## 3. Detailed Implementation

### 3.1 OAuth2 Flow Sequence
```
1. User clicks "Login with Google" button
2. Frontend redirects to backend `/auth/google`
3. Backend redirects to Google OAuth consent screen
4. User approves permissions
5. Google redirects to `/auth/google/callback` with authorization code
6. Backend exchanges code for tokens
7. Backend stores refresh token and user info
8. Backend redirects to frontend with success status
```

### 3.2 API Endpoints

#### POST `/api/auth/google`
- **Purpose**: Initiate OAuth2 flow
- **Response**: Redirect URL to Google OAuth consent screen
- **Required Scopes**:
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
  - `https://www.googleapis.com/auth/drive.file`

#### GET `/api/auth/google/callback`
- **Purpose**: Handle OAuth2 callback
- **Query Parameters**:
  - `code`: Authorization code from Google
  - `state`: CSRF protection token
- **Process**:
  1. Validate state parameter
  2. Exchange code for tokens
  3. Fetch user profile from Google
  4. Create/update user record
  5. Generate session JWT
  6. Redirect to frontend success page

#### GET `/api/auth/status`
- **Purpose**: Check authentication status
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**:
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "123",
      "email": "user@gmail.com",
      "lineUserId": "line_xyz"
    }
  }
  ```

### 3.3 Security Considerations

1. **CSRF Protection**: Use state parameter in OAuth flow
2. **Token Storage**: 
   - Refresh tokens encrypted at rest using AES-256
   - JWT tokens expire in 1 hour
   - Refresh token rotation on each use
3. **HTTPS**: All endpoints must use HTTPS
4. **Rate Limiting**: Max 5 auth attempts per minute per IP

### 3.4 Error Handling

| Error Code | Description | User Message |
|------------|-------------|--------------|
| AUTH001 | Invalid authorization code | "Authentication failed. Please try again." |
| AUTH002 | Token exchange failed | "Unable to complete login. Please try again." |
| AUTH003 | User profile fetch failed | "Unable to retrieve user information." |
| AUTH004 | Database error | "System error. Please try again later." |

### 3.5 Frontend Components

#### Login Button Component
```typescript
interface LoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

#### Auth Context Interface
```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}
```

### 3.6 Database Schema Details

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  google_email TEXT NOT NULL,
  google_refresh_token TEXT NOT NULL,
  google_folder_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_users_google_email ON users(google_email);
```

### 3.7 Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=3600

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key
```

## 4. Testing Requirements

### 4.1 Unit Tests
- OAuth token exchange logic
- User creation/update logic
- JWT generation and validation
- Encryption/decryption of refresh tokens

### 4.2 Integration Tests
- Full OAuth flow simulation
- Database operations
- API endpoint responses
- Error scenarios

### 4.3 E2E Tests
- Complete login flow from UI
- Session persistence
- Logout functionality

## 5. Monitoring & Logging

### 5.1 Metrics
- Authentication success/failure rates
- OAuth callback response times
- Token refresh frequencies
- Active user sessions

### 5.2 Logs
- All authentication attempts (success/failure)
- Token refresh operations
- Database errors
- OAuth API errors

## 6. Dependencies

### NPM Packages
- `@google-auth-library/oauth2-client`: Google OAuth2 client
- `jsonwebtoken`: JWT token handling
- `express-session`: Session management
- `bcrypt`: Password hashing (if needed for future)
- `crypto`: Token encryption

## 7. Migration Plan

1. Set up Google Cloud Console project
2. Configure OAuth2 credentials
3. Deploy database schema
4. Deploy backend endpoints
5. Deploy frontend components
6. Test in staging environment
7. Production deployment