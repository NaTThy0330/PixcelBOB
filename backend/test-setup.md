# Testing LINE Bot to Google Drive Integration

## 1. Local Testing Setup

### Install ngrok
```bash
brew install ngrok
```

### Start Backend Server
```bash
cd backend
npm start
```

### Start ngrok tunnel
```bash
ngrok http 3001
```

### Configure LINE Webhook
1. Copy ngrok URL (e.g., https://abc123.ngrok.io)
2. In LINE Developers Console, set webhook URL to: `https://abc123.ngrok.io/line/webhook`
3. Verify webhook

## 2. User Testing Flow

### Step 1: Add LINE Bot
- Scan QR code from LINE Official Account Manager
- Add as friend

### Step 2: Send First Photo
- Send any photo to the bot
- Bot replies: "กรุณาเชื่อมต่อบัญชี Google Drive ก่อนการใช้งาน\n\nเข้าไปที่: [frontend URL]"

### Step 3: Connect Google Drive
- Click the link
- Login with Google
- Authorize access
- Frontend shows success

### Step 4: Send Photo Again
- Send photo to LINE bot
- Bot replies: "ได้รับรูปภาพแล้ว กำลังอัพโหลดไปยัง Google Drive..."
- After upload, bot sends: "✅ อัพโหลดรูปภาพสำเร็จ!\nชื่อไฟล์: LINE_20240322_143025.jpg\nดูไฟล์: [Google Drive link]"

## 3. Monitoring

### Check Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Database - Check user connections
psql -d line_drive_db -c "SELECT line_user_id, google_email, created_at FROM users;"

# Database - Check uploads
psql -d line_drive_db -c "SELECT * FROM upload_history ORDER BY created_at DESC LIMIT 10;"
```

## 4. Features

- **Auto-upload**: Photos sent to LINE bot automatically upload to Google Drive
- **Upload limit**: 10,000 photos per user
- **Queue processing**: Failed uploads retry every 30 seconds
- **Notifications**: Users receive LINE messages with Google Drive links