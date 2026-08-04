import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export function calendarEncryptionKey() {
  return process.env.CALENDAR_CONNECTION_ENCRYPTION_KEY || process.env.APPLE_CALENDAR_ENCRYPTION_KEY || "";
}

function keyBuffer(rawKey: string) {
  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) throw new Error("Die sichere Kalenderverbindung ist nicht korrekt eingerichtet.");
  return key;
}

export function encryptCalendarCredentials(credentials: unknown, rawKey = calendarEncryptionKey()) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBuffer(rawKey), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(credentials), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${ciphertext.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}

export function decryptCalendarCredentials<T>(value: string, rawKey = calendarEncryptionKey()): T {
  const [, iv, ciphertext, tag] = value.split(".");
  if (!iv || !ciphertext || !tag) throw new Error("Die gespeicherte Kalenderverbindung ist ungültig.");
  const decipher = createDecipheriv("aes-256-gcm", keyBuffer(rawKey), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8")) as T;
}
