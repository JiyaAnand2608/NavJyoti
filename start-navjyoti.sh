
#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Starting NavJyoti..."

# Prepare Python environment outside Git repository
VENV="$HOME/.venvs/navjyoti"

if [ ! -x "$VENV/bin/python" ]; then
    mkdir -p "$HOME/.venvs"
    python3 -m venv "$VENV"
fi

"$VENV/bin/python" -m pip install -r backend/requirements.txt

# Install frontend packages when needed
if [ ! -d frontend/node_modules ]; then
    (cd frontend && npm install)
fi

# Use local environment file if available
if [ -f backend/.env.neon ]; then
    export NAVJYOTI_ENV_FILE=".env.neon"
fi

echo "Starting FastAPI backend..."

(
    cd backend
    "$VENV/bin/python" -m uvicorn main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --reload
) &
BACKEND_PID=$!

echo "Starting React frontend..."

(
    cd frontend
    npm run dev -- --host 0.0.0.0 --port 5173
) &
FRONTEND_PID=$!

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true' EXIT

wait
