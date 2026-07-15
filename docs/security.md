# Security

## Alapelvek
- A titkok `.env` fájlban kerülnek tárolásra.
- A személyes adatok nem kerülnek logokba.
- Minden felhasználói adat bejövő input friss validációval érkezik.
- Később az admin autentikáció jelszó + e-mailes 2FA kóddal lesz megvalósítva.

## Jelenlegi állapot
A projekt scaffold alapú és a biztonsági irányelvek dokumentáltak, de a teljes autentikáció és RBAC még nincs implementálva.

## Foglalási API

- A szerver nem fogad el kliensoldali árat, státuszt, `childCount` értéket vagy publikus referenciát.
- A teljes payload, e-mail és telefonszám nem kerül logba vagy hibaválaszba.
- A hozzájárulás kötelező, időpontja `privacyAcceptedAt`; IP-cím nem kerül tárolásra.
- Az API a Prisma/adatbázis hibák helyett stabil publikus hibakódot ad.
- A publikus referencia kriptográfiai véletlen 40 bites suffixet tartalmaz, személyes és növekvő adatbázis-azonosító nélkül.
- Az opcionális idempotenciakulcs legfeljebb 100 karakter, korlátozott karakterkészlettel; az eltérő tartalmú újrahasználat konfliktus.
- E-mail-szolgáltató és tényleges e-mail-küldés ebben a sprintben nincs integrálva.
