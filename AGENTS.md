# AGENTS.md

## Projekt áttekintés
Ez a repository egy moduláris, egyetlen szállásegységet kezelő Next.js booking rendszer projektvázlat. A cél egy szerverközpontú architektúra, ahol a foglalási szabályok, árképzés és iCal integráció külön modulokban kerülnek megvalósításra.

## Munkaszabályok
- Új agent elsőként olvassa el a `docs/PROJECT_HANDOFF.md`, `docs/ARCHITECTURE_MAP.md`, `docs/ROADMAP.md` és `docs/NEXT_SPRINT.md` fájlokat.
- Korábbi Prisma migrációt ne módosíts; minden séma-változás új migráció.
- Prisma módosítás után futtasd a `npm run db:generate` és `npx prisma validate` parancsokat.
- Security- és tesztelési szabályokat minden változtatásnál tartsd be.
- Nagy sprint végén frissítsd a `project-status.json` és `docs/PROJECT_HANDOFF.md` fájlokat.
- Minden üzleti szabályt szerveroldalon kell ellenőrizni.
- A foglalási intervallum [check-in, check-out) formában kezelendő.
- Az ugyanazon napos előző vendég távozása és következő vendég érkezése engedélyezett.
- A személyes adatok ne kerüljenek logokba vagy iCal exportba.
- A kód moduláris, dokumentált és tesztelhető legyen.

## Jelenlegi mérföldkő
Ebben a fázisban a projekt gerincét, a dokumentációt, a Docker és Prisma konfigurációt, valamint a minimális kezdő- és admin oldalt hoztuk létre.
