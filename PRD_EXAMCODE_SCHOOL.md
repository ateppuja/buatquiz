PRODUCT REQUIREMENTS DOCUMENT (PRD)
Sistem Ujian Online Sekolah Berbasis Kode Akses
Final · Siap untuk Pengembangan
ExamCode School
Platform ujian online terintegrasi untuk satu sekolah, dengan pembuatan soal oleh guru, akses ujian menggunakan kode unik, penilaian otomatis, dan pengelolaan hasil ujian secara terpusat.

Versi Dokumen
2.0 — Final MVP

Tanggal
23 September 2026

Target Pengguna
Satu Sekolah

Platform
Web Responsif

Metode Akses Murid
Kode Ujian + Identitas


1. Ringkasan Eksekutif
ExamCode School adalah aplikasi berbasis web yang memungkinkan sebuah sekolah menyelenggarakan ujian secara digital tanpa memerlukan instalasi aplikasi khusus pada perangkat guru maupun murid.
Guru dapat membuat ujian melalui dashboard dengan memasukkan soal secara manual atau mengunggah dokumen Word dan Excel.
Setelah soal dimasukkan, sistem akan membentuk ujian secara otomatis, menyimpan kunci jawaban, membuat halaman pengerjaan, dan menghasilkan kode ujian unik yang dapat dibagikan kepada murid.
Murid tidak perlu memiliki akun. Mereka cukup membuka website, memasukkan kode ujian, mengisi identitas, kemudian mengerjakan soal sesuai waktu dan ketentuan yang ditetapkan guru.
Sistem secara otomatis menyimpan jawaban, menghitung nilai untuk soal objektif, dan menyediakan laporan hasil ujian yang dapat diakses guru serta administrator sekolah.
Guru memiliki kendali terhadap jumlah percobaan ujian, jadwal pelaksanaan, durasi, pengacakan soal, dan publikasi nilai.
1.1 Sasaran Utama
Produk harus memungkinkan sekolah menjalankan seluruh proses ujian melalui satu aplikasi:
Administrator menyiapkan sistem sekolah
Mengelola guru, kelas, mata pelajaran, dan pengaturan sekolah.


Guru membuat ujian
Menulis soal atau mengimpor soal dari Word dan Excel.


Sistem menghasilkan kode ujian
Membuat ujian yang siap diakses murid sesuai jadwal.


Murid mengikuti ujian
Memasukkan kode, mengisi identitas, dan mengerjakan soal.


Guru memperoleh hasil ujian
Memantau peserta, memeriksa jawaban, dan mengunduh laporan nilai.


2. Ruang Lingkup Produk
2.1 Fitur yang Termasuk dalam MVP
Modul	Fitur
Administrasi sekolah	Akun administrator, guru, kelas, mata pelajaran, dan data murid
Autentikasi	Login administrator dan guru
Dashboard guru	Ringkasan ujian, peserta, dan hasil
Pembuatan soal	Input manual dan import Word/Excel
Pengelolaan ujian	Jadwal, durasi, pengacakan, kode, dan batas percobaan
Akses murid	Kode ujian dan identitas tanpa akun
Pelaksanaan ujian	Timer, navigasi soal, autosave, dan pengumpulan
Penilaian	Penilaian otomatis dan pemeriksaan esai
Laporan	Rekap peserta, nilai, statistik, dan ekspor Excel
Publikasi hasil	Guru menentukan kapan nilai dapat dilihat murid
2.2 Fitur di Luar MVP
Fitur berikut tidak termasuk dalam pengembangan versi pertama:
- Pembuatan soal menggunakan AI.
- Pemeriksaan esai menggunakan AI.
- Aplikasi Android dan iOS native.
- Sistem pembayaran atau berlangganan.
- Integrasi dengan sistem sekolah eksternal.
- Pengawasan ujian menggunakan webcam.
- Penguncian perangkat atau browser.
- Koreksi otomatis terhadap dokumen soal yang formatnya tidak sesuai.
Fitur-fitur tersebut dapat dipertimbangkan pada pengembangan berikutnya.
3. Struktur Pengguna dan Hak Akses
Sistem memiliki tiga peran pengguna utama.
Administrator Sekolah

Administrator merupakan pengelola utama sistem ujian sekolah.
Hak akses:
- Membuat, mengedit, menonaktifkan, dan mengatur ulang akses akun guru.
- Mengelola daftar kelas dan mata pelajaran.
- Mengimpor serta mengelola data identitas murid.
- Melihat seluruh ujian di sekolah.
- Melihat laporan ujian seluruh kelas.
- Menutup ujian dalam keadaan darurat.
- Mengelola pengaturan sekolah dan kebijakan penyimpanan data.
- Melihat audit log aktivitas penting.

Guru

Guru merupakan pengguna yang membuat dan menyelenggarakan ujian.
Hak akses:
- Login menggunakan akun yang disediakan sekolah.
- Membuat dan mengelola ujian miliknya.
- Menambahkan soal secara manual.
- Mengimpor soal dari Word dan Excel.
- Mengatur kelas peserta, jadwal, durasi, dan jumlah percobaan.
- Membagikan kode ujian.
- Memantau peserta selama ujian.
- Memeriksa jawaban esai dan mengelola publikasi nilai.
- Mengunduh laporan hasil ujian.

