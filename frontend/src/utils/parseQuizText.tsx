type Question = {
  id: number;
  intrebare: string;
  variante: string[];
  correct_answer: string; // textul corectei, nu doar litera
};

export function parseQuizText(text: string): Question[] {
  const questions: Question[] = [];

  // Blocuri pentru fiecare întrebare
  const blocks = text.split(/\n(?=\d+\.)/).map(b => b.trim()).filter(Boolean);

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    const answerLine = lines.find(line =>
      line.toLowerCase().startsWith("răspuns corect")
    );
    if (!answerLine) continue;
    let correctLitera = answerLine.split(":")[1]?.trim().toLowerCase();

    // Extrage variantele + mapping literă → text variantă
    const variante: string[] = [];
    const litereVariante: string[] = [];
    lines.forEach((line) => {
      const m = line.match(/^([a-d])\)\s*(.*)/i);
      if (m) {
        litereVariante.push(m[1].toLowerCase());
        variante.push(m[2].trim());
      }
    });

    // Găsește varianta corectă după literă
    let correctAnswer = "";
    for (let i = 0; i < litereVariante.length; i++) {
      if (litereVariante[i] === correctLitera) {
        correctAnswer = variante[i];
        break;
      }
    }
    // Extrage doar întrebarea
    const questionText = lines
      .filter(line => !/^[a-d]\)/i.test(line) && !line.toLowerCase().startsWith("răspuns corect"))
      .join(" ")
      .replace(/^\d+\.\s*/, '')
      .trim();

    if (questionText && variante.length && correctAnswer) {
      questions.push({
        id: idx + 1,
        intrebare: questionText,
        variante,
        correct_answer: correctAnswer,
      });
    }
  }
  return questions;
}

