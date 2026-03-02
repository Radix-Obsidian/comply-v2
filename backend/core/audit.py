from fastapi import APIRouter

from ..compliance.audit_logger import AuditLogger

router = APIRouter()
_logger = AuditLogger()


@router.get("/")
async def list_audit_entries(limit: int = 100, offset: int = 0):
    entries = _logger.get_log(limit=limit, offset=offset)
    total = _logger.count()
    return {"entries": entries, "total": total, "limit": limit, "offset": offset}
