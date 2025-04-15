import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center">
       <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Bine ai venit!</h1>
        <p className="text-gray-600 mb-6">Alege o opțiune din bara de sus.</p>
        </div> 
    </div>
  );
}
