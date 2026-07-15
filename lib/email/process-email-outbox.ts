import { EmailStatus, type EmailOutbox, type PrismaClient } from "@prisma/client";
import type { EmailConfig } from "./config";
import type { EmailProvider } from "./types";
import { decryptEmailBody } from "./encryption";

const BACKOFF_MINUTES = [1, 5, 30, 120] as const;

export type ProcessEmailResult = { sent: number; retried: number; failed: number };

export function nextAttemptDate(attemptCount: number, now: Date): Date {
  const minutes = BACKOFF_MINUTES[Math.min(Math.max(attemptCount - 1, 0), BACKOFF_MINUTES.length - 1)]!;
  return new Date(now.getTime() + minutes * 60_000);
}

function safeError(): { code: string; message: string } {
  return { code: "EMAIL_SEND_FAILED", message: "Az e-mail-szolgáltató nem fogadta el az üzenetet." };
}

async function claimNext(client: PrismaClient, now: Date): Promise<EmailOutbox | null> {
  const staleBefore = new Date(now.getTime() - 15 * 60_000);
  return client.$transaction(async (transaction) => {
    const rows = await transaction.$queryRaw<EmailOutbox[]>`
      WITH candidate AS (
        SELECT "id" FROM "EmailOutbox"
        WHERE (("status" IN ('PENDING', 'RETRY') AND "nextAttemptAt" <= ${now})
          OR ("status" = 'PROCESSING' AND "updatedAt" <= ${staleBefore}))
        ORDER BY "nextAttemptAt", "createdAt"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "EmailOutbox" AS email
      SET "status" = 'PROCESSING', "updatedAt" = ${now}
      FROM candidate
      WHERE email."id" = candidate."id"
      RETURNING email.*
    `;
    return rows[0] ?? null;
  });
}

export async function processEmailOutbox(
  client: PrismaClient,
  provider: EmailProvider,
  config: EmailConfig,
  options: { limit?: number; now?: Date } = {},
): Promise<ProcessEmailResult> {
  const result: ProcessEmailResult = { sent: 0, retried: 0, failed: 0 };
  const limit = options.limit ?? 20;
  for (let index = 0; index < limit; index += 1) {
    const now = options.now ?? new Date();
    const email = await claimNext(client, now);
    if (!email) break;
    try {
      const sent = await provider.send({
        to: email.recipient,
        from: { name: config.fromName, address: config.fromAddress },
        ...(config.replyTo ? { replyTo: config.replyTo } : {}),
        subject: email.subject,
        text: decryptEmailBody(email.textBody, config.encryptionSecret),
        html: decryptEmailBody(email.htmlBody, config.encryptionSecret),
        providerMessageKey: email.deduplicationKey,
        metadata: { emailType: email.type },
      });
      await client.emailOutbox.update({
        where: { id: email.id },
        data: { status: EmailStatus.SENT, attemptCount: { increment: 1 }, sentAt: now, failedAt: null, lastErrorCode: null, lastErrorMessage: null, providerMessageId: sent.messageId },
      });
      result.sent += 1;
    } catch {
      const attemptCount = email.attemptCount + 1;
      const terminal = attemptCount >= email.maxAttempts;
      const error = safeError();
      await client.emailOutbox.update({
        where: { id: email.id },
        data: {
          status: terminal ? EmailStatus.FAILED : EmailStatus.RETRY,
          attemptCount,
          nextAttemptAt: terminal ? email.nextAttemptAt : nextAttemptDate(attemptCount, now),
          failedAt: terminal ? now : null,
          lastErrorCode: error.code,
          lastErrorMessage: error.message,
        },
      });
      if (terminal) result.failed += 1;
      else result.retried += 1;
    }
  }
  return result;
}
