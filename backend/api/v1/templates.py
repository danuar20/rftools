"""
RF TOOLS API Routes: Sample Reference Templates
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from backend.tools.template_generator import generate_template

router = APIRouter(prefix="/templates", tags=["templates"])

@router.get("/{template_id}")
async def download_template(template_id: str):
    """Downloads verified sample Excel reference templates."""
    try:
        xlsx_bytes, filename = generate_template(template_id)
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc))
