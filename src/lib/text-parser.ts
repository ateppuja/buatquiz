export interface ParsedTextOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface ParsedTextQuestion {
  id?: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
  questionText: string;
  points: number;
  explanation?: string;
  options: ParsedTextOption[];
  rawNumber?: number;
  isValid: boolean;
  errors: string[];
}

export interface TextParseResult {
  success: boolean;
  questions: ParsedTextQuestion[];
  totalParsed: number;
  validCount: number;
  errorCount: number;
  globalErrors: string[];
}

/**
 * Smart plain-text question parser supporting various common formats:
 * - Numbered questions (1., 1), Soal 1, etc.)
 * - Options A., B., C., D., E. or a), b), c), d) or A: B:
 * - Answer keys (Kunci: C, Jawaban: B, Kunci Jawaban: A, Ans: C, Key: D, or asterisk *B.)
 * - True/False auto-detection (Benar/Salah)
 * - Essay auto-detection (questions without options)
 * - Custom point assignment (Bobot: 10, Poin: 20)
 * - Explanation support (Pembahasan: ...)
 */
export function parseQuestionsFromRawText(rawText: string): TextParseResult {
  const result: TextParseResult = {
    success: false,
    questions: [],
    totalParsed: 0,
    validCount: 0,
    errorCount: 0,
    globalErrors: [],
  };

  if (!rawText || rawText.trim().length === 0) {
    result.globalErrors.push("Teks soal masih kosong. Silakan ketik atau tempelkan teks soal.");
    return result;
  }

  // 1. Check if structured tags [SOAL]...[/SOAL] exist
  if (/\[SOAL\]/i.test(rawText)) {
    return parseTaggedFormat(rawText);
  }

  // 2. Split text into question blocks based on question numbering
  // Matches "1.", "1)", "Soal 1.", "No. 1", "[1]", "Pertanyaan 1:" at line starts or double line breaks
  const blocks = splitIntoQuestionBlocks(rawText);

  if (blocks.length === 0) {
    result.globalErrors.push("Tidak dapat mengenali butir soal. Gunakan nomor soal seperti '1.', '2.', dsb.");
    return result;
  }

  blocks.forEach((block, index) => {
    const q = parseSingleBlock(block, index + 1);
    if (q.isValid) {
      result.validCount++;
    } else {
      result.errorCount++;
    }
    result.questions.push(q);
  });

  result.totalParsed = result.questions.length;
  result.success = result.validCount > 0;
  return result;
}

function splitIntoQuestionBlocks(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  // Regex to detect starting of a question number e.g. "1.", "1)", "Soal 1:", "No 1.", "#1", "1 -"
  const questionStartPattern = /(?:^|\n\s*\n|\n)(?=(?:(?:Soal|No\.?|Nomor|Pertanyaan)\s*)?\d+[\.\)\:\-]\s+)/gi;

  const rawBlocks = normalized.split(questionStartPattern).map((b) => b.trim()).filter((b) => b.length > 0);

  // If regex didn't find multiple blocks, try splitting by double newline
  if (rawBlocks.length <= 1) {
    const doubleNewlineBlocks = normalized.split(/\n\s*\n+/).map((b) => b.trim()).filter((b) => b.length > 0);
    if (doubleNewlineBlocks.length > 1) {
      return doubleNewlineBlocks;
    }
  }

  return rawBlocks.length > 0 ? rawBlocks : [normalized];
}

