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

## Foglalási igény API

A `POST /api/bookings` Zod sémával ellenőrzi és normalizálja a vendégadatokat. A `childCount` mindig a `childAges.length` értékéből származik. A szerver közvetlenül mentés előtt újraszámolja az éjszakákat, ellenőrzi a múltbeli dátumot és a rendelkezésre állást, majd saját maga számolja az árat. Siker esetén csak publikus referencia, státusz, dátumok és áradatok kerülnek a válaszba; belső azonosító és személyes adat nem.

Hibakódok: `INVALID_JSON` (400), `INVALID_IDEMPOTENCY_KEY` (400), `VALIDATION_ERROR` (422, opcionális `fieldErrors`), `BOOKING_PERIOD_UNAVAILABLE` (409), `IDEMPOTENCY_CONFLICT` (409), `PRICING_UNAVAILABLE` (500), `INTERNAL_ERROR` (500). A létrejövő státusz `PENDING`, nem automatikusan `CONFIRMED`.

A sikeres tranzakció két `PENDING` e-mail outbox rekordot is létrehoz, de az API nem várja meg és nem garantálja a kézbesítést. Az API-válasz nem tartalmaz outbox- vagy provider-adatot. Az idempotens replay nem készít új e-mail rekordot.
