import { useState } from "react";
import Button from "../components/buttons/Button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CreeazaQuiz() {
  const navigate = useNavigate();
  const [document, setDocument] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [numarIntrebari, setNumarIntrebari] = useState<number | "">("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [showExamModal, setShowExamModal] = useState(false);

  // Funcție utilitară
  function indexToLitera(idx: number) {
    return ["a", "b", "c", "d"][idx];
  }

  // Parsează textul și returnează array cu text și indexul corect!
  const parseQuizText = (text: string) => {
    const questions: { text: string; correct: number }[] = [];
    const blocks = text.split(/\n(?=\d+\.)/).map(block => block.trim()).filter(Boolean);

    for (const block of blocks) {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

      const answerLine = lines.find(line =>
        line.toLowerCase().startsWith("răspuns corect")
      );

      if (!answerLine) continue;

      const litera = answerLine.split(":")[1]?.trim().toLowerCase() || "";
      const correct = { a: 0, b: 1, c: 2, d: 3 }[litera];

      const questionText = lines
        .filter(line => !line.toLowerCase().startsWith("răspuns corect"))
        .join("\n");

      if (questionText && correct !== undefined) {
        questions.push({ text: questionText, correct });
      }
    }

    return questions;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await generareQuiz(false); // grilă
  };

  const generareQuiz = async (isExam: boolean) => {
    if (isExam && user.abonament !== "PRO") {
      setShowExamModal(true);
      return;
    }

    if (!document) {
      setError("Nu ai încărcat un document PDF!");
      return;
    }

    if (
      numarIntrebari === "" ||
      isNaN(Number(numarIntrebari)) ||
      numarIntrebari < 1 ||
      numarIntrebari > 50
    ) {
      setError("intrebari");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("pdf", document);
    formData.append("numarIntrebari", numarIntrebari.toString());
    formData.append("mod", isExam ? "examen" : "grila");

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const genRes = await fetch("http://localhost:8000/api/quizz/generate", {
        method: "POST",
        body: formData,
      });

      if (!genRes.ok) {
        const msg = await genRes.text();
        console.error("Eroare server:", msg);
        setError("Eroare la generarea quiz-ului.");
        setIsLoading(false);
        return;
      }

      const { quiz, subject } = await genRes.json();

      let questions;

      if (isExam && typeof quiz === "string") {
        questions = quiz
          .split(/\n(?=\d+\.)/)
          .map((line) => ({
            text: line.trim(),
          }))
          .filter((q) => q.text !== "");
      } else if (!isExam && typeof quiz === "string") {
        const parsed = parseQuizText(quiz);
        questions = parsed.map((q) => ({
          text: q.text,
          correct_answer: indexToLitera(q.correct), // <--- trimite LITERA!
        }));
      } else {
        console.error("Format necunoscut pentru quiz:", quiz);
        setError("Format necunoscut pentru quiz.");
        setIsLoading(false);
        return;
      }

      // 1. Creează quiz-ul
      const quizRes = await fetch("http://localhost:8000/api/admin/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          num_questions: questions.length,
          is_exam: isExam,
          subject,
          document_id: null,
        }),
      });

      if (!quizRes.ok) {
        const msg = await quizRes.text();
        console.error("Eroare creare quiz:", msg);
        setError("Nu s-a putut salva quiz-ul.");
        setIsLoading(false);
        return;
      }

      const { quiz_id } = await quizRes.json();

      // 2. Trimite întrebările separat
      const questionsRes = await fetch(`http://localhost:8000/api/admin/quizzes/${quiz_id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ questions }),
      });

      if (!questionsRes.ok) {
        const msg = await questionsRes.text();
        console.error("Eroare salvare întrebări:", msg);
        setError("Quiz-ul a fost creat, dar nu s-au putut salva întrebările.");
        setIsLoading(false);
        return;
      }

      navigate("/profesor-dashboard");
    } catch (err) {
      console.error("Eroare creare quiz:", err);
      setError("A apărut o eroare la salvarea testului.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen pt-24 px-4 flex justify-center">
      <div className="max-w-2xl w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 rounded-3xl shadow-2xl p-8 w-full"
        >
          <label
            htmlFor="document"
            className="bg-white text-black w-full flex h-48 rounded-md border-4 border-dashed border-black cursor-pointer relative"
          >
            <div className="absolute inset-0 m-auto flex justify-center items-center font-semibold text-center px-4">
              {document?.name || "Apasă aici pentru a încărca un document PDF."}
            </div>
            <input
              type="file"
              id="document"
              accept=".pdf"
              className="w-full h-full opacity-0 z-10 cursor-pointer"
              onChange={(e) => setDocument(e.target.files?.[0] || null)}
            />
          </label>

          <div className="mt-6">
            <label htmlFor="numarIntrebari" className="block text-sm font-medium mb-2">
              Număr întrebări
            </label>
            <input
              id="numarIntrebari"
              type="number"
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={numarIntrebari}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val)) {
                  setNumarIntrebari("");
                } else {
                  setNumarIntrebari(val);
                }
              }}
              min={1}
              max={50}
              placeholder="Ex: 10"
            />
            {error === "intrebari" && (
              <p className="text-red-600 text-sm mt-1">
                Introdu un număr valid între 1 și 50.
              </p>
            )}
          </div>

          {error && error !== "intrebari" && (
            <p className="text-red-600 mt-4 text-center">{error}</p>
          )}

          <div className="flex justify-center gap-6 mt-10">
            {isLoading ? (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-gray-500 rounded-lg cursor-not-allowed"
              >
                <Loader2 className="animate-spin" size={18} />
                Se generează...
              </button>
            ) : (
              <>
                <Button type="submit" size="md">Quiz Grilă</Button>
                <Button type="button" size="md" onClick={() => generareQuiz(true)}>
                  Mod Examen
                </Button>
              </>
            )}
          </div>
        </form>
        {showExamModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
              <h2 className="text-xl font-bold mb-4 text-black">
                Modul examen este disponibil doar pentru conturile Pro!
              </h2>
              <Button className="mb-3" onClick={() => navigate("/profil")}>Abonează-te!</Button>
              <Button onClick={() => setShowExamModal(false)} className="w-full">Închide</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
