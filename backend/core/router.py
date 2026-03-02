from fastapi import APIRouter

from . import calendar, calendar_ics, workflow, queue, policies, attestations, documents, audit, dashboard, insights

api_router = APIRouter()

api_router.include_router(policies.router, prefix="/policies", tags=["policies"])
api_router.include_router(attestations.router, prefix="/attestations", tags=["attestations"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(insights.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(calendar_ics.router, prefix="/calendar/ics", tags=["calendar"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
api_router.include_router(queue.router, prefix="/queue", tags=["queue"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
