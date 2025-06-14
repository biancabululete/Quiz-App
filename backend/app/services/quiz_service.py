from PyPDF2 import PdfReader
from openai import OpenAI
from core.config import settings
from models.models import Quiz, Question
from sqlalchemy.orm import Session
from datetime import datetime

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_quiz_from_pdf(pdf_file, numar_intrebari: int, difficulty: str = "mediu"):
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    prompt = f"""
Generează {numar_intrebari} întrebări grilă cu dificultate {difficulty} bazate pe textul de mai jos.

Fiecare întrebare trebuie să aibă 3-4 opțiuni, o singură variantă corectă, și să fie formatată astfel:

1. Ce este React?
   a) Un framework
   b) O bibliotecă JavaScript
   c) Un limbaj
   d) Un server
   Răspuns corect: b

Conținut:
{text[:3000]}

IMPORTANT: Nu include explicații, doar întrebările.
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            { "role": "user", "content": prompt }
        ],
        temperature=0.7
    )

    return response.choices[0].message.content

def save_quiz_to_db(user_id, document_id, questions, db, subject, is_exam=False):
    quiz = Quiz(
        user_id=user_id,
        document_id=document_id,
        subject=subject,
        num_questions=len(questions),
        is_exam=is_exam
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for q in questions:
         if "correct" in q and q["correct"] is not None:  # e grilă
            question = Question(
                quiz_id=quiz.id,
                text=q["text"],
                type="multiple_choice",
                correct_answer=q["correct"],
                ai_scoreable=True
            )
         else:
            question = Question(
                quiz_id=quiz.id,
                text=q["text"],
                type="open",
                ai_scoreable=True
            )
         db.add(question)
    db.commit()
    return quiz.id


def generate_open_questions_from_pdf(pdf_file, numar_intrebari: int, difficulty: str = "mediu"):
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    prompt = f"""
Generează {numar_intrebari} întrebări cu răspuns deschis de dificultate {difficulty} bazate pe textul de mai jos.

Format:
1. Ce este democrația?

IMPORTANT: Fără variante de răspuns sau explicații, doar întrebările.

Conținut:
{text[:3000]}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{ "role": "user", "content": prompt }],
        temperature=0.7
    )

    return response.choices[0].message.content


ALLOWED_SUBJECTS = {
    "Matematică", "Fizică", "Chimie", "Biologie", "Istorie",
    "Geografie", "Economie", "Informatică", "Limba română"
}

def extract_subject_from_text(text: str) -> str:
    prompt = f"""
Textul de mai jos este dintr-un document educațional. Spune ce materie este abordată.

Răspunde doar cu un singur cuvânt.
Dacă nu este clar sau nu se încadrează în: {", ".join(ALLOWED_SUBJECTS)}, răspunde „Altceva”.

Text:
{text[:1000]}
"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{ "role": "user", "content": prompt }],
        temperature=0
    )

    subject = response.choices[0].message.content.strip()
    return subject if subject in ALLOWED_SUBJECTS else "Altceva"
