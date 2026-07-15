# Architektúra

## Áttekintés
A rendszer egy Next.js alkalmazás, amely a Next.js App Router architektúrát használja. A felhasználói felület és a szerveroldali végpontok ugyanabban a projektben vannak, de az üzleti logikák moduláris rétegekben szerveződnek.

## Rétegek

- App layer: Next.js route-ok és UI komponensek.
- Domain layer: tiszta dátum- és validációs függvények, valamint a szerveroldali Prisma elérhetőségvizsgálat a `lib/booking` modulban.
- Data layer: Prisma és PostgreSQL.
- Integration layer: iCal import/export modul.
- Security layer: input validation és titokkezelés.

## Közös elvek

- Minden üzleti szabály szerveroldalon érvényesül.
- A foglalási ár részletes pillanatképe a tárolt adatokban rögzítésre kerül.
- A `Booking` az elsődleges vendégadatokat és a foglalás állapotát tárolja; a vendégek, gyermekkorok, státusztörténet és ár-pillanatkép külön kapcsolt modellek.
- A kézi és iCal eredetű lezárások egységesen `CalendarBlock` rekordok, az adatvezérelt árképzés alapja a `PricingRule`.
- Személyes adat nem kerülhet logba, státuszindoklásba vagy iCal exportba.
- Az adminhitelesítés később password + email-based 2FA módon kerül megvalósításra.