Murid
Tanpa Akun

Murid mengakses ujian menggunakan kode dan identitas yang terdaftar di sekolah.
Hak akses:
- Memasukkan kode ujian.
- Mengisi NIS dan nama lengkap.
- Mengikuti ujian sesuai kelas dan jadwal.
- Mengulang ujian apabila diizinkan guru.
- Melihat nilai jika telah dipublikasikan.

Keputusan autentikasi: Administrator dan guru wajib login. Murid tidak menggunakan akun maupun password permanen, tetapi harus melalui validasi identitas dan sesi ujian yang aman.
4. Modul Administrasi Sekolah
FR-001 — Pengelolaan Akun Guru
Administrator dapat membuat akun guru dengan data berikut:
Field	Ketentuan
Nama lengkap	Wajib
NIP / ID Guru	Opsional, unik jika diisi
Email / Username	Wajib dan unik
Password	Dibuat melalui proses aktivasi atau reset yang aman
Mata pelajaran	Dapat lebih dari satu
Kelas yang diajar	Dapat lebih dari satu
Status	Aktif / Nonaktif
Akun guru yang dinonaktifkan tidak dapat membuat sesi login baru. Kebijakan penanganan sesi yang masih aktif harus diterapkan oleh sistem.
FR-002 — Pengelolaan Kelas
Administrator dapat membuat daftar kelas, misalnya:
- VII A, VII B, VII C
- VIII A, VIII B, VIII C
- IX A, IX B, IX C
Setiap kelas memiliki ID unik, nama kelas, tingkat, dan tahun ajaran.
Guru hanya dapat membuat ujian untuk kelas yang ditugaskan kepadanya, kecuali administrator memberikan izin tambahan.
FR-003 — Pengelolaan Data Murid
Administrator dapat memasukkan data murid secara manual atau mengimpor dari Excel.
Struktur data murid:
Field	Ketentuan
ID Murid	UUID internal
NIS	Wajib dan unik dalam sekolah
Nama lengkap	Wajib
Kelas	Wajib
Tahun ajaran	Wajib
Status	Aktif / Nonaktif
NIS menjadi identitas utama yang digunakan sistem untuk mengenali peserta ujian.
Untuk MVP, administrator mengimpor daftar murid sebelum ujian dilaksanakan.
Dengan demikian, murid tidak dapat mengikuti ujian hanya dengan memasukkan nama sembarang.
5. Modul Dashboard Guru
FR-004 — Dashboard Utama
Setelah login, guru diarahkan ke halaman dashboard.
DASHBOARD GURU
Selamat Datang, Pak Budi
Tahun Ajaran 2026/2027


12
Total Ujian


245
Total Peserta


3
Ujian Aktif


9
Ujian Selesai



Ujian Terbaru
Matematika Kelas IX A
Kode: MTK9A2

Aktif


Matematika Kelas VIII B
Kode: MTK8B4

Selesai


Contoh desain dashboard dengan data ilustrasi.
Dashboard harus menyediakan navigasi menuju daftar ujian, pembuatan ujian, bank soal, hasil ujian, dan pengaturan akun.
6. Modul Pembuatan Ujian
FR-005 — Membuat Ujian Baru
Guru menekan tombol "Buat Ujian" untuk membuka formulir pembuatan ujian.
Formulir dibagi menjadi empat tahap.
Tahap 1 — Informasi Ujian
Field	Tipe	Ketentuan
Judul ujian	Text	Wajib, maksimal 150 karakter
Mata pelajaran	Dropdown	Wajib
Kelas peserta	Multi-select	Minimal satu kelas
Deskripsi	Textarea	Opsional
Instruksi pengerjaan	Rich text	Opsional
Durasi	Integer	Wajib, 1–300 menit
Waktu mulai	Datetime	Wajib
Waktu berakhir	Datetime	Wajib
Status awal	Enum	Draft
Waktu berakhir harus lebih besar daripada waktu mulai.
Semua waktu disimpan di database dalam UTC dan ditampilkan sesuai zona waktu sekolah, dengan default Asia/Jakarta.
Tahap 2 — Memasukkan Soal
Guru dapat memilih salah satu metode:
Metode A — Input Manual
Guru menulis soal langsung melalui editor website.



Metode B — Import Dokumen
Guru mengunggah file Word (.docx) atau Excel (.xlsx).



Kedua metode dapat digunakan secara bersamaan dalam satu ujian. Guru dapat mengimpor 20 soal dari dokumen, kemudian menambahkan 5 soal lagi secara manual.
Tahap 3 — Pengaturan Ujian
Guru menentukan aturan pelaksanaan, termasuk jumlah percobaan, pengacakan soal, navigasi, dan publikasi hasil.
Tahap 4 — Pratinjau dan Publikasi
Guru meninjau seluruh soal sebelum menerbitkan ujian.
Sistem harus menampilkan peringatan apabila terdapat soal yang belum memiliki kunci jawaban, bobot tidak valid, atau pengaturan ujian yang belum lengkap.
Setelah seluruh validasi berhasil, guru dapat menerbitkan ujian.
7. Modul Editor Soal
FR-006 — Jenis Soal
MVP mendukung tiga jenis soal.
Pilihan Ganda
Multiple Choice
Guru dapat memasukkan pertanyaan, 2–5 pilihan jawaban, satu kunci jawaban, bobot nilai, dan pembahasan opsional.
Contoh: Berapakah hasil dari 8 × 7?
A. 54
B. 56
C. 58
D. 64
Kunci: B · Bobot: 5 poin


