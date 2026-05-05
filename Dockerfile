# --- Stage 1: Build Frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /frontend

# Define build arguments for Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

# Set them as environment variables for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build the frontend - the output will be in /frontend/dist
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

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
