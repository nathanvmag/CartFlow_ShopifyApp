import crypto from "crypto";

export function generateExternalToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const TOKEN_HASH_SECRET = process.env.EXTERNAL_TOKEN_HASH_SECRET || "";

if (!TOKEN_HASH_SECRET) {
  console.warn(
    "WARNING: EXTERNAL_TOKEN_HASH_SECRET is not set. Use a strong secret in production.",
  );
}

export function hashExternalToken(token: string): string {
  return crypto
    .createHmac("sha256", TOKEN_HASH_SECRET)
    .update(token)
    .digest("hex");
}

export function verifyExternalToken(
  plainToken: string,
  hashedToken: string | null | undefined,
): boolean {
  if (!hashedToken) return false;

  const hashedInput = hashExternalToken(plainToken);

  const a = Buffer.from(hashedInput, "hex");
  const b = Buffer.from(hashedToken, "hex");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