Benar / Salah
True / False
Guru memasukkan pernyataan, memilih kunci benar atau salah, dan menentukan bobot nilai.
Contoh: Bumi mengelilingi Matahari.
Kunci: Benar · Bobot: 5 poin


Esai
Essay
Guru memasukkan pertanyaan, bobot maksimal, dan pedoman penilaian opsional.
Contoh: Jelaskan proses fotosintesis pada tumbuhan.
Bobot: 20 poin · Penilaian manual


FR-007 — Struktur Data Soal
Setiap soal memiliki atribut:
Atribut	Tipe
ID soal	UUID
ID ujian	UUID
Jenis soal	Enum
Pertanyaan	Rich text
Gambar soal	URL, opsional
Pilihan jawaban	Array, jika diperlukan
Kunci jawaban	Disimpan di server
Bobot nilai	Decimal
Pembahasan	Rich text, opsional
Nomor urut	Integer
Guru dapat mengedit, menduplikasi, menghapus, dan mengubah urutan soal selama ujian masih berstatus Draft.
Setelah ujian diterbitkan, perubahan substansial pada soal harus melalui mekanisme revisi terkontrol agar tidak mengubah hasil peserta yang sudah mengerjakan.
8. Modul Import Soal Word dan Excel
FR-008 — Import Word
Sistem menerima file .docx dengan ukuran maksimal 10 MB.
Untuk memastikan hasil import konsisten, sekolah menggunakan template dokumen yang telah ditentukan.
Contoh format dokumen:
Template_Soal_ExamCode.docx


[SOAL]
TIPE: PG
PERTANYAAN: Berapakah hasil 10 + 5?
A: 10
B: 15
C: 20
D: 25
KUNCI: B
BOBOT: 5
[/SOAL]

[SOAL]
TIPE: ESAI
PERTANYAAN: Jelaskan pengertian ekosistem.
BOBOT: 10
[/SOAL]

Parser membaca penanda [SOAL] dan [/SOAL], tipe soal, pertanyaan, pilihan jawaban, kunci, dan bobot.
Apabila dokumen memiliki format yang tidak sesuai, sistem menampilkan kesalahan beserta nomor soal atau bagian yang bermasalah.
Sistem tidak boleh langsung menerbitkan soal hasil import tanpa pratinjau dan persetujuan guru.
FR-009 — Import Excel
Sistem menerima file .xlsx dengan ukuran maksimal 10 MB.
Template Excel menggunakan struktur kolom berikut:
Kolom	Keterangan
tipe_soal	PG / BS / ESAI
pertanyaan	Isi soal
opsi_a	Pilihan A
opsi_b	Pilihan B
opsi_c	Pilihan C
opsi_d	Pilihan D
opsi_e	Pilihan E
kunci_jawaban	A–E / BENAR / SALAH
bobot	Poin maksimal
pembahasan	Opsional
Untuk soal esai, kolom opsi dan kunci jawaban dapat dikosongkan.
Untuk soal benar/salah, sistem hanya menerima kunci BENAR atau SALAH.
Alur Import
1. Guru memilih file Word atau Excel.
2. Sistem memvalidasi jenis file, ukuran, dan struktur dokumen.
3. Sistem membaca soal dan menampilkannya pada halaman pratinjau.
4. Guru memeriksa hasil parsing dan memperbaiki soal yang bermasalah.
5. Guru menekan tombol "Tambahkan ke Ujian".
6. Sistem menyimpan soal ke dalam draft ujian.

Jika sebagian soal gagal dibaca, sistem harus menunjukkan soal yang berhasil dan yang gagal secara terpisah.
Import tidak boleh menghasilkan soal duplikat akibat pengiriman ulang permintaan yang sama.
9. Modul Pengaturan Ujian
FR-010 — Konfigurasi Pelaksanaan
Guru dapat mengatur parameter berikut:
Pengaturan	Pilihan	Default
Durasi ujian	1–300 menit	60 menit
Jadwal mulai	Tanggal dan jam	Wajib diisi
Jadwal berakhir	Tanggal dan jam	Wajib diisi
Acak soal	Aktif / Nonaktif	Nonaktif
Acak pilihan	Aktif / Nonaktif	Nonaktif
Navigasi soal	Bebas / Berurutan	Bebas
Jumlah percobaan	1–10 kali	1 kali
Metode nilai akhir	Tertinggi / Terakhir / Rata-rata	Tertinggi
Publikasi nilai	Langsung / Manual / Disembunyikan	Manual
Tampilkan kunci jawaban	Aktif / Nonaktif	Nonaktif
PIN tambahan	Aktif / Nonaktif	Nonaktif
Pengaturan jumlah percobaan dan metode nilai akhir merupakan bagian wajib dari MVP.
FR-011 — Aturan Percobaan Ujian
Guru dapat mengizinkan murid mengikuti ujian lebih dari satu kali.
Contoh:
Pengaturan Percobaan
Maksimal Percobaan3 kali

