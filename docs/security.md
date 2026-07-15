# Security

## Alapelvek
- A titkok `.env` fájlban kerülnek tárolásra.
- A személyes adatok nem kerülnek logokba.
- Minden felhasználói adat bejövő input friss validációval érkezik.
- Később az admin autentikáció jelszó + e-mailes 2FA kóddal lesz megvalósítva.

## Jelenlegi állapot
A projekt scaffold alapú és a biztonsági irányelvek dokumentáltak, de a teljes autentikáció és RBAC még nincs implementálva.
