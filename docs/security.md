# Security

## Alapelvek
- A titkok `.env` fájlban kerülnek tárolásra.
- A személyes adatok nem kerülnek logokba.
- Minden felhasználói adat bejövő input friss validációval érkezik.
- Később az admin autentikáció jelszó + e-mailes 2FA kóddal lesz megvalósítva.

## Jelenlegi állapot
A szerveroldali admin hitelesítés implementált; részletek az [admin-authentication.md](admin-authentication.md) fájlban.

## Foglalási API

- A szerver nem fogad el kliensoldali árat, státuszt, `childCount` értéket vagy publikus referenciát.
- A teljes payload, e-mail és telefonszám nem kerül logba vagy hibaválaszba.
- A hozzájárulás kötelező, időpontja `privacyAcceptedAt`; IP-cím nem kerül tárolásra.
- Az API a Prisma/adatbázis hibák helyett stabil publikus hibakódot ad.
- A publikus referencia kriptográfiai véletlen 40 bites suffixet tartalmaz, személyes és növekvő adatbázis-azonosító nélkül.
- Az opcionális idempotenciakulcs legfeljebb 100 karakter, korlátozott karakterkészlettel; az eltérő tartalmú újrahasználat konfliktus.
- A provider konfiguráció környezeti változókból, központi Zod-validációval érkezik; titok nem kerül az adatbázisba.
- Production környezetben a console provider nem küld és nem naplóz tartalmat. Fejlesztésben is maszkolt cím és személyes adat nélküli metadata kerül a console-ra.
- Az outbox hibaüzenete stabil, tisztított kód/szöveg; nem tárol provider-választ, API-kulcsot vagy Authorization headert.
- A sablon minden felhasználói HTML-tartalmat escape-el. A címzett kizárólag szerveren validált booking-adatból származik.
- Az API-válasz nem tartalmaz e-mail/outbox adatot, és a provider hibája nem törli a már commitolt foglalást.
