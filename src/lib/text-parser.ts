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
 * Super-Smart plain-text question parser:
 * - Robust question detection (Numbered 1., 1), No. 1, Soal 1, [1], (1), or unnumbered paragraphs)
 * - Flexible Option detection: Vertical (line-by-line) or Horizontal/Inline (A. 10  B. 20  C. 30  D. 40)
 * - Auto-detects Multiple Choice (PG), True/False (BS), and Essay (Esai/Uraian) seamlessly
 * - Answer key detection (Kunci: A, Jawaban: B, Jwb: C, Asterisk *B, [x] C, (kunci), or Global Key table at bottom)
 * - Document header noise cleaning (automatically ignores exam titles, school name, instructions headers)
 * - Default 1 point per question if not specified
 * - Explanations / Pembahasan support
 * - Zero-error tolerance: never crashes or loses valid questions
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

  // 2. Pre-process text: normalize unicode characters, line endings, spaces
  const normalized = normalizeRawText(rawText);

  // 3. Extract global answer key table if present at the end of the text (e.g. "Kunci Jawaban: 1. A, 2. B, 3. C")
  const { cleanedText, globalKeyMap } = extractGlobalAnswerKeys(normalized);

  // 4. Strip document headers / preambles before Question 1 if present
  const textWithoutHeader = stripDocumentHeader(cleanedText);

  // 5. Split text into individual question blocks
  const blocks = splitIntoQuestionBlocks(textWithoutHeader);

  if (blocks.length === 0) {
    result.globalErrors.push("Tidak dapat mengenali butir soal. Gunakan nomor soal seperti '1.', '2.', dsb.");
    return result;
  }

  blocks.forEach((block, index) => {
    const q = parseSingleBlock(block, index + 1, globalKeyMap);
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

/**
 * Normalizes unicode whitespace, quotation marks, line endings, and bullet chars
 */
function normalizeRawText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Replace non-breaking spaces and zero-width spaces
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    // Replace fancy smart quotes
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛ʻ]/g, "'")
    // Replace bullet symbols at start of lines with standard dash
    .replace(/^[•◦▪▫]\s*/gm, "- ")
    .trim();
}

/**
 * Checks for and extracts a global answer key section at the bottom of the text.
 * e.g. "KUNCI JAWABAN: 1. A, 2. B, 3. C" or "1.A 2.B 3.C"
 */
function extractGlobalAnswerKeys(text: string): { cleanedText: string; globalKeyMap: Record<number, string> } {
  const globalKeyMap: Record<number, string> = {};

  // Check if there is a dedicated global key header at the bottom/end of the text (e.g. "KUNCI JAWABAN:", "ANSWER KEYS:")
  const globalKeySectionRegex = /(?:^|\n)(?:---+\s*\n)?\s*(?:(?:KUNCI\s+JAWABAN|ANSWER\s+KEYS?|KUNCI\s+SOAL|TABEL\s+KUNCI)\s*[:=]?\s*\n?)([\s\S]*)$/i;
  const match = text.match(globalKeySectionRegex);

  if (!match) {
    return { cleanedText: text, globalKeyMap };
  }

  const keySectionContent = match[1].trim();

  // Pattern: "1. A", "1) B", "1: C", "1=D", "1-A", "1.A", "1 A"
  const pairRegex = /(?:(?:No\.?|Soal|Nomor)\s*)?(\d+)[\.\)\:\=\-\s]+([A-Ea-e]|Benar|Salah|True|False)/gi;
  let pairMatch;
  let count = 0;
  while ((pairMatch = pairRegex.exec(keySectionContent)) !== null) {
    const num = parseInt(pairMatch[1], 10);
    const key = pairMatch[2].trim().toUpperCase();
    if (!isNaN(num) && key) {
      globalKeyMap[num] = key;
      count++;
    }
  }

  // Only consider it a global key section if it matched at least 2 number-key pairs
  if (count >= 2) {
    const cleanedText = text.slice(0, match.index).trim();
    return { cleanedText, globalKeyMap };
  }

  return { cleanedText: text, globalKeyMap: {} };
}

/**
 * Strips exam metadata / preambles before Question 1 if found
 * e.g. "ULANGAN AKHIR SEMESTER", "Mata Pelajaran: IPA", "Petunjuk: ...", "---"
 */
