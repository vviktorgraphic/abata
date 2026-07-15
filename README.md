# Szállásfoglalási rendszer

Ez egy Next.js, TypeScript, PostgreSQL, Prisma és Tailwind CSS alapú projektvázlat egyetlen szállásegységhez.

## Előfeltételek
- Node.js 20+
- npm
- Docker Desktop vagy Docker CLI Windows-ra telepítve
- A Docker Desktopnek futnia kell, mielőtt a `docker compose` parancs működne

Az admin hitelesítés és a `npm run admin:create` használata a [docs/admin-authentication.md](docs/admin-authentication.md) dokumentumban található.

Az admin dashboard, foglaláslista és elfogadás/elutasítás folyamata a [docs/admin-booking-management.md](docs/admin-booking-management.md) dokumentumban található.

Az iCal export/import és SSRF-védelem részletei a [docs/ical-synchronization.md](docs/ical-synchronization.md) dokumentumban találhatók. A szinkron worker indítása: `npm run ical:sync`.

## Projektátadás

Az aktuális állapotot a [PROJECT_HANDOFF](docs/PROJECT_HANDOFF.md), a Windows runbookot a [LOCAL_DEVELOPMENT_RUNBOOK](docs/LOCAL_DEVELOPMENT_RUNBOOK.md), az új chat promptokat pedig a [NEW_CHAT_STARTER](docs/NEW_CHAT_STARTER.md) dokumentálja.

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
- `npm run build`
- `npm run format`

## Nyilvános foglalási prototípus

A `/` oldalon két hónapos, reszponzív naptár és valódi `PENDING` foglalási igényt létrehozó űrlap érhető el. A publikus foglaltság lekérése:

```text
GET /api/availability?from=2026-07-01&to=2026-09-01
```

A dátumok `YYYY-MM-DD` formátumúak, a `to` kizáró felső határ, és legfeljebb 12 hónapos tartomány kérhető. A válasz kizárólag `BOOKING`/`BLOCK` intervallumokat tartalmaz, személyes vagy belső adatot nem.

Az űrlap a `POST /api/bookings` végpontra küld foglalási igényt. A szerver újravalidálja a dátumot és elérhetőséget, az aktív `PricingRule` rekordokból számít árat, majd `PENDING` foglalást, státusztörténetet és változtathatatlan árpillanatképet ment. A kliens nem küld árat.

Példakérés:

```powershell
$headers = @{ "Content-Type" = "application/json"; "Idempotency-Key" = "manual-test-001" }
$body = @{ checkInDate = "2030-11-10"; checkOutDate = "2030-11-13"; guestName = "Teszt Vendég"; guestEmail = "teszt@example.test"; guestPhone = "+36301234567"; adultCount = 2; childAges = @(8); notes = ""; privacyAccepted = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/bookings" -Method Post -Headers $headers -Body $body
```

Sikeres foglalási igénykor két tranzakciós outbox rekord készül. Fejlesztésben egyszeri feldolgozásuk: `npm run email:process`. A console provider nem küld valódi e-mailt.

## Manuális ellenőrzés

1. Futtasd a migrációt és a seedet: `npx prisma migrate deploy`, majd `npm run db:seed`.
2. Indítsd az alkalmazást: `npm run dev`, majd nyisd meg a `http://localhost:3000` oldalt.
3. Ellenőrizd asztali és mobil szélességen a két hónapot, a nyilakat, a jelmagyarázatot és a vízszintes görgetés hiányát.
4. Billentyűzettel járd be a napokat és mezőket; ellenőrizd a fókuszjelölést és a napok felolvasott állapotát.
5. Válassz egymást követő, blokkon áthaladó és határnapon induló időszakokat; csak érvényes intervallum állhat össze.
6. Változtasd a gyermekek számát, töltsd ki az életkorokat, majd próbáld ki a hibás és helyes űrlap-ellenőrzést.
7. Küldd újra ugyanazt a POST kérést ugyanazzal az `Idempotency-Key` értékkel: ugyanazt a választ kell kapnod új rekord nélkül. Módosított törzzsel HTTP 409 az elvárt eredmény.
8. Két párhuzamos, azonos időszakú kérésből legfeljebb egy lehet sikeres.
9. Másik terminálban futtasd az `npm run email:process` parancsot, ellenőrizd a maszkolt console kimenetet, majd az `npm run db:studio` paranccsal a két `SENT` outbox rekordot.

## Architektúrai megjegyzések

- A foglalási intervallumok [check-in, check-out) módon kezelendők.
- A szerveroldali validáció kötelező minden üzleti szabály esetén.
- Az ütközésvizsgálat adatbázis-lekérdezéssel ellenőrzi a blokkoló foglalási státuszokat és a naptárblokkokat.
- Az árazás adatvezérelt és adminból később szerkeszthető lesz.

Részletes szabályok: `docs/booking-rules.md`. Rétegek és adatmodell: `docs/architecture.md`.

## Hibaelhárítás
Ha a Docker parancs továbbra is nem érhető el, akkor a PostgreSQL helyi példányát manuálisan is futtathatod, és a `DATABASE_URL` értékét ennek megfelelően módosítod. A projektben a `docker-compose.yml` szolgáltatja a helyi PostgreSQL referencia-konfigurációt.
