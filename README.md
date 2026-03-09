# FairShare (Smart Bill Splitter)

FairShare is a full-stack web application that allows groups of friends to upload receipt images and split bills accurately using a weighted, item-by-item system. It ensures everyone pays exactly for what they enjoyed, calculating pro-rated taxes and avoiding the typical "split evenly" disputes.

## Features

- **Group Management:** Create groups and invite friends to share and organize expenses.
- **Receipt Upload & OCR Processing:** Upload a photo of a receipt, and the system automatically extracts item names and unit prices using AWS Textract.
- **Manual Adjusting:** Users can easily edit the extracted receipt items in case the OCR results need adjusting.
- **Interactive Splitter Table:** A dynamic, real-time shared table to allocate costs. Instead of splitting evenly or using simple checkboxes, FairShare uses a weight-based share counter (`[-] [count] [+]`) to specify exact portions.
- **Pro-rated Tax & Grand Totals:** The application automatically calculates individual subtotals, pro-rates the total tax proportionally based on individual spending, and provides a final amount owed per person.

## Tech Stack

### Frontend

- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Authentication:** Firebase Authentication

### Backend

- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL with SQLAlchemy ORM
- **OCR Integration:** AWS Textract (via `boto3`)
- **Authentication Validation:** Firebase Admin SDK

## Setup Instructions (Local Development)

### 1. Prerequisites

- Node.js & npm (for the frontend)
- Python 3.9+ (for the backend)
- PostgreSQL running locally or hosted
- Firebase Project (for authentication credentials)
- AWS Credentials (for Textract)

### 2. Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Set up environment variables in `backend/.env` (Database URL, AWS Keys, etc.) and place your `firebase-adminsdk.json` in the backend root.
5.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --reload
    ```

### 3. Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables in `frontend/.env` (Firebase config keys, VITE_API_URL).
4.  Start the development server:
    ```bash
    npm run dev
    ```

## Project Structure

- **/frontend:** React application with views, components, context (Auth, Theme), and API service integration.
- **/backend:** FastAPI application containing routing (`/api`), SQLAlchemy ORM models (`/models`), CRUD operations (`/crud`), and core logic (`/core`).
