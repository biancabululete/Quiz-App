from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from services.user_service import get_current_user
from services.quiz_service import generate_quiz_from_pdf, save_quiz_to_db, generate_open_questions_from_pdf, extract_subject_from_text
from services.openai_service import generate_feedback
from sqlalchemy.orm import Session
from db.dependencies import get_db
from models.models import Quiz, Question, QuizResult
from typing import List
from schemas.quiz import QuizResultCreate, QuizResultRead, QuizWithScore, QuestionDTO
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload
from sqlalchemy.sql import func
from sqlalchemy import select
from fastapi import Body
from schemas.openai_eval import OpenAIEvalRequest


router = APIRouter()

@router.post("/quizz/save")
def save_quizz(payload: dict, db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    document_id = payload.get("document_id")
    questions = payload["questions"]
    subject = payload.get("subject", "Altceva")
    is_exam = payload.get("is_exam", False)

    quiz_id = save_quiz_to_db(user_id, document_id, questions, db, subject, is_exam)
    return { "quiz_id": quiz_id }


@router.get("/quizz/by-user/{user_id}", response_model=List[QuizWithScore])
def get_quizzes_by_user(user_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).filter(Quiz.user_id == user_id).all()
    results = db.query(QuizResult).filter(QuizResult.user_id == user_id).all()
    result_map = {r.quiz_id: r.score for r in results}

    enriched = []
    for q in quizzes:
        enriched.append({
            "id": q.id,
            "user_id": q.user_id,
            "num_questions": q.num_questions,
            "score": result_map.get(q.id),
            "subject": q.subject,
            "is_exam": q.is_exam 
        })
    return enriched


@router.get("/quizz/all", response_model=List[QuizWithScore])
def get_all_quizzes_with_scores(db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).all()
    results = db.query(QuizResult).all()
    result_map = {r.quiz_id: r.score for r in results}

    enriched = []
    for q in quizzes:
        enriched.append({
            "id": q.id,
            "user_id": q.user_id,
            "num_questions": q.num_questions,
            "score": result_map.get(q.id), 
            "subject": q.subject
        })
    return enriched

@router.post("/quizz/scores", response_model=QuizResultRead)
def save_quiz_score(result: QuizResultCreate, db: Session = Depends(get_db)):
    new_result = QuizResult(
        quiz_id=result.quiz_id,
        user_id=result.user_id,
        score=result.score,
        completed_at = datetime.now(timezone.utc)
    )
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    return new_result


@router.get("/quizz/scores/by-user/{user_id}", response_model=List[QuizResultRead])
def get_user_scores(user_id: int, db: Session = Depends(get_db)):
    return db.query(QuizResult).filter(QuizResult.user_id == user_id).all()

@router.get("/quizz/scores", response_model=List[QuizResultRead])
def get_all_scores(db: Session = Depends(get_db)):
    return db.query(QuizResult).all()

@router.post("/quizz/generate")
async def generate_quizz(
    pdf: UploadFile = File(...),
    numarIntrebari: int = Form(...),
    mod: str = Form("grila"),
    user_id: int = Form(None),
    db: Session = Depends(get_db)
):
    from PyPDF2 import PdfReader
    reader = PdfReader(pdf.file)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    subject = extract_subject_from_text(text)

    difficulty = "mediu"
    if user_id:
        results = db.query(QuizResult).filter(QuizResult.user_id == user_id).order_by(QuizResult.completed_at.desc()).limit(5).all()
        if results:
            avg = sum([r.score for r in results if r.score is not None]) / len(results)
            if avg < 60:
                difficulty = "ușor"
            elif avg > 85:
                difficulty = "dificil"
            else:
                difficulty = "mediu"

    pdf.file.seek(0)

    if mod == "examen":
        quiz = generate_open_questions_from_pdf(pdf.file, numarIntrebari, difficulty) 
    else:
        quiz = generate_quiz_from_pdf(pdf.file, numarIntrebari, difficulty) 

    return { "quiz": quiz, "subject": subject, "difficulty": difficulty }


from typing import List

@router.post("/openai/eval")
def evaluate_open_answer(body: OpenAIEvalRequest):
    try:
        results = [generate_feedback(p) for p in body.prompts]
        scor = 0
        for feedback in results:
            prima_linie = feedback.split('\n')[0].strip().lower()
            if prima_linie.startswith("corect"):
                scor += 1
        scor_procent = round((scor / len(results)) * 100) if results else 0

        return {"results": results, "scor": scor_procent}
    except Exception as e:
        return {"error": str(e)}
    
@router.get("/questions/by-quiz/{quiz_id}")
def get_questions_by_quiz(quiz_id: int, db: Session = Depends(get_db)):
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="Nu există întrebări pentru acest quiz.")
    
    def extract_corect(q):
        # Caută index litera din textul întrebării (a/b/c/d) - variantă robustă pentru orice proveniență
        import re
        if q.correct_answer:
            # 1. Dacă e deja index (0/1/2/3)
            try:
                idx = int(q.correct_answer)
                return idx
            except Exception:
                pass
            # 2. Dacă e literă (a/b/c/d)
            litera = q.correct_answer.strip().lower()
            if litera in ['a', 'b', 'c', 'd']:
                return {'a':0, 'b':1, 'c':2, 'd':3}[litera]
        # 3. Caută "Răspuns corect: ..." în textul întrebării, fallback (DOAR DACĂ E NEVOIE)
        match = re.search(r"Răspuns corect:\s*([a-d])", q.text, re.IGNORECASE)
        if match:
            litera = match.group(1).lower()
            return {'a':0, 'b':1, 'c':2, 'd':3}[litera]
        return None

    result = []
    for q in questions:
        result.append({
            "id": q.id,
            "text": q.text,
            "correct": extract_corect(q),   # trimite indexul!
        })
    return result


@router.get("/quiz-full/{quiz_id}")
def get_quiz_with_questions(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    
    return {
        "id": quiz.id,
        "subject": quiz.subject,
        "is_exam": quiz.is_exam,
        "questions": [
            {
                "id": q.id,
                "text": q.text,
                "correct_answer": q.correct_answer,
                "type": q.type
            }
            for q in questions
        ]
    }

@router.get("/quizz/by-code/{access_code}")
def get_quiz_by_access_code(
    access_code: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.access_code == access_code).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz inexistent")

    return {
        "id": quiz.id,
        "subject": quiz.subject,
        "num_questions": quiz.num_questions,
        "is_exam": quiz.is_exam,
        "access_code": quiz.access_code,
    }
