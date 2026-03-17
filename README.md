# FairShare (Smart Bill Splitter)

FairShare is a modern, high-performance web application designed to solve the age-old problem of "who owes what." Unlike traditional splitters that rely on simple checkboxes or equal divisions, FairShare uses a **weighted, item-by-item system**. This ensures everyone pays exactly for what they consumed—calculated down to the pro-rated tax and fees.

## Features

- **Group Management:** Organise expenses by groups (e.g., "Ski Trip 2024"). Invite friends via shareable links or manage them directly.
- **Smart Receipt Processing:** Upload a receipt photo, and FairShare uses **AWS Textract (OCR)** to automatically extract items, quantities, and prices.
- **Dynamic Manual Controls:** 
    - **Add/Edit/Delete:** Manually add missed items, delete extras, or edit OCR results in real-time.
    - **Auto-Split:** Quickly distribute costs evenly across all group members with a single click.
    - **Reset All:** Instantly clear all shares to start fresh.
- **Interactive Weighted Splitting:** Allocate portions using a share-based counter (`[-] [count] [+]`). If three people share a pizza but one has double the appetite, just assign shares accordingly (e.g., 2:1:1).
- **Precision Tax Logic:** Tax and fees are automatically **pro-rated** based on each individual's subtotal. This ensures that the person who ordered the expensive steak isn't subsidised by the person who had a side salad.
- **Multi-Currency Support:** Set a default currency for your group to keep everything transparent.
- **Optimised for Any Device:** Features a mobile-responsive table with sticky headers for easy scrolling through long bills.
- **User Profiles:** Customize your display name for clear identification in group tables.

## Tech Stack

### Frontend
- **Framework:** React (Vite)
- **State Management:** React Context API
- **Styling:** Tailwind CSS (Modern, Responsive UI)
- **Icons:** Lucide React
- **Authentication:** Firebase Client SDK

### Backend
- **Framework:** FastAPI (Python 3.9+)
- **ORM:** SQLAlchemy with PostgreSQL
- **OCR Engine:** AWS Textract (via Boto3)
- **Auth Validation:** Firebase Admin SDK
- **Database Migrations:** Alembic

## Setup Instructions (Local Development)

### 1. Prerequisites
- **Node.js & npm**
- **Python 3.9+**
- **PostgreSQL** (Local or RDS)
- **Firebase Project** (Auth credentials)
- **AWS Account** (Access keys for Textract)

### 2. Backend Setup
1.  Navigate to `backend/`.
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3.  Install dependencies: `pip install -r requirements.txt`.
4.  Configure `.env` with your `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`.
5.  Initialize the database: `alembic upgrade head` (or the app will auto-create tables on start).
6.  Start server: `uvicorn app.main:app --reload`.

### 3. Frontend Setup
1.  Navigate to `frontend/`.
2.  Install packages: `npm install`.
3.  Configure `.env` with Firebase API keys and `VITE_API_URL`.
4.  Launch dev server: `npm run dev`.

## Project Structure

- **`/frontend`**: React source codes including features-based components, UI primitives, and custom hooks.
- **`/backend`**: FastAPI application following a modular structure (`api`, `core`, `models`, `schemas`, `crud`).
- **`/docs`**: Project documentation including PRD and schemas.

## Documentation

| Doc | Description |
|---|---|
| [`docs/FEATURES.md`](docs/FEATURES.md) | Full feature list |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System diagram, DB schema, data flows |
| [`docs/EXECUTIVE_SUMMARY.md`](docs/EXECUTIVE_SUMMARY.md) | Product and technical overview |
| [`docs/SETUP.md`](docs/SETUP.md) | Detailed local setup and deployment guide |

