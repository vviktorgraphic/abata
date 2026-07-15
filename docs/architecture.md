# Architektúra

## Áttekintés
A rendszer egy Next.js alkalmazás, amely a Next.js App Router architektúrát használja. A felhasználói felület és a szerveroldali végpontok ugyanabban a projektben vannak, de az üzleti logikák moduláris rétegekben szerveződnek.

## Rétegek
- App layer: Next.js route-ok és UI komponensek.
- Domain layer: foglalási szabályok és árképzés funkciók.
- Data layer: Prisma és PostgreSQL.
- Integration layer: iCal import/export modul.
- Security layer: input validation és titokkezelés.

## Közös elvek
- Minden üzleti szabály szerveroldalon érvényesül.
- A foglalási ár részletes pillanatképe a tárolt adatokban rögzítésre kerül.
- Az adminhitelesítés később password + email-based 2FA módon kerül megvalósításra.
