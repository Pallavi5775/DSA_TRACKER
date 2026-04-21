from pydantic import BaseModel
from typing import List, Optional


class PracticeLogOut(BaseModel):
    id: int
    question_id: int
    date: str
    logic: str = ""
    code: str = ""
    time_taken: int = 0
    correct: bool = True

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    title: str
    pattern: str
    category: str = "Mixed"
    difficulty: str = "Medium"


class QuestionOut(BaseModel):
    id: int
    title: str
    pattern: str
    category: str
    difficulty: str
    coverage_status: str = "Not Covered"
    revision_status: str = "Pending"
    ease_factor: float = 2.5
    interval_days: int = 0
    next_revision: Optional[str] = None
    accuracy: Optional[float] = None
    suggestions: Optional[str] = None
    notes: Optional[str] = None
    my_gap_analysis: Optional[str] = None
    total_time_spent: int = 0
    logs: List[PracticeLogOut] = []

    class Config:
        from_attributes = True
