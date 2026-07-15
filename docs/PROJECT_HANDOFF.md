# Project handoff

## Projekt célja

Egyetlen szállásegység szerverközpontú foglalási rendszere nyilvános foglalási felülettel, adatvezérelt árazással, admin jóváhagyással, e-mailes 2FA-val, tranzakciós e-mail outboxszal és kétirányú iCal import/exporttal.

## Stack

Next.js 16.2.10, React 19.2.4, TypeScript 5 strict, PostgreSQL, Prisma 6.19.3, Tailwind CSS 4, Vitest 3.2.7, Docker Compose és GitHub Actions. A bcryptjs 3.0.3 a jelszóhash-eléshez, Zod 4 validációhoz használatos.

## Elkészült modulok

1. **Projektalap és CI** – App Router, TypeScript, Prisma, Docker és CI ellenőrzési lánc (`npm ci`, generate, validate, lint, typecheck, test, build).
2. **Booking domain** – `lib/booking/domain.ts`, dátum/éjszaka/átfedés és szerveroldali validáció; [check-in, check-out) intervallum.
3. **Availability és naptár** – foglalások, `CalendarBlock` és aktív `ICalImportedEvent` rekordok közös ellenőrzése.
4. **Pricing engine** – `lib/pricing/`, `PricingRule`, szerveroldali árkalkuláció és `BookingPriceSnapshot`.
5. **Booking API** – `GET /api/availability`, `POST /api/bookings`, tranzakciós létrehozás és outbox.
6. **Idempotencia** – `BookingRequestIdempotency`, request hash és konfliktus esetén 409.
7. **Email outbox** – `EmailOutbox`, provider abstraction, retry/backoff, console provider és `npm run email:process`; developmentben admin kód látható, productionben tiltott.
8. **Admin authentication** – `AdminUser`, challenge/session modellek, bcrypt cost 12, hash-elt tokenek, HttpOnly session cookie, lockout és 2FA API.
9. **Admin booking management** – `/admin`, `/admin/bookings`, részletek, confirm/reject API, státuszátmenet-domain és audit history.
10. **iCal import/export** – `lib/ical`, tokenes privacy-safe export, SSRF-védett külső feed import, UID-upsert, sync worker (`npm run ical:sync`) és `/admin/ical`.
11. **Dokumentáció** – architektúra, security, booking, e-mail, auth és iCal dokumentumok.
12. **Tesztelés** – 84 Vitest teszt; domain, API, pricing, calendar, auth, outbox, iCal és UI lefedettség.

## Fő üzleti szabályok

- A foglalási intervallum `[check-in, check-out)`; azonos napi távozás és érkezés lehetséges.
- A `PENDING` nem végleges. Csak `CONFIRMED` booking exportálódik iCalban.
- Aktív, nem törölt iCal esemény blokkolja az availability-t.
- Ár szerveroldalon számítódik és a snapshot megmarad.
- E-mail hiba nem gördíti vissza a booking státuszt.
- Admin státuszváltás historyban admin actorral auditált.

## Státuszok és átmenetek

`PENDING`, `QUOTED`, `AWAITING_APPROVAL`, `CONFIRMED`, `REJECTED`, `CANCELLED`, `EXPIRED`, `ICAL_IMPORTED`.

Engedélyezett: `PENDING → CONFIRMED/REJECTED/CANCELLED`, `QUOTED → CONFIRMED/REJECTED`, `AWAITING_APPROVAL → CONFIRMED/REJECTED`, `CONFIRMED → CANCELLED`. Minden más átmenet tiltott.

## Kritikus modellek

`AccommodationUnit` a booking, pricing, calendar és iCal source gyökere. `Booking` vendég-, dátum- és státuszadatokat tart; gyermekek/guest rekordokkal, snapshot-tal, historyval és outbox kapcsolattal. `PricingRule` árverziókat, `CalendarBlock` kézi blokkokat tárol. `EmailOutbox` küldési életciklust kezel. `AdminUser`, `AdminLoginChallenge`, `AdminSession` és `AdminAuthEvent` a hitelesítést szolgálják. `ICalSource` külső feedet, `ICalImportedEvent` UID-s eseményt, `ICalSyncRun` futási statisztikát, `ICalExportToken` hash-elt feed-hozzáférést tárol.

## Biztonsági döntések

Bcrypt cost 12 és dummy password verification; challenge/session token csak hashként tárolódik; HttpOnly/SameSite=Lax, productionben Secure cookie; AES-256-GCM titkosított outbox body; JSON Content-Type és same-origin ellenőrzés; tranzakciós/advisory lockos foglaláskezelés; iCal SSRF-védelem DNS/IP/redirect/timeout/méret ellenőrzéssel; exportban nincs vendégadat; CI-ban nincs production titok.

## iCal és e-mail korlátok

Az export URL formája `/api/ical/export/<nyers-token>`, a DB-ben hash van; rotáció a régi tokent visszavonja. Az import UID + recurrence-id alapján upsertel, eltűnés `REMOVED`, `STATUS:CANCELLED` deaktivál. A worker külső scheduler nélkül, egyszer futó CLI. Az e-mail provider jelenleg console-only, valódi production provider még nincs.

## Következő állapot

A javasolt következő sprint: production readiness foundation. Részletek a [ROADMAP.md](ROADMAP.md) és [NEXT_SPRINT.md](NEXT_SPRINT.md) fájlban.
