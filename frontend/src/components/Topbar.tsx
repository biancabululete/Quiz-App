import { useState, useEffect } from "react";
import { Home, User, BarChart2, Settings, FileQuestion } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";


export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("");

  useEffect(() => {
    switch (location.pathname) {
      case "/":
        setActive("Acasă");
        break;
      case "/profil":
        setActive("Profil");
        break;
      case "/dashboard":
        setActive("Dashboard");
        break;
      case "/setari":
        setActive("Setări");
        break;
      case "/quiz":
        setActive("Quiz");
        break;

      default:
        setActive("");
    }
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-black text-white flex items-center justify-between px-8 z-50 shadow-md">
      <div className="text-2xl font-bold text-crem">LOGO</div>

      <nav className="flex gap-6">
        <NavItem
          icon={<Home size={24} />}
          label="Acasă"
          active={active === "Acasă"}
          onClick={() => navigate("/")}
        />
         <NavItem
          icon={<FileQuestion size={24} />}
          label="Quiz"
          active={active === "Quiz"}
          onClick={() => navigate("/quiz")}
        />
        <NavItem
          icon={<User size={24} />}
          label="Profil"
          active={active === "Profil"}
          onClick={() => navigate("/profil")}
        />
        <NavItem
          icon={<BarChart2 size={24} />}
          label="Dashboard"
          active={active === "Dashboard"}
          onClick={() => navigate("/dashboard")}
        />
        <NavItem
          icon={<Settings size={24} />}
          label="Setări"
          active={active === "Setări"}
          onClick={() => navigate("/setari")}
        />
      </nav>
    </header>
  );
}

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-3 py-3 rounded-md cursor-pointer transition-all duration-500 ${
        active ? "bg-crem text-black" : "hover:bg-gray-700"
      }`}
    >
      <div
        className={`transition-transform duration-500 ${
          active ? "scale-150" : "scale-100"
        }`}
      >
        {icon}
      </div>

      {/* Eticheta – dispare dacă e activ */}
      <span
        className={`text-xs mt-1 transition-all duration-500 ${
          active ? "opacity-0 h-0" : "opacity-100 h-auto"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

