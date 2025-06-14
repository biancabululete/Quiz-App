import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/buttons/Button";
import { Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Quiz = {
  id: number;
  subject: string;
  num_questions: number;
  created_at: string;
  access_code: string;
  is_exam: boolean;
};

type Result = {
  student_id: number;
  student_email: string;
  student_name?: string | null;
  score: number | null;
  completed_at: string | null;
};

type Question = {
  id: number;
  text: string;
};

type User = {
  id: number;
  email: string;
  nume: string;
  rol: string;
};

type Stats = {
  average: number | null;
  min: number | null;
  max: number | null;
  distribution: { [key: string]: number };
  top5: { student_email: string; student_name?: string; score: number }[];
  count: number;
};

type ActiveDetail = "results" | "questions" | "invite" | null;

export default function ProfesorDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<ActiveDetail>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.rol !== "ADMIN") {
      navigate("/");
      return;
    }

    fetch("http://localhost:8000/api/admin/quizzes", {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setQuizzes)
      .catch((err) => console.error("Eroare la preluarea quiz-urilor:", err));
  }, [navigate]);

  const handleSelectQuiz = async (quizId: number) => {
    if (selectedQuizId === quizId && activeDetail === "results") {
      setActiveDetail(null);
      setResults([]);
      setStats(null);
      return;
    }
    setSelectedQuizId(quizId);
    setActiveDetail("results");
    setResults([]);
    setStats(null);
    setQuestions([]);
    setShowInvite(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      // Fetch rezultate
      const resResults = await fetch(
        `http://localhost:8000/api/admin/quizzes/${quizId}/results`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const resultsData = await resResults.json();
      setResults(resultsData);

      // Fetch statistici
      const resStats = await fetch(
        `http://localhost:8000/api/admin/quizzes/${quizId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const statsData = await resStats.json();
      setStats(statsData);
    } catch (error) {
      setResults([]);
      setStats(null);
      console.error("Eroare la fetch rezultate/statistici:", error);
    }
  };

  const handleSeeQuestions = async (quizId: number) => {
    if (selectedQuizId === quizId && activeDetail === "questions") {
      setActiveDetail(null);
      setQuestions([]);
      return;
    }
    setSelectedQuizId(quizId);
    setActiveDetail("questions");
    setQuestions([]);
    setResults([]);
    setShowInvite(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      const res = await fetch(`http://localhost:8000/api/questions/by-quiz/${quizId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error("Eroare la preluarea întrebărilor:", error);
    }
  };

  const handleLoadStudents = async (quizId: number) => {
    if (selectedQuizId === quizId && activeDetail === "invite") {
      setActiveDetail(null);
      setShowInvite(false);
      setStudents([]);
      return;
    }
    setSelectedQuizId(quizId);
    setActiveDetail("invite");
    setShowInvite(true);
    setQuestions([]);
    setResults([]);
    setStats(null);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      const usersRes = await fetch("http://localhost:8000/api/users", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const allUsers: User[] = await usersRes.json();
      setStudents(allUsers.filter((u) => u.rol === "USER"));
    } catch (error) {
      console.error("Eroare la preluarea utilizatorilor:", error);
    }
  };

  const handleInvite = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      const res = await fetch(`http://localhost:8000/api/admin/quizzes/${selectedQuizId}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_ids: selectedStudents }),
      });
      const data = await res.json();
      alert(data.message || "Studenți invitați cu succes");
    } catch (error) {
      console.error("Eroare la trimiterea invitațiilor:", error);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    const confirmDelete = window.confirm("Ești sigur că vrei să ștergi acest quiz?");
    if (!confirmDelete) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      const res = await fetch(`http://localhost:8000/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
        // curăță starea dacă ștergi quiz-ul activ
        if (selectedQuizId === quizId) {
          setSelectedQuizId(null);
          setActiveDetail(null);
          setResults([]);
          setQuestions([]);
          setStats(null);
        }
      } else {
        alert("Eroare la ștergerea quiz-ului.");
      }
    } catch (err) {
      console.error("Eroare la ștergere:", err);
    }
  };

  const handleExportCSV = async (quizId: number) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  try {
    const res = await fetch(
      `http://localhost:8000/api/admin/quizzes/${quizId}/export`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    if (!res.ok) {
      alert("Eroare la export!");
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_${quizId}_results.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Eroare la descărcare.");
    console.error(err);
  }
};


  return (
    <div className="p-10 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-maroInchis text-center">Dashboard Profesor</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quiz-uri create</h2>
        <ul className="space-y-2">
          {quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className="flex flex-col border rounded-lg p-4 hover:bg-gray-50 transition mb-4"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                <div className="mb-2 md:mb-0">
                  <p className="font-medium text-maroInchis">
                    Cod acces: <span className="font-mono">{quiz.access_code}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Întrebări: {quiz.num_questions} · Creat:{" "}
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                  <span className="mt-2 inline-block text-sm font-medium px-2 py-1 rounded-full bg-gray-100 border text-gray-800">
                    {quiz.is_exam ? "Mod Examen" : "Quiz Grilă"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleSelectQuiz(quiz.id)}>Vezi rezultate</Button>
                  <Button onClick={() => handleSeeQuestions(quiz.id)}>Vezi întrebări</Button>
                  <Button onClick={() => handleLoadStudents(quiz.id)}>Invită studenți</Button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="flex items-center gap-2 border border-red-600 text-red-600 px-3 py-1 rounded-xl hover:bg-red-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {selectedQuizId === quiz.id && (
                <div className="w-full mt-6 space-y-4">
                  {activeDetail === "invite" && showInvite && students.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                      <h2 className="text-lg font-semibold mb-2">
                        Invita studenți la quiz #{quiz.id}
                      </h2>
                      <ul className="space-y-1 max-h-64 overflow-y-auto">
                        {students.map((student) => (
                          <li key={student.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents((prev) => [...prev, student.id]);
                                } else {
                                  setSelectedStudents((prev) =>
                                    prev.filter((id) => id !== student.id)
                                  );
                                }
                              }}
                            />
                            <span>
                              {student.nume} ({student.email})
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button onClick={handleInvite} className="mt-4">
                        Trimite invitații
                      </Button>
                    </div>
                  )}

                  {activeDetail === "questions" && questions.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                      <h2 className="text-lg font-semibold mb-2">
                        Întrebări din quiz #{quiz.id}
                      </h2>
                      <ul className="list pl-5 space-y-2">
                        {questions.map((q, idx) => (
                          <li key={idx} className="text-gray-700 whitespace-pre-line">
                            {q.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeDetail === "results" && results.length > 0 && (
                    <>
                      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-2">
                          Rezultate pentru quiz #{quiz.id}
                        </h2>
                        <table className="w-full text-left table-auto">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2">Student</th>
                              <th>Scor</th>
                              <th>Finalizat la</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map((r) => (
                              <tr key={r.student_id} className="border-b">
                                {(r.student_name && r.student_name.trim())
                                  ? `${r.student_name} (${r.student_email})`
                                  : r.student_email}
                                <td>
                                  {r.score != null ? `${r.score}%` : "—"}
                                </td>
                                <td>
                                  {r.completed_at
                                    ? new Date(r.completed_at).toLocaleString()
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {stats && (
                          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h3 className="font-bold text-lg mb-2">
                                Statistici generale
                              </h3>
                              <ul className="space-y-1">
                                <li>
                                  Număr rezultate: <b>{stats.count}</b>
                                </li>
                                <li>
                                  Scor mediu: <b>{stats.average ?? "-"}</b>
                                </li>
                                <li>
                                  Scor minim: <b>{stats.min ?? "-"}</b>
                                </li>
                                <li>
                                  Scor maxim: <b>{stats.max ?? "-"}</b>
                                </li>
                              </ul>
                              <h3 className="font-bold text-lg mt-6 mb-2">
                                Top 5 scoruri
                              </h3>
                             <ol className="list-decimal ml-6">
                                {stats.top5.map(
                                  (
                                    res: { student_email: string; student_name?: string | null; score: number },
                                    idx: number
                                  ) => (
                                    <li key={idx}>
                                      {(res.student_name && res.student_name.trim())
                                        ? `${res.student_name} (${res.student_email})`
                                        : res.student_email}
                                      : <b>{res.score}%</b>
                                    </li>
                                  )
                                )}
                              </ol>

                            </div>
                            <div>
                              <BarChart
                                width={320}
                                height={220}
                                data={[
                                  { name: "0-50", value: stats.distribution["0-50"] ?? 0 },
                                  { name: "51-75", value: stats.distribution["51-75"] ?? 0 },
                                  { name: "76-100", value: stats.distribution["76-100"] ?? 0 },
                                ]}
                              >
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#0097B2" />
                              </BarChart>
                              <div className="flex justify-center mt-6">
                                <Button onClick={() => handleExportCSV(quiz.id)}>
                                  Exportă rezultatele (.csv)
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
