# ── Stage 1: build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python runtime ──────────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

# System deps (none required beyond base, but keep pip fresh)
RUN pip install --no-cache-dir --upgrade pip

# Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# App code
COPY app.py database.py ./
COPY static/ ./static/

# Built frontend from stage 1
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Runtime data dirs (mounted as volumes in compose so they persist)
RUN mkdir -p uploads/images uploads/files

EXPOSE 5000

# 3 workers is a sane default; tune to your CPU. Bind to all interfaces.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--timeout", "120", "app:app"]
