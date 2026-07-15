# Követelmények

## Funkcionális célok
- Egyetlen szállásegység kezelése.
- Közvetlen foglalási árazás adatvezérelt módon.
- Admin felület későbbi szerkesztéshez.
- iCal import/export külön modulban.
- Szerveroldali szabályvalidáció.

## Architekturális korlátok
- A foglalás kezdő és végő időpontja közötti intervallum [check-in, check-out).
- Azon a napon ugyanolyan napon engedélyezett az előző vendég távozása és a következő érkezése.
- Személyes adatok nem kerülnek naplózási és iCal export útvonalba.
