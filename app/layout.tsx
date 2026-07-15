import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Szállásfoglalás | Elérhetőségi naptár",
  description: "Két hónapos elérhetőségi naptár és foglalási adatellenőrző prototípus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className="h-full antialiased">
      <body className="min-h-full bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