Metode Perhitungan Nilai Akhir
Nilai tertinggi

Nilai percobaan terakhir

Rata-rata seluruh percobaan


Ringkasan Pengaturan
Murid dapat mengikuti ujian maksimal 3 kali. Nilai akhir dihitung menggunakan nilai tertinggi.

Simulasi konfigurasi yang akan tersedia pada dashboard guru.
Aturan Teknis Percobaan
1. Setiap percobaan memiliki ID sesi yang berbeda.
2. Sistem mengidentifikasi murid berdasarkan ID murid yang telah diverifikasi.
3. Percobaan yang telah dikirim atau berakhir karena waktu habis dihitung sebagai satu percobaan.
4. Memuat ulang halaman tidak membuat percobaan baru.
5. Murid yang memiliki sesi aktif harus melanjutkan sesi tersebut sebelum membuat percobaan berikutnya.
6. Percobaan baru hanya dapat dimulai jika kuota masih tersedia dan jadwal ujian masih berlangsung.
7. Guru dapat mereset kuota percobaan peserta tertentu dengan alasan yang dicatat dalam audit log.
Untuk ujian dengan soal esai, nilai akhir baru ditetapkan setelah seluruh percobaan yang relevan selesai dinilai.
10. Sistem Kode Ujian Otomatis
FR-012 — Generator Kode
Ketika guru menerbitkan ujian, sistem menghasilkan kode unik secara otomatis.
Contoh:
Ujian Berhasil Diterbitkan
Matematika Kelas IX A
KODE UJIAN
MTK9A2
Aktif

 Salin Kode ContohIlustrasi kode ujian, bukan kode aktif.
Spesifikasi Kode
Parameter	Ketentuan
Panjang	8 karakter
Karakter	Huruf kapital dan angka, tanpa karakter ambigu
Generator	Cryptographically secure random generator
Keunikan	Dijamin oleh unique constraint database
Masa berlaku	Mengikuti jadwal dan status ujian
Format input	Tidak sensitif terhadap kapitalisasi
Penggunaan ulang	Tidak diperbolehkan selama masa retensi kode
Sistem harus mengulangi proses pembuatan kode apabila terjadi benturan kode unik.
Guru dapat menyalin kode, menyalin tautan ujian, dan menonaktifkan akses ujian.
11. Modul Akses Murid Tanpa Akun
FR-013 — Halaman Masuk Ujian
Murid membuka website dan memasukkan kode ujian.
ExamCode School
Masukkan kode ujian yang diberikan oleh guru.

Kode Ujian
Lanjutkan 
FR-014 — Validasi Identitas Murid
Setelah kode valid, sistem menampilkan informasi ujian dan formulir identitas.
Identitas Peserta
Ujian Matematika Kelas IX A
Durasi: 60 menit · Maksimal 3 percobaan

Nomor Induk Siswa (NIS)

Nama Lengkap

KelasPilih kelas

Verifikasi IdentitasIlustrasi formulir identitas murid.
Aturan Validasi
Sistem harus memeriksa bahwa:
- NIS terdaftar pada database sekolah.
- Nama dan kelas sesuai dengan data murid.
- Murid termasuk dalam kelas peserta ujian.
- Jadwal ujian mengizinkan akses.
- Kuota percobaan murid masih tersedia.
- Tidak terdapat sesi lain yang sedang aktif untuk ujian yang sama.
Apabila seluruh validasi berhasil, sistem membuat sesi peserta dan menampilkan halaman instruksi.
Keamanan identitas: NIS, nama, dan kelas bukan bukti identitas yang kuat karena dapat diketahui orang lain. Untuk penggunaan sekolah, MVP harus menyediakan PIN peserta sekali pakai atau token akses individual sebagai lapisan verifikasi tambahan yang dapat diaktifkan sekolah. Sistem juga harus membatasi percobaan verifikasi dan tidak mengungkap data murid melalui pesan kesalahan.
12. Modul Pelaksanaan Ujian
FR-015 — Halaman Pengerjaan
Halaman ujian menampilkan judul, identitas peserta, timer, soal, pilihan jawaban, progres pengerjaan, dan tombol pengumpulan.
MATEMATIKA KELAS IX A
Ujian Semester 1

 45:30

Progres Pengerjaan
8 dari 20




Soal 9 dari 20
Berapakah hasil dari 15 × 4?

A. 45

B. 50

C. 60

D. 75


 SebelumnyaSelanjutnya 
Ilustrasi halaman ujian. Timer dan penyimpanan jawaban akan terhubung ke server pada aplikasi sebenarnya.
FR-016 — Timer Ujian
Saat murid memulai percobaan, server mencatat started_at dan menghitung batas waktu pengerjaan.
Batas akhir percobaan ditentukan oleh waktu yang lebih awal antara:
- Waktu mulai percobaan ditambah durasi ujian.
- Waktu berakhir ujian yang ditetapkan guru.
Ketika timer mencapai nol, sistem mengakhiri percobaan dan menyimpan jawaban terakhir yang telah diterima.
Murid yang memuat ulang halaman tetap memiliki waktu tersisa yang sama berdasarkan batas waktu server.
FR-017 — Autosave Jawaban
Jawaban harus disimpan secara otomatis.
Untuk pilihan ganda dan benar/salah, penyimpanan dilakukan setelah murid memilih jawaban.
Untuk esai, sistem menggunakan mekanisme debounce sekitar 2 detik setelah murid berhenti mengetik.
Sistem menampilkan status:
 Menyimpan...
 Tersimpan
 Belum tersimpan

