# Testing Guide for PixcelBOB

## Prerequisites

1. **Backend Setup**
   - PostgreSQL database running
   - Database tables created (run `database/schema.sql`)
   - `.env` file configured with correct values
   - Google Cloud APIs enabled (Drive API)
   - OAuth 2.0 redirect URIs configured in Google Cloud Console

2. **Frontend Setup**
   - `.env` file created with `VITE_API_URL=http://localhost:5000`
   - Dependencies installed (`npm install`)

## Starting the Application

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   # Should see: "Server running on port 5000"
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   # Should open http://localhost:3000
   ```

## Test Flow

### 1. Google Authentication
- Click "Login with Google" on landing page
- Should redirect to Google OAuth consent screen
- After approval, should redirect back to app
- Should see folder selection page

### 2. Folder Selection
- Google Drive folders should load automatically
- Select a folder and click "Save Folder"
- Should redirect to dashboard

### 3. Dashboard
- Should display:
  - Usage statistics (initially 0)
  - Google Drive connection status (✅)
  - LINE connection status (❌)
  - Recent activity (empty initially)

### 4. Settings Page
- Click "Settings" button
- Should display user email and name
- "Change Google Drive Folder" should navigate to folder selection
- "Reconnect" Google should start OAuth flow again

### 5. Billing Page
- Click "Billing" button
- Should show current package info
- Upload history (empty initially)
- Package selection (UI only, payment not implemented)

## Testing API Endpoints Directly

### Check Auth Status
```bash
curl http://localhost:5000/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User Folders
```bash
curl http://localhost:5000/user/folders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Usage Stats
```bash
curl http://localhost:5000/stats/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues & Solutions

### 1. "redirect_uri_mismatch" Error
- Go to Google Cloud Console > APIs & Services > Credentials
- Edit your OAuth 2.0 Client ID
- Add `http://localhost:5000/auth/google/callback` to Authorized redirect URIs
- Save and try again

### 2. "column google_drive_folder_id does not exist" Error
- Fixed in code - using correct column name `google_folder_id`
- If persists, check database schema

### 3. Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check CORS settings in backend
- Verify `VITE_API_URL` in frontend `.env`

### 4. Google Drive API Errors
- Ensure Google Drive API is enabled in Cloud Console
- Check API quotas and limits
- Verify OAuth scopes include `drive.file`

## LINE Integration (Not Yet Implemented)

Currently, LINE OAuth integration is not implemented. The LINE webhook endpoint exists at `/line/webhook` for receiving messages when users add the bot and send photos.

To test LINE webhook locally:
1. Use ngrok to expose local server: `ngrok http 5000`
2. Configure LINE webhook URL in LINE Developers Console
3. Send test images to the LINE bot

## Database Verification

Check if user was created after Google login:
```sql
SELECT * FROM users;
```

Check upload history:
```sql
SELECT * FROM upload_history WHERE user_id = YOUR_USER_ID;
```

## Next Steps for Production

1. Implement proper LINE OAuth flow
2. Add payment gateway integration
3. Implement actual sync functionality
4. Add comprehensive error logging
5. Set up monitoring and alerts
6. Configure production environment variables
7. Set up SSL certificates
8. Deploy to production server