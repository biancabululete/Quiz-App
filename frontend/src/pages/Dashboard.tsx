import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import Button from "../components/buttons/Button";
import { ScrollArea } from "../components/ScrollArea";

// Tipuri de date
type EvolutionItem = { date: string; score: number };
type ScoreDistributionItem = { range: string; count: number };
type QuizWithScore = { id: number; user_id: number; num_questions: number; score?: number; subject: string };
type HeatmapItem = { date: string; count: number };
type SubjectData = { name: string; value: number };

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0097B2", "#AA336A", "#9ACD32", "#D2691E"];

const Dashboard = () => {
  const [evolution, setEvolution] = useState<EvolutionItem[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizWithScore[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return;

    fetch(`http://localhost:8000/api/quizz/scores/by-user/${user.id}`)
      .then((res) => res.json())
      .then((scoruri: any[]) => {
        const evo = scoruri.map((s) => ({
          date: new Date(s.completed_at).toLocaleDateString("ro-RO"),
          score: s.score,
        }));
        setEvolution(evo);

        const distrib = [
          { range: "0–50", count: scoruri.filter((s) => s.score <= 50).length },
          { range: "51–75", count: scoruri.filter((s) => s.score > 50 && s.score <= 75).length },
          { range: "76–100", count: scoruri.filter((s) => s.score > 75).length },
        ];
        setScoreDistribution(distrib);

        const heat = scoruri.map((s) => ({
          date: s.completed_at.split("T")[0],
          count: 1,
        }));
        setHeatmapData(heat);
      });

    fetch(`http://localhost:8000/api/quizz/by-user/${user.id}`)
      .then((res) => res.json())
      .then((data: QuizWithScore[]) => {
        setQuizzes(data);

        const countMap: Record<string, number> = {};
        data.forEach((q) => {
          countMap[q.subject] = (countMap[q.subject] || 0) + 1;
        });

        const formatted: SubjectData[] = Object.entries(countMap).map(([name, value]) => ({
          name,
          value,
        }));
        setSubjectData(formatted);
      });
  }, []);

  return (
    <ScrollArea className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-maroInchis">Dashboard</h1>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Obiectiv săptămânal</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-albastruCard h-4 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((evolution.length / 5) * 100, 100)}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {evolution.length} din 5 teste finalizate
        </p>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Evoluția scorurilor în timp</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolution}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#0097B2" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Distribuția scorurilor</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreDistribution}>
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0097B2" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Repartizarea testelor pe materii</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={subjectData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {subjectData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Activitate recentă</h2>
        <div className="flex justify-center">
          <div style={{ width: 800, overflow: "hidden" }}>
            <CalendarHeatmap
              startDate={new Date(new Date().setMonth(new Date().getMonth() - 5))}
              endDate={new Date()}
              values={heatmapData}
              classForValue={(value) => {
                if (!value) return "color-empty";
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
              showWeekdayLabels={true}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ultimele teste susținute</h2>
        <ul className="space-y-2">
          {quizzes.slice(-5).reverse().map((quiz, idx) => (
            <li key={idx} className="flex justify-between text-sm text-gray-700">
              Test #{quiz.id}
              <span
                className={`font-semibold ${
                  quiz.score != null && quiz.score >= 75
                    ? "text-green-600"
                    : quiz.score != null && quiz.score >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {quiz.score != null ? `${quiz.score}%` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </ScrollArea>
  );
};

export default Dashboard;
