import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth/service";
import { getAuthConfig, maskEmail } from "@/lib/admin-auth/security";
import { LogoutButton } from "@/components/admin/LogoutButton";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminPage() {
  const config = getAuthConfig(); const token = (await cookies()).get(config.cookieName)?.value;
  const admin = await getCurrentAdmin(prisma, token); if (!admin) redirect("/admin/login");
  return <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16"><section className="rounded-3xl border bg-white p-8 shadow-sm"><p className="eyebrow">Védett admin terület</p><h1 className="mt-3 text-4xl font-semibold">Üdv, {admin.displayName}!</h1><p className="mt-4 text-slate-600">Bejelentkezve: {maskEmail(admin.email)}. A foglaláskezelés a következő sprintben készül el.</p><LogoutButton /></section></main>;
}
