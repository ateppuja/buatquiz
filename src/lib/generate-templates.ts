import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

async function generateTemplates() {
  const dir = path.join(process.cwd(), "public", "templates");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Template Soal Excel
  const questionRows = [
    {
      tipe_soal: "PG",
      pertanyaan: "Berapakah hasil dari 15 × 4?",
      opsi_a: "45",
      opsi_b: "50",
      opsi_c: "60",
      opsi_d: "75",
      opsi_e: "80",
      kunci_jawaban: "C",
      bobot: 5,
      pembahasan: "15 dikali 4 sama dengan 60.",
    },
    {
      tipe_soal: "BS",
      pertanyaan: "Bumi mengelilingi Matahari dalam tata surya kita.",
      opsi_a: "",
      opsi_b: "",
      opsi_c: "",
      opsi_d: "",
      opsi_e: "",
      kunci_jawaban: "BENAR",
      bobot: 5,
      pembahasan: "Bumi bergerak mengelilingi matahari yang disebut revolusi bumi.",
    },
    {
      tipe_soal: "ESAI",
      pertanyaan: "Jelaskan perbedaan antara perpindahan kalor secara konduksi, konveksi, dan radiasi!",
      opsi_a: "",
      opsi_b: "",
      opsi_c: "",
      opsi_d: "",
      opsi_e: "",
      kunci_jawaban: "",
      bobot: 15,
      pembahasan: "Konduksi: hantaran zat padat tanpa perpindahan partikel. Konveksi: hantaran zat cair/gas dengan perpindahan partikel. Radiasi: pancaran tanpa zat perantara.",
    },
  ];

  const wsQuestions = XLSX.utils.json_to_sheet(questionRows);
  const wbQuestions = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbQuestions, wsQuestions, "Soal");
  const qExcelBuffer = XLSX.write(wbQuestions, { type: "buffer", bookType: "xlsx" });
  fs.writeFileSync(path.join(dir, "template_soal_examcode.xlsx"), qExcelBuffer);

  // 2. Template Siswa Excel
  const studentRows = [
    {
      nis: "1001",
      nama: "Ahmad Fauzi",
      kelas: "IX A",
      jenis_kelamin: "L",
      pin: "1234",
    },
    {
      nis: "1002",
      nama: "Siti Rahmawati",
      kelas: "IX A",
      jenis_kelamin: "P",
      pin: "2345",
    },
    {
      nis: "1003",
      nama: "Budi Santoso",
      kelas: "IX B",
      jenis_kelamin: "L",
      pin: "3456",
    },
    {
      nis: "1004",
      nama: "Dewi Lestari",
      kelas: "IX B",
      jenis_kelamin: "P",
      pin: "4567",
    },
  ];

  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  const wbStudents = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbStudents, wsStudents, "Siswa");
  const sExcelBuffer = XLSX.write(wbStudents, { type: "buffer", bookType: "xlsx" });
  fs.writeFileSync(path.join(dir, "template_siswa_examcode.xlsx"), sExcelBuffer);

  // 3. Template Soal Word (.docx)
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "TEMPLATE SOAL EXAMCODE SCHOOL",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Gunakan format penanda [SOAL] dan [/SOAL] untuk setiap butir soal di bawah ini.",
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "[SOAL]" }),
          new Paragraph({ text: "TIPE: PG" }),
          new Paragraph({ text: "PERTANYAAN: Berapakah hasil dari 25 + 75?" }),
          new Paragraph({ text: "A: 80" }),
          new Paragraph({ text: "B: 90" }),
          new Paragraph({ text: "C: 100" }),
          new Paragraph({ text: "D: 110" }),
          new Paragraph({ text: "KUNCI: C" }),
          new Paragraph({ text: "BOBOT: 5" }),
          new Paragraph({ text: "PEMBAHASAN: 25 + 75 = 100" }),
          new Paragraph({ text: "[/SOAL]" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "[SOAL]" }),
          new Paragraph({ text: "TIPE: BS" }),
          new Paragraph({ text: "PERTANYAAN: Ibukota Republik Indonesia adalah Jakarta." }),
          new Paragraph({ text: "KUNCI: BENAR" }),
          new Paragraph({ text: "BOBOT: 5" }),
          new Paragraph({ text: "[/SOAL]" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "[SOAL]" }),
          new Paragraph({ text: "TIPE: ESAI" }),
          new Paragraph({ text: "PERTANYAAN: Sebutkan 3 contoh sumber energi terbarukan dan jelaskan keunggulannya!" }),
          new Paragraph({ text: "BOBOT: 15" }),
          new Paragraph({ text: "[/SOAL]" }),
        ],
      },
    ],
  });

  const docBuffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(dir, "template_soal_examcode.docx"), docBuffer);
  console.log("Templates created successfully!");
}

export { generateTemplates };
