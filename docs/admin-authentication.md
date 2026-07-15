# Admin hitelesítés

Az admin belépés jelszó + e-mailes 2FA. Sikeres jelszó után 10 perces challenge jön létre, a 6 számjegyű kód az outboxon át megy; teljes session csak helyes kód után készül. A session cookie HttpOnly, SameSite=Lax, productionben Secure és 12 órás. A DB csak a session token SHA-256 hashét és a kód HMAC-hashét tárolja; az outbox body AES-256-GCM titkosított.

A jelszavak bcrypt cost 12 hashként készülnek, ismeretlen e-mailhez dummy ellenőrzés fut. Öt sikertelen jelszópróba 15 perc zárolást, challenge-enként öt hibás kód lezárást okoz. Auth POST végpontokon JSON Content-Type és same-origin ellenőrzés van; válaszaik no-store-ok.

## Első admin PowerShellből

```powershell
$env:ADMIN_CREATE_EMAIL="holdenx007@gmail.com"
$env:ADMIN_CREATE_PASSWORD="Robobbo-135265!+"
$env:ADMIN_CREATE_DISPLAY_NAME="Fadmin"
npm run admin:create
Remove-Item Env:ADMIN_CREATE_EMAIL, Env:ADMIN_CREATE_PASSWORD, Env:ADMIN_CREATE_DISPLAY_NAME
```

Az értékek nem kerülnek fájlba vagy Gitbe, a meglévő e-mailt a parancs elutasítja.

## Manuális ellenőrzés

```powershell
docker compose up -d
npx prisma migrate dev
npm run dev
```

Nyisd meg a `/admin` címet, majd jelentkezz be. Developmentben a kód megtekintéséhez futtasd: `$env:EMAIL_DEBUG_CONTENT="true"; npm run email:process`. Productionben a console provider és a tartalomkiírás tiltott. A `/admin` session nélkül `/admin/login`-ra irányít, logout POST-tal visszavonja a sessiont.

Fennmaradó production feladat: valódi e-mail provider, IP-alapú proxy rate limit, kulcsrotáció és központi riasztás.
