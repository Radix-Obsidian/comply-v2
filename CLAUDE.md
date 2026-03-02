# Comply-v2

Privacy-first, locally-run RIA compliance management platform. Zero cloud dependencies.

## Tech Stack
- **Backend**: FastAPI + LangChain (Ollama only)
- **LLM**: Local Ollama (llama3.2:3b default, configurable)
- **Storage**: SQLite + SQLCipher (encrypted)
- **Frontend**: Next.js + Tailwind CSS
- **Deployment**: Native Mac Mini (launchd) or Docker Compose

## Quick Start

### One-command Mac Mini install (recommended)
```bash
bash scripts/install.sh
```
Installs everything, pulls model, starts services, auto-starts on boot.

### Service control
```bash
scripts/comply-ctl.sh status    # Check all services
scripts/comply-ctl.sh stop      # Stop all
scripts/comply-ctl.sh start     # Start all
scripts/comply-ctl.sh restart   # Restart all
scripts/comply-ctl.sh logs      # View backend logs
scripts/comply-ctl.sh logs ollama  # View Ollama logs
```

### Development mode
```bash
# Backend
pip install -r backend/requirements.txt
OLLAMA_MODEL=llama3.2:3b uvicorn backend.main:app --reload --port 8100

# Frontend
cd frontend && npm install && npm run dev
```

### Docker (alternative)
```bash
./scripts/create-golden-image.sh
docker compose up -d
```

### Uninstall
```bash
bash scripts/uninstall.sh
```

## Key Endpoints
- `GET /health` — Health check
- `GET /docs` — Swagger UI
- `POST /api/glassbox/scan-marketing` — SEC Rule 206(4)-1 marketing scanner
- `POST /api/glassbox/detect-policy-gaps` — SEC Rule 206(4)-7 policy gap detector
- `GET /api/dashboard/stats` — Compliance dashboard stats
- CRUD: `/api/policies/`, `/api/attestations/`, `/api/audit/`
- `/api/calendar/`, `/api/workflow/`, `/api/queue/`, `/api/documents/`

## Architecture
```
backend/
├── main.py          # FastAPI app
├── config.py        # All env-based config
├── database.py      # SQLCipher connection
├── core/            # 8 module routers
├── glassbox/        # Glass Box scanner (marketing + policy gaps)
├── llm/             # Ollama wrapper
├── models/          # Pydantic schemas
├── compliance/      # Audit logger, PII guard, retention
└── auth/            # Local JWT auth

scripts/
├── install.sh       # One-command Mac Mini installer
├── uninstall.sh     # Clean removal
├── comply-ctl.sh    # Service controller (start/stop/status/logs)
├── create-golden-image.sh  # Docker deployment builder
└── launchd/         # macOS service plists
```

## Deployment Layout (after install)
```
/opt/comply-v2/
├── backend/          # Python code
├── frontend/         # Next.js (built)
├── .venv/            # Python virtualenv
├── .env              # Auto-generated secrets (chmod 600)
├── data/             # Encrypted SQLite DB
├── logs/             # Service logs
└── scripts/          # Control scripts
```

## Glass Box Scanner
- `/scan-marketing`: Scans marketing text for SEC Rule 206(4)-1 violations
- `/detect-policy-gaps`: Detects missing compliance policies per Rule 206(4)-7
- Both have regex/keyword fallbacks when Ollama is unavailable
