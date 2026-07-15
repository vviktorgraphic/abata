import { EmailStatus, EmailType, type EmailOutbox } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { processEmailOutbox, nextAttemptDate } from "@/lib/email/process-email-outbox";
import type { EmailConfig } from "@/lib/email/config";
import { ConsoleEmailProvider } from "@/lib/email/email-provider";
import { encryptEmailBody } from "@/lib/email/encryption";

const now = new Date("2030-01-01T10:00:00.000Z");
const config: EmailConfig = { provider: "console", fromName: "Teszt", fromAddress: "from@example.test", replyTo: "", notificationEmail: "admin@example.test", maxAttempts: 5, appName: "Teszt", encryptionSecret: "test-email-encryption-secret-at-least-32-chars" };

function email(overrides: Partial<EmailOutbox> = {}): EmailOutbox {
  return {
    id: "email-1", type: EmailType.BOOKING_REQUEST_GUEST, status: EmailStatus.PENDING,
    recipient: "guest@example.test", subject: "Subject", textBody: "Text", htmlBody: "<p>Text</p>", bookingId: "booking-1",
    attemptCount: 0, maxAttempts: 5, nextAttemptAt: now, sentAt: null, failedAt: null,
    lastErrorCode: null, lastErrorMessage: null, providerMessageId: null, deduplicationKey: "booking:1:guest",
    createdAt: now, updatedAt: now, ...overrides,
  };
}

function fakeClient(initial: EmailOutbox[]) {
  const rows = initial.map((row) => ({ ...row }));
  let transactionTail = Promise.resolve();
  const transaction = {
    $queryRaw: async () => {
      const candidate = rows.find((row) => ((row.status === EmailStatus.PENDING || row.status === EmailStatus.RETRY) && row.nextAttemptAt <= now) || (row.status === EmailStatus.PROCESSING && row.updatedAt <= new Date(now.getTime() - 15 * 60_000)));
      if (!candidate) return [];
      candidate.status = EmailStatus.PROCESSING; candidate.updatedAt = now;
      return [{ ...candidate }];
    },
  };
  const client = {
    $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => {
      const run = transactionTail.then(() => callback(transaction));
      transactionTail = run.then(() => undefined, () => undefined);
      return run;
    },
    emailOutbox: {
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = rows.find((item) => item.id === where.id)!;
        for (const [key, value] of Object.entries(data)) {
          if (key === "attemptCount" && typeof value === "object") row.attemptCount += (value as { increment: number }).increment;
          else (row as unknown as Record<string, unknown>)[key] = value;
        }
        return row;
      },
    },
  };
  return { client, rows };
}

