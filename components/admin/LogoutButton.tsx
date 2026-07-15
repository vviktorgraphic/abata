"use client";
import { useState } from "react";
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return <button className="primary-button mt-6" disabled={busy} onClick={async () => { setBusy(true); await fetch("/api/admin/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); window.location.assign("/admin/login"); }}>{busy ? "Kijelentkezés…" : "Kijelentkezés"}</button>;
}
