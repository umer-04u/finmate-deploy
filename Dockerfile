# --- Stage 1: Build Frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /frontend

# Build Arguments (Astro requires PUBLIC_ prefix for client-side variables)
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_API_URL

# Set as Environment Variables for the build process
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY
ENV PUBLIC_API_URL=$PUBLIC_API_URL

# Compatibility for Vite-style prefixes
ENV VITE_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY
ENV VITE_API_URL=$PUBLIC_API_URL

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build the frontend - output is in /frontend/dist
RUN npm run build

# --- Stage 2: Build Backend & Serve Frontend ---
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy the built frontend from Stage 1 to the backend's static folder
COPY --from=frontend-build /frontend/dist ./static

# Expose the port FastAPI runs on
EXPOSE 8000

# Runtime Environment Variables for the Backend
# Note: These should be provided at runtime by the hosting provider (Render, Docker, etc.)
# SUPABASE_URL
# SUPABASE_KEY

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
