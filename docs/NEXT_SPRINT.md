# Következő sprint: Production readiness foundation

1. Valódi e-mail provider adapter és staging credential-kezelés.
2. Deployment/staging környezet és HTTPS domain.
3. Scheduled email/iCal worker futtatás.
4. Health/readiness endpoint, strukturált logolás és error tracking csatlakozási pont.
5. Backup/restore dokumentáció és próba.
6. Production env validation, secret rotation és adatvédelmi/retention ellenőrzés.

Elfogadás: stagingben teljes login–2FA–booking–outbox–iCal folyamat, worker scheduler, riasztás, restore teszt és nincs production secret a repositoryban.
