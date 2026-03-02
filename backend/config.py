import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent  # comply-v2/
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "comply.db"

# Ollama
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:11b")

# Server
API_PORT = int(os.getenv("API_PORT", "8100"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Auth
JWT_SECRET = os.getenv("JWT_SECRET", "comply-v2-local-dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

# Compliance
RETENTION_DAYS = int(os.getenv("RETENTION_DAYS", "2555"))  # 7 years for SEC
PII_SCAN_ENABLED = os.getenv("PII_SCAN_ENABLED", "true").lower() in ("true", "1")
AUDIT_LOG_ENABLED = os.getenv("AUDIT_LOG_ENABLED", "true").lower() in ("true", "1")

# SQLCipher
DB_ENCRYPTION_KEY = os.getenv("DB_ENCRYPTION_KEY", "")