Jika koneksi terputus, aplikasi menyimpan perubahan yang belum terkirim secara lokal jika memungkinkan dan mencoba menyinkronkannya kembali ketika koneksi tersedia.
Server harus menggunakan nomor revisi jawaban untuk mencegah respons jaringan yang datang terlambat menimpa jawaban yang lebih baru.
FR-018 — Pengumpulan Jawaban
Murid dapat mengumpulkan jawaban dengan menekan tombol "Selesaikan Ujian".
Sistem menampilkan konfirmasi dan jumlah soal yang belum dijawab.
Setelah murid menyetujui pengumpulan, server menyimpan status percobaan sebagai submitted.
Jawaban yang sudah dikumpulkan tidak dapat diubah.
Pengiriman ulang permintaan yang sama tidak boleh membuat duplikasi hasil atau mengurangi kuota percobaan tambahan.
13. Modul Penilaian dan Publikasi Nilai
FR-019 — Penilaian Otomatis
Sistem menilai soal pilihan ganda dan benar/salah berdasarkan kunci jawaban dan bobot yang tersimpan.
Rumus nilai:
\[
\text{Nilai}=\frac{\text{Poin diperoleh}}{\text{Poin maksimal}}\times100
\]

Nilai disimpan dengan presisi dua angka desimal.
Untuk soal esai, guru memberikan nilai antara 0 dan bobot maksimal soal.
Jika masih ada esai yang belum dinilai, status hasil adalah pending_grading.
FR-020 — Perhitungan Nilai dari Beberapa Percobaan
Misalnya seorang murid mengikuti ujian sebanyak tiga kali.
Contoh Riwayat Percobaan
Percobaan	Nilai
Percobaan 1	60
Percobaan 2	80
Percobaan 3	90
Metode Nilai Akhir
TertinggiTerakhirRata-rata

Nilai Akhir
90,00


Metode penilaian dipilih guru sebelum ujian diterbitkan dan harus konsisten untuk seluruh peserta ujian tersebut.
FR-021 — Publikasi Hasil
Guru dapat memilih tiga mode publikasi.
Mode	Perilaku Sistem
Langsung	Nilai tersedia setelah percobaan selesai dan seluruh soal dinilai.
Manual	Nilai disembunyikan sampai guru menekan tombol "Publikasikan Hasil".
Disembunyikan	Nilai hanya tersedia untuk guru dan administrator.
Untuk mode langsung, nilai yang ditampilkan selama kuota percobaan masih tersedia merupakan nilai sementara sesuai metode perhitungan yang dipilih.
Jika guru mengaktifkan tampilan kunci jawaban, sistem hanya boleh menampilkannya setelah peserta tidak dapat lagi melakukan percobaan baru, misalnya setelah kuota habis atau periode ujian berakhir.
14. Modul Monitoring dan Laporan
FR-022 — Monitoring Peserta
Guru dapat melihat status peserta secara langsung.
Status	Keterangan
Belum mulai	Belum memiliki percobaan
Sedang mengerjakan	Memiliki sesi aktif
Selesai	Percobaan telah dikumpulkan
Waktu habis	Percobaan diakhiri karena batas waktu
Menunggu penilaian	Memiliki jawaban esai yang belum dinilai
Dashboard monitoring diperbarui secara berkala tanpa mengharuskan guru memuat ulang seluruh halaman.
FR-023 — Laporan Hasil Ujian
Laporan menampilkan:
- Nama dan NIS peserta.
- Kelas.
- Jumlah percobaan.
- Nilai setiap percobaan.
- Nilai akhir.
- Waktu mulai dan selesai.
- Status penilaian.
- Detail jawaban dan poin setiap soal.
Guru dapat mengunduh laporan dalam format Excel dan CSV.
Laporan Excel minimal memiliki dua sheet: Rekap Nilai dan Detail Percobaan.
15. Arsitektur Teknologi
Arsitektur berikut merupakan rancangan implementasi yang direkomendasikan untuk satu sekolah.
Frontend — Next.js + TypeScript
Halaman administrator, guru, dan murid


Backend — Next.js Server / API
Autentikasi, validasi ujian, pengelolaan sesi, dan penilaian


PostgreSQL
Data ujian, soal, murid, jawaban, nilai


Object Storage
Dokumen import dan gambar soal




