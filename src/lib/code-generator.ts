import crypto from "crypto";

// 32 unambiguous characters (excludes 0, O, 1, I, L)
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateExamCode(length: number = 8): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

export function normalizeExamCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, "");
}
