import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/buttons/Button";


type Question = {
  id: number;
  intrebare: string;
  variante: string[];
  corect?: number;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Parsator pentru variante
function parseOptions(text: string): string[] {
  const matches = text.match(/^[a-d]\)\s*[^\n]+/gim);
  if (!matches) return [];
  return matches.map(line => line.replace(/^[a-d]\)\s*/, '').trim());
}

// Parsator pentru textul întrebării (fără variante)
function parseQuestionText(text: string): string {
  const idx = text.search(/a\)/i);
  if (idx === -1) return text.replace(/^\d+\.\s*/, '').trim();
  return text.slice(0, idx).replace(/^\d+\.\s*/, '').trim();
}

export default function QuizGrila() {
  const navigate = useNavigate();
  const [intrebari, setIntrebari] = useState<Question[]>([]);
  const [curenta, setCurenta] = useState(0);
  const [raspunsuri, setRaspunsuri] = useState<{ [id: number]: number }>({});
  const [feedback, setFeedback] = useState<"corect" | "gresit" | null>(null);
  const [locked, setLocked] = useState(false);
  const [quizId, setQuizId] = useState<number | null>(null);
  const subject = localStorage.getItem("materie") || "Altceva";

  const query = useQuery();
  const quizIdParam = query.get("quizId");
  const accessCodeParam = query.get("accessCode")?.trim();

  useEffect(() => {
    const text = localStorage.getItem("quiz_generat");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Caz 1: Quiz generat local
    if (text && user?.id) {
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      const parsed: Question[] = [];
      let currentQ: Partial<Question> = {};
      let variante: string[] = [];

      lines.forEach((line) => {
        if (/^\d+\./.test(line)) {
          if (currentQ.intrebare && variante.length) {
            parsed.push({
              id: parsed.length + 1,
              intrebare: currentQ.intrebare!,
              variante: [...variante],
              corect: currentQ.corect,
            });
          }
          currentQ = { intrebare: line.replace(/^\d+\.\s*/, "") };
          variante = [];
        } else if (/^[a-d]\)/i.test(line)) {
          variante.push(line.replace(/^[a-d]\)\s*/, ""));
        } else if (/^Răspuns corect:/i.test(line)) {
          const litera = line.split(":")[1].trim().toLowerCase();
          const indexCorect = { a: 0, b: 1, c: 2, d: 3 }[litera as "a" | "b" | "c" | "d"];
          if (indexCorect !== undefined) {
            currentQ.corect = indexCorect;
          }
        }
      });

      if (currentQ.intrebare && variante.length) {
        parsed.push({
          id: parsed.length + 1,
          intrebare: currentQ.intrebare!,
          variante: [...variante],
          corect: currentQ.corect,
        });
      }

      fetch("http://localhost:8000/api/quizz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          document_id: null,
          subject,
          questions: parsed.map((q) => ({
            text: q.intrebare,
            correct: q.corect,
          })),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Quiz salvat cu ID:", data.quiz_id);
          setQuizId(data.quiz_id);
        })
        .catch((err) => console.error("Eroare salvare quiz:", err));

      setIntrebari(parsed);
    }

    // Caz 2: Quiz din backend după quizId
    else if (quizIdParam && user?.token) {
      fetch(`http://localhost:8000/api/questions/by-quiz/${quizIdParam}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("QuizGrila data:", data);
          const parsed: Question[] = data.map((q: any) => ({
            id: q.id,
            intrebare: parseQuestionText(q.text),
            variante: parseOptions(q.text),
            corect: q.correct,
          }));
          setIntrebari(parsed);
          setQuizId(parseInt(quizIdParam));
        })
        .catch((err) => console.error("Eroare la încărcare întrebări din server:", err));
    }

    // Caz 3: Quiz cu cod de acces
    else if (accessCodeParam && user?.token) {
      fetch(`http://localhost:8000/api/quizz/by-code/${accessCodeParam}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Cod invalid sau quiz inexistent");
          return res.json();
        })
        .then((quiz) => {
          setQuizId(quiz.id);
          return fetch(`http://localhost:8000/api/questions/by-quiz/${quiz.id}`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
        })
        .then((res) => res.json())
        .then((data) => {
          const parsed: Question[] = data.map((q: any) => ({
            id: q.id,
            intrebare: parseQuestionText(q.text),
            variante: parseOptions(q.text),
            corect: q.correct,
          }));
          setIntrebari(parsed);
        })
        .catch((err) => {
          console.error("Eroare la încărcare quiz cu cod:", err);
          alert("Cod de acces invalid sau quiz indisponibil.");
          navigate("/quiz");
        });
    }
  }, [quizIdParam, accessCodeParam]);

  const handleSelect = (idx: number) => {
    const intrebare = intrebari[curenta];
    if (locked) return;

    setRaspunsuri((prev) => ({ ...prev, [intrebare.id]: idx }));
    setLocked(true);

    if (idx === intrebare.corect) {
      setFeedback("corect");
    } else {
      setFeedback("gresit");
    }
  };

  const urmatoarea = () => {
    setFeedback(null);
    setLocked(false);
    setCurenta((prev) => prev + 1);
  };

 const handleFinal = async () => {
  let scor = 0;

  intrebari.forEach((q) => {
    const r = raspunsuri[q.id];
    if (r !== undefined && r === q.corect) {
      scor++;
    }
  });

  const procent = Math.round((scor / intrebari.length) * 100);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (quizId && user?.id) {
    try {
      const res = await fetch("http://localhost:8000/api/quizz/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quizId,
          user_id: user.id,
          score: procent,
        }),
      });

      if (!res.ok) {
        console.error("Eroare salvare scor:", await res.text());
      }
    } catch (err) {
      console.error("Eroare fetch scor:", err);
    }
  }

  navigate("/quiz-rezultat", {
    state: {
      scor: procent,
      total: 100,
    },
  });
};


  const intrebare = intrebari[curenta];

  if (!intrebare) {
    return <div className="text-center mt-20">Se încarcă întrebarea...</div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white/90 p-8 rounded-3xl shadow-lg">
        <h2 className="text-2xl font-bold text-maroInchis mb-6">
          Întrebarea {curenta + 1} / {intrebari.length}
        </h2>

        <p className="text-lg mb-6 text-black font-semibold">
          {intrebare.intrebare}
        </p>

        <div className="space-y-3">
          {intrebare.variante.map((opt, idx) => {
            const esteSelectat = raspunsuri[intrebare.id] === idx;

            const feedbackClass =
              locked && esteSelectat
                ? feedback === "corect"
                  ? "bg-green-100 border-green-500"
                  : "bg-red-100 border-red-500"
                : "hover:bg-gray-100";

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={locked}
                className={`w-full border px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                  esteSelectat ? "font-bold" : ""
                } ${feedbackClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {locked && (
          <div className="mt-8 text-center">
            {curenta + 1 < intrebari.length ? (
              <Button onClick={urmatoarea} size="lg">
                Următoarea întrebare
              </Button>
            ) : (
              <Button onClick={handleFinal} size="lg">
                Trimite răspunsurile
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
