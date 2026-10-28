import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function validateCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.AUTH_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.AUTH_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) {
    console.error("AUTH_EMAIL o AUTH_PASSWORD mancanti");
    return false;
  }

  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail);
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}
