from openai import OpenAI
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/quizz/generate")
async def generate_quizz(pdf: UploadFile = File(...), numarIntrebari: int = Form(...)):
    reader = PdfReader(pdf.file)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    # Prompt personalizat
    prompt = f"""
Generează {numarIntrebari} întrebări grilă bazate pe textul de mai jos.

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

    # ✅ Cerere către OpenAI
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            { "role": "user", "content": prompt }
        ],
        temperature=0.7
    )

    quiz = response.choices[0].message.content
    return { "quiz": quiz }
