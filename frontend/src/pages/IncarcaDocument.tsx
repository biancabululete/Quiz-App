import { useState } from "react";
import Button from "../components/buttons/Button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function IncarcaDocument() {
  const navigate = useNavigate();
  const [document, setDocument] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [numarIntrebari, setNumarIntrebari] = useState<number | "">("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!document) {
      setError("Nu ai încărcat un document PDF!");
      return;
    }

    if (numarIntrebari === "") {
      setError("intrebari");
      return;
    }

    setError("");
    setIsLoading(true);
    const formData = new FormData();
    formData.append("pdf", document);
    formData.append("numarIntrebari", numarIntrebari.toString());

     const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (user && user.id) {
        formData.append("user_id", user.id);
      }
    try {
      const res = await fetch("http://localhost:8000/api/quizz/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Eroare răspuns server:", text);
        setError("Serverul a răspuns cu o eroare.");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      console.log("Complexitatea generată pentru quiz:", data.difficulty);
      console.log("Quiz generat:", data.quiz);
      localStorage.setItem("quiz_generat", data.quiz);
      navigate("/quiz-grila");
    } catch (err) {
      console.error("Eroare generare quiz:", err);
      setError("A apărut o eroare la generarea quiz-ului.");
    }

    setIsLoading(false);
  };

const handleExamMode = async () => {
  if (!document) {
    setError("Nu ai încărcat un document PDF!");
    return;
  }

  if (numarIntrebari === "") {
    setError("intrebari");
    return;
  }

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  if (!user || user.abonament !== "PRO") {
    setShowExamModal(true);
    return;
  }

  setIsLoading(true);
  const formData = new FormData();
  formData.append("pdf", document);
  formData.append("numarIntrebari", numarIntrebari.toString());
  formData.append("mod", "examen");

    if (user && user.id) {
    formData.append("user_id", user.id);
    }

  try {
    const res = await fetch("http://localhost:8000/api/quizz/generate", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Eroare server:", text);
      setError("Serverul a răspuns cu o eroare.");
      setIsLoading(false);
      return;
    }

    const data = await res.json();
    console.log("Complexitatea generată pentru quiz:", data.difficulty);
    const questions = data.quiz.split(/\n(?=\d+\.)/)
      .map((line:string) => ({ text: line.trim(), correct: null }));

    const saveRes = await fetch("http://localhost:8000/api/quizz/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        document_id: null,
        subject: data.subject,
        questions: questions,
        is_exam: true,
      }),
    });

    const { quiz_id } = await saveRes.json();

    localStorage.setItem("quiz_generat", JSON.stringify({ questions, quiz_id }));
    navigate("/quiz-examen");
  } catch (err) {
    console.error("Eroare generare quiz:", err);
    setError("A apărut o eroare la generarea quiz-ului.");
  }

  setIsLoading(false);
};

  const closeExamModal = () => {
    setShowExamModal(false);
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
            className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-gray-500 
            rounded-lg cursor-not-allowed">
            <Loader2 className="animate-spin" size={18} />
            Se generează...
          </button>
        ) : (
          <>
            <Button type="submit" size="md">Quiz Grilă</Button>
            <Button type="button" size="md" onClick={handleExamMode}>
              Mod Examen
            </Button>
          </>
        )}
      </div>
    </form>
  </div>

  {showExamModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <h2 className="text-xl font-bold mb-4 text-black">
          Modul examen este disponibil doar pentru conturile Pro!
        </h2>
        <Button className="mb-3" onClick={() => navigate("/profil")}>Abonează-te!</Button>
        <Button onClick={closeExamModal} className="w-full">Închide</Button>
      </div>
    </div>
  )}
</div>

  );
}