function stripDocumentHeader(text: string): string {
  const firstQuestionMatch = text.match(/(?:^|\n)\s*(?:(?:Soal|No\.?|Nomor|Pertanyaan)\s*)?1[\.\)\:\-]\s+/i);
  if (firstQuestionMatch && firstQuestionMatch.index !== undefined && firstQuestionMatch.index > 0) {
    const preamble = text.slice(0, firstQuestionMatch.index).trim();
    // If preamble has header keywords, slice it off
    if (/ulangan|ujian|semester|penilaian|mata\s*pelajaran|mapel|kelas|waktu|petunjuk|sekolah|nama\s*siswa|pilihlah/i.test(preamble)) {
      return text.slice(firstQuestionMatch.index).trim();
    }
  }
  return text;
}

/**
 * Splits text into question blocks based on smart numbering and spacing patterns
 */
function splitIntoQuestionBlocks(text: string): string[] {
  const normalized = text.trim();

  // Pattern to match question boundaries:
  // "1. ", "1) ", "1 - ", "Soal 1: ", "No 1. ", "Nomor 1. ", "(1) ", "[1] ", "1.Apa" (no space after dot)
  const questionStartPattern = /(?:^|\n\s*\n|\n)(?=(?:(?:Soal|No\.?|Nomor|Pertanyaan)\s*)?\d+[\.\)\:\-]\s*|\(\d+\)\s+|\[\d+\]\s+|(?:Soal|No\.?|Nomor)\s+\d+\s*[:\-\n])/gi;

  const rawBlocks = normalized.split(questionStartPattern).map((b) => b.trim()).filter((b) => b.length > 0);

  // If numbering split didn't find multiple blocks, try splitting by double newlines or horizontal dividers
  if (rawBlocks.length <= 1) {
    const dividerBlocks = normalized
      .split(/(?:\n\s*[-=_]{3,}\s*\n|\n\s*\n+)/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
    if (dividerBlocks.length > 1) {
      return dividerBlocks;
    }
  }

  return rawBlocks.length > 0 ? rawBlocks : [normalized];
}

/**
 * Parses a single question block and extracts question text, options, keys, points, explanation, and type
 */
