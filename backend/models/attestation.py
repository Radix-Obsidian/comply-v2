from pydantic import BaseModel
from typing import Optional


class AttestationCreate(BaseModel):
    policy_id: str
    attested_by: str
    notes: Optional[str] = None


class AttestationResponse(BaseModel):
    id: str
    policy_id: str
    attested_by: str
    attested_at: str
    expires_at: Optional[str] = None
    notes: Optional[str] = None
