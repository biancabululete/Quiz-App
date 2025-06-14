from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuestionCreate(BaseModel):
    text: str
    correct: Optional[int] = None

class QuizCreate(BaseModel):
    user_id: int
    document_id: Optional[int] = None
    questions: List[QuestionCreate]
    subject: str = "Altceva"

# class QuizRead(BaseModel):
#     id: int
#     user_id: int
#     num_questions: int

#     class Config:
#         from_attributes = True

class QuizResultCreate(BaseModel):
    quiz_id: int
    user_id: int
    score: float  # procent (ex: 80.0)

class QuizResultRead(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    score: float
    completed_at: datetime

    class Config:
        from_attributes = True

class QuizWithScore(BaseModel):
    id: int
    user_id: int
    num_questions: int
    score: Optional[float] = None  # poate să nu aibă scor încă
    subject: str
    
    class Config:
        from_attributes = True

class QuestionDTO(BaseModel):
    id: int
    text: str

    class Config:
        orm_mode = True