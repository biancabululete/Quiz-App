# Quiz-App

O aplicație web full-stack care transformă orice document PDF într-un quiz interactiv generat cu AI. Utilizatorul încarcă un curs, o notiță sau un capitol de carte, iar aplicația produce automat întrebări grilă sau întrebări deschise de tip examen, cu evaluare automată a răspunsurilor.

Proiectul include autentificare cu Google, dashboard cu statistici și heatmap de activitate, dificultate adaptivă în funcție de rezultatele anterioare, un mod separat pentru profesori care pot crea quiz-uri partajabile prin cod de acces, abonament Pro și panou de administrare.

---

## Cuprins

- [Funcționalități](#funcționalități)
- [Stack tehnologic](#stack-tehnologic)
- [Structura proiectului](#structura-proiectului)
- [Instalare](#instalare)
- [Configurare variabile de mediu](#configurare-variabile-de-mediu)
- [Rulare](#rulare)
- [Endpoint-uri API](#endpoint-uri-api)
- [Modelul de date](#modelul-de-date)
- [Capturi din aplicație](#capturi-din-aplicație)
- [Roadmap](#roadmap)

---

## Funcționalități

### Pentru studenți
- **Generare quiz din PDF** — încarci documentul, alegi numărul de întrebări și aplicația extrage textul, îl trimite la OpenAI și returnează quiz-ul formatat.
- **Două moduri de testare**:
  - **Grilă** — întrebări cu 3-4 variante, o singură variantă corectă, corectare instant.
  - **Examen** — întrebări deschise, răspunsurile sunt evaluate de AI și primesc feedback per întrebare.
- **Dificultate adaptivă** — pe baza ultimelor 5 rezultate ale utilizatorului, sistemul cere AI-ului întrebări „ușor", „mediu" sau „dificil".
- **Dashboard personal** — istoricul quiz-urilor, scoruri, grafice (Recharts) și heatmap de activitate zilnică (calendar-heatmap).
- **Detectare automată a materiei** — aplicația încearcă să identifice domeniul (Matematică, Istorie, Biologie etc.) direct din textul PDF-ului.

### Pentru profesori
- **Mod profesor** cu dashboard separat.
- **Creare quiz-uri partajabile** — fiecare quiz primește un `access_code` unic (8 caractere) pe care studenții îl pot folosi pentru a accesa testul.
- **Atribuire quiz către studenți** (`QuizAssignment`) și tracking al completărilor.

### Pentru toți utilizatorii
- **Autentificare** cu Google OAuth (`@react-oauth/google` + JWT) sau email/parolă.
- **Abonament Pro** prin rutele de payment (limite extinse pentru utilizatorii `IMPLICIT` vs. `PRO`).
- **Panou admin** pentru gestionarea utilizatorilor și a conținutului.
- **Pagină demo** — încearcă aplicația fără cont.

---

## Stack tehnologic

### Backend
| Componentă | Tehnologie |
|---|---|
| Framework web | **FastAPI** |
| Server ASGI | **Uvicorn** |
| ORM | **SQLAlchemy** |
| Bază de date | **MySQL / PostgreSQL** (driver `pymysql`) |
| Extracție text PDF | **PyPDF2** |
| AI | **OpenAI API** (`gpt-3.5-turbo`) |
| Auth | **JWT** + Google OAuth |
| Config | **python-dotenv** |

### Frontend
| Componentă | Tehnologie |
|---|---|
| Framework | **React 18** + **TypeScript** |
| Build | **Create React App** (`react-scripts`) |
| Routing | **react-router-dom v6** |
| Styling | **Tailwind CSS** |
| Iconuri | **lucide-react** |
| Animații | **framer-motion** |
| Grafice | **Recharts** + **react-calendar-heatmap** |
| Auth | **@react-oauth/google** + **jwt-decode** |

---

## Structura proiectului

```
Quiz-App/
├── backend/
│   ├── app/
│   │   ├── core/          # Configurări (config.py)
│   │   ├── db/            # Engine SQLAlchemy + dependențe FastAPI
│   │   ├── models/        # Modelele ORM (User, Quiz, Question, ...)
│   │   ├── routes/        # Endpoint-urile (user, quiz, payment, admin)
│   │   ├── schemas/       # Schemele Pydantic
│   │   ├── services/      # Logica de business + integrare OpenAI
│   │   └── main.py        # Punct de intrare FastAPI
│   ├── main.py            # Variantă minimală standalone
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Layout, Topbar, Card, UserContext, ...
│   │   ├── pages/         # Home, Dashboard, Quiz, QuizGrila, QuizExamen, ...
│   │   ├── utils/         # parseQuizText (parser pentru output-ul AI)
│   │   ├── App.tsx        # Rutele aplicației
│   │   └── index.tsx
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## Instalare

### Cerințe preliminare
- **Node.js** 18+ și **npm**
- **Python** 3.10+
- **MySQL** sau **PostgreSQL** pornit local (sau un connection string către o instanță remote)
- O cheie **OpenAI API**
- (Opțional) **Google OAuth Client ID** pentru autentificarea cu Google

### Pași

```bash
# 1. Clonează repo-ul
git clone https://github.com/<user>/Quiz-App.git
cd Quiz-App

# 2. Backend — creează un virtualenv și instalează dependențele
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate
pip install -r requirements.txt
pip install openai PyPDF2 python-multipart passlib[bcrypt] python-jose

# 3. Frontend — instalează dependențele
cd ../frontend
npm install
```

---

## Configurare variabile de mediu

Creează un fișier `.env` în `backend/` cu conținutul:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=mysql+pymysql://user:parola@localhost:3306/quizapp
JWT_SECRET=un-secret-foarte-lung-si-aleator
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

În `frontend/`, dacă folosești Google OAuth, creează `.env`:

```env
REACT_APP_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:8000
```

> ⚠️ Nu commita niciodată fișierele `.env` — adaugă-le în `.gitignore`.

---

## Rulare

### Backend

```bash
cd backend/app
uvicorn main:app --reload --port 8000
```

API disponibil la `http://localhost:8000`, documentație interactivă Swagger la `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm start
```

Aplicația rulează la `http://localhost:3000`.

---

## Endpoint-uri API

Toate rutele sunt prefixate cu `/api`.

### Quiz
| Metodă | Rută | Descriere |
|---|---|---|
| `POST` | `/api/quizz/generate` | Generează quiz din PDF (form-data: `pdf`, `numarIntrebari`, `mod`, `user_id`) |
| `POST` | `/api/quizz/save` | Salvează quiz-ul în DB |
| `GET` | `/api/quizz/by-user/{user_id}` | Lista quiz-urilor unui utilizator |
| `GET` | `/api/quizz/all` | Toate quiz-urile (admin) |
| `POST` | `/api/quizz/scores` | Salvează scorul unui quiz |
| `GET` | `/api/quizz/scores/by-user/{user_id}` | Scorurile unui utilizator |
| `GET` | `/api/quiz-full/{quiz_id}` | Quiz complet cu întrebări |
| `GET` | `/api/quizz/by-code/{access_code}` | Acces quiz prin cod (mod profesor) |
| `GET` | `/api/questions/by-quiz/{quiz_id}` | Întrebările unui quiz |
| `POST` | `/api/openai/eval` | Evaluează răspunsuri deschise cu AI |

### Utilizatori, plăți, admin
- `/api/users/...` — înregistrare, login, profil, Google OAuth
- `/api/payment/...` — abonament Pro
- `/api/admin/...` — gestiune utilizatori și conținut

---

## Modelul de date

```
users (id, email, nume, avatar_url, google_id, rol, abonament, subscription_id, created_at)
   └── documents (id, user_id, file_name, uploaded_at)
   └── quizzes (id, document_id, user_id, is_exam, num_questions, subject, access_code)
        ├── questions (id, quiz_id, text, type, correct_answer, ai_scoreable)
        │     └── answers (id, question_id, user_id, answer_text, is_correct, score)
        ├── quiz_results (id, quiz_id, user_id, score, completed_at)
        └── quiz_assignments (id, quiz_id, user_id, invited_at, completed)
   └── activity_log (id, user_id, activity, timestamp)
```

Enum-uri:
- `rol`: `USER` | `ADMIN`
- `abonament`: `IMPLICIT` | `PRO`
- `question.type`: `multiple_choice` | `open`

---

## Capturi din aplicație

Paginile principale (în `frontend/src/pages/`):
- `Home` — landing page
- `Login` / `SignUp` — autentificare (email/parolă + Google)
- `IncarcaDocument` — upload PDF și configurare quiz
- `QuizGrila` — quiz cu variante multiple
- `QuizExamen` — quiz cu întrebări deschise
- `QuizRezultat` / `RezultatExamen` — scor + feedback per întrebare
- `Dashboard` — istoric, statistici, heatmap
- `Profil` / `Setari` — profilul utilizatorului
- `ProfesorDashboard` / `CreeazaQuiz` — modul profesor
- `Demo` — încearcă fără cont

---

## Roadmap

- [ ] Suport pentru fișiere `.docx` și `.txt` (acum doar PDF)
- [ ] Export rezultate quiz în PDF / CSV
- [ ] Notificări email când un student termină un quiz atribuit
- [ ] Quiz timer (cronometru pe întrebare/total)
- [ ] Migrare la Vite pentru build mai rapid pe frontend
- [ ] Internaționalizare (i18n) — momentan UI este în română

---

## Licență

Acest proiect este distribuit sub licență MIT. Vezi `LICENSE` pentru detalii.

---

*Realizat ca proiect personal pentru a explora integrarea OpenAI API într-o aplicație educațională full-stack.*
