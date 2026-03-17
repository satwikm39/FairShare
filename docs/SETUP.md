# FairShare — Setup Guide

## Prerequisites
- Node.js 18+, Python 3.11+
- Firebase project (Auth enabled, Google provider)
- AWS credentials (Textract + S3 access)
- PostgreSQL database (Supabase free tier works great)

---

## Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Configure .env (see .env.example)
alembic upgrade head
uvicorn app.main:app --reload
```

### Backend `.env`
```
DATABASE_URL=postgresql://...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-adminsdk.json
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## Frontend

```bash
cd frontend
npm install
# Configure .env
npm run dev
```

### Frontend `.env`
```
VITE_API_URL=https://your-backend.onrender.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Deployment

| Layer | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Push to `main` → auto-deploy |
| Backend | Render | Push to `main` → auto-deploy via `deploy-backend.yml` |
| Database | Supabase | Managed PostgreSQL |

## Project Structure

```
FairShare/
├── docs/                    # This folder
├── frontend/src/
│   ├── components/          # Reusable UI + feature components
│   ├── context/             # AuthContext (Firebase + backend user)
│   ├── features/            # SplitterTable (core bill splitting UI)
│   ├── hooks/               # useBill, useGroups, useGroupBalances, etc.
│   ├── services/            # Axios API service layer
│   ├── types/               # TypeScript interfaces
│   └── views/               # Page-level components
└── backend/app/
    ├── api/routes/          # FastAPI route handlers
    ├── core/                # DB connection, config
    ├── crud/                # Database access layer
    ├── models/              # SQLAlchemy ORM models
    ├── schemas/             # Pydantic request/response schemas
    └── services/            # Business logic (debt recomputation, OCR)
```
