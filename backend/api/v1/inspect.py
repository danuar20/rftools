"""
RF TOOLS API Routes: Column Inspection & Heuristics
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.schemas.models import ColumnInspectionResponse
from backend.tools.column_inspector import inspect_file_columns

router = APIRouter(tags=["inspect"])

@router.post("/inspect-columns", response_model=ColumnInspectionResponse)
async def inspect_columns(file: UploadFile = File(...)):
    """Inspects uploaded spreadsheet columns and recommends mapping roles."""
    try:
        content = await file.read()
        res = inspect_file_columns(content, filename=file.filename or "data.xlsx")
        return res
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to inspect file columns: {exc}")
