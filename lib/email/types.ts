export type EmailMessage = {
  to: string;
  from: { name: string; address: string };
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  providerMessageKey: string;
  metadata: Record<string, string>;
};

export type EmailSendResult = { messageId: string };

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export type EmailTemplate = { subject: string; text: string; html: string };
