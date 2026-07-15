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

## Naptár napi állapotai

A `getCalendarDayAvailability` nem egyetlen foglalt/szabad értéket ad vissza. Külön jelzi, hogy engedélyezett-e az érkezés és a távozás, teljesen blokkolt vagy múltbeli-e a nap, illetve érkezési vagy távozási határra esik-e.

- Az intervallum kezdőnapja érkezési határ: az új érkezés blokkolt, egy korábbi tartózkodás távozása lehetséges.
- Az intervallum zárónapja távozási határ: az előző vendég távozik, ezért új érkezés lehetséges.
- A két határ közötti nap teljesen blokkolt.
- A határokat átlós, félcellás jelölés mutatja; az állapotot szöveges `aria-label` és a jelmagyarázat is közvetíti.

## Dátumkiválasztás

Az első érvényes kattintás az érkezés, a következő későbbi, távozásra használható nap a távozás. Az `isSelectableBookingInterval` a domain `doBookingIntervalsOverlap` függvényét használva tiltja a nulla éjszakás, múltbeli és blokkolt intervallumon áthaladó kijelölést. A távozási határnap új érkezési napként választható. A kijelölés visszaállítható; egy kész időszak után új nap választása új kijelölést kezd.

## Publikus availability API

`GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`

A tartomány fél-nyílt, legfeljebb 12 hónapos. A válasz `range` és rendezett `intervals` mezőt tartalmaz; minden intervallum kizárólag `start`, `end` és `type` (`BOOKING` vagy `BLOCK`) értéket publikál. Hibás dátumnál `INVALID_DATE_RANGE`, túl hosszú tartománynál `RANGE_TOO_LARGE` kódú, HTTP 400 válasz érkezik.
