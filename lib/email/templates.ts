import type { EmailTemplate } from "./types";

export type BookingEmailData = {
  publicReference: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adultCount: number;
  childAges: readonly number[];
  notes: string;
  createdAt: Date;
  price: {
    accommodationSubtotal: number;
    extraAdultFee: number;
    childrenFee: number;
    cleaningFee: number;
    tourismTax: number;
    discount: number;
    total: number;
    currency: string;
  };
  appName: string;
  contactEmail: string;
};

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function adminLoginCodeTemplate(input: { code: string; expiresInMinutes: number; appName: string }) {
  const subject = `${input.appName} – admin belépési kód`;
  const text = `Admin bejelentkezési kód: ${input.code}\n\nA kód ${input.expiresInMinutes} percig érvényes. Ne oszd meg mással. Ha nem te kezdeményezted a belépést, hagyd figyelmen kívül ezt az üzenetet.`;
  const html = `<h1>Admin bejelentkezés</h1><p>A belépési kód:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${input.code}</p><p>A kód ${input.expiresInMinutes} percig érvényes. Ne oszd meg mással.</p><p>Ha nem te kezdeményezted a belépést, hagyd figyelmen kívül ezt az üzenetet.</p>`;
  return { subject, text, html };
}

const money = (value: number) => new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(value);

function priceText(data: BookingEmailData): string {
  return [`Szállás: ${money(data.price.accommodationSubtotal)}`, `Extra felnőtt díj: ${money(data.price.extraAdultFee)}`, `Gyermekdíj: ${money(data.price.childrenFee)}`, `Takarítás: ${money(data.price.cleaningFee)}`, `Összesen: ${money(data.price.total)}`].join("\n");
}

function layout(title: string, content: string, appName: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f7f3;font-family:Arial,sans-serif;color:#173128"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:auto;background:#fff;border:1px solid #dbe4df;border-radius:12px"><tr><td style="padding:28px"><h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(title)}</h1>${content}<p style="margin-top:28px;color:#66756f">${escapeHtml(appName)}</p></td></tr></table></td></tr></table></body></html>`;
}

function priceHtml(data: BookingEmailData): string {
  const rows = [["Szállás", data.price.accommodationSubtotal], ["Extra felnőtt díj", data.price.extraAdultFee], ["Gyermekdíj", data.price.childrenFee], ["Takarítás", data.price.cleaningFee], ["Összesen", data.price.total]] as const;
  return `<table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse">${rows.map(([label, value]) => `<tr><td style="border-bottom:1px solid #dbe4df">${label}</td><td style="text-align:right;border-bottom:1px solid #dbe4df"><strong>${money(value)}</strong></td></tr>`).join("")}</table>`;
}

export function bookingRequestGuestTemplate(data: BookingEmailData): EmailTemplate {
  const subject = `Foglalási igény rögzítve – ${data.publicReference}`;
  const warning = "Ez még nem végleges foglalási visszaigazolás. A foglalási igény PENDING állapotú; a tulajdonos később fogja elfogadni vagy elutasítani.";
  const text = `Kedves ${data.guestName}!\n\nFoglalási referenciaszám: ${data.publicReference}\nÁllapot: PENDING\nÉrkezés: ${data.checkInDate}\nTávozás: ${data.checkOutDate}\nÉjszakák: ${data.nights}\nFelnőttek: ${data.adultCount}\nGyermekek: ${data.childAges.length}\n\n${priceText(data)}\n\n${warning}\nKérjük, őrizd meg a referenciaszámot. Kapcsolat: ${data.contactEmail}`;
  const html = layout("Foglalási igényedet rögzítettük", `<p>Kedves ${escapeHtml(data.guestName)}!</p><p><strong>Referencia: ${escapeHtml(data.publicReference)}</strong><br>Állapot: PENDING<br>Érkezés: ${escapeHtml(data.checkInDate)}<br>Távozás: ${escapeHtml(data.checkOutDate)}<br>Éjszakák: ${data.nights}<br>Felnőttek: ${data.adultCount}<br>Gyermekek: ${data.childAges.length}</p>${priceHtml(data)}<p style="padding:14px;background:#fff4d6"><strong>Fontos:</strong> ${escapeHtml(warning)}</p><p>Kérjük, őrizd meg a referenciaszámot. Kapcsolat: ${escapeHtml(data.contactEmail)}</p>`, data.appName);
  return { subject, text, html };
}

export function bookingRequestAdminTemplate(data: BookingEmailData): EmailTemplate {
  const subject = `Új foglalási igény – ${data.publicReference}`;
  const children = data.childAges.length ? data.childAges.join(", ") : "nincs";
  const text = `Új PENDING foglalási igény érkezett.\nReferencia: ${data.publicReference}\nVendég: ${data.guestName}\nE-mail: ${data.guestEmail}\nTelefon: ${data.guestPhone}\nÉrkezés: ${data.checkInDate}\nTávozás: ${data.checkOutDate}\nÉjszakák: ${data.nights}\nFelnőttek: ${data.adultCount}\nGyermekkorok: ${children}\nMegjegyzés: ${data.notes || "nincs"}\nLétrehozva: ${data.createdAt.toISOString()}\n\n${priceText(data)}\n\nA foglalási igény kezelése a hamarosan elkészülő adminfelületen lesz elérhető.`;
  const html = layout("Új foglalási igény", `<p>Új <strong>PENDING</strong> foglalási igény érkezett.</p><p>Referencia: <strong>${escapeHtml(data.publicReference)}</strong><br>Vendég: ${escapeHtml(data.guestName)}<br>E-mail: ${escapeHtml(data.guestEmail)}<br>Telefon: ${escapeHtml(data.guestPhone)}<br>Érkezés: ${escapeHtml(data.checkInDate)}<br>Távozás: ${escapeHtml(data.checkOutDate)}<br>Éjszakák: ${data.nights}<br>Felnőttek: ${data.adultCount}<br>Gyermekkorok: ${escapeHtml(children)}<br>Megjegyzés: ${escapeHtml(data.notes || "nincs")}<br>Létrehozva: ${escapeHtml(data.createdAt.toISOString())}</p>${priceHtml(data)}<p>A foglalási igény kezelése a hamarosan elkészülő adminfelületen lesz elérhető.</p>`, data.appName);
  return { subject, text, html };
}