describe("processEmailOutbox", () => {
  it("logs the decrypted admin login code in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const provider = new ConsoleEmailProvider();
    await provider.send({
      to: "admin@example.test", from: { name: "Test", address: "from@example.test" },
      subject: "Code", text: "Your code: 123456. Expires in 10 perc.", html: "", providerMessageKey: "k",
      metadata: { emailType: "ADMIN_LOGIN_CODE" },
    });
    expect(info).toHaveBeenCalledWith(expect.stringContaining("type=ADMIN_LOGIN_CODE"));
    expect(info).toHaveBeenCalledWith(expect.stringContaining("code=123456"));
    expect(info).toHaveBeenCalledWith(expect.stringContaining("to=ad***@example.test"));
    info.mockRestore(); vi.unstubAllEnvs();
  });

  it("never logs the admin login code in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await expect(new ConsoleEmailProvider().send({
      to: "admin@example.test", from: { name: "Test", address: "from@example.test" }, subject: "Code",
      text: "Your code: 123456", html: "", providerMessageKey: "k", metadata: { emailType: "ADMIN_LOGIN_CODE" },
    })).rejects.toThrow();
    expect(info).not.toHaveBeenCalled();
    info.mockRestore(); vi.unstubAllEnvs();
  });

  it("safely retries when encrypted outbox body cannot be decrypted", async () => {
    const encrypted = encryptEmailBody("Your code: 123456", config.encryptionSecret);
    const { client, rows } = fakeClient([email({ type: EmailType.ADMIN_LOGIN_CODE, textBody: encrypted, htmlBody: encrypted })]);
    await expect(processEmailOutbox(client as never, { send: vi.fn() }, { ...config, encryptionSecret: "wrong-secret-that-is-at-least-32-chars" }, { now })).resolves.toEqual({ sent: 0, retried: 1, failed: 0 });
    expect(rows[0]).toMatchObject({ status: EmailStatus.RETRY, lastErrorCode: "EMAIL_SEND_FAILED" });
    expect(rows[0]!.lastErrorMessage).not.toContain("123456");
  });

  it("marks a successfully sent PENDING message as SENT", async () => {
    const { client, rows } = fakeClient([email()]);
    const provider = { send: vi.fn().mockResolvedValue({ messageId: "provider-1" }) };
    await expect(processEmailOutbox(client as never, provider, config, { now })).resolves.toEqual({ sent: 1, retried: 0, failed: 0 });
    expect(rows[0]).toMatchObject({ status: EmailStatus.SENT, attemptCount: 1, providerMessageId: "provider-1", sentAt: now });
  });

  it("decrypts AES-256-GCM admin login body before sending and marks SENT", async () => {
    const codeBody = "Your code: 123456. Expires in 10 perc.";
    const encrypted = encryptEmailBody(codeBody, config.encryptionSecret);
    const { client, rows } = fakeClient([email({ type: EmailType.ADMIN_LOGIN_CODE, textBody: encrypted, htmlBody: encrypted })]);
    const provider = { send: vi.fn().mockResolvedValue({ messageId: "provider-admin" }) };
    await expect(processEmailOutbox(client as never, provider, config, { now })).resolves.toEqual({ sent: 1, retried: 0, failed: 0 });
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({ text: codeBody, html: codeBody }));
    expect(rows[0]).toMatchObject({ status: EmailStatus.SENT, providerMessageId: "provider-admin" });
  });

  it("increments attempts and schedules deterministic RETRY after provider failure", async () => {
    const { client, rows } = fakeClient([email()]);
    const provider = { send: vi.fn().mockRejectedValue(new Error("secret provider response")) };
    await expect(processEmailOutbox(client as never, provider, config, { now })).resolves.toEqual({ sent: 0, retried: 1, failed: 0 });
    expect(rows[0]).toMatchObject({ status: EmailStatus.RETRY, attemptCount: 1, nextAttemptAt: nextAttemptDate(1, now), lastErrorCode: "EMAIL_SEND_FAILED" });
    expect(rows[0]!.lastErrorMessage).not.toContain("secret");
  });

  it("marks the message FAILED at max attempts", async () => {
    const { client, rows } = fakeClient([email({ attemptCount: 4 })]);
    await processEmailOutbox(client as never, { send: vi.fn().mockRejectedValue(new Error()) }, config, { now });
    expect(rows[0]).toMatchObject({ status: EmailStatus.FAILED, attemptCount: 5, failedAt: now });
  });

  it("does not resend an already SENT message", async () => {
    const { client } = fakeClient([email({ status: EmailStatus.SENT })]);
    const provider = { send: vi.fn() };
    await processEmailOutbox(client as never, provider, config, { now });
    expect(provider.send).not.toHaveBeenCalled();
  });

  it("lets only one of two parallel workers claim the same message", async () => {
    const { client } = fakeClient([email()]);
    const provider = { send: vi.fn().mockResolvedValue({ messageId: "provider-1" }) };
    await Promise.all([processEmailOutbox(client as never, provider, config, { now, limit: 1 }), processEmailOutbox(client as never, provider, config, { now, limit: 1 })]);
    expect(provider.send).toHaveBeenCalledTimes(1);
  });
});
