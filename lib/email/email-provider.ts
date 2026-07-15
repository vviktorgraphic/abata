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
    const type = String(message.metadata?.emailType ?? "UNKNOWN");
    const base = `[email:console] type=${type} to=${maskedAddress(message.to)}`;
    if (process.env.NODE_ENV === "development" && type === "ADMIN_LOGIN_CODE") {
      const code = message.text.match(/(?:kód|code)\D+(\d{6})/i)?.[1] ?? "[redacted]";
      const expiresInMinutes = message.text.match(/(\d+) perc/i)?.[1] ?? "[unknown]";
      console.info(`${base} code=${code} expiresInMinutes=${expiresInMinutes}`);
    } else {
      console.info(base);
    }
    return { messageId: `console:${message.providerMessageKey}` };
  }
}

export function createEmailProvider(config: EmailConfig): EmailProvider {
  if (config.provider === "console") return new ConsoleEmailProvider();
  throw new EmailConfigurationError();
}
