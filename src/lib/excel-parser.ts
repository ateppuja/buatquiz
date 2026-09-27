import * as XLSX from "xlsx";
import { ParsedQuestion, ParsedQuestionOption } from "./docx-parser";

export interface ExcelQuestionParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  totalParsed: number;
  validCount: number;
  errorCount: number;
  globalErrors: string[];
}

export interface ParsedStudent {
  nis: string;
  name: string;
  className: string;
  gender?: string;
  pin?: string;
  rawRow: number;
  isValid: boolean;
  errors: string[];
}

export interface ExcelStudentParseResult {
  success: boolean;
  students: ParsedStudent[];
  totalParsed: number;
  validCount: number;
  errorCount: number;
  globalErrors: string[];
}

export function parseQuestionsExcelBuffer(buffer: Buffer): ExcelQuestionParseResult {
  const result: ExcelQuestionParseResult = {
    success: false,
    questions: [],
    totalParsed: 0,
    validCount: 0,
    errorCount: 0,
    globalErrors: [],
  };

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      result.globalErrors.push("File Excel tidak memiliki sheet yang dapat dibaca.");
      return result;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

    if (rawRows.length === 0) {
      result.globalErrors.push("Sheet Excel kosong tidak memiliki data soal.");
      return result;
    }

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const normalizedRow: Record<string, string> = {};
      Object.keys(row).forEach((k) => {
        normalizedRow[k.trim().toLowerCase()] = String(row[k]).trim();
      });

      const typeStr = (normalizedRow["tipe_soal"] || normalizedRow["tipe"] || "").toUpperCase();
      const questionText = normalizedRow["pertanyaan"] || normalizedRow["soal"] || "";
      const rawPoints = parseFloat(normalizedRow["bobot"] || normalizedRow["poin"] || "5");
      const points = !isNaN(rawPoints) && rawPoints > 0 ? rawPoints : 5;
      const explanation = normalizedRow["pembahasan"] || "";
      const rawKey = (normalizedRow["kunci_jawaban"] || normalizedRow["kunci"] || "").toUpperCase();

      const rawOptions: { [key: string]: string } = {
        A: normalizedRow["opsi_a"] || normalizedRow["pilihan_a"] || "",
        B: normalizedRow["opsi_b"] || normalizedRow["pilihan_b"] || "",
        C: normalizedRow["opsi_c"] || normalizedRow["pilihan_c"] || "",
        D: normalizedRow["opsi_d"] || normalizedRow["pilihan_d"] || "",
        E: normalizedRow["opsi_e"] || normalizedRow["pilihan_e"] || "",
      };

      const errors: string[] = [];

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
        const validKey =
          rawKey === "BENAR" || rawKey === "B" || rawKey === "TRUE" ? "BENAR" :
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
        rawBlockNumber: rowNum,
        isValid,
        errors,
      });
    });

    result.totalParsed = result.questions.length;
    result.success = result.validCount > 0;
  } catch (err: any) {
    result.globalErrors.push(`Gagal membaca file Excel: ${err.message || err}`);
  }

  return result;
}

export function parseStudentsExcelBuffer(buffer: Buffer): ExcelStudentParseResult {
  const result: ExcelStudentParseResult = {
    success: false,
    students: [],
    totalParsed: 0,
    validCount: 0,
    errorCount: 0,
    globalErrors: [],
  };

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      result.globalErrors.push("File Excel tidak memiliki sheet yang dapat dibaca.");
      return result;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

    if (rawRows.length === 0) {
      result.globalErrors.push("Sheet data murid kosong.");
      return result;
    }

    const seenNIS = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const normalizedRow: Record<string, string> = {};
      Object.keys(row).forEach((k) => {
        normalizedRow[k.trim().toLowerCase()] = String(row[k]).trim();
      });

      const nis = normalizedRow["nis"] || normalizedRow["nomor_induk"] || "";
      const name = normalizedRow["nama"] || normalizedRow["nama_lengkap"] || normalizedRow["nama_murid"] || "";
      const className = normalizedRow["kelas"] || normalizedRow["nama_kelas"] || "";
      let gender = (normalizedRow["jenis_kelamin"] || normalizedRow["gender"] || "").toUpperCase();
      if (gender.startsWith("L") || gender === "M") gender = "L";
      else if (gender.startsWith("P") || gender === "F") gender = "P";
      else gender = "L";

      const pin = normalizedRow["pin"] || "";
      const errors: string[] = [];

      if (!nis) {
        errors.push("NIS wajib diisi.");
      } else if (seenNIS.has(nis)) {
        errors.push(`NIS "${nis}" duplikat dalam file.`);
      } else {
        seenNIS.add(nis);
      }

      if (!name) {
        errors.push("Nama murid wajib diisi.");
      }

      if (!className) {
        errors.push("Kelas wajib diisi.");
      }

      const isValid = errors.length === 0;
      if (isValid) {
        result.validCount++;
      } else {
        result.errorCount++;
      }

      result.students.push({
        nis,
        name,
        className,
        gender,
        pin: pin || undefined,
        rawRow: rowNum,
        isValid,
        errors,
      });
    });

    result.totalParsed = result.students.length;
    result.success = result.validCount > 0;
  } catch (err: any) {
    result.globalErrors.push(`Gagal membaca file Excel murid: ${err.message || err}`);
  }

  return result;
}