15.1 Teknologi yang Digunakan
Komponen	Teknologi
Frontend	Next.js, React, TypeScript
Styling	Tailwind CSS, shadcn/ui
Backend	Next.js Route Handlers / Server Actions
Database	PostgreSQL
ORM	Prisma
Autentikasi guru	Auth.js atau Supabase Auth
Penyimpanan file	S3-compatible Object Storage
Import Word	Mammoth atau parser DOCX
Import Excel	SheetJS atau ExcelJS
Validasi input	Zod
Ekspor laporan	ExcelJS
Deployment	Vercel atau server sekolah
Monitoring	Sentry dan monitoring infrastruktur
Pemilihan penyedia hosting harus mempertimbangkan kebijakan sekolah terkait lokasi penyimpanan data, privasi murid, dan anggaran operasional.
16. Desain Database Final
Database menggunakan PostgreSQL dengan UUID sebagai primary key untuk entitas utama.
16.1 Daftar Tabel
Tabel	Fungsi
schools	Informasi dan konfigurasi sekolah
users	Akun administrator dan guru
academic_years	Tahun ajaran
classes	Data kelas
subjects	Mata pelajaran
teacher_classes	Relasi guru dan kelas
students	Identitas murid
student_classes	Riwayat kelas murid per tahun ajaran
exams	Informasi dan konfigurasi ujian
questions	Bank soal
exam_questions	Snapshot soal dan bobot dalam ujian
exam_participants	Daftar peserta yang diizinkan mengikuti ujian
exam_attempts	Setiap percobaan pengerjaan
attempt_questions	Urutan soal dan opsi untuk setiap percobaan
answers	Jawaban peserta per percobaan
exam_results	Rekap nilai akhir peserta
import_jobs	Status proses import Word/Excel
audit_logs	Riwayat aktivitas penting
16.2 Struktur Tabel Exams
Field	Tipe	Ketentuan
id	UUID	Primary key
school_id	UUID	Foreign key
teacher_id	UUID	Foreign key
title	VARCHAR(150)	Not null
subject_id	UUID	Foreign key
exam_code	VARCHAR(8)	Unique, nullable saat Draft
duration_minutes	INTEGER	1–300
start_at	TIMESTAMPTZ	Not null
end_at	TIMESTAMPTZ	Not null
max_attempts	INTEGER	1–10
grading_method	ENUM	highest/latest/average
result_visibility	ENUM	immediate/manual/hidden
shuffle_questions	BOOLEAN	Default false
shuffle_options	BOOLEAN	Default false
status	ENUM	draft/published/closed
published_at	TIMESTAMPTZ	Nullable
created_at	TIMESTAMPTZ	Not null
updated_at	TIMESTAMPTZ	Not null
16.3 Struktur Tabel Exam Attempts
Field	Tipe	Ketentuan
id	UUID	Primary key
exam_id	UUID	Foreign key
student_id	UUID	Foreign key
attempt_number	INTEGER	Nomor percobaan
status	ENUM	in_progress/submitted/expired
started_at	TIMESTAMPTZ	Waktu mulai
deadline_at	TIMESTAMPTZ	Batas waktu percobaan
submitted_at	TIMESTAMPTZ	Nullable
earned_points	DECIMAL	Nullable
final_score	DECIMAL(5,2)	Nullable
grading_status	ENUM	pending/graded
Database harus menerapkan unique constraint pada kombinasi exam_id, student_id, dan attempt_number.
Sistem juga harus mencegah lebih dari satu percobaan aktif untuk kombinasi ujian dan murid yang sama menggunakan transaksi database serta constraint yang sesuai.
16.4 Struktur Tabel Answers
Field	Tipe	Ketentuan
id	UUID	Primary key
attempt_id	UUID	Foreign key
exam_question_id	UUID	Foreign key
selected_option_id	UUID	Nullable
answer_text	TEXT	Nullable
awarded_points	DECIMAL	Nullable
revision	INTEGER	Versi jawaban
saved_at	TIMESTAMPTZ	Waktu penyimpanan
Kombinasi attempt_id dan exam_question_id harus unik.
Kunci jawaban dan data penilaian hanya boleh diakses melalui endpoint server yang memiliki otorisasi sesuai peran.
17. Spesifikasi API
Semua API menggunakan prefix /api/v1.
Respons API menggunakan JSON dengan format konsisten.
Contoh respons berhasil:

{
  "success": true,
  "data": {
    "exam_id": "uuid",
    "exam_code": "AB12CD34",
    "status": "published"
  }
}



Contoh respons kesalahan:

{
  "success": false,
  "error": {
    "code": "EXAM_NOT_AVAILABLE",
    "message": "Ujian tidak tersedia."
  }
}



