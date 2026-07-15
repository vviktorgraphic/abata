import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword, maskEmail, normalizeEmail, validateAdminPassword } from "../lib/admin-auth/security";
async function main() {
  const email = process.env.ADMIN_CREATE_EMAIL ?? ""; const password = process.env.ADMIN_CREATE_PASSWORD ?? ""; const displayName = process.env.ADMIN_CREATE_DISPLAY_NAME?.trim() ?? "";
  if (!email || !displayName || !validateAdminPassword(password).success) throw new Error("Add meg az ADMIN_CREATE_EMAIL, ADMIN_CREATE_PASSWORD (min. 12 karakter, nem csak betű) és ADMIN_CREATE_DISPLAY_NAME változókat.");
  const normalizedEmail = normalizeEmail(email); if (await prisma.adminUser.findUnique({ where: { normalizedEmail } })) throw new Error("Ezzel az e-mail-címmel már létezik admin.");
  await prisma.adminUser.create({ data: { email: email.trim(), normalizedEmail, displayName, passwordHash: await hashPassword(password) } });
  console.info(`Admin létrehozva: ${maskEmail(email)}`);
}
main().finally(() => prisma.$disconnect());
