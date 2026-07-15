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
- A jelenlegi űrlap kizárólag ellenőrzött összefoglalót jelenít meg, adatbázis-műveletet nem végez.

## Közös elvek

- Minden üzleti szabály szerveroldalon érvényesül.
- A foglalási ár részletes pillanatképe a tárolt adatokban rögzítésre kerül.
- A `Booking` az elsődleges vendégadatokat és a foglalás állapotát tárolja; a vendégek, gyermekkorok, státusztörténet és ár-pillanatkép külön kapcsolt modellek.
- A kézi és iCal eredetű lezárások egységesen `CalendarBlock` rekordok, az adatvezérelt árképzés alapja a `PricingRule`.
- Személyes adat nem kerülhet logba, státuszindoklásba vagy iCal exportba.
- A publikus availability API személyes adatot és belső azonosítót lekérdezéskor sem választ ki.
- Az adminhitelesítés később password + email-based 2FA módon kerül megvalósításra.
