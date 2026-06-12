#!/bin/sh
set -e

# Start nginx in background
nginx -g 'daemon on;'

# Start uvicorn in foreground (keeps container alive)
exec /app/.venv/bin/uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers ${UVICORN_WORKERS:-2}
