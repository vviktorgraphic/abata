# Architektúra térkép

```text
Public UI → Booking API → Booking Service → Availability → Pricing → PostgreSQL
                                      └→ EmailOutbox → Email worker/provider

Admin UI → Admin Auth → Session → Booking Management → PostgreSQL/EmailOutbox

iCal → privacy-safe Export → External consumer
External Source → SSRF-safe Fetch → Sync Worker → Imported Events → Availability
```

- `app/`: Next.js oldalak és route handlerek.
- `components/`: kliensoldali admin és booking UI.
- `lib/booking/`: booking domain, availability és státuszátmenetek.
- `lib/pricing/`: szabályalapú árkalkuláció.
- `lib/email/`: sablonok, provider, titkosítás és outbox worker.
- `lib/admin-auth/`: jelszó, challenge, session és request security.
- `lib/ical/`: parser, export, fetch és import.
- `prisma/`: schema és verziózott migrációk.
- `scripts/`: admin létrehozás, e-mail és iCal worker.
- `tests/`: Vitest és Testing Library tesztek.
- `docs/`: üzemeltetési, biztonsági és átadási dokumentáció.
