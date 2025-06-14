import { RollerCoaster } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Setari() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState<any>(storedUser ? JSON.parse(storedUser) : null);

  const [nume, setNume] = useState(user?.nume || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
  setSuccess("");
  setError("");

  try {
    const res = await fetch(`http://localhost:8000/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nume,
        avatar_url: avatarUrl,
        current_password: currentPassword || null,
        new_password: newPassword || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "Eroare la salvare");
    }

    const updated = await res.json();
    const old = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...updated, token: old.token, rol: old.rol }));
    setUser({ ...updated, token: old.token, rol: old.rol });

    setSuccess("Datele au fost actualizate cu succes.");
  } catch (err: any) {
    setError(err.message);
  }
};


  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isGoogleUser = !!user?.google_id;

  return (
    <div className="min-h-screen bg-crem flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-maroInchis">Setări cont</h1>

        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block mb-1 font-medium">Email (nu poate fi modificat)</label>
          <input type="email" disabled className="w-full p-3 border rounded bg-gray-100" value={user?.email} />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Nume afișat</label>
          <input type="text" className="w-full p-3 border rounded" value={nume} onChange={(e) => setNume(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Avatar (URL)</label>
          <input type="text" className="w-full p-3 border rounded" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          {avatarUrl && <img src={avatarUrl} alt="avatar" className="h-20 w-20 mt-2 rounded-full border" />}
        </div>

        <div className="mb-6">
        <label className="block mb-1 font-medium">Schimbare parolă</label>
        {isGoogleUser ? (
          <p className="text-sm text-gray-500">
            Contul tău este conectat prin Google. Nu poți schimba parola din aplicație.
          </p>
        ) : (
          <>
            <input
              type="password"
              placeholder="Parola actuală"
              className="w-full p-3 border rounded mb-2"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Parolă nouă"
              className="w-full p-3 border rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </>
        )}
      </div>

        <div className="flex justify-between">
          <button
            onClick={handleLogout}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded hover:bg-gray-400"
          >
            Deconectare
          </button>

          <button
            onClick={handleSave}
            className="bg-maroInchis text-white px-6 py-3 rounded hover:bg-maroDeschis"
          >
            Salvează modificările
          </button>
        </div>
      </div>
    </div>
  );
}
