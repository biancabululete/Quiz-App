import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/buttons/Button";

export default function QuizRezultat() {
  const navigate = useNavigate();
  const location = useLocation();

  const scor = location.state?.scor ?? 0;
  const total = location.state?.total ?? 0;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <h1 className="text-3xl font-bold text-green-600">Felicitări!</h1>
      <p className="text-gray-700">Ai trimis cu succes răspunsurile la quiz.</p>

      {/* Scorul */}
      <p className="text-lg font-medium">
        Scor: <span className="font-bold">{scor}</span> / {total}
      </p>

      <div className="flex gap-4 mt-6">
        <Button onClick={() => navigate("/")}>Înapoi la Acasă</Button>
        <Button onClick={() => navigate("/quiz-grila")}>Refă testul</Button>
      </div>
    </div>
  );
}
