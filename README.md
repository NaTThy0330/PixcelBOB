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

### Background Worker Setup

1. Navigate to the worker directory
```bash
cd ../worker
```

2. Install dependencies
```bash
npm install
```

3. Copy environment variables (same values as backend)
```bash
cp .env.example .env
# Ensure DB, Google, and LINE credentials match the backend service
```

4. Start the worker
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

### Docker Images
- Frontend (Node + Nginx multi-stage)
  ```bash
  docker build -f frontend/Dockerfile -t pixcelbob-frontend .
  ```
- Backend API (Node 18 Alpine, non-root, healthcheck on `/health`)
  ```bash
  docker build -f backend/Dockerfile -t pixcelbob-backend .
  ```
- Upload Worker (shares base with backend, DB healthcheck)
  ```bash
  docker build -f worker/Dockerfile -t pixcelbob-worker .
  ```

## Version Control Strategy
- **Branches:** `main` (production), `develop` (staging), plus short-lived feature branches (`feature/*`).
- **Tags:** Semantic tags such as `v1.0.0` are created when a production release is cut.
- **Monorepo layout:** `frontend/`, `backend/`, `worker/`, `infra/`, and `Jenkinsfile` live at the repository root to keep CI/CD auditing simple.

## Environment Variables

See `.env.example` files in both frontend and backend directories for required variables.

## Security

- All sensitive credentials are stored in environment variables
- Google OAuth2 for secure authentication
- LINE webhook signature validation
- JWT tokens for session management

## License

MIT
