# Local development runbook (Windows PowerShell)

1. Előfeltétel: Node.js 20+, npm, Docker Desktop futó virtualizációval.
2. `docker compose up -d`
3. `Copy-Item .env.example .env`, majd adj meg fejlesztői `AUTH_SECRET` értéket.
4. `npm install`
5. `npm run db:generate`
6. `npx prisma migrate deploy` (új séma fejlesztéskor `npm run db:migrate`).
7. `npm run db:seed`
8. `$env:ADMIN_CREATE_EMAIL="admin@example.test"; $env:ADMIN_CREATE_PASSWORD="<placeholder>"; $env:ADMIN_CREATE_DISPLAY_NAME="Local admin"; npm run admin:create; Remove-Item Env:ADMIN_CREATE_EMAIL,Env:ADMIN_CREATE_PASSWORD,Env:ADMIN_CREATE_DISPLAY_NAME`
9. `npm run dev`, majd `/admin/login`.
10. Külön terminál: `npm run email:process`.
11. iCal worker: `npm run ical:sync`.
12. Prisma Studio: `npm run db:studio`.
13. Validáció: `npm run lint; npm run typecheck; npm test; npm run build`.

Gyakori hibák: Docker virtualization support esetén engedélyezd a virtualizációt és indítsd újra Docker Desktopot; P1001-nél ellenőrizd a konténert és `DATABASE_URL`-t; Prisma EPERM DLL locknál állítsd le a Next dev szervert és regenerálj; 3000-as port foglaltságnál `npm run dev -- -p 3001`; PowerShell `curl` helyett `Invoke-WebRequest`; `Failed to fetch` esetén ellenőrizd a hálózatot/SSRF-szabályt; CI-ban mindig fusson `npm ci` után `npm run db:generate`; console provider kódjához futtasd developmentben az email workert; idempotency vagy booking period 409 esetén ellenőrizd a kulcsot és a dátumütközést; localhost iCal feed alapból tiltott, csak explicit development flaggel engedélyezhető.
