import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseStudentsExcelBuffer } from "@/lib/excel-parser";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang dapat mengimpor data murid." } },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE", message: "File Excel (.xlsx) tidak ditemukan." } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = parseStudentsExcelBuffer(buffer);

    if (!parseResult.success && parseResult.validCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PARSE_FAILED",
            message: parseResult.globalErrors.join(". ") || "Format file Excel tidak valid.",
            details: parseResult,
          },
        },
        { status: 400 }
      );
    }

    // Get all school classes for mapping
    const classes = await prisma.class.findMany({
      where: { schoolId: session.schoolId },
    });
    const classMap = new Map(classes.map((c) => [c.name.trim().toLowerCase(), c.id]));

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const student of parseResult.students) {
      if (!student.isValid) {
        skippedCount++;
        errors.push(`Baris ${student.rawRow}: ${student.errors.join(", ")}`);
        continue;
      }

      let classId = classMap.get(student.className.trim().toLowerCase());
      if (!classId) {
        // Auto-create class if it doesn't exist
        const newClass = await prisma.class.create({
          data: {
            schoolId: session.schoolId,
            name: student.className.trim(),
            gradeLevel: parseInt(student.className.replace(/\D/g, ""), 10) || 7,
          },
        });
        classId = newClass.id;
        classMap.set(student.className.trim().toLowerCase(), classId);
      }

      try {
        const existing = await prisma.student.findFirst({
          where: {
            schoolId: session.schoolId,
            OR: [
              ...(student.nis ? [{ nis: student.nis }] : []),
              { name: student.name, classId },
            ],
          },
        });

        if (existing) {
          await prisma.student.update({
            where: { id: existing.id },
            data: {
              name: student.name,
              nis: student.nis || existing.nis,
              classId,
              gender: student.gender || existing.gender,
              pin: student.pin || existing.pin,
            },
          });
        } else {
          await prisma.student.create({
            data: {
              schoolId: session.schoolId,
              nis: student.nis || null,
              name: student.name,
              classId,
              gender: student.gender || "L",
              pin: student.pin || null,
              status: "ACTIVE",
            },
          });
        }
        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Baris ${student.rawRow} (NIS ${student.nis}): Gagal menyimpan (${err.message})`);
      }
    }

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "IMPORT_STUDENTS",
        details: JSON.stringify({ importedCount, skippedCount, total: parseResult.totalParsed }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        importedCount,
        skippedCount,
        total: parseResult.totalParsed,
        errors: errors.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error("Student import error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memproses import data murid." } },
      { status: 500 }
    );
  }
}