function parseSingleBlock(block: string, itemNumber: number, globalKeyMap: Record<number, string> = {}): ParsedTextQuestion {
  const rawLines = block.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const errors: string[] = [];

  let detectedItemNumber = itemNumber;
  let explicitType: string | null = null;
  let rawKey = "";
  let explanation = "";
  let points = 1;
  let questionText = "";

  const rawOptions: { key: string; text: string; isMarkedCorrect?: boolean }[] = [];

  // 1. Extract and remove question number from the first line (e.g. "1. ", "Soal 1: ", "No. 1. ")
  if (rawLines.length > 0) {
    const numMatch = rawLines[0].match(/^(?:(?:Soal|No\.?|Nomor|Pertanyaan)\s*)?(\d+)[\.\)\:\-]?\s*/i);
    if (numMatch && numMatch[1]) {
      detectedItemNumber = parseInt(numMatch[1], 10) || itemNumber;
      rawLines[0] = rawLines[0].replace(/^(?:(?:Soal|No\.?|Nomor|Pertanyaan)\s*)?\d+[\.\)\:\-]?\s*/i, "").trim();
    } else {
      // Check bracketed format like "(1) " or "[1] "
      const bracketMatch = rawLines[0].match(/^[\(\[](\d+)[\)\]]\s*/i);
      if (bracketMatch && bracketMatch[1]) {
        detectedItemNumber = parseInt(bracketMatch[1], 10) || itemNumber;
        rawLines[0] = rawLines[0].replace(/^[\(\[]\d+[\)\]]\s*/i, "").trim();
      }
    }
  }

  // 2. Scan lines for metadata, inline options, vertical options, explanations, and keys
  let currentSection: "QUESTION" | "OPTION" | "EXPLANATION" | "KEY" | "OTHER" = "QUESTION";

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) continue;

    // A. Points / Bobot detection: "Bobot: 10", "Poin: 20", "Nilai: 5", "[10 Poin]", "(Bobot: 2)"
    const pointMatch = line.match(/^(?:Bobot|Poin|Score|Points?|Nilai)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i) ||
                       line.match(/^[\(\[]\s*(\d+(?:\.\d+)?)\s*(?:poin|points?|bobot|nilai)\s*[\)\]]$/i);
    if (pointMatch) {
      points = parseFloat(pointMatch[1]) || 1;
      continue;
    }

    // B. Explicit Question Type: "Tipe: PG", "Tipe: Esai", "Tipe: Benar Salah"
    const typeMatch = line.match(/^(?:Tipe|Type|Jenis)\s*[:=\-]?\s*(.+)/i);
    if (typeMatch) {
      explicitType = typeMatch[1].trim().toUpperCase();
      continue;
    }

    // C. Answer Key: "Kunci: C", "Kunci Jawaban: B", "Jawaban: A", "Jwb: D", "Ans: C", "Key: D", "Kunci: Benar"
    const keyMatch = line.match(/^(?:Kunci(?:\s*Jawaban)?|Jawaban(?:nya)?|Jwb|Jawab|Ans(?:wer)?|Key)\s*[:=\-]?\s*([A-Ea-e]|Benar|Salah|True|False)(?:[\.\s\)].*)?$/i);
    if (keyMatch) {
      rawKey = keyMatch[1].trim().toUpperCase();
      currentSection = "KEY";
      continue;
    }

    // D. Explanation: "Pembahasan: ...", "Penjelasan: ...", "Explanation: ...", "Catatan: ..."
    const expMatch = line.match(/^(?:Pembahasan|Penjelasan|Explanation|Catatan|Keterangan|Alasan)\s*[:=\-]?\s*(.*)/i);
    if (expMatch) {
      explanation = expMatch[1].trim();
      currentSection = "EXPLANATION";
      continue;
    }

    // E. Check for Inline Options (e.g. "A. 10   B. 20   C. 30   D. 40" or "Apa ibukota RI? A. Bandung B. Jakarta C. Medan Kunci: B")
    const inlineResult = extractInlineOptions(line);
    if (inlineResult.options.length >= 2) {
      if (inlineResult.prefixText) {
        questionText += (questionText ? "\n" : "") + inlineResult.prefixText;
      }
      if (inlineResult.keySuffix) {
        rawKey = inlineResult.keySuffix;
      }
      if (inlineResult.pointsSuffix) {
        points = inlineResult.pointsSuffix;
      }
      if (inlineResult.explanationSuffix) {
        explanation = inlineResult.explanationSuffix;
      }
      inlineResult.options.forEach((opt) => rawOptions.push(opt));
      currentSection = "OPTION";
      continue;
    }

    // F. Vertical Option Pattern:
    // Matches "A. text", "A) text", "A: text", "A - text", "*A. text", "[x] A. text", "(A) text", "A text"
    const singleOptionMatch = line.match(/^([\*\[xX\(vV✓✔\]\s]*)\(?([A-Ea-e])[\.\)\:\-]\s*(.*)/i);
    if (singleOptionMatch) {
      const prefixMarker = singleOptionMatch[1];
      const optKey = singleOptionMatch[2].toUpperCase();
      let optText = singleOptionMatch[3].trim();

      // Check if correct marker is in prefix (*A, [x] A) or suffix (A. Jakarta (kunci), A. Jakarta *)
      let isCorrect =
        prefixMarker.includes("*") ||
        prefixMarker.toLowerCase().includes("x") ||
        prefixMarker.toLowerCase().includes("v") ||
        prefixMarker.includes("✓") ||
        prefixMarker.includes("✔");

      // Check for suffix markers e.g. "(kunci)", "(jawaban benar)", "(benar)", "[kunci]", "*"
      if (/\s*(?:\(kunci(?: jawaban)?\)|\(jawaban benar\)|\(benar\)|\[kunci\]|\*)\s*$/i.test(optText)) {
        isCorrect = true;
        optText = optText.replace(/\s*(?:\(kunci(?: jawaban)?\)|\(jawaban benar\)|\(benar\)|\[kunci\]|\*)\s*$/i, "").trim();
      }

      rawOptions.push({
        key: optKey,
        text: optText,
        isMarkedCorrect: isCorrect,
      });

      currentSection = "OPTION";
      continue;
    }

    // G. Benar / Salah standalone line (e.g. "A. Benar" / "B. Salah" or just "Benar / Salah")
    if (/^(?:A[\.\)]\s*)?Benar\s*(?:\/|atau)?\s*(?:B[\.\)]\s*)?Salah$/i.test(line) ||
        /^(?:A[\.\)]\s*)?True\s*(?:\/|or)?\s*(?:B[\.\)]\s*)?False$/i.test(line)) {
      rawOptions.push(
        { key: "BENAR", text: "Benar" },
        { key: "SALAH", text: "Salah" }
      );
      currentSection = "OPTION";
      continue;
    }

    // H. Continuation of multiline sections
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

  // 3. Auto-detect question type
  let type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" = "MULTIPLE_CHOICE";

  if (explicitType) {
    if (explicitType.includes("ESAI") || explicitType.includes("ESSAY") || explicitType.includes("URAIAN")) {
      type = "ESSAY";
    } else if (explicitType.includes("BS") || explicitType.includes("BENAR") || explicitType.includes("TF") || explicitType.includes("TRUE")) {
      type = "TRUE_FALSE";
    } else {
      type = "MULTIPLE_CHOICE";
    }
  } else if (rawOptions.length === 0) {
    // No options provided -> Essay question
    type = "ESSAY";
  } else if (
    rawOptions.length === 2 &&
    rawOptions.some((o) => /^(?:benar|true|ya|setuju)$/i.test(o.text.trim()) || o.key === "BENAR") &&
    rawOptions.some((o) => /^(?:salah|false|tidak|tidak setuju)$/i.test(o.text.trim()) || o.key === "SALAH")
  ) {
    type = "TRUE_FALSE";
  } else {
    type = "MULTIPLE_CHOICE";
  }

  // 4. Resolve Answer Key:
  // Priority: 1. Inline marked asterisk/bracket -> 2. Explicit "Kunci:" in block -> 3. Global Key table -> 4. Default 'A'
  let finalKey = rawKey;
  const markedOpt = rawOptions.find((o) => o.isMarkedCorrect);
  if (markedOpt) {
    finalKey = markedOpt.key;
  }

  if (!finalKey && globalKeyMap[detectedItemNumber]) {
    finalKey = globalKeyMap[detectedItemNumber].toUpperCase();
  }

  // 5. Build clean, standard options array
  const formattedOptions: ParsedTextOption[] = [];

  if (type === "MULTIPLE_CHOICE") {
    // Ensure keys A, B, C, D, E are sorted or reassigned properly
    if (!finalKey && rawOptions.length > 0) {
      // Default to first option key if none provided
      finalKey = rawOptions[0].key || "A";
    }

    rawOptions.forEach((opt, idx) => {
      const fallbackKey = String.fromCharCode(65 + idx);
      const cleanKey = opt.key || fallbackKey;
      formattedOptions.push({
        key: cleanKey,
        text: opt.text || `Pilihan ${cleanKey}`,
        isCorrect: cleanKey.toUpperCase() === finalKey.toUpperCase(),
      });
    });
  } else if (type === "TRUE_FALSE") {
    const isBenar = finalKey === "BENAR" || finalKey === "A" || finalKey === "TRUE" || finalKey === "B" && !finalKey.includes("SALAH");
    const isSalah = finalKey === "SALAH" || finalKey === "B" || finalKey === "FALSE" || finalKey === "S";

    formattedOptions.push(
      { key: "BENAR", text: "Benar", isCorrect: isBenar && !isSalah },
      { key: "SALAH", text: "Salah", isCorrect: isSalah }
    );
  }

  // 6. Question text fallback if empty (e.g. prompt only had options)
  if (!questionText.trim()) {
    questionText = `Pertanyaan Nomor ${detectedItemNumber}`;
  }

  // 7. Validation: All properly formatted questions are valid!
  const isValid = questionText.trim().length > 0 && (type === "ESSAY" || formattedOptions.length >= 2);

  return {
    type,
    questionText: questionText.trim(),
    points,
    explanation: explanation.trim() || undefined,
    options: formattedOptions,
    rawNumber: detectedItemNumber,
    isValid,
    errors,
  };
}