17.1 API Administrator
Method	Endpoint	Fungsi
POST	/admin/teachers	Membuat akun guru
GET	/admin/teachers	Melihat daftar guru
PATCH	/admin/teachers/:id	Mengubah data guru
POST	/admin/classes	Membuat kelas
GET	/admin/classes	Melihat daftar kelas
POST	/admin/students/import	Mengimpor data murid
GET	/admin/students	Melihat daftar murid
Seluruh endpoint pada tabel menggunakan prefix /api/v1.
17.2 API Guru
Method	Endpoint	Fungsi
GET	/teacher/exams	Daftar ujian guru
POST	/teacher/exams	Membuat draft ujian
GET	/teacher/exams/:id	Detail ujian
PATCH	/teacher/exams/:id	Mengubah draft
POST	/teacher/exams/:id/questions	Menambahkan soal
POST	/teacher/exams/:id/import	Mengimpor soal
POST	/teacher/exams/:id/publish	Menerbitkan ujian
POST	/teacher/exams/:id/close	Menutup ujian
GET	/teacher/exams/:id/participants	Monitoring peserta
GET	/teacher/exams/:id/results	Hasil ujian
POST	/teacher/answers/:id/grade	Menilai jawaban esai
POST	/teacher/exams/:id/publish-results	Memublikasikan hasil
GET	/teacher/exams/:id/export	Mengunduh laporan
17.3 API Murid
Method	Endpoint	Fungsi
POST	/student/exams/lookup	Validasi kode ujian
POST	/student/exams/verify-identity	Verifikasi identitas
POST	/student/exams/:id/start	Memulai atau melanjutkan sesi
GET	/student/attempts/:id	Mengambil soal dan status sesi
PUT	/student/attempts/:id/answers/:questionId	Menyimpan jawaban
POST	/student/attempts/:id/submit	Mengumpulkan jawaban
GET	/student/attempts/:id/result	Melihat hasil jika diizinkan
Endpoint murid harus memvalidasi token sesi, kepemilikan percobaan, batas waktu, dan status ujian pada setiap permintaan.
Endpoint yang mengambil soal tidak boleh menyertakan kunci jawaban atau informasi penilaian yang belum diizinkan untuk dilihat peserta.
18. Aturan Bisnis dan Kondisi Khusus
Bagian ini menjadi acuan developer untuk menangani kondisi yang dapat terjadi selama ujian.
Kondisi	Perilaku yang Diharapkan
Kode ujian salah	Sistem menolak akses tanpa mengungkap data peserta.
Ujian belum dimulai	Murid tidak dapat memulai percobaan.
Ujian telah berakhir	Percobaan baru ditolak.
Murid memuat ulang halaman	Sesi dan jawaban dipulihkan.
Koneksi internet terputus	Jawaban terakhir yang berhasil tersimpan tetap aman.
Murid membuka ujian di dua perangkat	Sistem menggunakan satu sesi aktif; perangkat kedua tidak membuat percobaan baru.
Murid sudah mencapai batas percobaan	Sistem menolak percobaan tambahan.
Guru menutup ujian	Sesi aktif diakhiri sesuai kebijakan penutupan yang ditampilkan kepada guru.
Guru mengubah pengaturan setelah publikasi	Perubahan yang memengaruhi penilaian atau hak peserta dibatasi dan dicatat.
File import tidak valid	Sistem menampilkan kesalahan dan tidak menyimpan soal yang tidak valid.
Jawaban dikirim dua kali	Sistem mempertahankan satu pengumpulan final.
Nilai belum dipublikasikan	Murid tidak dapat mengambil nilai melalui API.
19. Keamanan, Privasi, dan Keandalan
19.1 Keamanan
Sistem wajib menerapkan HTTPS, validasi server-side, pembatasan akses berdasarkan peran, dan rate limiting pada endpoint sensitif.
Guru tidak boleh dapat membaca ujian atau hasil milik guru lain tanpa kewenangan yang diberikan administrator.
Murid tidak boleh dapat mengakses sesi, jawaban, atau nilai peserta lain.
File yang diunggah harus divalidasi berdasarkan jenis, ukuran, dan struktur file. File harus disimpan pada penyimpanan privat dan tidak dieksekusi oleh server.
19.2 Privasi Data
Data murid hanya digunakan untuk keperluan penyelenggaraan ujian sekolah.
Sekolah perlu menentukan masa retensi data, pihak yang dapat mengakses hasil ujian, dan prosedur penghapusan data sesuai ketentuan perlindungan data pribadi yang berlaku.
Sistem harus menyediakan backup berkala dan prosedur pemulihan data.
19.3 Target Performa
Parameter	Target MVP
Peserta aktif bersamaan	Minimal 100 murid
Waktu validasi kode	≤ 2 detik
Waktu respons autosave	≤ 2 detik pada kondisi normal
Waktu muat halaman ujian	≤ 3 detik
Ketersediaan layanan	Target 99,9% per bulan
Backup database	Minimal harian
Target harus diverifikasi melalui pengujian beban sebelum sistem digunakan untuk ujian resmi.
20. Struktur Halaman dan Routing
Halaman Publik dan Murid
Beranda — /
Masuk Ujian — /join
Identitas Peserta — /exam/:code/identity
Instruksi Ujian — /exam/:code/instructions
Pengerjaan — /exam/:code/attempt
Konfirmasi Selesai — /exam/:code/finish
Hasil Ujian — /exam/:code/result

Halaman Guru
Login — /login
Dashboard — /teacher/dashboard
Daftar Ujian — /teacher/exams
Buat Ujian — /teacher/exams/create
Edit Ujian — /teacher/exams/:id/edit
Monitoring — /teacher/exams/:id/monitor
Hasil Ujian — /teacher/exams/:id/results
Bank Soal — /teacher/questions

Halaman Administrator
Dashboard — /admin/dashboard
Kelola Guru — /admin/teachers
Kelola Murid — /admin/students
Kelola Kelas — /admin/classes
Mata Pelajaran — /admin/subjects
Seluruh Ujian — /admin/exams
Pengaturan Sekolah — /admin/settings

