import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileQuestion, BarChart2, Settings, User, FilePlus2 } from "lucide-react";
import { ReactComponent as Logo } from "../components/logo/logoColorText.svg";

export default function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  type CardType = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

let cards: CardType[] = [];

  if (user?.rol === "ADMIN") {
  cards = [
    {
      icon: <BarChart2 size={52} />,
      title: "Panou Profesor",
      description: "Gestionează testele și vezi rezultatele.",
      onClick: () => navigate("/profesor-dashboard"),
    },
    {
      icon: <FilePlus2 size={52} />,
      title: "Creare Quiz",
      description: "Creează un test pentru studenții tăi.",
      onClick: () => navigate("/creeaza-quiz"),
    },
    {
      icon: <Settings size={52} />,
      title: "Setări",
      description: "Configurează preferințele contului.",
      onClick: () => navigate("/setari"),
    },
    {
      icon: <User size={52} />,
      title: "Profil",
      description: "Informațiile tale personale.",
      onClick: () => navigate("/profil"),
    },
  ];
} else {
  cards = [
    {
      icon: <FileQuestion size={52} />,
      title: "Quiz",
      description: "Generează întrebări dintr-un PDF și testează-ți cunoștințele.",
      onClick: () => navigate("/quiz"),
    },
    {
      icon: <BarChart2 size={52} />,
      title: "Dashboard",
      description: "Urmărește-ți progresul.",
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: <Settings size={52} />,
      title: "Setări",
      description: "Configurează preferințele contului.",
      onClick: () => navigate("/setari"),
    },
    {
      icon: <User size={52} />,
      title: "Profil",
      description: "Informațiile tale personale.",
      onClick: () => navigate("/profil"),
    },
  ];
}

  const [activeIndex, setActiveIndex] = useState(0);

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
  };

  const getCard = (offset: number) => {
    const index = (activeIndex + offset + cards.length) % cards.length;
    return cards[index];
  };

  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center max-w-7xl w-full">
        <div className="flex justify-center mb-8">
          <Logo className="h-44 w-auto" />
        </div>

        <h1 className="text-5xl font-bold mb-6 text-maroInchis">
          Bine ai venit în platforma ta de învățare!
        </h1>

        <p className="text-gray-700 mb-10 text-xl">
          Această aplicație facilitează învățarea și evaluarea automată pe baza documentelor încărcate,
          oferind teste grilă și examene cu răspuns deschis, corectate cu ajutorul AI.        </p>

        <div className="flex items-center justify-center gap-6 relative">
          <button
            onClick={prevSlide}
            className="text-maroInchis hover:text-maroDeschis text-4xl font-bold p-3"
          >
            &#8592;
          </button>

          <div className="flex gap-10 justify-center items-center w-full max-w-6xl">
            <HomeCard {...getCard(-1)} size="small" />
            <HomeCard {...getCard(0)} size="large" />
            <HomeCard {...getCard(1)} size="small" />
          </div>

          <button
            onClick={nextSlide}
            className="text-maroInchis hover:text-maroDeschis text-4xl font-bold p-3"
          >
            &#8594;
          </button>
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => navigate("/quiz")}
            className="bg-maroInchis hover:bg-maroDeschis text-white text-2xl font-bold py-6 px-20 rounded-full transition duration-300 shadow-lg"
          >
            Începe acum un test
          </button>
        </div>

        <blockquote className="mt-14 italic text-gray-500 text-xl">
          "Educația este cea mai puternică armă pe care o putem folosi pentru a schimba lumea." – Nelson Mandela
        </blockquote>
      </div>
    </div>
  );
}

function HomeCard({
  icon,
  title,
  description,
  onClick,
  size = "small",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  size?: "small" | "large";
}) {
  const isLarge = size === "large";

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border border-gray-200 hover:shadow-2xl
        transition-all duration-700 ease-in-out transform
        ${isLarge
          ? "scale-105 opacity-100 bg-white shadow-xl w-[360px] px-10 py-12 text-left"
          : "scale-90 opacity-60 bg-white/80 w-[280px] px-6 py-10 text-left"
        }`}
    >
      <div className="flex items-center gap-4 mb-5">
        <div className="text-maroInchis">{icon}</div>
        <h3 className={`font-bold ${isLarge ? "text-3xl" : "text-xl"} text-maroInchis`}>
          {title}
        </h3>
      </div>
      <p className={`text-albastruCard font-medium ${isLarge ? "text-lg" : "text-sm"}`}>
        {description}
      </p>
    </div>
  );
}