interface InlineExtractResult {
  prefixText: string;
  options: Array<{ key: string; text: string; isMarkedCorrect?: boolean }>;
  keySuffix?: string;
  pointsSuffix?: number;
  explanationSuffix?: string;
}

/**
 * Extracts multiple options from a single line if present (horizontal / inline options)
 * e.g. "A. 10   B. 20   C. 30   D. 40" or "Apa ibukota RI? A. Bandung B. Jakarta C. Medan Kunci: B"
 */
function extractInlineOptions(line: string): InlineExtractResult {
  // Regex finding option markers like " A. ", " B) ", " *C. ", " (D) ", " [E] "
  const inlinePattern = /(?:^|\s{2,}|\t|\s+)([\*\[\(]?[A-Ea-e][\]\)\.\:\-]\s*)/g;
  const matches: { index: number; fullMatch: string; key: string; isMarked: boolean }[] = [];

  let m;
  while ((m = inlinePattern.exec(line)) !== null) {
    const marker = m[1].trim();
    const keyMatch = marker.match(/([A-Ea-e])/i);
    if (keyMatch) {
      matches.push({
        index: m.index + m[0].indexOf(marker),
        fullMatch: marker,
        key: keyMatch[1].toUpperCase(),
        isMarked: marker.includes("*") || marker.includes("[x]"),
      });
    }
  }

  if (matches.length < 2) {
    return { prefixText: "", options: [] };
  }

  // Verify that keys are in sequence (e.g. A, B or A, B, C or A, B, C, D)
  const isSequential = matches.every((match, idx) => {
    if (idx === 0) return true;
    const prevCharCode = matches[idx - 1].key.charCodeAt(0);
    const currCharCode = match.key.charCodeAt(0);
    return currCharCode === prevCharCode + 1 || currCharCode > prevCharCode;
  });

  if (!isSequential) {
    return { prefixText: "", options: [] };
  }

  const prefixText = line.slice(0, matches[0].index).trim();
  const results: Array<{ key: string; text: string; isMarkedCorrect?: boolean }> = [];
  let keySuffix: string | undefined;
  let pointsSuffix: number | undefined;
  let explanationSuffix: string | undefined;

  for (let i = 0; i < matches.length; i++) {
    const startPos = matches[i].index + matches[i].fullMatch.length;
    const endPos = i + 1 < matches.length ? matches[i + 1].index : line.length;
    let optText = line.slice(startPos, endPos).trim();

    let isCorrect = matches[i].isMarked;

    // For the last option, check if there's trailing metadata (Kunci, Bobot, Pembahasan)
    if (i === matches.length - 1) {
      // Check for Kunci / Jawaban
      const keyTrailingMatch = optText.match(/\s+(?:Kunci(?:\s*Jawaban)?|Jawaban(?:nya)?|Jwb|Jawab|Ans(?:wer)?|Key)\s*[:=\-]?\s*([A-Ea-e]|Benar|Salah|True|False)(?:[\.\s\)].*)?$/i);
      if (keyTrailingMatch) {
        keySuffix = keyTrailingMatch[1].trim().toUpperCase();
        optText = optText.slice(0, keyTrailingMatch.index).trim();
      }

      // Check for Bobot / Points
      const pointTrailingMatch = optText.match(/\s+(?:Bobot|Poin|Score|Points?|Nilai)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i);
      if (pointTrailingMatch) {
        pointsSuffix = parseFloat(pointTrailingMatch[1]) || undefined;
        optText = optText.slice(0, pointTrailingMatch.index).trim();
      }

      // Check for Pembahasan
      const expTrailingMatch = optText.match(/\s+(?:Pembahasan|Penjelasan|Explanation)\s*[:=\-]?\s*(.*)$/i);
      if (expTrailingMatch) {
        explanationSuffix = expTrailingMatch[1].trim();
        optText = optText.slice(0, expTrailingMatch.index).trim();
      }
    }

    if (/\s*(?:\(kunci(?: jawaban)?\)|\(jawaban benar\)|\(benar\)|\[kunci\]|\*)\s*$/i.test(optText)) {
      isCorrect = true;
      optText = optText.replace(/\s*(?:\(kunci(?: jawaban)?\)|\(jawaban benar\)|\(benar\)|\[kunci\]|\*)\s*$/i, "").trim();
    }

    results.push({
      key: matches[i].key,
      text: optText,
      isMarkedCorrect: isCorrect,
    });
  }

  return { prefixText, options: results, keySuffix, pointsSuffix, explanationSuffix };
}

