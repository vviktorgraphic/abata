import type { EmailMessage, EmailProvider, EmailSendResult } from "./types";
import type { EmailConfig } from "./config";
import { EmailConfigurationError } from "./config";

function maskedAddress(address: string): string {
  const [local, domain] = address.split("@");
  return `${local?.slice(0, 2) ?? "**"}***@${domain ?? "***"}`;
}

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (process.env.NODE_ENV === "production") throw new EmailConfigurationError();
    console.info("[email:console]", {
      to: maskedAddress(message.to),
      subject: message.subject,
      providerMessageKey: message.providerMessageKey,
      metadata: message.metadata,
    });
    return { messageId: `console:${message.providerMessageKey}` };
  }
}

export function createEmailProvider(config: EmailConfig): EmailProvider {
  if (config.provider === "console") return new ConsoleEmailProvider();
  throw new EmailConfigurationError();
}
