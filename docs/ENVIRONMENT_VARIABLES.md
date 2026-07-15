# Környezeti változók

| Csoport | Változó | Kötelező | Jelentés/biztonság |
|---|---|---:|---|
| App | `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL` | nem | publikus alkalmazásnév és URL |
| Database | `DATABASE_URL` | igen | PostgreSQL kapcsolat; ne commitold |
| Prisma | `PRISMA_SCHEMA_PATH` | nem | schema útvonal |
| Auth | `AUTH_SECRET` | igen productionben | legalább 32 karakteres titok |
| Auth | `ADMIN_SESSION_COOKIE_NAME`, `ADMIN_SESSION_TTL_HOURS` | nem | session cookie és TTL |
| Auth | `ADMIN_2FA_CODE_TTL_MINUTES`, `ADMIN_2FA_MAX_ATTEMPTS`, `ADMIN_2FA_RESEND_COOLDOWN_SECONDS` | nem | challenge korlátok |
| Auth | `ADMIN_PASSWORD_MAX_ATTEMPTS`, `ADMIN_LOCKOUT_MINUTES`, `AUTH_DUMMY_PASSWORD_HASH` | nem | lockout és timing védelem |
| Email | `EMAIL_PROVIDER`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`, `BOOKING_NOTIFICATION_EMAIL`, `EMAIL_MAX_ATTEMPTS` | provider szerint | console fejlesztői provider; productionben valós provider szükséges |
| Email | `EMAIL_DEBUG_CONTENT` | fejlesztés | csak development console debug; titkot ne állíts be productionben |
| iCal | `ICAL_EXPORT_DOMAIN`, `ICAL_SYNC_TIMEOUT_MS`, `ICAL_SYNC_MAX_RESPONSE_BYTES`, `ICAL_SYNC_MAX_REDIRECTS`, `ICAL_DEFAULT_SYNC_INTERVAL_MINUTES` | nem | export és fetch korlátok |
| iCal | `ICAL_ALLOW_PRIVATE_NETWORKS_IN_DEVELOPMENT` | nem | alapértelmezett `false`; productionben nem használható engedmény |
| Admin CLI | `ADMIN_CREATE_EMAIL`, `ADMIN_CREATE_PASSWORD`, `ADMIN_CREATE_DISPLAY_NAME` | ideiglenes | csak process environment; ne fájlban tárold |

Az `.env.example` csak placeholder értékeket tartalmaz; valódi jelszó, token és encryption key nem kerülhet Gitbe.
