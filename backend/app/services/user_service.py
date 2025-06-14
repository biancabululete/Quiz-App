from jose import JWTError, jwt
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from models.models import User
from schemas.user import UserCreate, UserRegister
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from db.dependencies import get_db
from datetime import datetime, timedelta
from core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_all_users(db: Session):
    return db.query(User).all()

def create_or_login_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        # 1. Dacă userul are google_id și se potrivește cu cel de pe Google => e login cu Google!
        if existing.google_id and user.google_id and existing.google_id == user.google_id:
            # Returnezi date + token (LOGIN CU GOOGLE)
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
                "token": access_token
            }
        # 2. Dacă există user cu email dar fără google_id (deci cont creat cu parolă):
        elif existing.hashed_password:
            raise HTTPException(status_code=400, detail="Există deja cont cu acest email, folosește login cu parolă.")
        # 3. Dacă există user cu email, dar fără google_id (deși ar trebui să nu se întâmple la Google login):
        else:
            raise HTTPException(status_code=400, detail="Contul există deja cu acest email.")
    # Dacă userul nu există, îl creezi (signup Google)
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
        "token": access_token
    }

def register_user_logic(user: UserRegister, db: Session):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Există deja un cont cu această adresă de email.")

    hashed_pw = pwd_context.hash(user.password)
    new_user = User(
        email=user.email,
        nume=user.nume,
        hashed_password=hashed_pw,
        rol=user.rol.upper(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Utilizator înregistrat cu succes"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalid")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Utilizator inexistent")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalid")
    
SECRET_KEY = "super-ultra-secret"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + expires_delta})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)