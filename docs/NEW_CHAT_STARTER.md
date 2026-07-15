# Új chat indító promptok

## Prompt 1 – rövid indító prompt

Egy Next.js 16.2.10 / TypeScript strict / PostgreSQL / Prisma 6.19.3 / Tailwind 4 / Vitest projektet folytatunk. A cél egyetlen szállásegység foglalási rendszere nyilvános bookinggal, szerveroldali pricinggel, admin 2FA-val, outbox e-mailekkel, admin booking managementtel és tokenes iCal import/exporttal. A jelenlegi állapot 84 teszt, működő Prisma migrációk és CI build.

Kérlek először olvasd el: `AGENTS.md`, `docs/PROJECT_HANDOFF.md`, `docs/ARCHITECTURE_MAP.md`, `docs/ROADMAP.md`, `docs/NEXT_SPRINT.md`, majd ellenőrizd a `git status`-t és a kódot. Ne feltételezz korábbi összefoglaló alapján, és ne módosíts kódot vakon. A következő javasolt sprint a production readiness foundation: valódi e-mail provider, staging/deployment, scheduled worker, health/readiness, structured logging, error tracking és backup/restore. Titkot, valódi jelszót vagy tokent ne hozz létre és ne commitolj.

## Prompt 2 – Codex indító prompt

Olvasd el ebben a sorrendben: `AGENTS.md`, `docs/PROJECT_HANDOFF.md`, `docs/ARCHITECTURE_MAP.md`, `docs/ROADMAP.md`, `docs/NEXT_SPRINT.md`. Ezután futtasd a `git status --short` és `git log -5 --oneline` parancsokat, ellenőrizd a package/séma/migrációk állapotát, majd a szükséges validációkat (`npm run db:generate`, `npx prisma validate`, lint, typecheck, test, build). Készíts rövid tervet és csak jóváhagyható, szűk scope-ban kezdj fejlesztést. Ne módosíts korábbi migrációt; tartsd meg a szerveroldali security, no-store, SSRF és adatvédelmi szabályokat; frissítsd a handoffot és `project-status.json`-t nagy sprint végén.
