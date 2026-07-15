import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

const passwordSchema = z.string().min(12).refine((value) => !/^\p{L}+$/u.test(value));
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.5jUKB5A5lYfHqB/ExQj6K1i2OqI7d7K";

export function getAuthConfig(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === "production";
  const secret = env.AUTH_SECRET ?? (production ? "" : "development-auth-secret-change-me-32-chars");
  if (secret.length < 32) throw new Error("Az AUTH_SECRET legalább 32 karakter legyen.");
  return {
    secret,
    cookieName: env.ADMIN_SESSION_COOKIE_NAME ?? "admin_session",
    sessionHours: Number(env.ADMIN_SESSION_TTL_HOURS ?? 12),
    codeMinutes: Number(env.ADMIN_2FA_CODE_TTL_MINUTES ?? 10),
    codeAttempts: Number(env.ADMIN_2FA_MAX_ATTEMPTS ?? 5),
    cooldownSeconds: Number(env.ADMIN_2FA_RESEND_COOLDOWN_SECONDS ?? 60),
    passwordAttempts: Number(env.ADMIN_PASSWORD_MAX_ATTEMPTS ?? 5),
    lockoutMinutes: Number(env.ADMIN_LOCKOUT_MINUTES ?? 15),
    secureCookie: production,
  };
}

export const normalizeEmail = (email: string) => email.trim().toLocaleLowerCase("en-US");
export const validateAdminPassword = (password: string) => passwordSchema.safeParse(password);
export const hashPassword = (password: string) => hash(password, 12);
export const verifyPassword = (password: string, passwordHash?: string) => compare(password, passwordHash ?? process.env.AUTH_DUMMY_PASSWORD_HASH ?? DUMMY_HASH);
export const generateToken = () => randomBytes(32).toString("base64url");
export const generateCode = () => randomInt(0, 1_000_000).toString().padStart(6, "0");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const hashCode = (challengeToken: string, code: string, secret: string) => createHmac("sha256", secret).update(`${challengeToken}:${code}`).digest("hex");
export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}
