"""
Pydantic Request & Response Data Models
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ToolMetadata(BaseModel):
    id: str
    title: str
    category: str
    category_id: str
    description: str
    icon: str
    route: str
    inputs: List[str]
    outputs: List[str]
    supported_formats: List[str]
    documentation_summary: str
    sample_template_id: str

class ColumnInspectionItem(BaseModel):
    name: str
    type: str
    sample_values: List[str]
    suggested_role: Optional[str] = None
    confidence: float = 0.0
    match_type: str = "unmapped"

class ColumnInspectionResponse(BaseModel):
    filename: str
    sheets: List[str]
    active_sheet: Optional[str]
    total_rows: int
    total_columns: int
    columns: List[ColumnInspectionItem]
    preview_rows: List[Dict[str, Any]]

class CalculationSummaryResponse(BaseModel):
    success: bool
    tool: str
    message: str
    total_rows: Optional[int] = None
    valid_count: Optional[int] = None
    skipped_count: Optional[int] = None
    preview_rows: Optional[List[Dict[str, Any]]] = None
    extra: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str
    instance: Optional[str] = None
