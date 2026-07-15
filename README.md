# Szállásfoglalási rendszer

Ez egy Next.js, TypeScript, PostgreSQL, Prisma és Tailwind CSS alapú projektvázlat egyetlen szállásegységhez.

## Előfeltételek
- Node.js 20+
- npm
- Docker Desktop vagy Docker CLI Windows-ra telepítve
- A Docker Desktopnek futnia kell, mielőtt a `docker compose` parancs működne

## Helyi indítás
1. Másold a `.env.example` fájlt `.env` néven, és állítsd be a helyi értékeket.
2. Ha Docker Desktop telepítve van és fut, indítsd el a PostgreSQL konténert:
   ```bash
   docker compose up -d
   ```
3. Ha a PowerShellben ezt látod:
   ```powershell
   docker: The term 'docker' is not recognized as the name of a cmdlet...
   ```
   akkor a Docker CLI nincs a PATH-ban, vagy nincs telepítve a Docker Desktop. Telepítsd és indítsd el a Docker Desktopet, majd ellenőrizd:
   ```powershell
   docker --version
   ```
4. Telepítsd a függőségeket:
   ```bash
   npm install
   ```
5. Generáld a Prisma klienst és alkalmazd a verziózott migrációkat:
   ```bash
   npm run db:generate
   npx prisma migrate deploy
   ```
6. Igény szerint töltsd be az idempotens fejlesztői mintaadatokat:
   ```bash
   npm run db:seed
   ```
7. Indítsd el a fejlesztői szervert:
   ```bash
   npm run dev
   ```

## Ellenőrző parancsok
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run format`

## Architektúrai megjegyzések

- A foglalási intervallumok [check-in, check-out) módon kezelendők.
- A szerveroldali validáció kötelező minden üzleti szabály esetén.
- Az ütközésvizsgálat adatbázis-lekérdezéssel ellenőrzi a blokkoló foglalási státuszokat és a naptárblokkokat.
- Az árazás adatvezérelt és adminból később szerkeszthető lesz.

Részletes szabályok: `docs/booking-rules.md`. Rétegek és adatmodell: `docs/architecture.md`.

## Hibaelhárítás
Ha a Docker parancs továbbra is nem érhető el, akkor a PostgreSQL helyi példányát manuálisan is futtathatod, és a `DATABASE_URL` értékét ennek megfelelően módosítod. A projektben a `docker-compose.yml` szolgáltatja a helyi PostgreSQL referencia-konfigurációt.
