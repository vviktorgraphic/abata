# Tesztelés és CI

Vitest 3.2.7 és Testing Library futtatja a jelenlegi 84 tesztet. Fő csoportok: booking domain/API, availability/calendar, pricing, e-mail sablon/outbox, admin auth, státuszátmenetek, iCal parser/export/SSRF, komponensek.

CI sorrend: `npm ci` → `npm run db:generate` → `npx prisma validate` → `npm run lint` → `npm run typecheck` → `npm test` → `npm run build`. A Prisma generate szükséges, mert a TypeScript a generált Prisma Client típusait használja.

CI-ban nincs valódi admin, production titok, valódi e-mail provider vagy külső iCal hálózati feed. Manuálisan ellenőrizendő a Docker/PostgreSQL, admin 2FA, e-mail worker, iCal export HTTP, fixture import, token rotáció és SSRF tiltás.
