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
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
//import { Navigate} from "react-router-dom";
import QuizExamen from "./pages/QuizExamen";
import RezultatExamen from "./pages/RezultatExamen";
import DemoPage from "./pages/Demo";
import ProfesorDashboard from "./pages/ProfesorDashboard";
import CreeazaQuiz from "./pages/CreeazaQuiz";
import { UserProvider } from "./components/UserContext";

export default function App() {
  return (
    <UserProvider>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home/>} />
        <Route path="/incarca" element={<IncarcaDocument/>} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setari" element={<Setari />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz-grila" element={<QuizGrila />} />
        <Route path="/quiz-rezultat" element={<QuizRezultat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/quiz-examen" element={<QuizExamen />} />
        <Route path="/rezultat-examen" element={<RezultatExamen />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/profesor-dashboard" element={<ProfesorDashboard />} />
        <Route path="/creeaza-quiz" element={<CreeazaQuiz />} />
      </Route>
    </Routes>
    </UserProvider>
  );
}