/**
 * Handles structured tagged format e.g. [SOAL]...[/SOAL]
 */
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

/**
 * Helper to auto-format / beautify messy question text into clean standard format
 */
export function beautifyQuestionText(rawText: string): string {
  const parsed = parseQuestionsFromRawText(rawText);
  if (!parsed.success || parsed.questions.length === 0) {
    return rawText;
  }

  return parsed.questions
    .map((q, idx) => {
      let block = `${idx + 1}. ${q.questionText}`;

      if (q.type === "MULTIPLE_CHOICE") {
        const correctKey = q.options.find((o) => o.isCorrect)?.key || "A";
        q.options.forEach((opt) => {
          block += `\n${opt.key}. ${opt.text}`;
        });
        block += `\nKunci: ${correctKey}`;
      } else if (q.type === "TRUE_FALSE") {
        const isBenar = q.options.find((o) => o.key === "BENAR")?.isCorrect;
        block += `\nA. Benar\nB. Salah`;
        block += `\nKunci: ${isBenar ? "Benar" : "Salah"}`;
      }

      if (q.points && q.points !== 1) {
        block += `\nBobot: ${q.points}`;
      }

      if (q.explanation) {
        block += `\nPembahasan: ${q.explanation}`;
      }

      return block;
    })
    .join("\n\n");
}
