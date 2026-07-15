import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(secret: string) { return createHash("sha256").update(secret).digest(); }
export function encryptEmailBody(value: string, secret: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `enc:v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${body.toString("base64url")}`;
}
export function decryptEmailBody(value: string, secret: string) {
  if (!value.startsWith("enc:v1:")) return value;
  const [, , iv, tag, body] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(iv!, "base64url"));
  decipher.setAuthTag(Buffer.from(tag!, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body!, "base64url")), decipher.final()]).toString("utf8");
}
