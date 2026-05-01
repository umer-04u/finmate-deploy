# --- Stage 1: Build Frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /frontend
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

# Ensure the data directory exists
RUN mkdir -p app/data

# Expose the port FastAPI runs on
EXPOSE 8000

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
