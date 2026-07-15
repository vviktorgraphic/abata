import { AdminAuthEventType, EmailType, type PrismaClient } from "@prisma/client";
import { adminLoginCodeTemplate } from "@/lib/email/templates";
import { encryptEmailBody } from "@/lib/email/encryption";
import { generateCode, generateToken, getAuthConfig, hashCode, hashToken, normalizeEmail, safeEqual, verifyPassword } from "./security";

export class InvalidCredentialsError extends Error {}
export class InvalidCodeError extends Error {}
export class AuthRateLimitError extends Error {}

export async function startAdminLogin(client: PrismaClient, input: { email: string; password: string; requestedIpHash?: string }, now = new Date()) {
  const config = getAuthConfig(); const normalizedEmail = normalizeEmail(input.email);
  const user = await client.adminUser.findUnique({ where: { normalizedEmail } });
  const valid = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !valid || !user.isActive || (user.lockedUntil && user.lockedUntil > now)) {
    if (user && !valid) {
      const attempts = user.failedPasswordAttempts + 1;
      await client.adminUser.update({ where: { id: user.id }, data: { failedPasswordAttempts: attempts, ...(attempts >= config.passwordAttempts ? { lockedUntil: new Date(now.getTime() + config.lockoutMinutes * 60_000) } : {}) } });
    }
    await client.adminAuthEvent.create({ data: { ...(user ? { adminUserId: user.id } : {}), eventType: AdminAuthEventType.PASSWORD_LOGIN_ATTEMPT, success: false, reasonCode: "INVALID_CREDENTIALS" } });
    throw new InvalidCredentialsError();
  }
  const recent = await client.adminLoginChallenge.findFirst({ where: { adminUserId: user.id, createdAt: { gt: new Date(now.getTime() - config.cooldownSeconds * 1000) } } });
  if (recent) throw new AuthRateLimitError();
  const challengeToken = generateToken(); const code = generateCode();
  const template = adminLoginCodeTemplate({ code, expiresInMinutes: config.codeMinutes, appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Szállásfoglalás" });
  const expiresAt = new Date(now.getTime() + config.codeMinutes * 60_000);
  await client.$transaction(async (tx) => {
    await tx.adminLoginChallenge.updateMany({ where: { adminUserId: user.id, consumedAt: null }, data: { consumedAt: now } });
    const challenge = await tx.adminLoginChallenge.create({ data: { adminUserId: user.id, challengeTokenHash: hashToken(challengeToken), codeHash: hashCode(challengeToken, code, config.secret), expiresAt, maxCodeAttempts: config.codeAttempts, ...(input.requestedIpHash ? { requestedIpHash: input.requestedIpHash } : {}) } });
    await tx.emailOutbox.create({ data: { type: EmailType.ADMIN_LOGIN_CODE, recipient: user.email, subject: template.subject, textBody: encryptEmailBody(template.text, config.secret), htmlBody: encryptEmailBody(template.html, config.secret), deduplicationKey: `admin-login:${challenge.id}` } });
    await tx.adminAuthEvent.createMany({ data: [
      { adminUserId: user.id, eventType: AdminAuthEventType.PASSWORD_LOGIN_ATTEMPT, success: true },
      { adminUserId: user.id, eventType: AdminAuthEventType.TWO_FACTOR_REQUESTED, success: true },
    ] });
  });
  return { challengeToken, expiresInSeconds: config.codeMinutes * 60 };
}

export async function verifyAdminCode(client: PrismaClient, input: { challengeToken: string; code: string }, now = new Date()) {
  const config = getAuthConfig(); const challenge = await client.adminLoginChallenge.findUnique({ where: { challengeTokenHash: hashToken(input.challengeToken) }, include: { adminUser: true } });
  const unusable = !challenge || challenge.consumedAt || challenge.expiresAt <= now || challenge.failedCodeAttempts >= challenge.maxCodeAttempts || !challenge.adminUser.isActive;
  const valid = challenge ? safeEqual(hashCode(input.challengeToken, input.code, config.secret), challenge.codeHash) : false;
  if (unusable || !valid) {
    if (challenge && !challenge.consumedAt) await client.adminLoginChallenge.update({ where: { id: challenge.id }, data: { failedCodeAttempts: { increment: 1 }, ...(challenge.failedCodeAttempts + 1 >= challenge.maxCodeAttempts ? { consumedAt: now } : {}) } });
    if (challenge) await client.adminAuthEvent.create({ data: { adminUserId: challenge.adminUserId, eventType: AdminAuthEventType.TWO_FACTOR_ATTEMPT, success: false, reasonCode: "INVALID_OR_EXPIRED_CODE" } });
    throw new InvalidCodeError();
  }
  const sessionToken = generateToken(); const expiresAt = new Date(now.getTime() + config.sessionHours * 3_600_000);
  await client.$transaction(async (tx) => {
    const consumed = await tx.adminLoginChallenge.updateMany({ where: { id: challenge.id, consumedAt: null }, data: { consumedAt: now } });
    if (consumed.count !== 1) throw new InvalidCodeError();
    await tx.adminSession.create({ data: { adminUserId: challenge.adminUserId, tokenHash: hashToken(sessionToken), expiresAt, lastSeenAt: now } });
    await tx.adminUser.update({ where: { id: challenge.adminUserId }, data: { lastLoginAt: now, failedPasswordAttempts: 0, lockedUntil: null } });
    await tx.adminAuthEvent.createMany({ data: [{ adminUserId: challenge.adminUserId, eventType: AdminAuthEventType.TWO_FACTOR_ATTEMPT, success: true }, { adminUserId: challenge.adminUserId, eventType: AdminAuthEventType.LOGIN_SUCCEEDED, success: true }] });
  });
  return { sessionToken, expiresAt };
}

export async function getCurrentAdmin(client: PrismaClient, token?: string | null, now = new Date()) {
  if (!token) return null;
  const session = await client.adminSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { adminUser: true } });
  if (!session || session.revokedAt || session.expiresAt <= now || !session.adminUser.isActive) return null;
  if (now.getTime() - session.lastSeenAt.getTime() > 15 * 60_000) await client.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: now } });
  return { id: session.adminUser.id, displayName: session.adminUser.displayName, email: session.adminUser.email, sessionId: session.id };
}

export async function requireAdmin(client: PrismaClient, token?: string | null) {
  const admin = await getCurrentAdmin(client, token); if (!admin) throw new Error("UNAUTHORIZED"); return admin;
}
export async function revokeAdminSession(client: PrismaClient, token?: string | null, now = new Date()) {
  if (!token) return;
  const session = await client.adminSession.findUnique({ where: { tokenHash: hashToken(token) } }); if (!session || session.revokedAt) return;
  await client.$transaction([client.adminSession.update({ where: { id: session.id }, data: { revokedAt: now } }), client.adminAuthEvent.create({ data: { adminUserId: session.adminUserId, eventType: AdminAuthEventType.LOGOUT, success: true } })]);
}
export const cleanupExpiredAdminSessions = (client: PrismaClient, now = new Date()) => client.adminSession.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] } });
