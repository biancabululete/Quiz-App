import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import Button from "../components/buttons/Button";
import { useLocation } from "react-router-dom";

export default function Profil() {
  const [user, setUser] = useState<{
    nume: string;
    email: string;
    telefon?: string;
    avatar_url?: string;
    abonament: "IMPLICIT" | "PRO";
  } | null>(null);

  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    setUser(parsed);

    // 🔄 dacă ne întoarcem de la Stripe și avem un checkout de succes
    const query = new URLSearchParams(location.search);
    const isSuccess = query.get("checkout") === "success";

    if (isSuccess && parsed?.id) {
      fetch(`http://localhost:8000/api/users/${parsed.id}`)
        .then((res) => res.json())
        .then((data) => {
          const old = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...data, token: old.token, rol: old.rol }));
          setUser({ ...data, token: old.token, rol: old.rol });
        })
        .catch((err) => console.error("Eroare reload user:", err));
    }
  }, [location.search]);


  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

const handleUpgrade = async () => {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  if (!user?.id) return alert("Eroare: user inexistent");

  try {
    const res = await fetch("http://localhost:8000/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Redirecționează spre Stripe
    } else {
      alert("Eroare la inițializarea plății.");
    }
  } catch (err) {
    console.error("Eroare upgrade:", err);
    alert("Eroare rețea.");
  }
};

const handleDowngrade = async () => {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  if (!user?.id) return alert("Eroare: user inexistent");

  try {
    const res = await fetch("http://localhost:8000/api/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (res.ok) {
      const updatedUser = await fetch(`http://localhost:8000/api/users/${user.id}`).then(r => r.json());
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert("Abonamentul a fost anulat cu succes.");
    } else {
      const data = await res.json();
      alert(data.detail || "Eroare la anularea abonamentului.");
    }
  } catch (err) {
    console.error("Eroare dezabonare:", err);
    alert("Eroare rețea.");
  }
};


  if (!user) {
    if (!user) {
  return (
    <div className="flex flex-col justify-center items-center h-screen text-center space-y-6">
      <p className="text-red-600 text-xl">Nu ești autentificat(ă).</p>
      <button
        onClick={() => (window.location.href = "/login")}
        className="bg-albastruCard text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-[#4f7c95] transition"
      >
        Conectează-te
      </button>
    </div>
  );
}

  }

  const avatar =
    user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email)}`;

  return (
    <div className="flex justify-center py-10">
      <div className="w-full max-w-3xl bg-white/80 rounded-3xl shadow-md p-10">
        <h1 className="text-3xl font-bold mb-8 text-maroInchis text-center">Profilul tău</h1>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <img
            src={avatar}
            alt="Avatar"
            className="w-40 h-40 rounded-full border-4 border-maroInchis shadow-md object-cover"
          />

          <div className="flex-1 text-left w-full">
            <ProfileRow label="Nume complet" value={user.nume} />
            <ProfileRow label="Email" value={user.email} />
            {user.telefon && <ProfileRow label="Telefon" value={user.telefon} />}

            <div className="mt-6">
              <p className="text-sm text-gray-500">Abonament</p>
              <p className="text-lg font-medium text-gray-800 mb-4">
                {user.abonament === "PRO" ? "Pro" : "Implicit"}
              </p>
              <div className="flex gap-4 mt-10">
                {user.abonament === "PRO" ? (
                  <button onClick={handleDowngrade} className="text-white border border-[#13383e] text-base px-5 py-3 rounded-xl transition font-semibold bg-albastruCard hover:bg-[#4f7c95]">Renunță la abonament Pro</button>
                ) : (
                  <button onClick={handleUpgrade} className="text-white border border-[#13383e] text-base px-5 py-3 rounded-xl transition font-semibold bg-albastruCard  hover:bg-[#4f7c95]">Upgrade la Pro</button>
                )}
              </div>
            </div>

            <div className="mt-10">
              <Button variant="secondary" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut size={18} />
                Deconectează-te
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-medium text-gray-800">{value}</p>
    </div>
  );
}
