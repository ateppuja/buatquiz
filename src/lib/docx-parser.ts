import mammoth from "mammoth";

export interface ParsedQuestionOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
  questionText: string;
  points: number;
  explanation?: string;
  options: ParsedQuestionOption[];
  rawBlockNumber: number;
  isValid: boolean;
  errors: string[];
}

export interface DocxParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  totalParsed: number;
  validCount: number;
  errorCount: number;
  globalErrors: string[];
}

export async function parseDocxBuffer(buffer: Buffer): Promise<DocxParseResult> {
  const result: DocxParseResult = {
    success: false,
    questions: [],
    totalParsed: 0,
    validCount: 0,
    errorCount: 0,
    globalErrors: [],
  };

  try {
    const rawResult = await mammoth.extractRawText({ buffer });
    const text = rawResult.value;

    if (!text || text.trim().length === 0) {
      result.globalErrors.push("Dokumen kosong atau teks tidak dapat diekstrak.");
      return result;
    }

    // Split blocks by [SOAL] and [/SOAL]
    const regex = /\[SOAL\]([\s\S]*?)\[\/SOAL\]/gi;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }

    if (matches.length === 0) {
      result.globalErrors.push(
        "Tidak ditemukan penanda [SOAL] dan [/SOAL] di dalam dokumen. Pastikan mengikuti format template."
      );
      return result;
    }

    matches.forEach((block, index) => {
      const blockNum = index + 1;
      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

      let typeStr = "";
      let questionText = "";
      let points = 5;
      let explanation = "";
      let rawKey = "";
      const rawOptions: { [key: string]: string } = {};
      const errors: string[] = [];

      let currentSection = "";

      for (const line of lines) {
        if (/^TIPE\s*:\s*/i.test(line)) {
          typeStr = line.replace(/^TIPE\s*:\s*/i, "").trim().toUpperCase();
          currentSection = "TIPE";
        } else if (/^PERTANYAAN\s*:\s*/i.test(line)) {
          questionText = line.replace(/^PERTANYAAN\s*:\s*/i, "").trim();
          currentSection = "PERTANYAAN";
        } else if (/^BOBOT\s*:\s*/i.test(line)) {
          const val = parseFloat(line.replace(/^BOBOT\s*:\s*/i, "").trim());
          if (!isNaN(val) && val > 0) points = val;
          currentSection = "BOBOT";
        } else if (/^KUNCI\s*:\s*/i.test(line)) {
          rawKey = line.replace(/^KUNCI\s*:\s*/i, "").trim().toUpperCase();
          currentSection = "KUNCI";
        } else if (/^PEMBAHASAN\s*:\s*/i.test(line)) {
          explanation = line.replace(/^PEMBAHASAN\s*:\s*/i, "").trim();
          currentSection = "PEMBAHASAN";
        } else if (/^[A-E]\s*:\s*/i.test(line)) {
          const optKey = line[0].toUpperCase();
          const optText = line.replace(/^[A-E]\s*:\s*/i, "").trim();
          rawOptions[optKey] = optText;
          currentSection = `OPT_${optKey}`;
        } else {
          // Multiline continuation
          if (currentSection === "PERTANYAAN") {
            questionText += " " + line;
          } else if (currentSection === "PEMBAHASAN") {
            explanation += " " + line;
          } else if (currentSection.startsWith("OPT_")) {
            const optKey = currentSection.replace("OPT_", "");
            rawOptions[optKey] = (rawOptions[optKey] || "") + " " + line;
          }
        }
      }

      // Normalization of Type
      let questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" = "MULTIPLE_CHOICE";
      if (typeStr === "ESAI" || typeStr === "ESSAY" || typeStr === "URAIAN") {
        questionType = "ESSAY";
      } else if (typeStr === "BS" || typeStr === "BENAR_SALAH" || typeStr === "TF") {
        questionType = "TRUE_FALSE";
      } else if (typeStr === "PG" || typeStr === "PILIHAN_GANDA" || typeStr === "MC") {
        questionType = "MULTIPLE_CHOICE";
      } else {
        errors.push(`Tipe soal "${typeStr}" tidak dikenal (Gunakan PG, BS, atau ESAI).`);
      }

      if (!questionText) {
        errors.push("Isi teks pertanyaan wajib diisi.");
      }

      const options: ParsedQuestionOption[] = [];

      if (questionType === "MULTIPLE_CHOICE") {
        const optionKeys = ["A", "B", "C", "D", "E"].filter((k) => rawOptions[k]);
        if (optionKeys.length < 2) {
          errors.push("Pilihan ganda minimal harus memiliki 2 pilihan (A dan B).");
        }
        if (!rawKey) {
          errors.push("Kunci jawaban wajib diisi untuk pilihan ganda.");
        } else if (!optionKeys.includes(rawKey)) {
          errors.push(`Kunci jawaban "${rawKey}" tidak ada dalam daftar pilihan (${optionKeys.join(", ")}).`);
        }

        optionKeys.forEach((key) => {
          options.push({
            key,
            text: rawOptions[key],
            isCorrect: key === rawKey,
          });
        });
      } else if (questionType === "TRUE_FALSE") {
        const validKey = rawKey === "BENAR" || rawKey === "B" || rawKey === "TRUE" ? "BENAR" :
                         rawKey === "SALAH" || rawKey === "S" || rawKey === "FALSE" ? "SALAH" : "";
        if (!validKey) {
          errors.push(`Kunci jawaban "${rawKey}" tidak valid untuk Benar/Salah (Gunakan BENAR atau SALAH).`);
        }

        options.push(
          { key: "BENAR", text: "Benar", isCorrect: validKey === "BENAR" },
          { key: "SALAH", text: "Salah", isCorrect: validKey === "SALAH" }
        );
      }

      const isValid = errors.length === 0;
      if (isValid) {
        result.validCount++;
      } else {
        result.errorCount++;
      }

      result.questions.push({
        type: questionType,
        questionText,
        points,
        explanation: explanation || undefined,
        options,
        rawBlockNumber: blockNum,
        isValid,
        errors,
      });
    });

    result.totalParsed = result.questions.length;
    result.success = result.validCount > 0;
  } catch (err: any) {
    result.globalErrors.push(`Gagal membaca file Word: ${err.message || err}`);
  }

  return result;
}
