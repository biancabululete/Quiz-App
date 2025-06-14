import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nume, setNume] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rol, setRol] = useState<"USER" | "ADMIN">("USER");
  const [repeatPassword, setRepeatPassword] = useState("");

  const handleRegister = async () => {
    setError("");
     if (password !== repeatPassword) {
      setError("Parolele nu coincid.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, nume, password, rol }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Eroare necunoscută la înregistrare");
      }

      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (credentialResponse: any) => {
    const decoded: any = jwtDecode(credentialResponse.credential);

    const newUser = {
      email: decoded.email,
      nume: decoded.name,
      avatar_url: decoded.picture,
      google_id: decoded.sub,
    };

    try {
      const res = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (res.status === 400) {
        const data = await res.json();
        throw new Error(data.detail);
      }

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch (err: any) {
      console.error("Eroare Google:", err.message);
      setError(err.message || "Eroare Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-crem p-4">
      <div className="bg-white/80 p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-maroInchis mb-6">Creează un cont</h1>

        <input
          type="text"
          placeholder="Nume complet"
          className="w-full mb-4 p-3 border rounded"
          value={nume}
          onChange={(e) => setNume(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Parolă"
          className="w-full mb-6 p-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Repetă parola"
          className="w-full mb-6 p-3 border rounded"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
        />

        <div className="mb-6">
          <label className="block mb-2 font-medium">Rol:</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rol"
                value="USER"
                checked={rol === "USER"}
                onChange={() => setRol("USER")}
              />
              Elev / Student
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rol"
                value="ADMIN"
                checked={rol === "ADMIN"}
                onChange={() => setRol("ADMIN")}
              />
              Profesor
            </label>
          </div>
        </div>

        {error && <p className="text-red-600 text-center text-sm mb-4">{error}</p>}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-maroInchis text-white py-3 rounded hover:bg-maroDeschis"
        >
          {loading ? "Se creează contul..." : "Înregistrează-te"}
        </button>

        <div className="text-center my-4 text-gray-500 text-sm">sau</div>

        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleRegister}
              onError={() => alert("Eroare Google")}
            />
          </div>
        </GoogleOAuthProvider>

        <p className="text-center text-sm text-gray-600 mt-6">
          Ai deja un cont?{" "}
          <span onClick={() => navigate("/login")} className="text-maroInchis font-semibold cursor-pointer hover:underline">
            Autentifică-te!
          </span>
        </p>
      </div>
    </div>
  );
}
