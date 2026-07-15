# API referencia

Publikus: `GET /api/health` (nyilvános health), `GET /api/availability` (dátum/unit query, availability JSON), `POST /api/bookings` (validált booking body, idempotency key támogatott; 409 ütközés/idempotencia), `GET /api/ical/export/[token]` (hash-elt token, `text/calendar`, rossz/revoked token 404, nincs vendégadat).

Admin auth: `POST /api/admin/auth/login` JSON e-mail/jelszó, challenge token válasz; `POST /api/admin/auth/verify` challenge + 6 számjegyű kód, HttpOnly session cookie; `POST /api/admin/auth/logout` session visszavonás. Hibák 400/401/422/429, JSON és same-origin ellenőrzés.

Admin booking: `POST /api/admin/bookings/[reference]/confirm` és `/reject` aktív admin sessionnel, JSON body (rejectnél reason), tranzakciós státusz/history/outbox, ismételt vagy konkurens művelet 409. A lista és részlet server-rendered oldalon fut, külön lista API nincs.

Admin iCal: `GET/POST /api/admin/ical/sources` source lista/létrehozás; `POST /api/admin/ical/sources/[id]/sync` kézi sync; `POST /api/admin/ical/export-token/rotate` új token URL egyszeri visszaadása. Minden író végpont JSON Content-Type, same-origin, no-store és admin session köteles; teljes URL/feed és tokenHash nem kerül válaszba.
