import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
export const metadata = { title: "Admin bejelentkezés", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function LoginPage() { return <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-16"><section className="w-full rounded-3xl border bg-white p-8 shadow-sm"><p className="eyebrow">Admin</p><h1 className="mt-3 text-3xl font-semibold">Biztonságos bejelentkezés</h1><AdminLoginForm /></section></main>; }
