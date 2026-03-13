# FINMATE: Complete Deployment Guide

This document details how to take the local developer setup and deploy it to a production-ready cloud environment. The frontend will be hosted on Vercel, and the backend on Render/Railway.

## 1. Version Control (GitHub) Setup

Initialize the root directory and create separate configurations for frontend and backend.

1. Navigate to the project root: `cd FINMATE`
2. Create `.gitignore` files for both frontend and backend (ignoring `.env`, `__pycache__`, `node_modules`, `venv`, and `saved_models`).
3. Initialize the Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of FINMATE project"
   git branch -M main
   git remote add origin https://github.com/your-username/FINMATE.git
   git push -u origin main
   ```

## 2. Deploying the React Frontend on Vercel

Vercel is ideal for Vite/React applications.

1. Go to [Vercel](https://vercel.com/) and log in with your GitHub account.
2. Click **"Add New" > "Project"**.
3. Import the `FINMATE` repository.
4. **Important**: Since the React app is in a subdirectory, modify the "Root Directory" setting to `/frontend`.
5. The build settings will automatically detect Vite:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Environment Variables**:
   - Add `VITE_API_BASE_URL` and point it to your deployed backend URL (e.g., `https://finmate-api.onrender.com`).
7. Click **Deploy**. Vercel will output a live URL (e.g., `https://finmate.vercel.app`).

## 3. Deploying the FastAPI Backend on Render / Railway

Render and Railway offer accessible free tiers that support persistent Python/Docker applications. Here we use **Render** as the example.

1. Go to [Render.com](https://render.com/) and link your GitHub.
2. Click **"New +" > "Web Service"**.
3. Choose "Build and deploy from a Git repository" and select the `FINMATE` repo.
4. Set the **Root Directory** to `/backend`.
5. Configuration details:
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - (For Phase 1 CSV storage) You can persist CSV uploads on Render by adding a **Disk** to your Web Service mounted at `/backend/data`. Render free tier wipes ephemeral file systems, so a Disk is critical if you want uploaded data to persist across restarts.
   - Alternatively, use Phase 2 scaling (PostgreSQL connection strings).
   - Add `CORS_ORIGINS`: `https://finmate.vercel.app` (to allow communication from your Vite app).
7. Click **Create Web Service**.

## 4. Phase 2: Scaling to PostgreSQL

While Phase 1 uses local `.csv` files for ease of offline academic defense, extending to PostgreSQL readies the app for startups/market launch.

1. Provision a PostgreSQL DB on Supabase, Render, or Railway.
2. Copy the `DATABASE_URL` (Connection String).
3. Update the Render Backend environment variables to include `DATABASE_URL`.
4. In the FastAPI backend, install `sqlalchemy` and `psycopg2-binary`.
5. Modify `backend/database.py` (which will be generated in Phase 2) to use SQLAlchemy for mapped CSV ingestion directly into the SQL database.

## 5. Running the Application Locally 

If you are defending the project locally on a laptop without internet or cloud deployment during the Viva Voce:

**Terminal 1 (Backend):**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Then visit `http://localhost:5173` in any modern web browser.
