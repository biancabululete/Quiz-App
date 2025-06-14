from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy.dialects.postgresql import ENUM
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    nume = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)
    rol = Column(ENUM('USER', 'ADMIN', name='rol_enum'), default='USER', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    hashed_password = Column(String(255), nullable=True)
    abonament = Column(ENUM('IMPLICIT', 'PRO', name='abonament_enum'), default='IMPLICIT', nullable=False)
    subscription_id = Column(String(255), nullable=True)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    file_name = Column(String(255))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    is_exam = Column(Boolean, default=False)
    num_questions = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    subject = Column(String(100), nullable=False, default="Altceva")
    access_code = Column(String(8), unique=True, default=lambda: str(uuid.uuid4())[:8])


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    text = Column(Text)
    type = Column(ENUM('multiple_choice', 'open', name='question_type_enum'), default='multiple_choice')
    correct_answer = Column(Text)
    ai_scoreable = Column(Boolean, default=False)

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    answer_text = Column(Text)
    is_correct = Column(Boolean)
    score = Column(Float)
    submitted_at = Column(DateTime, default=datetime.utcnow)

class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    score = Column(Float)
    completed_at = Column(DateTime, default=datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_log"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    activity = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)

class QuizAssignment(Base):
    __tablename__ = "quiz_assignments"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))  # studentul invitat
    invited_at = Column(DateTime, default=datetime.utcnow)
    completed = Column(Boolean, default=False)