function parseSingleBlock(block: string, itemNumber: number): ParsedTextQuestion {
  const lines = block.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const errors: string[] = [];

  let questionText = "";
  let explicitType: string | null = null;
  let rawKey = "";
  let explanation = "";
  let points = 5;

  const rawOptions: { key: string; text: string; isMarkedCorrect?: boolean }[] = [];

  // Remove leading question numbering from the first line e.g. "1. ", "1) ", "Soal 1: "
  if (lines.length > 0) {
    lines[0] = lines[0].replace(/^(?:(?:Soal|No\.?|Nomor|Pertanyaan)\s*)?\d+[\.\)\:\-]\s*/i, "");
  }

  let currentSection: "QUESTION" | "OPTION" | "EXPLANATION" | "KEY" | "OTHER" = "QUESTION";
  let lastOptionKey = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Points / Bobot: "Bobot: 10" or "Poin: 20" or "[10 poin]"
    const pointMatch = line.match(/^(?:Bobot|Poin|Score|Points?)\s*[:=]\s*(\d+(?:\.\d+)?)/i);
    if (pointMatch) {
      points = parseFloat(pointMatch[1]) || 5;
      continue;
    }

    // Check for Type: "Tipe: PG" or "Tipe: Esai"
    const typeMatch = line.match(/^(?:Tipe|Type|Jenis)\s*[:=]\s*(.+)/i);
    if (typeMatch) {
      explicitType = typeMatch[1].trim().toUpperCase();
      continue;
    }

    // Check for Answer Key: "Kunci: C" or "Kunci Jawaban: B" or "Jawaban: A" or "Ans: D" or "Key: C"
    const keyMatch = line.match(/^(?:Kunci(?:\s*Jawaban)?|Jawaban(?:nya)?|Ans(?:wer)?|Key)\s*[:=]\s*([A-Ea-e]|Benar|Salah|True|False)/i);
    if (keyMatch) {
      rawKey = keyMatch[1].trim().toUpperCase();
      currentSection = "KEY";
      continue;
    }

    // Check for Explanation: "Pembahasan: ..." or "Penjelasan: ..."
    const expMatch = line.match(/^(?:Pembahasan|Penjelasan|Explanation)\s*[:=]\s*(.*)/i);
    if (expMatch) {
      explanation = expMatch[1].trim();
      currentSection = "EXPLANATION";
      continue;
    }

    // Check for Option pattern:
    // Matches "A. text", "A) text", "A: text", "*A. text" (marked correct), "[x] A. text", "(A) text", "A text"
    const optionMatch = line.match(/^([\*\[xX\]\s]*)\(?([A-Ea-e])[\.\)\:\-]\s*(.*)/i);
    if (optionMatch) {
      const isAsteriskMarked = optionMatch[1].includes("*") || optionMatch[1].toLowerCase().includes("x");
      const optKey = optionMatch[2].toUpperCase();
      const optText = optionMatch[3].trim();

      rawOptions.push({
        key: optKey,
        text: optText,
        isMarkedCorrect: isAsteriskMarked,
      });

      lastOptionKey = optKey;
      currentSection = "OPTION";
      continue;
    }

    // Append to multiline content
    if (currentSection === "EXPLANATION") {
      explanation += (explanation ? "\n" : "") + line;
    } else if (currentSection === "OPTION" && rawOptions.length > 0) {
      // Continuation of last option
      const lastOpt = rawOptions[rawOptions.length - 1];
      lastOpt.text += " " + line;
    } else {
      // Default: Question text
      questionText += (questionText ? "\n" : "") + line;
    }
  }

  // Auto-detect question type
  let type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" = "MULTIPLE_CHOICE";

  if (explicitType) {
    if (explicitType.includes("ESAI") || explicitType.includes("ESSAY") || explicitType.includes("URAIAN")) {
      type = "ESSAY";
    } else if (explicitType.includes("BS") || explicitType.includes("BENAR") || explicitType.includes("TF")) {
      type = "TRUE_FALSE";
    } else {
      type = "MULTIPLE_CHOICE";
    }
  } else if (rawOptions.length === 0) {
    // No options provided -> Essay
    type = "ESSAY";
    if (points === 5) points = 15; // default reasonable essay point
  } else if (
    rawOptions.length === 2 &&
    rawOptions.some((o) => /benar|true/i.test(o.text)) &&
    rawOptions.some((o) => /salah|false/i.test(o.text))
  ) {
    type = "TRUE_FALSE";
  } else {
    type = "MULTIPLE_CHOICE";
  }

  // Key resolution
  let finalKey = rawKey;
  const markedOpt = rawOptions.find((o) => o.isMarkedCorrect);
  if (!finalKey && markedOpt) {
    finalKey = markedOpt.key;
  }

  // Build options array
  const formattedOptions: ParsedTextOption[] = [];

  if (type === "MULTIPLE_CHOICE") {
    if (rawOptions.length < 2) {
      errors.push("Pilihan ganda harus memiliki minimal 2 opsi (A dan B).");
    }

    if (!finalKey && rawOptions.length > 0) {
      // If no key specified, default to 'A' and record warning error
      finalKey = "A";
      errors.push("Kunci jawaban belum ditentukan (otomatis diset ke A, silakan sesuaikan jika perlu).");
    }

    rawOptions.forEach((opt) => {
      formattedOptions.push({
        key: opt.key,
        text: opt.text || `Pilihan ${opt.key}`,
        isCorrect: opt.key === finalKey,
      });
    });
  } else if (type === "TRUE_FALSE") {
    const isBenar = finalKey === "BENAR" || finalKey === "A" || finalKey === "TRUE" || finalKey === "B";
    const isSalah = finalKey === "SALAH" || finalKey === "B" || finalKey === "FALSE" || finalKey === "S";

    formattedOptions.push(
      { key: "BENAR", text: "Benar", isCorrect: isBenar && !isSalah },
      { key: "SALAH", text: "Salah", isCorrect: isSalah }
    );
  }

  if (!questionText.trim()) {
    errors.push("Teks pertanyaan tidak boleh kosong.");
  }

  const isValid = questionText.trim().length > 0 && (type === "ESSAY" || formattedOptions.length >= 2);

  return {
    type,
    questionText: questionText.trim(),
    points,
    explanation: explanation.trim() || undefined,
    options: formattedOptions,
    rawNumber: itemNumber,
    isValid,
    errors,
  };
}

function parseTaggedFormat(text: string): TextParseResult {
  const result: TextParseResult = {
    success: false,
    questions: [],
    totalParsed: 0,
    validCount: 0,
    errorCount: 0,
    globalErrors: [],
  };

  const regex = /\[SOAL\]([\s\S]*?)\[\/SOAL\]/gi;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }

  matches.forEach((block, idx) => {
    const q = parseSingleBlock(block, idx + 1);
    if (q.isValid) result.validCount++;
    else result.errorCount++;
    result.questions.push(q);
  });

  result.totalParsed = result.questions.length;
  result.success = result.validCount > 0;
  return result;
}
