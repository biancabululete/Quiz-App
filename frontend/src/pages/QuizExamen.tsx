import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/buttons/Button";
import { Loader2 } from "lucide-react";

type Question = {
  id: number;
  intrebare: string;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function QuizExamen() {
  const navigate = useNavigate();
  const query = useQuery();
  const quizIdParam = query.get("quizId");
  const accessCodeParam = query.get("accessCode");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [id: number]: string }>({});
  const [feedbackAll, setFeedbackAll] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [isExam, setIsExam] = useState(false);


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const quizDataRaw = localStorage.getItem("quiz_generat");
    if (quizDataRaw && !quizIdParam && !accessCodeParam) {
      const quizData = JSON.parse(quizDataRaw);
      const parsed: Question[] = quizData.questions.map((q: any, idx: number) => ({
        id: idx + 1,
        intrebare: q.text,
      }));
      setQuestions(parsed);
      setQuizId(quizData.quiz_id);
      setIsExam(true);
      return;
    }

    if (quizIdParam && user?.token) {
      fetch(`http://localhost:8000/api/quiz-full/${quizIdParam}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            const parsed: Question[] = data.questions.map((q: any) => ({
              id: q.id,
              intrebare: q.text,
               type: q.type,
              correct_answer: q.correct_answer 
            }));
            setQuestions(parsed);
            setQuizId(data.id);
            setIsExam(data.is_exam);
          })
        .catch((err) => console.error("Eroare încărcare întrebări:", err));
    } else if (accessCodeParam && user?.token) {
      fetch(`http://localhost:8000/api/quizz/by-code/${accessCodeParam}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
          .then((res) => res.json())
          .then((quiz) => {
            setQuizId(quiz.id);
            return fetch(`http://localhost:8000/api/quiz-full/${quiz.id}`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
          })
          .then((res) => res.json())
          .then((data) => {
            const parsed: Question[] = data.questions.map((q: any) => ({
              id: q.id,
              intrebare: q.text,
            }));
            setQuestions(parsed);
            setIsExam(data.is_exam);
          })

        .catch((err) => {
          console.error("Eroare acces prin cod:", err);
          alert("Cod invalid sau quiz inexistent");
          navigate("/quiz");
        });
    }
  }, [quizIdParam, accessCodeParam]);

  const next = () => {
    if (!answers[questions[current].id]) return;
    if (current < questions.length - 1) setCurrent((c) => c + 1);
  };

const handleFinalSubmit = async () => {
  setLoadingFeedback(true);
  const prompts = questions.map((q) => {
    const answer = answers[q.id];
    return `Întrebare: ${q.intrebare}
    Răspuns utilizator: ${answer}
    Apoi spune pe o linie: „corect” sau „incorect” fara ghilimele si cu ":" feedback scurt pentru utilizator, incluzand si raspunsul corect pe scurt.`;
  });

  try {
    const res = await fetch("http://localhost:8000/api/openai/eval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompts }),
    });

    const data = await res.json();
    console.log("AI eval:", data);

    setFeedbackAll(data.results);

    const scorFinal = data.scor;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const quizGenerat = JSON.parse(localStorage.getItem("quiz_generat") || "{}");

    await fetch("http://localhost:8000/api/quizz/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: quizGenerat.quiz_id,
        user_id: user.id,
        score: scorFinal,
      }),
    }); 

    navigate("/rezultat-examen", {
      state: {
        questions,
        answers,
        feedback: data.results,
        scor: scorFinal,
      },
    });

  } catch (err) {
    console.error("Eroare evaluare:", err);
  } finally {
    setLoadingFeedback(false);
  }
};


  if (!questions.length) return <div className="text-center mt-20">Se încarcă testul...</div>;
  
  if (loadingFeedback) {
  return (
    <div className="flex justify-center items-center h-screen">
      <button
        disabled
        className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-gray-500 rounded-lg cursor-not-allowed"
      >
        <Loader2 className="animate-spin" size={20} />
        Se generează feedback-ul...
      </button>
    </div>
  );
}
  const q = questions[current];

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">
        Întrebarea {current + 1}/{questions.length}
      </h2>
      <p className="mb-4 text-black">{q.intrebare}</p>
      <textarea
        className="w-full h-32 p-3 border rounded-lg"
        placeholder="Scrie răspunsul tău..."
        value={answers[q.id] || ""}
        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
      />
      <div className="flex justify-between mt-6">
        {current < questions.length - 1 ? (
          <Button onClick={next} disabled={!answers[q.id]}>
            Următoarea întrebare
          </Button>
        ) : (
          <Button onClick={handleFinalSubmit} disabled={!answers[q.id]}>
            Trimite răspunsurile
          </Button>
        )}
      </div>
    </div>
  );
}
