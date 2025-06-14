import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../components/buttons/Button";
import { FileText, Loader2 } from "lucide-react";

const demoDocs = [
  {
    titlu: "Algoritmi de sortare",
    url: "/demo/algoritmi_sortare.pdf",
  },
  {
    titlu: "Cerere și ofertă",
    url: "/demo/cerere_oferta.pdf",
  },
  {
    titlu: "Fotosinteza",
    url: "/demo/fotosinteza.pdf",
  },
  {
    titlu: "Legea gravitației universale",
    url: "/demo/legea_gravitatiei.pdf",
  },
  {
    titlu: "Revoluția Franceză",
    url: "/demo/revolutia_franceza.pdf",
  },
  {
    titlu: "Schimbările climatice",
    url: "/demo/schimbarile_climatice.pdf",
  },
];

export default function DemoPage() {
  const navigate = useNavigate();
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

const handleLoad = async (docUrl: string) => {
  try {
    setLoadingDoc(docUrl);

    const res = await fetch(docUrl);
    const blob = await res.blob();
    const file = new File([blob], "demo.pdf", { type: blob.type });

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("numarIntrebari", "10");

    const upload = await fetch("http://localhost:8000/api/quizz/generate", {
      method: "POST",
      body: formData,
    });

    const data = await upload.json();

    localStorage.setItem("quiz_generat", data.quiz); // ✅ text brut, compatibil
    navigate("/quiz-grila");
  } catch (err) {
    alert("Eroare la încărcarea documentului demo.");
    setLoadingDoc(null);
  }
};


  return (
    <div className="min-h-screen py-20 px-4">
      <h1 className="text-3xl font-bold text-center text-maroInchis mb-10">Documente Demo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {demoDocs.map((doc, idx) => (
          <div
            key={idx}
            className="border p-6 rounded-2xl shadow bg-white/90 flex flex-col justify-between"
          >
            <h2 className="text-xl font-semibold mb-3">{doc.titlu}</h2>

            {/* Preview doar pe desktop */}
            <div className="hidden md:block mb-4">
              <iframe
                src={doc.url}
                width="100%"
                height="250"
                className="rounded border"
                title={`Preview ${doc.titlu}`}
              ></iframe>
            </div>

            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-700 font-medium hover:underline mb-4"
            >
              <FileText size={18} /> Vezi document complet
            </a>

            {loadingDoc === doc.url ? (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-gray-500 rounded-lg cursor-not-allowed"
              >
                <Loader2 className="animate-spin" size={18} />
                Se generează...
              </button>
            ) : (
              <Button onClick={() => handleLoad(doc.url)}>Generează test</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
