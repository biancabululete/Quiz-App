import { useState } from "react";
import Button from "../components/buttons/Button";
import { useNavigate } from "react-router-dom";

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


    try {
      const res = await fetch("http://localhost:8000/api/quizz/generate", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      console.log("Quiz generat:", data.quiz);
  
      // 🔥 Salvează quizul generat (ca text simplu) în localStorage
      localStorage.setItem("quiz_generat", data.quiz);
  
      // 🔁 Trimite utilizatorul către pagina de quiz
      navigate("/quiz-grila");
  
    } catch (err) {
      console.error("Eroare generare quiz:", err);
      setError("A apărut o eroare la generarea quiz-ului.");
    }
  
    setIsLoading(false);
  };

  const handleExamMode = () => {
    setShowExamModal(true);
  };

  const closeExamModal = () => {
    setShowExamModal(false);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-[#D2BDB1] rounded-3xl shadow-2xl p-8"
      >
        <label
          htmlFor="document"
          className="bg-white text-black w-full flex h-60 rounded-md border-4 border-dashed border-black cursor-pointer relative"
        >
          <div className="absolute inset-0 m-auto flex justify-center items-center font-semibold text-center">
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
        <label htmlFor="numarIntrebari" className="block text-sm font-medium text-gray-700 mb-2">
          Alege numărul de întrebări:
        </label>
        <select
          id="numarIntrebari"
          className="w-full border border-gray-300 rounded-md px-4 py-2"
          value={numarIntrebari}
          onChange={(e) => {
            const value = e.target.value;
            setNumarIntrebari(value ? parseInt(value) : "");
          }}
        >
          <option value="">Selectează</option>
          <option value={10}>10 întrebări</option>
          <option value={15}>15 întrebări</option>
          <option value={20}>20 întrebări</option>
        </select>

        {numarIntrebari === "" && error === "intrebari" && (
          <p className="text-red-600 text-sm mt-1">Selectează câte întrebări vrei să conțină quiz-ul.</p>
        )}
      </div>


        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}

        <div className="flex justify-center gap-6 mt-10">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Se generează..." : "Generează Quiz"}
          </Button>
          <Button type="button" onClick={handleExamMode}>
            Mod Examen
          </Button>
        </div>
      </form>

      {showExamModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-4 text-black">
              Modul examen este disponibil doar pentru conturile Pro!
            </h2>
            <Button
              className="mb-3"
              onClick={() => console.log("Navigare către abonare")}
            >
              Abonează-te!
            </Button>
            <Button onClick={closeExamModal} className="w-full">
              Închide
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
