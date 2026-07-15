# Architektúra

## Áttekintés
A rendszer egy Next.js alkalmazás, amely a Next.js App Router architektúrát használja. A felhasználói felület és a szerveroldali végpontok ugyanabban a projektben vannak, de az üzleti logikák moduláris rétegekben szerveződnek.

## Rétegek

- App layer: Next.js route-ok és UI komponensek.
- Domain layer: tiszta dátum- és validációs függvények, valamint a szerveroldali Prisma elérhetőségvizsgálat a `lib/booking` modulban.
- Data layer: Prisma és PostgreSQL.
- Integration layer: iCal import/export modul.
- Security layer: input validation és titokkezelés.

## Nyilvános foglalási réteg

- A `GET /api/availability` route a `lib/booking/availability.ts` lekérdezőt használja, és csak dátumokat valamint publikus intervallumtípust választ ki a Prisma queryben.
- A `lib/booking/calendar.ts` tiszta függvényekkel alakítja az intervallumokat explicit napi állapotokká és ugyanazt a domain átfedésvizsgálatot használja.
- A `lib/booking/validation.ts` közös Zod séma a kliensoldali prototípus mezőinek ellenőrzésére; későbbi szerveroldali beküldésnél ugyanez a séma újrahasználható.
- A `components/booking` kis, felelősség szerint bontott komponenseket tartalmaz. A publikus oldal szabványos HTML form-elemekből áll, ezért önálló weboldalba később átültethető.
- A jelenlegi űrlap a `POST /api/bookings` és a `createBookingRequest` alkalmazásszolgáltatáson keresztül valódi `PENDING` igényt hoz létre. A szolgáltatás kezeli a normalizált bemenetet, az árazást, snapshotot, státusztörténetet és idempotenciát.

## Konzisztens foglalási tranzakció

A mentés Prisma `Serializable` tranzakcióban történik. A tranzakció `pg_advisory_xact_lock(hashtextextended(unitId, 0))` zárolást kér a szállásegységre, majd a lock után futtatja újra a booking- és CalendarBlock-lekérdezést. Az azonos egységre érkező konkurens mentések így sorban haladnak; a második kérés már látja az első `PENDING` rekordját. A lock tranzakció végén automatikusan felszabadul.

Az `Idempotency-Key` és a normalizált kérés SHA-256 hash-e a `BookingRequestIdempotency` rekordban tárolódik a biztonságos válasszal. A rekordok 24 óra után lejártak; későbbi ütemezett karbantartás törli az `expiresAt` szerinti rekordokat, a kérésfolyamat pedig újrafelhasználáskor eltávolítja a lejárt kulcsot.

## Közös elvek

- Minden üzleti szabály szerveroldalon érvényesül.
- A foglalási ár részletes pillanatképe a tárolt adatokban rögzítésre kerül.
- A `Booking` az elsődleges vendégadatokat és a foglalás állapotát tárolja; a vendégek, gyermekkorok, státusztörténet és ár-pillanatkép külön kapcsolt modellek.
- A kézi és iCal eredetű lezárások egységesen `CalendarBlock` rekordok, az adatvezérelt árképzés alapja a `PricingRule`.
- Személyes adat nem kerülhet logba, státuszindoklásba vagy iCal exportba.
- A publikus availability API személyes adatot és belső azonosítót lekérdezéskor sem választ ki.
- Az adminhitelesítés később password + email-based 2FA módon kerül megvalósításra.
