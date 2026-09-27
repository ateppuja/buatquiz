import ExcelJS from "exceljs";

export interface ExportExamData {
  exam: {
    title: string;
    subjectName: string;
    teacherName: string;
    examCode: string;
    durationMinutes: number;
    startAt: Date;
    endAt: Date;
    gradingMethod: string;
    maxAttempts: number;
  };
  questions: Array<{
    id: string;
    orderIndex: number;
    type: string;
    points: number;
    questionText: string;
  }>;
  participants: Array<{
    studentId: string;
    nis?: string | null;
    name: string;
    className: string;
    totalAttempts: number;
    highestScore: number | null;
    latestScore: number | null;
    averageScore: number | null;
    finalScore: number | null;
    gradingStatus: string;
    attempts: Array<{
      attemptNumber: number;
      startedAt: Date;
      submittedAt: Date | null;
      status: string;
      finalScore: number | null;
      earnedPoints: number | null;
      maxPoints: number | null;
      gradingStatus: string;
      answers: Array<{
        questionId: string;
        answerText: string | null;
        selectedOptionText: string | null;
        awardedPoints: number | null;
      }>;
    }>;
  }>;
}

export async function generateExamReportExcelBuffer(data: ExportExamData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExamCode School";
  workbook.created = new Date();

  // --- SHEET 1: Rekap Nilai ---
  const sheet1 = workbook.addWorksheet("Rekap Nilai", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5 }],
  });

  // Title Block
  sheet1.mergeCells("A1:H1");
  sheet1.getCell("A1").value = `LAPORAN HASIL UJIAN - ${data.exam.title.toUpperCase()}`;
  sheet1.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  sheet1.getCell("A1").alignment = { vertical: "middle" };

  sheet1.getCell("A2").value = `Mata Pelajaran: ${data.exam.subjectName} | Guru: ${data.exam.teacherName} | Kode: ${data.exam.examCode}`;
  sheet1.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF475569" } };

  sheet1.getCell("A3").value = `Metode Nilai Akhir: ${data.exam.gradingMethod} | Maks Percobaan: ${data.exam.maxAttempts}x | Durasi: ${data.exam.durationMinutes} menit`;
  sheet1.getCell("A3").font = { size: 10, color: { argb: "FF475569" } };

  // Headers for Sheet 1
  const maxAttemptsFound = Math.max(1, ...data.participants.map((p) => p.totalAttempts));
  const s1Headers = ["No", "Nama Lengkap", "Kelas", "Jumlah Percobaan"];
  for (let i = 1; i <= maxAttemptsFound; i++) {
    s1Headers.push(`Nilai Ke-${i}`);
  }
  s1Headers.push("Nilai Akhir", "Status Penilaian");

  const headerRow1 = sheet1.getRow(5);
  headerRow1.values = s1Headers;
  headerRow1.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow1.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerRow1.alignment = { vertical: "middle", horizontal: "center" };

  // Fill Sheet 1 Data
  data.participants.forEach((p, index) => {
    const rowValues: any[] = [
      index + 1,
      p.name,
      p.className,
      p.totalAttempts,
    ];

    for (let i = 1; i <= maxAttemptsFound; i++) {
      const att = p.attempts.find((a) => a.attemptNumber === i);
      rowValues.push(att && att.finalScore !== null ? att.finalScore : "-");
    }

    rowValues.push(p.finalScore !== null ? p.finalScore : 0);
    rowValues.push(p.gradingStatus === "GRADED" ? "Selesai Dinilai" : "Menunggu Koreksi");

    const row = sheet1.addRow(rowValues);
    row.alignment = { vertical: "middle" };
    // Center columns: No, Kelas, Percobaan
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(3).alignment = { horizontal: "center" };
    row.getCell(4).alignment = { horizontal: "center" };
    for (let c = 5; c <= 5 + maxAttemptsFound; c++) {
      row.getCell(c).alignment = { horizontal: "right" };
    }
  });

  // Adjust column widths for Sheet 1
  sheet1.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : "";
      if (val.length > maxLength) maxLength = Math.min(val.length + 3, 40);
    });
    column.width = maxLength;
  });

  // --- SHEET 2: Detail Percobaan ---
  const sheet2 = workbook.addWorksheet("Detail Percobaan", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5 }],
  });

  sheet2.mergeCells("A1:K1");
  sheet2.getCell("A1").value = `RINCIAN PERCOBAAN & JAWABAN - ${data.exam.title.toUpperCase()}`;
  sheet2.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF065F46" } };

  // Headers for Sheet 2
  const s2Headers = [
    "No",
    "Nama Murid",
    "Kelas",
    "Percobaan Ke",
    "Status",
    "Waktu Mulai",
    "Waktu Selesai",
    "Poin Diperoleh",
    "Poin Maksimal",
    "Nilai",
  ];

  data.questions.forEach((q, idx) => {
    s2Headers.push(`Soal ${idx + 1} (${q.type === "ESSAY" ? "Esai" : q.type === "TRUE_FALSE" ? "BS" : "PG"})`);
  });

  const headerRow2 = sheet2.getRow(5);
  headerRow2.values = s2Headers;
  headerRow2.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow2.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF059669" },
  };
  headerRow2.alignment = { vertical: "middle", horizontal: "center" };

  let rowIndex = 1;
  data.participants.forEach((p) => {
    p.attempts.forEach((att) => {
      const rowValues: any[] = [
        rowIndex++,
        p.name,
        p.className,
        att.attemptNumber,
        att.status === "SUBMITTED" ? "Selesai" : att.status === "EXPIRED" ? "Waktu Habis" : "Sedang Mengerjakan",
        att.startedAt ? new Date(att.startedAt).toLocaleString("id-ID") : "-",
        att.submittedAt ? new Date(att.submittedAt).toLocaleString("id-ID") : "-",
        att.earnedPoints ?? 0,
        att.maxPoints ?? 0,
        att.finalScore ?? 0,
      ];

      const answerMap = new Map(att.answers.map((a) => [a.questionId, a]));

      data.questions.forEach((q) => {
        const ans = answerMap.get(q.id);
        if (!ans) {
          rowValues.push("- (0)");
        } else if (q.type === "ESSAY") {
          const textPreview = ans.answerText ? (ans.answerText.length > 25 ? ans.answerText.slice(0, 22) + "..." : ans.answerText) : "Kosong";
          rowValues.push(`${textPreview} [Poin: ${ans.awardedPoints ?? "Belum"}]`);
        } else {
          rowValues.push(`${ans.selectedOptionText || "-"} [Poin: ${ans.awardedPoints ?? 0}]`);
        }
      });

      sheet2.addRow(rowValues);
    });
  });

  sheet2.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : "";
      if (val.length > maxLength) maxLength = Math.min(val.length + 2, 35);
    });
    column.width = maxLength;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
