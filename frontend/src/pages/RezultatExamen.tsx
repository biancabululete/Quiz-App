// src/pages/RezultatExamen.tsx
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/buttons/Button";

export default function RezultatExamen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { questions, answers, feedback, scor } = location.state || {};

  if (!questions || !answers || !feedback) {
    return <div className="text-center mt-20 text-red-600">Date lipsă pentru afișare rezultat.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Rezultate Examen</h2>

      <p className="mb-6 text-lg font-semibold">Scor final: {scor} / 100</p>

      <ul className="space-y-4">
        {questions.map((q: any, idx: number) => (
          <li key={q.id} className="border rounded-xl p-4">
            <p className="font-semibold mb-2">{q.intrebare}</p>
            <p className="mb-1"><strong>Răspuns:</strong> {answers[q.id]}</p>
            <p className="text-green-700"><strong>Feedback:</strong> {feedback[idx]}</p>
          </li>
        ))}
      </ul>
      <div className="text-center mt-8">
        <Button onClick={() => navigate("/dashboard")}>Înapoi la Dashboard</Button>
      </div>
    </div>
  );
}
