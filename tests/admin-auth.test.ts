import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { decryptEmailBody, encryptEmailBody } from "@/lib/email/encryption";
import { generateCode, generateToken, getAuthConfig, hashCode, hashPassword, hashToken, normalizeEmail, safeEqual, validateAdminPassword, verifyPassword } from "@/lib/admin-auth/security";
import { validateAuthRequest } from "@/lib/admin-auth/request-security";

describe("admin auth cryptography", () => {
  it("accepts a correct password and rejects an incorrect one", async () => {
    const stored = await hashPassword("long-enough-password-42");
    expect(stored).not.toContain("long-enough-password-42");
    expect(await verifyPassword("long-enough-password-42", stored)).toBe(true);
    expect(await verifyPassword("wrong-password", stored)).toBe(false);
  });
  it("normalizes email and validates password policy", () => {
    expect(normalizeEmail(" Admin@Example.COM ")).toBe("admin@example.com");
    expect(validateAdminPassword("onlyletterssss").success).toBe(false);
    expect(validateAdminPassword("long-password-42").success).toBe(true);
  });
  it("creates six-digit codes and opaque tokens", () => {
    expect(generateCode()).toMatch(/^\d{6}$/); expect(generateToken().length).toBeGreaterThan(32);
  });
  it("stores deterministic hashes instead of raw tokens and codes", () => {
    const token = generateToken(); const code = "123456"; const config = getAuthConfig();
    expect(hashToken(token)).not.toContain(token); expect(hashCode(token, code, config.secret)).not.toContain(code);
    expect(safeEqual(hashCode(token, code, config.secret), hashCode(token, code, config.secret))).toBe(true);
  });
  it("encrypts the outbox body at rest", () => {
    const encrypted = encryptEmailBody("A kód: 123456", "test-secret-with-at-least-thirty-two-characters");
    expect(encrypted).not.toContain("123456");
    expect(decryptEmailBody(encrypted, "test-secret-with-at-least-thirty-two-characters")).toBe("A kód: 123456");
  });
});

describe("admin auth request protection", () => {
  it("rejects a wrong content type", () => {
    const request = new NextRequest("http://localhost/api/admin/auth/login", { method: "POST", body: "{}", headers: { "Content-Type": "text/plain" } });
    expect(validateAuthRequest(request)?.status).toBe(400);
  });
  it("rejects cross-origin requests", () => {
    const request = new NextRequest("http://localhost/api/admin/auth/login", { method: "POST", body: "{}", headers: { "Content-Type": "application/json", Origin: "https://attacker.example" } });
    expect(validateAuthRequest(request)?.status).toBe(403);
  });
  it("accepts same-origin JSON requests", () => {
    const request = new NextRequest("http://localhost/api/admin/auth/login", { method: "POST", body: "{}", headers: { "Content-Type": "application/json", Origin: "http://localhost" } });
    expect(validateAuthRequest(request)).toBeNull();
  });
  it("uses Secure cookies only in production", () => {
    expect(getAuthConfig({ NODE_ENV: "production", AUTH_SECRET: "production-secret-with-at-least-thirty-two-characters" }).secureCookie).toBe(true);
    expect(getAuthConfig({ NODE_ENV: "test" }).secureCookie).toBe(false);
  });
});
