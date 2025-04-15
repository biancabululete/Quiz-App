import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profil from "./pages/Profil";
import Dashboard from "./pages/Dashboard";
import Setari from "./pages/Setari";
import IncarcaDocument from "./pages/IncarcaDocument";
import Quiz from "./pages/Quiz";
import QuizGrila from "./pages/QuizGrila";
import QuizRezultat from "./pages/QuizRezultat";

export default function App() {
  return (
    <Routes>
      {/* Pagini cu layout comun */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/incarca" element={<IncarcaDocument/>} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setari" element={<Setari />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz-grila" element={<QuizGrila />} />
        <Route path="/quiz-rezultat" element={<QuizRezultat />} />
      </Route>

      {/* Pagină complet separată */}
    </Routes>
  );
}
