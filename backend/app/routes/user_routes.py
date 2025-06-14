from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import stripe
from schemas.admin import QuizDTO
from models.models import Quiz, QuizAssignment, QuizResult, User
from schemas.user import UserCreate, UserRegister, UserLogin, UserUpdate
from db.dependencies import get_db
from services.user_service import create_access_token, get_all_users, get_current_user, register_user_logic
from jose import jwt



router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    return get_all_users(db)

@router.post("/users")
def create_or_login_google_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        if existing.google_id and user.google_id and existing.google_id == user.google_id:
            token_data = {
                "sub": str(existing.id),
                "email": existing.email,
                "rol": existing.rol
            }
            access_token = create_access_token(token_data)
            return {
                "id": existing.id,
                "email": existing.email,
                "nume": existing.nume,
                "rol": existing.rol,
                "avatar_url": existing.avatar_url,
                "abonament": existing.abonament,
                "google_id": existing.google_id,
                "token": access_token
            }
        elif existing.hashed_password:
            raise HTTPException(status_code=400, detail="Există deja cont cu această adresă de email. Folosește autentificarea cu parolă!")
        else:
            raise HTTPException(status_code=400, detail="Contul există deja cu această adresă de email.")
    new_user = User(
        email=user.email,
        nume=user.nume,
        avatar_url=user.avatar_url,
        google_id=user.google_id,
        rol=user.rol
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token_data = {
        "sub": str(new_user.id),
        "email": new_user.email,
        "rol": new_user.rol
    }
    access_token = create_access_token(token_data)
    return {
        "id": new_user.id,
        "email": new_user.email,
        "nume": new_user.nume,
        "rol": new_user.rol,
        "avatar_url": new_user.avatar_url,
        "abonament": new_user.abonament,
        "google_id": new_user.google_id,
        "token": access_token
    }


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    return register_user_logic(user, db)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Email inexistent")
    if not db_user.hashed_password:
        raise HTTPException(status_code=400, detail="Contul a fost creat cu Google")
    if not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Parolă incorectă")
    
    if db_user.subscription_id:
        status = stripe.Subscription.retrieve(db_user.subscription_id)
        if status and status["status"] == "active":
            db_user.abonament = "PRO"
        else:
            db_user.abonament = "IMPLICIT"
        db.commit()

    token_data = {
        "sub": str(db_user.id),
        "email": db_user.email,
        "rol": db_user.rol
    }
    access_token = create_access_token(token_data, expires_delta=timedelta(hours=24))

    return {
        "id": db_user.id,
        "email": db_user.email,
        "nume": db_user.nume,
        "rol": db_user.rol,
        "avatar_url": db_user.avatar_url,
        "abonament": db_user.abonament,
        "token": access_token
    }


@router.put("/users/{user_id}")
def update_user(user_id: int, update_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu există")

    if update_data.nume is not None:
        user.nume = update_data.nume
    if update_data.avatar_url is not None:
        user.avatar_url = update_data.avatar_url

    if update_data.current_password and update_data.new_password:
        if not user.hashed_password:
            raise HTTPException(status_code=400, detail="Contul nu are parolă setată")
        if not pwd_context.verify(update_data.current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Parola actuală este greșită")
        user.hashed_password = pwd_context.hash(update_data.new_password)

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "nume": user.nume,
        "rol": user.rol,
        "avatar_url": user.avatar_url
    }

@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "nume": user.nume,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "abonament": user.abonament
    }


@router.get("/user/assigned-quizzes", response_model=List[QuizDTO])
def get_assigned_quizzes(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.rol != "USER":
        raise HTTPException(status_code=403, detail="Doar studenții au acces")

    quizzes = (
        db.query(Quiz)
        .join(QuizAssignment, Quiz.id == QuizAssignment.quiz_id)
        .filter(QuizAssignment.user_id == user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )
    return quizzes

@router.get("/user/{user_id}/average-score")
def user_average_score(user_id: int, db: Session = Depends(get_db)):
    results = db.query(QuizResult).filter(QuizResult.user_id == user_id).order_by(QuizResult.completed_at.desc()).limit(5).all()
    if not results:
        return {"average_score": 0}
    avg = sum([r.score for r in results if r.score is not None])/len(results)
    return {"average_score": avg}
