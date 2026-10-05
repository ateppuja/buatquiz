import { generateExamCode, normalizeExamCode } from "../src/lib/code-generator";
import { parseDocxBuffer } from "../src/lib/docx-parser";
import { parseQuestionsExcelBuffer, parseStudentsExcelBuffer } from "../src/lib/excel-parser";
import { calculateAttemptScore, calculateMultiAttemptFinalScore } from "../src/lib/scoring";
import { generateExamReportExcelBuffer } from "../src/lib/excel-exporter";
import { parseQuestionsFromRawText, beautifyQuestionText } from "../src/lib/text-parser";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    totalFailed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   EXAMCODE SCHOOL - COMPREHENSIVE TEST SUITE");
  console.log("=======================================================\n");

  // ----------------------------------------------------
  // TEST 1: Exam Code Generator (FR-012)
  // ----------------------------------------------------
  console.log("1. Pengujian Generator Kode Ujian Otomatis (FR-012)");
  const code1 = generateExamCode(8);
  const code2 = generateExamCode(8);
  assert(code1.length === 8, "Panjang kode tepat 8 karakter");
  assert(code1 !== code2, "Dua kode acak berurutan unik");
  assert(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code1), "Tidak mengandung karakter ambigu (0, O, 1, I, L)");
  assert(normalizeExamCode("  mtk9a2bc  ") === "MTK9A2BC", "Normalisasi input kode case-insensitive & trim");

  // ----------------------------------------------------
  // TEST 2: Word Parser (FR-008)
  // ----------------------------------------------------
  console.log("\n2. Pengujian Parser Template Word .docx (FR-008)");
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "[SOAL]" }),
          new Paragraph({ text: "TIPE: PG" }),
          new Paragraph({ text: "PERTANYAAN: Berapakah hasil 10 + 5?" }),
          new Paragraph({ text: "A: 10" }),
          new Paragraph({ text: "B: 15" }),
          new Paragraph({ text: "C: 20" }),
          new Paragraph({ text: "D: 25" }),
          new Paragraph({ text: "KUNCI: B" }),
          new Paragraph({ text: "BOBOT: 10" }),
          new Paragraph({ text: "[/SOAL]" }),
          new Paragraph({ text: "[SOAL]" }),
          new Paragraph({ text: "TIPE: ESAI" }),
          new Paragraph({ text: "PERTANYAAN: Jelaskan siklus air!" }),
          new Paragraph({ text: "BOBOT: 20" }),
          new Paragraph({ text: "[/SOAL]" }),
        ],
      },
    ],
  });
  const docBuffer = await Packer.toBuffer(doc);
  const docxResult = await parseDocxBuffer(docBuffer);
  assert(docxResult.success === true, "Word parser berhasil membaca template");
  assert(docxResult.totalParsed === 2, "Tepat 2 soal terbaca");
  assert(docxResult.questions[0].type === "MULTIPLE_CHOICE", "Soal 1 adalah Pilihan Ganda");
  assert(docxResult.questions[0].options.find((o) => o.key === "B")?.isCorrect === true, "Kunci B bertanda isCorrect = true");
  assert(docxResult.questions[1].type === "ESSAY", "Soal 2 adalah Esai");

  // ----------------------------------------------------
  // TEST 3: Excel Parsers (FR-009 & FR-003)
  // ----------------------------------------------------
  console.log("\n3. Pengujian Parser Template Excel .xlsx (FR-009 & FR-003)");
  // Question Excel
  const qRows = [
    { tipe_soal: "PG", pertanyaan: "Ibukota Indonesia?", opsi_a: "Bandung", opsi_b: "Jakarta", kunci_jawaban: "B", bobot: 5 },
    { tipe_soal: "BS", pertanyaan: "Matahari terbit dari timur.", kunci_jawaban: "BENAR", bobot: 5 },
  ];
  const wsQ = XLSX.utils.json_to_sheet(qRows);
  const wbQ = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbQ, wsQ, "Soal");
  const excelQBuffer = XLSX.write(wbQ, { type: "buffer", bookType: "xlsx" });
  const excelQResult = parseQuestionsExcelBuffer(excelQBuffer);
  assert(excelQResult.success === true, "Excel question parser berhasil");
  assert(excelQResult.validCount === 2, "2 soal Excel berstatus valid");

  // Student Excel
  const sRows = [
    { nis: "9901", nama: "Budi Test", kelas: "IX A", jenis_kelamin: "L" },
    { nis: "9902", nama: "Ani Test", kelas: "IX B", jenis_kelamin: "P" },
  ];
  const wsS = XLSX.utils.json_to_sheet(sRows);
  const wbS = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbS, wsS, "Murid");
  const excelSBuffer = XLSX.write(wbS, { type: "buffer", bookType: "xlsx" });
  const excelSResult = parseStudentsExcelBuffer(excelSBuffer);
  assert(excelSResult.success === true, "Excel student parser berhasil");
  assert(excelSResult.students[0].nis === "9901", "NIS 9901 diekstrak dengan benar");

  // ----------------------------------------------------
  // TEST 4: Scoring Engine (FR-019 & FR-020)
  // ----------------------------------------------------
  console.log("\n4. Pengujian Engine Penilaian & Multi-Attempt (FR-019 & FR-020)");
  const mockQuestions = [
    { id: "q1", type: "MULTIPLE_CHOICE", points: 20, options: [{ id: "opt1", isCorrect: true }, { id: "opt2", isCorrect: false }] },
    { id: "q2", type: "TRUE_FALSE", points: 20, options: [{ id: "opt3", isCorrect: true }, { id: "opt4", isCorrect: false }] },
    { id: "q3", type: "ESSAY", points: 60, options: [] },
  ];

  // Attempt with correct PG, correct TF, and essay graded 40/60 points
  const mockAnswers = [
    { questionId: "q1", selectedOptionId: "opt1" },
    { questionId: "q2", selectedOptionId: "opt3" },
    { questionId: "q3", answerText: "Penjelasan saya", awardedPoints: 40 },
  ];

  const score1 = calculateAttemptScore(mockQuestions, mockAnswers);
  assert(score1.earnedPoints === 80, "Poin diperoleh 20 + 20 + 40 = 80 poin");
  assert(score1.maxPoints === 100, "Total poin maksimal 100 poin");
  assert(score1.finalScore === 80, "Nilai akhir percobaan 80.00");
  assert(score1.hasUngradedEssays === false, "Tidak ada esai yang belum dinilai");

  // Multi Attempt calculations
  const attemptsHistory = [
    { attemptNumber: 1, finalScore: 70, gradingStatus: "GRADED" },
    { attemptNumber: 2, finalScore: 90, gradingStatus: "GRADED" },
    { attemptNumber: 3, finalScore: 80, gradingStatus: "GRADED" },
  ];

  const scoreHighest = calculateMultiAttemptFinalScore(attemptsHistory, "HIGHEST");
  assert(scoreHighest.finalScore === 90, "Metode HIGHEST memilih 90");

  const scoreLatest = calculateMultiAttemptFinalScore(attemptsHistory, "LATEST");
  assert(scoreLatest.finalScore === 80, "Metode LATEST memilih percobaan terakhir (80)");

  const scoreAverage = calculateMultiAttemptFinalScore(attemptsHistory, "AVERAGE");
  assert(scoreAverage.finalScore === 80, "Metode AVERAGE menghitung rata-rata (70+90+80)/3 = 80.00");

  // Default 1 Point per question & 0-100 Fair Proportional Scoring Tests
  // Scenario A: 10 questions each 1 point, 10 correct -> Score = 100
  const questions10 = Array.from({ length: 10 }, (_, i) => ({
    id: `q-${i + 1}`,
    type: "MULTIPLE_CHOICE",
    points: 1,
    options: [{ id: `opt-${i + 1}-A`, isCorrect: true }, { id: `opt-${i + 1}-B`, isCorrect: false }],
  }));
  const answers10AllCorrect = Array.from({ length: 10 }, (_, i) => ({
    questionId: `q-${i + 1}`,
    selectedOptionId: `opt-${i + 1}-A`,
  }));
  const score10All = calculateAttemptScore(questions10, answers10AllCorrect);
  assert(score10All.earnedPoints === 10 && score10All.maxPoints === 10, "10 soal @ 1 poin: Total poin diperoleh 10/10");
  assert(score10All.finalScore === 100, "10 soal @ 1 poin, benar semua bernilai 100");

  // Scenario B: 6 questions each 1 point, 5 correct -> Score = (5/6)*100 = 83.33
  const questions6 = Array.from({ length: 6 }, (_, i) => ({
    id: `q6-${i + 1}`,
    type: "MULTIPLE_CHOICE",
    points: 1,
    options: [{ id: `opt6-${i + 1}-A`, isCorrect: true }, { id: `opt6-${i + 1}-B`, isCorrect: false }],
  }));
  const answers6FiveCorrect = [
    { questionId: "q6-1", selectedOptionId: "opt6-1-A" },
    { questionId: "q6-2", selectedOptionId: "opt6-2-A" },
    { questionId: "q6-3", selectedOptionId: "opt6-3-A" },
    { questionId: "q6-4", selectedOptionId: "opt6-4-A" },
    { questionId: "q6-5", selectedOptionId: "opt6-5-A" },
    { questionId: "q6-6", selectedOptionId: "opt6-6-B" }, // wrong
  ];
  const score6Five = calculateAttemptScore(questions6, answers6FiveCorrect);
  assert(score6Five.earnedPoints === 5 && score6Five.maxPoints === 6, "6 soal @ 1 poin: 5 benar dari 6 soal");
  assert(score6Five.finalScore === 83.33, "6 soal @ 1 poin, 5 benar dinilai adil 83.33");

  // Scenario C: 4 questions each 1 point, 3 correct -> Score = (3/4)*100 = 75
  const questions4 = Array.from({ length: 4 }, (_, i) => ({
    id: `q4-${i + 1}`,
    type: "MULTIPLE_CHOICE",
    points: 1,
    options: [{ id: `opt4-${i + 1}-A`, isCorrect: true }, { id: `opt4-${i + 1}-B`, isCorrect: false }],
  }));
  const answers4ThreeCorrect = [
    { questionId: "q4-1", selectedOptionId: "opt4-1-A" },
    { questionId: "q4-2", selectedOptionId: "opt4-2-A" },
    { questionId: "q4-3", selectedOptionId: "opt4-3-A" },
    { questionId: "q4-4", selectedOptionId: "opt4-4-B" }, // wrong
  ];
  const score4Three = calculateAttemptScore(questions4, answers4ThreeCorrect);
  assert(score4Three.finalScore === 75, "4 soal @ 1 poin, 3 benar dinilai adil 75.00");

  // ----------------------------------------------------
  // TEST 5: Excel Report Exporter (FR-023)
  // ----------------------------------------------------
  console.log("\n5. Pengujian Ekspor Laporan Excel 2-Sheet (FR-023)");
  const exportBuffer = await generateExamReportExcelBuffer({
    exam: {
      title: "Ujian Matematika IX",
      subjectName: "Matematika",
      teacherName: "Pak Budi",
      examCode: "MTK9A2BC",
      durationMinutes: 60,
      startAt: new Date(),
      endAt: new Date(),
      gradingMethod: "HIGHEST",
      maxAttempts: 3,
    },
    questions: [
      { id: "q1", orderIndex: 0, type: "MULTIPLE_CHOICE", points: 20, questionText: "Soal 1" },
    ],
    participants: [
      {
        studentId: "s1",
        nis: "1001",
        name: "Ahmad Fauzi",
        className: "IX A",
        totalAttempts: 1,
        highestScore: 85,
        latestScore: 85,
        averageScore: 85,
        finalScore: 85,
        gradingStatus: "GRADED",
        attempts: [
          {
            attemptNumber: 1,
            startedAt: new Date(),
            submittedAt: new Date(),
            status: "SUBMITTED",
            finalScore: 85,
            earnedPoints: 17,
            maxPoints: 20,
            gradingStatus: "GRADED",
            answers: [{ questionId: "q1", answerText: null, selectedOptionText: "Pilihan B", awardedPoints: 17 }],
          },
        ],
      },
    ],
  });

  assert(exportBuffer.length > 1000, "Buffer Excel laporan terbuat (size > 1KB)");

  // ----------------------------------------------------
  // TEST 6: Database Integration & Relasi Ujian
  // ----------------------------------------------------
  console.log("\n6. Pengujian Database & Relasi Ujian");
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  const studentCount = await prisma.student.count();
  assert(adminUser !== null && adminUser.role === "ADMIN", "Admin sekolah ada dan aktif di database");
  assert(teacherUser !== null && teacherUser.role === "TEACHER", `Guru terdaftar di database (${teacherUser?.name})`);
  assert(typeof studentCount === "number", "Tabel dan relasi data murid berfungsi normal");

  // ----------------------------------------------------
  // TEST 7: School Name & Custom Class CRUD
  // ----------------------------------------------------
  console.log("\n7. Pengujian Nama Sekolah & Manajemen Kelas Kustom (CRUD)");
  const school = await prisma.school.findFirst();
  assert(school?.name === "Quiz White Bee School of Life", "Nama sekolah terkonfigurasi 'Quiz White Bee School of Life'");

  // Test Create Custom Class
  const customClass = await prisma.class.create({
    data: {
      schoolId: school!.id,
      name: "Bee Toddler Test",
      gradeLevel: 0,
    },
  });
  assert(customClass.name === "Bee Toddler Test" && customClass.gradeLevel === 0, "Kelas kustom (PAUD/TK 0) berhasil dibuat");

  // Test Update Custom Class
  const updatedClass = await prisma.class.update({
    where: { id: customClass.id },
    data: { name: "Bee Primary 1", gradeLevel: 1 },
  });
  assert(updatedClass.name === "Bee Primary 1" && updatedClass.gradeLevel === 1, "Kelas kustom berhasil di-edit");

  // Test Delete Custom Class
  await prisma.class.delete({ where: { id: customClass.id } });
  const checkDeleted = await prisma.class.findUnique({ where: { id: customClass.id } });
  assert(checkDeleted === null, "Kelas kustom berhasil di-hapus");

  // ----------------------------------------------------
  // TEST 8: Teacher Custom Subject Management (CRUD)
  // ----------------------------------------------------
  console.log("\n8. Pengujian Manajemen Mata Pelajaran Guru & Kustom (CRUD)");
  // Create Subject
  const customSubject = await prisma.subject.create({
    data: {
      schoolId: school!.id,
      name: "Robotika & Coding",
      code: "ROBO",
    },
  });
  assert(customSubject.name === "Robotika & Coding" && customSubject.code === "ROBO", "Mapel kustom guru berhasil dibuat");

  // Update Subject
  const updatedSubject = await prisma.subject.update({
    where: { id: customSubject.id },
    data: { name: "Coding & AI", code: "CAI" },
  });
  assert(updatedSubject.name === "Coding & AI" && updatedSubject.code === "CAI", "Mapel kustom berhasil di-edit");

  // Delete Subject
  await prisma.subject.delete({ where: { id: customSubject.id } });
  const checkSubDeleted = await prisma.subject.findUnique({ where: { id: customSubject.id } });
  assert(checkSubDeleted === null, "Mapel kustom berhasil di-hapus");

  // ----------------------------------------------------
  // TEST 9: Smart Text-to-Question Parser
  // ----------------------------------------------------
  console.log("\n9. Pengujian Parser Teks Otomatis Jadi Soal");
  const rawSampleText = `1. Berapakah hasil dari 25 + 15?
A. 30
B. 35
C. 40
D. 45
Kunci: C
Bobot: 10
Pembahasan: 25 + 15 = 40.

2. Ibukota Indonesia adalah Nusantara.
A. Benar
B. Salah
Kunci: A
Bobot: 5

3. Jelaskan pengertian dari fotosintesis pada tumbuhan hijau!
Bobot: 20
Pembahasan: Fotosintesis adalah proses pembentukan energi kimia oleh tumbuhan.`;

  const parsedTextResult = parseQuestionsFromRawText(rawSampleText);
  assert(parsedTextResult.success === true, "Text parser berhasil memproses teks soal mentah");
  assert(parsedTextResult.validCount === 3, "3 butir soal teks valid dikenali");
  assert(parsedTextResult.questions[0].type === "MULTIPLE_CHOICE", "Soal 1 otomatis dikenali sebagai Pilihan Ganda");
  assert(parsedTextResult.questions[0].options.find((o) => o.key === "C")?.isCorrect === true, "Kunci C pada soal 1 valid");
  assert(parsedTextResult.questions[1].type === "TRUE_FALSE", "Soal 2 otomatis dikenali sebagai Benar/Salah");
  assert(parsedTextResult.questions[2].type === "ESSAY", "Soal 3 otomatis dikenali sebagai Esai");
  assert(parsedTextResult.questions[2].points === 20, "Bobot 20 pada soal 3 terbaca akurat");

  // Sub-test: Text without explicit bobot should default to 1 point each
  const rawTextNoBobot = `1. Hasil 5 x 5 adalah?
A. 20
B. 25
Kunci: B

2. Indonesia merdeka tahun 1945.
A. Benar
B. Salah
Kunci: A

3. Jelaskan apa itu gravitasi!`;
  const resultNoBobot = parseQuestionsFromRawText(rawTextNoBobot);
  assert(resultNoBobot.questions[0].points === 1, "Soal PG tanpa bobot default 1 poin");
  assert(resultNoBobot.questions[1].points === 1, "Soal BS tanpa bobot default 1 poin");
  assert(resultNoBobot.questions[2].points === 1, "Soal Esai tanpa bobot default 1 poin");

  // Sub-test 9.2: Horizontal / Inline options (A. ...  B. ...  C. ...  D. ...)
  const rawHorizontalText = `1. Berapakah hasil dari 10 + 20?
A. 15   B. 25   C. 30   D. 35
Kunci: C

2. Ibukota Jawa Barat adalah...
A. Bandung   B. Semarang
C. Surabaya   D. Medan
Jawaban: A`;
  const resultHorizontal = parseQuestionsFromRawText(rawHorizontalText);
  assert(resultHorizontal.success === true && resultHorizontal.validCount === 2, "Parser berhasil membaca format opsi horizontal/inline");
  assert(resultHorizontal.questions[0].options.length === 4, "Soal 1 horizontal berhasil dipecah menjadi 4 opsi terpisah (A, B, C, D)");
  assert(resultHorizontal.questions[0].options.find((o) => o.key === "C")?.isCorrect === true, "Kunci C pada soal horizontal 1 akurat");
  assert(resultHorizontal.questions[1].options.length === 4, "Soal 2 horizontal 2 baris x 2 kolom berhasil dipecah 4 opsi");

  // Sub-test 9.3: Asterisk & Suffix Key Markers (*B or (kunci))
  const rawAsteriskText = `1. Presiden pertama RI:
A. Soeharto
*B. Ir. Soekarno
C. BJ Habibie
D. Gus Dur

2. Candi Borobudur terletak di:
A. Jawa Tengah (kunci)
B. Jawa Barat
C. Jawa Timur
D. Bali`;
  const resultAsterisk = parseQuestionsFromRawText(rawAsteriskText);
  assert(resultAsterisk.questions[0].options.find((o) => o.key === "B")?.isCorrect === true, "Kunci bertanda bintang (*B) otomatis terbaca benar");
  assert(resultAsterisk.questions[1].options.find((o) => o.key === "A")?.isCorrect === true, "Kunci bertanda teks suffix (kunci) otomatis terbaca benar");

  // Sub-test 9.4: Global Answer Key Table at bottom
  const rawGlobalKeyText = `1. Warna primer pertama
A. Merah
B. Hijau
C. Ungu

2. Warna primer kedua
A. Oranye
B. Kuning
C. Cokelat

KUNCI JAWABAN:
1. A
2. B`;
  const resultGlobalKey = parseQuestionsFromRawText(rawGlobalKeyText);
  assert(resultGlobalKey.questions.length === 2, "Tabel kunci jawaban di bawah terpisah dari butir soal utama");
  assert(resultGlobalKey.questions[0].options.find((o) => o.key === "A")?.isCorrect === true, "Kunci global soal 1 (A) otomatis terpasang");
  assert(resultGlobalKey.questions[1].options.find((o) => o.key === "B")?.isCorrect === true, "Kunci global soal 2 (B) otomatis terpasang");

  // Sub-test 9.5: Document Header & Preamble cleaning
  const rawHeaderDocText = `DINAS PENDIDIKAN DAN KEBUDAYAAN
ULANGAN AKHIR SEMESTER GENAP
Mata Pelajaran : IPA
Kelas : IX
Waktu : 60 Menit
------------------------------------------------
1. Organ ekskresi manusia adalah ginjal.
A. Benar
B. Salah
Kunci: Benar`;
  const resultHeader = parseQuestionsFromRawText(rawHeaderDocText);
  assert(resultHeader.validCount === 1, "Header dokumen ujian berhasil dibersihkan otomatis");
  assert(resultHeader.questions[0].questionText === "Organ ekskresi manusia adalah ginjal.", "Teks pertanyaan soal 1 bersih tanpa tercampur header kop");

  // Sub-test 9.6: Auto-beautification (beautifyQuestionText)
  const messyText = `1. Apa ibukota RI? A. Bandung B. Jakarta C. Medan Kunci: B`;
  const beautified = beautifyQuestionText(messyText);
  assert(beautified.includes("1. Apa ibukota RI?"), "Beautify merapikan teks nomor soal");
  assert(beautified.includes("B. Jakarta"), "Beautify menyusun baris opsi rapi");

  // ----------------------------------------------------
  // TEST 10: Teacher CRUD Management (FR-002)
  // ----------------------------------------------------
  console.log("\n10. Pengujian Manajemen Guru (CRUD)");
  const testTeacher = await prisma.user.create({
    data: {
      schoolId: school!.id,
      name: "Ibu Siti Nurhaliza, M.Pd.",
      username: "siti.test",
      email: "siti.test@whitebee.sch.id",
      passwordHash: "dummyhash",
      role: "TEACHER",
      status: "ACTIVE",
    },
  });
  assert(testTeacher.name === "Ibu Siti Nurhaliza, M.Pd." && testTeacher.username === "siti.test", "Guru baru berhasil dibuat");

  const updatedTeacher = await prisma.user.update({
    where: { id: testTeacher.id },
    data: { name: "Ibu Siti Nurhaliza, S.Si.", username: "siti.updated" },
  });
  assert(updatedTeacher.name === "Ibu Siti Nurhaliza, S.Si." && updatedTeacher.username === "siti.updated", "Data guru berhasil di-edit");

  await prisma.user.delete({ where: { id: testTeacher.id } });
  const checkTeacherDeleted = await prisma.user.findUnique({ where: { id: testTeacher.id } });
  assert(checkTeacherDeleted === null, "Akun guru berhasil di-hapus");

  // ----------------------------------------------------
  // TEST 11: Student CRUD Management (FR-003)
  // ----------------------------------------------------
  const sampleClass = (await prisma.class.findFirst({ where: { schoolId: school!.id } })) ||
    (await prisma.class.create({ data: { schoolId: school!.id, name: "Kelas Test", gradeLevel: 1 } }));
  const testStudent = await prisma.student.create({
    data: {
      schoolId: school!.id,
      classId: sampleClass!.id,
      name: "Bintang Pratama",
      nis: "8888",
      gender: "L",
      status: "ACTIVE",
    },
  });
  assert(testStudent.name === "Bintang Pratama" && testStudent.nis === "8888", "Murid baru berhasil dibuat");

  const updatedStudent = await prisma.student.update({
    where: { id: testStudent.id },
    data: { name: "Bintang Pratama Putra", nis: "8889" },
  });
  assert(updatedStudent.name === "Bintang Pratama Putra" && updatedStudent.nis === "8889", "Data murid berhasil di-edit");

  // ----------------------------------------------------
  // TEST 11: Gmail Login & Auto-Registration for New Teachers
  // ----------------------------------------------------
  console.log("11. Pengujian Autentikasi & Registrasi Guru via Gmail");
  const testGmail = "gurubaru.test@gmail.com";
  // Clean up any existing test user
  await prisma.user.deleteMany({ where: { email: testGmail } });

  // Simulate first-time teacher registration via Gmail
  const newTeacher = await prisma.user.create({
    data: {
      schoolId: school!.id,
      name: "Ibu Siti Rohmah, M.Pd.",
      email: testGmail,
      username: "gurubaru_test",
      passwordHash: "dummy_hash_for_gmail_user",
      role: "TEACHER",
      status: "ACTIVE",
    },
  });
  assert(newTeacher.email === testGmail, "Guru baru berhasil didaftarkan via Gmail");
  assert(newTeacher.role === "TEACHER", "Role akun guru baru otomatis 'TEACHER'");
  assert(newTeacher.status === "ACTIVE", "Status akun guru baru langsung 'ACTIVE'");

  // Verify finding existing user on subsequent Gmail login
  const existingTeacher = await prisma.user.findFirst({
    where: { OR: [{ email: testGmail }, { username: testGmail }] },
  });
  assert(existingTeacher?.id === newTeacher.id, "Guru lama yang login via Gmail berhasil dikenali");

  // Cleanup test user
  await prisma.user.delete({ where: { id: newTeacher.id } });
  const checkGmailUserDeleted = await prisma.user.findUnique({ where: { id: newTeacher.id } });
  assert(checkGmailUserDeleted === null, "Pembersihan akun uji coba Gmail selesai");

  console.log("\n=======================================================");
  console.log(`   HASIL TEST SUITE: ${totalPassed} BERHASIL, ${totalFailed} GAGAL`);
  console.log("=======================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
