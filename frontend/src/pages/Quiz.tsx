import { useNavigate } from "react-router-dom";
import Button from "../components/buttons/Button";

export default function Quiz() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-10">Începe un quiz!</h1>
        <Button
          variant="primary"
          onClick={() => navigate("/incarca")}>
          Încarcă document
        </Button>
      </div>
    </div>
  );
}
