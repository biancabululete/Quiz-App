import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/buttons/Button";

type Question = {
  id: number;
  intrebare: string;
  variante: string[];
  corect?: number; // opțional – pentru AI parsing viitor
};

export default function QuizGrila() {
  const navigate = useNavigate();
  const [intrebari, setIntrebari] = useState<Question[]>([]);
  const [raspunsuri, setRaspunsuri] = useState<{ [id: number]: number }>({});
  const [trimis, setTrimis] = useState(false);

  // 🔍 parsează textul generat de AI
  useEffect(() => {
    const text = localStorage.getItem("quiz_generat");
    if (!text) return;
  
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
  
    // ultima întrebare
    if (currentQ.intrebare && variante.length) {
      parsed.push({
        id: parsed.length + 1,
        intrebare: currentQ.intrebare!,
        variante: [...variante],
        corect: currentQ.corect,
      });
    }
  
    setIntrebari(parsed);
  }, []);  

  const handleSelect = (id: number, idx: number) => {
    setRaspunsuri((prev) => ({ ...prev, [id]: idx }));
  };

  const handleSubmit = () => {
    let scor = 0;
  
    intrebari.forEach((q) => {
      const raspunsUser = raspunsuri[q.id];
      if (raspunsUser !== undefined && raspunsUser === q.corect) {
        scor++;
      }
    });
  
    navigate("/quiz-rezultat", {
      state: {
        scor,
        total: intrebari.length,
      },
    });
  };  

  return (
    <div className="space-y-10 p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Quiz Grilă</h1>

      {intrebari.map((q) => (
        <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm">
          <p className="font-semibold mb-2">{q.intrebare}</p>
          <div className="space-y-2">
            {q.variante.map((opt, idx) => {
              const selectat = raspunsuri[q.id] === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(q.id, idx)}
                  className={`cursor-pointer px-4 py-2 rounded-md border ${
                    selectat
                      ? "bg-black text-white border-black"
                      : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="text-center mt-10">
        <Button onClick={handleSubmit}>Trimite răspunsurile</Button>
      </div>

      {trimis && (
        <div className="text-center mt-6 font-semibold text-green-600">
          Răspunsurile au fost trimise!
        </div>
      )}
    </div>
  );
}
