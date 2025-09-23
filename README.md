# PixcelBob - LINE to Google Drive Photo Backup

Automatically backup photos from LINE to Google Drive with a simple chat interface.

## Features

- 📸 Automatic photo backup from LINE to Google Drive
- 🔐 Secure Google OAuth2 authentication
- 📁 Custom folder selection in Google Drive
- 📊 Upload statistics and monitoring
- 💰 Billing system (10,000 photos for 39 THB)
- 🎮 Retro pixel art UI design

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Retro pixel art design

### Backend
- Node.js + Express
- PostgreSQL
- LINE Messaging API
- Google Drive API
- JWT authentication

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL
- LINE Developer Account
- Google Cloud Console Account

### Backend Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/pixcelbob.git
cd pixcelbob/backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Set up database
```bash
psql -U your_user -d your_database -f database/schema.sql
```

5. Start the server
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory
```bash
cd ../frontend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API URL
```

4. Start the development server
```bash
npm run dev
```

## Deployment

### Frontend (Vercel)
```bash
vercel
```

### Backend (Railway)
```bash
railway up
```

## Environment Variables

See `.env.example` files in both frontend and backend directories for required variables.

## Security

- All sensitive credentials are stored in environment variables
- Google OAuth2 for secure authentication
- LINE webhook signature validation
- JWT tokens for session management

## License

MIT