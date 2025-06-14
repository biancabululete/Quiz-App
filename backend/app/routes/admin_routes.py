from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from models.models import Question, Quiz, QuizAssignment, User, QuizResult
from schemas.admin import AddQuestionsRequest, QuizDTO
from db.dependencies import get_db
from services.user_service import get_current_user
from schemas.admin import QuizCreateDTO, InviteStudentsDTO, QuizResultDTO, QuizDTO
from fastapi.responses import StreamingResponse
import io
import csv

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/quizzes")
def create_quiz(data: QuizCreateDTO, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    quiz = Quiz(
        user_id=user.id,
        num_questions=data.num_questions,
        is_exam=data.is_exam,
        subject=data.subject,
        document_id=data.document_id
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return {"quiz_id": quiz.id, "message": "Quiz creat cu succes"}

@router.post("/quizzes/{quiz_id}/invite")
def invite_students(quiz_id: int, data: InviteStudentsDTO, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    for student_id in data.user_ids:
        exists = db.query(QuizAssignment).filter_by(quiz_id=quiz_id, user_id=student_id).first()
        if not exists:
            assignment = QuizAssignment(quiz_id=quiz_id, user_id=student_id)
            db.add(assignment)
    db.commit()

    return {"message": "Studenți invitați cu succes"}

@router.get("/quizzes/{quiz_id}/results", response_model=List[QuizResultDTO])
def get_quiz_results(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acces interzis")

    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz-ul nu a fost găsit")

    assignments = (
        db.query(QuizAssignment, User, QuizResult)
        .join(User, QuizAssignment.user_id == User.id)
        .outerjoin(QuizResult, (QuizResult.quiz_id == quiz_id) & (QuizResult.user_id == User.id))
        .filter(QuizAssignment.quiz_id == quiz_id)
        .all()
    )

    results = []
    for assignment, student, result in assignments:
        results.append(QuizResultDTO(
            student_id=student.id,
            student_email=student.email,
            student_name=student.nume,
            score=result.score if result else None,
            completed_at=result.completed_at if result else None
        ))

    return results


@router.get("/quizzes", response_model=list[QuizDTO])
def get_all_quizzes_for_admin(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acces interzis")

    quizzes = db.query(Quiz).filter(Quiz.user_id == user.id).order_by(Quiz.created_at.desc()).all()
    return quizzes


@router.get("/quizzes/access/{access_code}")
def get_quiz_by_access_code(access_code: str, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.access_code == access_code).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Cod invalid")
    return {
        "id": quiz.id,
        "subject": quiz.subject,
        "num_questions": quiz.num_questions,
        "is_exam": quiz.is_exam
    }


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acces interzis")

    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz-ul nu există")

    db.delete(quiz)
    db.commit()
    return {"message": "Quiz șters cu succes"}


@router.post("/quizzes/{quiz_id}/questions")
def add_questions_to_quiz(
    quiz_id: int,
    data: AddQuestionsRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Doar profesorii pot adăuga întrebări")

    for q in data.questions:
        question = Question(
            quiz_id=quiz_id,
            text=q.text,
            correct_answer=q.correct_answer,
            type="multiple_choice" if q.correct_answer else "open",
            ai_scoreable=q.correct_answer is not None
        )
        db.add(question)

    db.commit()
    return {"message": "Întrebări adăugate cu succes"}


@router.get("/quizzes/{quiz_id}/stats")
def get_quiz_stats(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acces interzis")

    # Validare ca quiz-ul apartine profesorului
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz-ul nu a fost găsit")

    results = db.query(QuizResult).filter(QuizResult.quiz_id == quiz_id).all()
    scores = [r.score for r in results if r.score is not None]

    if not scores:
        return {
            "average": None,
            "min": None,
            "max": None,
            "distribution": {},
            "top5": [],
            "count": 0,
        }

    # Distribuție simplă: 0-50, 51-75, 76-100
    distribution = {
        "0-50": len([s for s in scores if s <= 50]),
        "51-75": len([s for s in scores if 51 <= s <= 75]),
        "76-100": len([s for s in scores if s > 75]),
    }

    # Top 5 rezultate (cu nume + email + scor)
    assignments = (
        db.query(QuizAssignment, User, QuizResult)
        .join(User, QuizAssignment.user_id == User.id)
        .outerjoin(QuizResult, (QuizResult.quiz_id == quiz_id) & (QuizResult.user_id == User.id))
        .filter(QuizAssignment.quiz_id == quiz_id)
        .all()
    )
    results_table = []
    for assignment, student, result in assignments:
        results_table.append({
            "student_id": student.id,
            "student_email": student.email,
            "student_name": student.nume,      # <--- aici
            "score": result.score if result else None,
            "completed_at": result.completed_at if result else None,
        })

    # Top 5 cu nume + email + scor
    top5 = sorted(
        [r for r in results_table if r["score"] is not None], 
        key=lambda x: -x["score"]
    )[:5]

    return {
        "average": round(sum(scores) / len(scores), 2),
        "min": min(scores),
        "max": max(scores),
        "distribution": distribution,
        "top5": top5,
        "count": len(scores),
        "all_results": results_table,
    }


@router.get("/quizzes/{quiz_id}/export")
def export_quiz_results_csv(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz-ul nu a fost găsit")

    assignments = (
        db.query(QuizAssignment, User, QuizResult)
        .join(User, QuizAssignment.user_id == User.id)
        .outerjoin(QuizResult, (QuizResult.quiz_id == quiz_id) & (QuizResult.user_id == User.id))
        .filter(QuizAssignment.quiz_id == quiz_id)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Nume", "Email", "Score", "Completed At"])
    for assignment, student, result in assignments:
        writer.writerow([
            student.id,
            student.nume,  
            student.email,
            result.score if result else "",
            result.completed_at.strftime("%Y-%m-%d %H:%M") if result and result.completed_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=quiz_{quiz_id}_results.csv"}
    )
