import { z } from "zod";

const schema = z.object({
  provider: z.enum(["console"]),
  fromName: z.string().trim().min(1),
  fromAddress: z.email(),
  replyTo: z.union([z.email(), z.literal("")]),
  notificationEmail: z.email(),
  maxAttempts: z.coerce.number().int().min(1).max(10),
  appName: z.string().trim().min(1),
});

export type EmailConfig = z.infer<typeof schema>;

export class EmailConfigurationError extends Error {
  constructor() {
    super("Az e-mail-rendszer konfigurációja hiányos.");
    this.name = "EmailConfigurationError";
  }
}

export function getEmailConfig(environment: NodeJS.ProcessEnv = process.env): EmailConfig {
  const production = environment.NODE_ENV === "production";
  const provider = environment.EMAIL_PROVIDER ?? (production ? undefined : "console");
  const result = schema.safeParse({
    provider,
    fromName: environment.EMAIL_FROM_NAME ?? environment.NEXT_PUBLIC_APP_NAME ?? "Szállásfoglalás",
    fromAddress: environment.EMAIL_FROM_ADDRESS ?? (production ? undefined : "foglalas@example.test"),
    replyTo: environment.EMAIL_REPLY_TO ?? "",
    notificationEmail: environment.BOOKING_NOTIFICATION_EMAIL ?? environment.AUTH_ADMIN_EMAIL ?? (production ? undefined : "admin@example.test"),
    maxAttempts: environment.EMAIL_MAX_ATTEMPTS ?? "5",
    appName: environment.NEXT_PUBLIC_APP_NAME ?? "Szállásfoglalás",
  });
  if (!result.success) throw new EmailConfigurationError();
  return result.data;
}
