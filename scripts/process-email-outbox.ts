import { prisma } from "../lib/prisma";
import { getEmailConfig } from "../lib/email/config";
import { createEmailProvider } from "../lib/email/email-provider";
import { processEmailOutbox } from "../lib/email/process-email-outbox";

async function main() {
  const config = getEmailConfig();
  const result = await processEmailOutbox(prisma, createEmailProvider(config), config);
  console.info(`[email:process] sent=${result.sent} retry=${result.retried} failed=${result.failed}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async () => {
    console.error("[email:process] Az outbox feldolgozása sikertelen.");
    await prisma.$disconnect();
    process.exit(1);
  });
