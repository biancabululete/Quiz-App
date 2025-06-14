import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../components/UserContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useUser(); // Folosește contextul!
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Eroare autentificare");
      }

      const data = await res.json();

      // verificăm că token-ul există
      if (!data.token) {
        throw new Error("Tokenul lipsește din răspunsul serverului");
      }

      const userData = {
        id: data.id,
        email: data.email,
        nume: data.nume,
        rol: data.rol,
        avatar_url: data.avatar_url,
        abonament: data.abonament,
        token: data.token,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData); // <-- actualizează contextul global!
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google Login handler
  const handleGoogleLogin = async (credentialResponse: any) => {
    const decoded: any = jwtDecode(credentialResponse.credential);

    // NU lua rolul din user context. Pune direct "USER".
    const newUser = {
      email: decoded.email,
      nume: decoded.name,
      avatar_url: decoded.picture,
      google_id: decoded.sub,
      rol: "USER",   
      abonament: "IMPLICIT",  
    };

    console.log("TRIMIT NEW USER:", newUser);

    try {
      const res = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      // Dacă răspunsul nu e ok, tratează elegant
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Eroare la crearea contului cu Google");
      }

      const data = await res.json();

      if (!data.token) {
        throw new Error("Tokenul lipsește din răspunsul de la Google login");
      }

      const userData = {
        id: data.id,
        email: data.email,
        nume: data.nume,
        rol: data.rol,
        avatar_url: data.avatar_url,
        abonament: data.abonament,
        token: data.token,
        google_id: data.google_id
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData); // <-- actualizează contextul global!
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Eroare la login Google");
      console.error("Eroare login Google:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-crem p-4">
      <div className="bg-white/80 p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-maroInchis mb-6">Autentificare</h1>

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

        {error && <p className="text-red-600 text-center text-sm mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-maroInchis text-white py-3 rounded hover:bg-maroDeschis"
        >
          {loading ? "Se autentifică..." : "Autentifică-te"}
        </button>

        <div className="text-center my-4 text-gray-500 text-sm">sau</div>

        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError("Eroare autentificare Google")}
            />
          </div>
        </GoogleOAuthProvider>

        <p className="text-center text-sm text-gray-600 mt-6">
          Nu ai cont?{" "}
          <span onClick={() => navigate("/signup")} className="text-maroInchis font-semibold cursor-pointer hover:underline">
            Creează unul!
          </span>
        </p>
      </div>
    </div>
  );
}
