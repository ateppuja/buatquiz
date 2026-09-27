import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateTemplates } from "../src/lib/generate-templates";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Generate public templates
  try {
    await generateTemplates();
  } catch (e) {
    console.log("Template generation error:", e);
  }

  // 1. Create School
  const school = await prisma.school.upsert({
    where: { id: "school-smpn1" },
    update: {},
    create: {
      id: "school-smpn1",
      name: "Quiz White Bee School of Life",
      npsn: "10293847",
      address: "Jl. Pendidikan No. 45, Jakarta",
      timezone: "Asia/Jakarta",
    },
  });

  // 2. Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { id: "ay-2026-2027" },
    update: {},
    create: {
      id: "ay-2026-2027",
      schoolId: school.id,
      name: "2026/2027",
      semester: 1,
      isActive: true,
    },
  });

  // 3. Classes
  const class7A = await prisma.class.upsert({
    where: { id: "class-7a" },
    update: {},
    create: { id: "class-7a", schoolId: school.id, academicYearId: academicYear.id, name: "VII A", gradeLevel: 7 },
  });

  const class8A = await prisma.class.upsert({
    where: { id: "class-8a" },
    update: {},
    create: { id: "class-8a", schoolId: school.id, academicYearId: academicYear.id, name: "VIII A", gradeLevel: 8 },
  });

  const class9A = await prisma.class.upsert({
    where: { id: "class-9a" },
    update: {},
    create: { id: "class-9a", schoolId: school.id, academicYearId: academicYear.id, name: "IX A", gradeLevel: 9 },
  });

  const class9B = await prisma.class.upsert({
    where: { id: "class-9b" },
    update: {},
    create: { id: "class-9b", schoolId: school.id, academicYearId: academicYear.id, name: "IX B", gradeLevel: 9 },
  });

  // 4. Subjects
  const subMath = await prisma.subject.upsert({
    where: { id: "sub-mtk" },
    update: {},
    create: { id: "sub-mtk", schoolId: school.id, name: "Matematika", code: "MTK" },
  });

  const subIPA = await prisma.subject.upsert({
    where: { id: "sub-ipa" },
    update: {},
    create: { id: "sub-ipa", schoolId: school.id, name: "Ilmu Pengetahuan Alam", code: "IPA" },
  });

  const subBIndo = await prisma.subject.upsert({
    where: { id: "sub-bin" },
    update: {},
    create: { id: "sub-bin", schoolId: school.id, name: "Bahasa Indonesia", code: "BIN" },
  });

  // 5. Users (Admin & Teachers)
  const adminPassword = await bcrypt.hash("admin123", 10);
  const teacherPassword = await bcrypt.hash("guru123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@examcode.sch.id" },
    update: {},
    create: {
      id: "user-admin",
      schoolId: school.id,
      name: "Administrator Sekolah",
      username: "admin",
      email: "admin@examcode.sch.id",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const teacherBudi = await prisma.user.upsert({
    where: { email: "budi@examcode.sch.id" },
    update: {},
    create: {
      id: "user-budi",
      schoolId: school.id,
      nip: "198501152010011002",
      name: "Pak Budi Santoso, S.Pd.",
      username: "budi",
      email: "budi@examcode.sch.id",
      passwordHash: teacherPassword,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  const teacherSiti = await prisma.user.upsert({
    where: { email: "siti@examcode.sch.id" },
    update: {},
    create: {
      id: "user-siti",
      schoolId: school.id,
      nip: "198803202014022003",
      name: "Ibu Siti Aminah, M.Pd.",
      username: "siti",
      email: "siti@examcode.sch.id",
      passwordHash: teacherPassword,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  // Assign classes to teacher Budi
  await prisma.teacherClass.upsert({
    where: { teacherId_classId_subjectId: { teacherId: teacherBudi.id, classId: class9A.id, subjectId: subMath.id } },
    update: {},
    create: { teacherId: teacherBudi.id, classId: class9A.id, subjectId: subMath.id },
  });

  await prisma.teacherClass.upsert({
    where: { teacherId_classId_subjectId: { teacherId: teacherBudi.id, classId: class9B.id, subjectId: subMath.id } },
    update: {},
    create: { teacherId: teacherBudi.id, classId: class9B.id, subjectId: subMath.id },
  });

  // 6. Students
  const studentsData = [
    { nis: "1001", name: "Ahmad Fauzi", classId: class9A.id, gender: "L", pin: "1234" },
    { nis: "1002", name: "Siti Rahmawati", classId: class9A.id, gender: "P", pin: "2345" },
    { nis: "1003", name: "Budi Santoso", classId: class9A.id, gender: "L", pin: "3456" },
    { nis: "1004", name: "Dewi Lestari", classId: class9A.id, gender: "P", pin: "4567" },
    { nis: "1005", name: "Eko Prasetyo", classId: class9A.id, gender: "L", pin: "5678" },
    { nis: "1006", name: "Fitri Handayani", classId: class9B.id, gender: "P", pin: "6789" },
    { nis: "1007", name: "Gilang Ramadhan", classId: class9B.id, gender: "L", pin: "7890" },
    { nis: "1008", name: "Hana Pertiwi", classId: class9B.id, gender: "P", pin: "8901" },
  ];

  for (const s of studentsData) {
    const existing = await prisma.student.findFirst({
      where: { schoolId: school.id, name: s.name, classId: s.classId },
    });
    if (!existing) {
      await prisma.student.create({
        data: {
          schoolId: school.id,
          nis: s.nis,
          name: s.name,
          classId: s.classId,
          gender: s.gender,
          pin: s.pin,
          status: "ACTIVE",
        },
      });
    }
  }

  // 7. Exams & Questions
  const now = new Date();
  const startAt = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
  const endAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days from now

  const examActive = await prisma.exam.upsert({
    where: { id: "exam-mtk-9a" },
    update: {},
    create: {
      id: "exam-mtk-9a",
      schoolId: school.id,
      teacherId: teacherBudi.id,
      subjectId: subMath.id,
      title: "Ujian Matematika Semester 1 Kelas IX A",
      description: "Ujian mencakup materi bilangan berpangkat, persamaan kuadrat, dan geometri dasar.",
      instructions: "Bacalah setiap butir soal dengan cermat sebelum menjawab. Dilarang bekerja sama atau membuka catatan.",
      examCode: "MTK9A2BC",
      durationMinutes: 60,
      startAt: startAt,
      endAt: endAt,
      maxAttempts: 3,
      gradingMethod: "HIGHEST",
      resultVisibility: "IMMEDIATE",
      shuffleQuestions: false,
      shuffleOptions: false,
      navigationMode: "FREE",
      showAnswerKey: true,
      status: "PUBLISHED",
      publishedAt: now,
    },
  });

  // Assign class IX A to exam
  await prisma.examClass.upsert({
    where: { examId_classId: { examId: examActive.id, classId: class9A.id } },
    update: {},
    create: { examId: examActive.id, classId: class9A.id },
  });

  // Questions for Exam 1
  // Q1: PG
  const q1 = await prisma.question.upsert({
    where: { id: "q-mtk-1" },
    update: {},
    create: {
      id: "q-mtk-1",
      examId: examActive.id,
      type: "MULTIPLE_CHOICE",
      questionText: "Berapakah hasil dari 15 × 4?",
      points: 20,
      explanation: "15 dikali 4 menghasilkan 60.",
      orderIndex: 0,
    },
  });

  await prisma.questionOption.createMany({
    data: [
      { id: "opt-q1-a", questionId: q1.id, optionKey: "A", optionText: "45", isCorrect: false, orderIndex: 0 },
      { id: "opt-q1-b", questionId: q1.id, optionKey: "B", optionText: "50", isCorrect: false, orderIndex: 1 },
      { id: "opt-q1-c", questionId: q1.id, optionKey: "C", optionText: "60", isCorrect: true, orderIndex: 2 },
      { id: "opt-q1-d", questionId: q1.id, optionKey: "D", optionText: "75", isCorrect: false, orderIndex: 3 },
    ],
  }).catch(() => {});

  // Q2: PG
  const q2 = await prisma.question.upsert({
    where: { id: "q-mtk-2" },
    update: {},
    create: {
      id: "q-mtk-2",
      examId: examActive.id,
      type: "MULTIPLE_CHOICE",
      questionText: "Berapakah nilai dari 8² - √144?",
      points: 20,
      explanation: "8² = 64, √144 = 12. Jadi 64 - 12 = 52.",
      orderIndex: 1,
    },
  });

  await prisma.questionOption.createMany({
    data: [
      { id: "opt-q2-a", questionId: q2.id, optionKey: "A", optionText: "50", isCorrect: false, orderIndex: 0 },
      { id: "opt-q2-b", questionId: q2.id, optionKey: "B", optionText: "52", isCorrect: true, orderIndex: 1 },
      { id: "opt-q2-c", questionId: q2.id, optionKey: "C", optionText: "56", isCorrect: false, orderIndex: 2 },
      { id: "opt-q2-d", questionId: q2.id, optionKey: "D", optionText: "60", isCorrect: false, orderIndex: 3 },
    ],
  }).catch(() => {});

  // Q3: BS
  const q3 = await prisma.question.upsert({
    where: { id: "q-mtk-3" },
    update: {},
    create: {
      id: "q-mtk-3",
      examId: examActive.id,
      type: "TRUE_FALSE",
      questionText: "Sebuah segitiga sama sisi memiliki tiga sudut yang besarnya masing-masing 60 derajat.",
      points: 20,
      explanation: "Jumlah sudut segitiga adalah 180°. Pada segitiga sama sisi, 180° / 3 = 60°.",
      orderIndex: 2,
    },
  });

  await prisma.questionOption.createMany({
    data: [
      { id: "opt-q3-benar", questionId: q3.id, optionKey: "BENAR", optionText: "Benar", isCorrect: true, orderIndex: 0 },
      { id: "opt-q3-salah", questionId: q3.id, optionKey: "SALAH", optionText: "Salah", isCorrect: false, orderIndex: 1 },
    ],
  }).catch(() => {});

  // Q4: Esai
  const q4 = await prisma.question.upsert({
    where: { id: "q-mtk-4" },
    update: {},
    create: {
      id: "q-mtk-4",
      examId: examActive.id,
      type: "ESSAY",
      questionText: "Jelaskan langkah-langkah untuk menentukan akar-akar persamaan kuadrat x² - 5x + 6 = 0 menggunakan metode pemfaktoran!",
      points: 40,
      explanation: "Cari dua bilangan yang hasil kalinya 6 dan jumlahnya -5, yaitu -2 dan -3. Sehingga (x - 2)(x - 3) = 0. Akar-akarnya adalah x = 2 atau x = 3.",
      orderIndex: 3,
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