21. Rencana Implementasi
Estimasi awal pengembangan MVP adalah 8–10 minggu untuk tim kecil yang memiliki pengalaman dengan teknologi yang dipilih.
1. Minggu 1–2
   Fondasi Sistem
   Setup project, database, autentikasi, manajemen akun guru, kelas, dan data murid.
2. Minggu 3–4
   Modul Guru dan Pembuatan Ujian
   Dashboard guru, editor soal, import Word/Excel, pengaturan ujian, pratinjau, dan generator kode.
3. Minggu 5–6
   Modul Ujian Murid
   Validasi kode, verifikasi identitas, sesi percobaan, halaman pengerjaan, timer, autosave, dan pengumpulan jawaban.
4. Minggu 7–8
   Penilaian dan Laporan
   Penilaian otomatis, penilaian esai, pengelolaan beberapa percobaan, publikasi nilai, monitoring, dan ekspor laporan.
5. Minggu 9–10
   Quality Assurance dan Peluncuran
   Pengujian keamanan, pengujian beban, simulasi ujian sekolah, perbaikan bug, deployment, dan pelatihan pengguna.

Estimasi ini merupakan perencanaan, bukan jaminan waktu penyelesaian. Kebutuhan desain, jumlah developer, dan kompleksitas import dokumen dapat memengaruhi durasi aktual.
22. Acceptance Criteria — Syarat Produk Siap Digunakan
Website dinyatakan siap digunakan untuk ujian sekolah apabila seluruh skenario berikut berhasil diuji.
Checklist UAT
0/18



[ ] Administrator dapat membuat akun guru dan mengimpor data murid.
[ ] Guru dapat membuat ujian menggunakan input manual.
[ ] Guru dapat mengimpor soal dari Word dan Excel sesuai template.
[ ] Guru dapat memeriksa dan mengedit hasil import sebelum publikasi.
[ ] Sistem menghasilkan kode unik saat ujian diterbitkan.
[ ] Murid dapat masuk menggunakan kode dan identitas tanpa membuat akun.
[ ] Murid yang tidak terdaftar atau tidak berhak mengikuti ujian ditolak.
[ ] Timer dan batas waktu ujian dikendalikan oleh server.
[ ] Jawaban tersimpan otomatis dan dapat dipulihkan setelah halaman dimuat ulang.
[ ] Murid dapat mengulang ujian sesuai kuota yang ditetapkan guru.
[ ] Sistem mencegah percobaan tambahan ketika kuota habis.
[ ] Sistem menghitung nilai objektif secara otomatis.
[ ] Guru dapat memeriksa dan memberi nilai jawaban esai.
[ ] Nilai akhir dihitung sesuai metode yang ditentukan guru.
[ ] Guru dapat mengatur publikasi nilai kepada murid.
[ ] Guru dapat memantau peserta dan mengunduh laporan hasil ujian.
[ ] Sistem menolak akses tidak sah terhadap jawaban dan nilai peserta lain.
[ ] Sistem lulus simulasi beban minimal 100 peserta aktif bersamaan.
Checklist ini dapat digunakan tim pengembang dan pihak sekolah saat melakukan User Acceptance Testing (UAT).

23. Ringkasan Keputusan Pengembangan
Spesifikasi Produk Final
ExamCode School — MVP
Sistem ujian online untuk satu sekolah yang dapat digunakan melalui browser di HP maupun komputer.

Guru membuat soal secara manual atau melalui import Word dan Excel.

Sistem otomatis membuat ujian dan menghasilkan kode unik.

Murid mengikuti ujian menggunakan kode dan identitas tanpa akun.

Guru mengatur jadwal, durasi, pengacakan, dan jumlah percobaan.

Sistem menyimpan jawaban, menghitung nilai, dan menyediakan laporan.

Guru menentukan kapan hasil ujian dapat dilihat murid.

Administrator mengelola seluruh data sekolah melalui satu dashboard.


Dokumen ini dapat digunakan sebagai acuan pengembangan MVP, termasuk pembagian pekerjaan frontend dan backend, perancangan database, pembuatan API, desain antarmuka, serta pengujian sistem.
Sebelum implementasi dimulai, tim sekolah dan developer perlu menyepakati rancangan UI final, format template import, kebijakan verifikasi identitas murid, serta infrastruktur hosting yang akan digunakan.
Sebagai alternatif ChatGPT untuk membantu pengembangan website, Anda juga dapat mencoba https://hix.ai/id/chat.











   







mana file prd nya saya mau buat di antigravity













Saya akan buatkan file PRD dalam format Markdown (.md) yang bisa langsung Anda gunakan di Google Antigravity sebagai dokumen acuan untuk membangun website ujian online.
File ini akan mencakup fitur guru, administrator, dan murid; import soal Word/Excel; kode ujian otomatis; database; API; aturan penilaian; serta instruksi implementasi agar Antigravity dapat mengembangkan aplikasinya berdasarkan spesifikasi yang sudah kita tetapkan.





Saya belum dapat melampirkan file .md langsung di percakapan ini. Namun, Anda bisa menggunakan PRD yang sudah dibuat di atas dengan menyalinnya ke file bernama PRD_EXAMCODE_SCHOOL.md, lalu menyimpannya di folder proyek Antigravity.