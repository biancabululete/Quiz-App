import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Button from "../components/buttons/Button";
import { FileText, FilePlus2, ShieldCheck, Sparkles } from "lucide-react";

type Quiz = {
  id: number;
  subject: string;
  num_questions: number;
  created_at: string;
  access_code: string;
  is_exam?: boolean;
};

export default function Quiz() {
  const navigate = useNavigate();
  const [quizuri, setQuizuri] = useState<Quiz[]>([]);
  const [codAcces, setCodAcces] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.rol !== "USER") return;

    fetch("http://localhost:8000/api/user/assigned-quizzes", {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Nu poți accesa quiz-urile primite");
        return res.json();
      })
      .then(setQuizuri)
      .catch((err) => console.error("Eroare la încărcare quiz-uri:", err));
  }, []);

  const handleJoinWithCode = async () => {
  if (codAcces.trim()) {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(`http://localhost:8000/api/quizz/by-code/${codAcces.trim()}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (!res.ok) throw new Error("Cod invalid!");

      const quiz = await res.json();

      if (quiz.is_exam) {
        navigate(`/quiz-examen?quizId=${quiz.id}`);
      } else {
        navigate(`/quiz-grila?quizId=${quiz.id}`);
      }
    } catch (err) {
      alert("Cod invalid sau quiz inexistent!");
    }
  }
};

return (
  <div className="h-full flex flex-col items-center justify-center px-4 py-10">
    <div className="mb-24 w-full flex flex-col items-center">
        <h2 className="text-xl font-bold text-maroInchis mb-4 text-center">Ai primit un cod de acces?</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 w-full max-w-xl">
          <input
            type="text"
            placeholder="Introdu codul de acces"
            value={codAcces}
            onChange={(e) => setCodAcces(e.target.value)}
            className="border px-4 py-2 rounded-lg w-full max-w-xs"
          />
          <Button onClick={handleJoinWithCode}>Participă la quiz</Button>
        </div>
      </div>

    <div className="text-center max-w-3xl w-full">      

        <p className="text-gray-700 mb-8 text-lg">
        Sistemul nostru citește fișierul tău PDF și creează automat întrebări de tip grilă sau teste cu răspuns deschis (mod examen).
        </p>
      <Button
        variant="primary"
        onClick={() => navigate("/incarca")}
        className="mb-4 text-xl py-5 px-10"
      >
        <div className="flex items-center gap-3 justify-center">
          <FileText size={24} />
          Încarcă document PDF
        </div>
      </Button>

      <div className="text-lg text-gray-600">
        <span className="mr-1">sau</span>
        <span
          className="underline cursor-pointer text-maroInchis font-medium"
          onClick={() => navigate("/demo")}
        >
          încearcă unul demo
        </span>
        <span className="mr-1">.</span>
      </div>
    </div>

    {quizuri.length > 0 && (
      <div className="mt-24 w-full max-w-4xl">
        <h2 className="text-xl font-bold text-maroInchis mb-6 text-center">Quiz-uri primite</h2>
        <ul className="space-y-3">
          {quizuri.map((quiz) => (
            <li
              key={quiz.id}
              className="border rounded-lg p-3 bg-white shadow flex justify-between items-center"
            >
              <div>
                <p className="text-base font-semibold text-maroInchis">{quiz.subject}</p>
                <p className="text-sm text-gray-500">
                  Cod: <span className="font-mono">{quiz.access_code}</span> · {quiz.num_questions} întrebări · {new Date(quiz.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                onClick={() => {
                  if (quiz.is_exam) {
                    navigate(`/quiz-examen?quizId=${quiz.id}`);
                  } else {
                    navigate(`/quiz-grila?quizId=${quiz.id}`);
                  }
                }}
                size="sm">Începe quiz</Button>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

}
