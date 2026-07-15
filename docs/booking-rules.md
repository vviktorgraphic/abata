# Foglalási szabályok

## Intervallum modell

A foglalások és naptárblokkok dátum alapú, fél-nyílt `[check-in, check-out)` intervallumok. Két intervallum akkor ütközik, ha `existingStart < requestedEnd` és `existingEnd > requestedStart`. Emiatt az egyik vendég távozási napja lehet a következő vendég érkezési napja.

## Validáció

A `lib/booking/domain.ts` szerveroldali domainréteg ellenőrzi, hogy:

- a távozás későbbi az érkezésnél, a tartózkodás legalább egy éjszaka;
- az érkezés nem múltbeli;
- legalább egy felnőtt van, a gyermekek száma nem negatív egész;
- a `childCount` megegyezik a `BookingChild` rekordokhoz átadott életkorok számával.

## Elérhetőség

A `checkAvailability` közvetlen Prisma-lekérdezéssel vizsgálja ugyanazon szállásegység átfedő foglalásait és `CalendarBlock` rekordjait. Blokkoló státuszok: `PENDING`, `QUOTED`, `AWAITING_APPROVAL`, `CONFIRMED`, `ICAL_IMPORTED`. A `REJECTED`, `CANCELLED` és `EXPIRED` foglalások nem blokkolnak.

Az ellenőrzést minden későbbi létrehozási vagy módosítási szerverfolyamatnak meg kell hívnia. Nagyobb konkurens terhelésnél az ellenőrzést és létrehozást tranzakcióval/adatbázis-szintű zárolással is védeni kell.
