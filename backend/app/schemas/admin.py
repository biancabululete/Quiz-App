from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuizCreateDTO(BaseModel):
    num_questions: int
    is_exam: bool = False
    subject: str = "Altceva"
    document_id: int | None = None  # dacă e legat de un PDF

class InviteStudentsDTO(BaseModel):
    user_ids: List[int]

class QuizResultDTO(BaseModel):
    student_id: int
    student_email: str
    student_name: str | None = None    # <-- adaugă asta
    score: float | None = None
    completed_at: datetime | None = None

class QuizDTO(BaseModel):
    id: int
    num_questions: int
    is_exam: bool
    created_at: datetime
    subject: str
    access_code:Optional[str]

    class Config:
        orm_mode = True

class InviteStudentsDTO(BaseModel):
    user_ids: list[int]

class QuestionInput(BaseModel):
    text: str
    correct_answer: Optional[str] = None

class AddQuestionsRequest(BaseModel):
    questions: list[QuestionInput]