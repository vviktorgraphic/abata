# E-mail-rendszer

## Provider absztrakció és konfiguráció

Az `ADMIN_LOGIN_CODE` sablon az outbox része; bodyja AES-256-GCM titkosítva kerül adatbázisba, és csak a worker fejti vissza küldéskor. Developmentben `EMAIL_DEBUG_CONTENT=true` mellett a console provider kiírhatja a tartalmat.

Az `EmailProvider.send` szolgáltatófüggetlen `EmailMessage` objektumot fogad. Jelenleg csak a fejlesztői `ConsoleEmailProvider` létezik; nem küld valódi levelet, és production környezetben explicit konfigurációs hibát ad. Későbbi szolgáltató a `createEmailProvider` csatlakozási pontján illeszthető be.

Környezeti változók: `EMAIL_PROVIDER`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`, `BOOKING_NOTIFICATION_EMAIL` (fejlesztési fallback: `AUTH_ADMIN_EMAIL`) és `EMAIL_MAX_ATTEMPTS`. A production konfigurációnak teljesnek és érvényesnek kell lennie.

## Outbox és tranzakció

A booking mentési tranzakciója két, már renderelt text/HTML tartalmú rekordot hoz létre: `BOOKING_REQUEST_GUEST` és `BOOKING_REQUEST_ADMIN`. Az egyedi kulcsok `booking:<id>:guest-request` és `booking:<id>:admin-request`. Ha az outbox mentése hibázik, a booking, snapshot és status history is rollbackel. Külső provider-hívás csak commit után, külön workerben történik.

## Feldolgozás, retry és konkurencia

Az `npm run email:process` legfeljebb 20 esedékes rekordot dolgoz fel egyszer. Az atomikus claim PostgreSQL `FOR UPDATE SKIP LOCKED` lekérdezéssel `PROCESSING` állapotot állít be, ezért párhuzamos worker ugyanazt a sort nem kapja meg. A 15 percnél régebben beragadt claim újra feldolgozható.

Sikertelen próbálkozások backoffja: 1 perc, 5 perc, 30 perc, majd 2 óra. Az `attemptCount` minden provider-hívásnál nő; `maxAttempts` elérésekor az állapot `FAILED`. A provider a deduplikációs kulcsot provider message key-ként is megkapja a későbbi szolgáltatói idempotencia támogatásához.

## Sablonok és kézbesítés

A vendéglevél hangsúlyozza, hogy a `PENDING` igény nem végleges foglalás. Mindkét levél inline stílusú, JavaScript- és külső CSS-mentes HTML-t, valamint kötelező text változatot tartalmaz. A felhasználói szövegek HTML-escape-et kapnak.

A `SENT` csak azt jelenti, hogy a provider elfogadta az üzenetet; a postaládába történő tényleges kézbesítés nem garantálható visszapattanás- és eseményfeldolgozás nélkül.

## Manuális tesztelés Windows PowerShellben

1. Első terminál: `npm run dev`.
2. Böngészőben hozz létre új foglalási igényt.
3. Második terminál: `npm run email:process`.
4. Ellenőrizd a két maszkolt console provider bejegyzést.
5. Futtasd az `npm run db:studio` parancsot, és ellenőrizd, hogy mindkét `EmailOutbox` rekord `SENT`.
6. Ismételd meg ugyanazt a PowerShell POST kérést azonos `Idempotency-Key` értékkel.
7. Ellenőrizd a Studio felületén, hogy nem jött létre további outbox rekord.

Deploymentben az egyszeri parancsot cron vagy ütemezett job hívja majd. A `RETRY` és `FAILED` rekordokhoz később monitorozás és admin művelet szükséges.
