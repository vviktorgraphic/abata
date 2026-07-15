# Roadmap és technikai adósság

## Kritikus production előtt

- Valódi e-mail provider: küldés biztosítása; kockázat elveszett értesítés; sorrend első.
- Deployment és scheduler: worker futtatás; kockázat elmaradt retry/sync; staging után.
- Backup/restore, monitoring, error tracking: üzemeltetési és adatvesztési kockázat; deployment előtt.
- Production secrets, domain/HTTPS, adatvédelmi dokumentumok, retention/törlés, restore- és penetration teszt: megfelelőség és támadási kockázat; provider után.

## Fontos, nem blokkoló

Pricing admin, e-mail retry UI, iCal conflict management, jobb admin naptár, cancellation workflow, password reset, session management finomítás, TOTP 2FA, több admin role és audit UI: kezelhetőség/biztonság javítása a production alapok után.

## Későbbi fejlesztés

Fizetés, kupon, több szállásegység, CalDAV, Google Calendar API, Booking.com/Airbnb API és analytics: üzleti bővítés, csak stabil production után.
