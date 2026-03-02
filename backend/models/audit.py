from pydantic import BaseModel
from typing import Any, Optional


class AuditEntry(BaseModel):
    id: Optional[int] = None
    timestamp: str
    actor: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    data_hash: str
    metadata: Optional[dict[str, Any]] = None
