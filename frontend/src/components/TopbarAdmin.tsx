import { useState, useEffect } from "react";
import { BarChart2, FilePlus2, Home, Settings, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ReactComponent as Logo } from "../components/logo/logoSimplu.svg";

export default function TopbarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("");

  useEffect(() => {
    switch (location.pathname) {
      case "/":
        setActive("Acasă");
        break;
      case "/profesor-dashboard":
        setActive("Panou");
        break;
      case "/creeaza-quiz":
        setActive("Creare");
        break;
      case "/setari":
        setActive("Setări");
        break;
      case "/profil":
        setActive("Profil");
        break;
      default:
        setActive("");
    }
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-maroInchis text-white flex items-center justify-between px-8 z-50 shadow-md">
      <div className="flex items-center">
        <Logo className="h-16 w-auto text-crem" />
      </div>

      <nav className="flex gap-6">
         <NavItem
          icon={<Home size={24} />}
          label="Acasă"
          active={active === "Acasă"}
          onClick={() => navigate("/")}
        />
        <NavItem
          icon={<BarChart2 size={24} />}
          label="Panou"
          active={active === "Panou"}
          onClick={() => navigate("/profesor-dashboard")}
        />
        <NavItem
          icon={<FilePlus2 size={24} />}
          label="Creare"
          active={active === "Creare"}
          onClick={() => navigate("/creeaza-quiz")}
        />
        <NavItem
          icon={<Settings size={24} />}
          label="Setări"
          active={active === "Setări"}
          onClick={() => navigate("/setari")}
        />
        <NavItem
          icon={<User size={24} />}
          label="Profil"
          active={active === "Profil"}
          onClick={() => navigate("/profil")}
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
}: NavItemProps) {
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
