# Árazási szabályok

## Adatvezérelt kiválasztás

A `PricingRule` tárolja az éjszakasávot, opcionális dátumtartományt, prioritást, aktív állapotot, verziót, alap vendégszámot, extra felnőtt díjat, gyermek-korcsoportokat és egyszeri takarítási díjat. A seed öt HUF ársávot hoz létre: 1, 2, 3–4, 5–7 és 8+ éjszaka.

A motor először az aktív, dátumra és éjszakaszámra illeszkedő szabályokat szűri. A legnagyobb prioritás nyer; ha ezen a prioritáson több szabály marad, `AMBIGUOUS_PRICING_RULE` hibát ad. Hiányzó szabály esetén `NO_PRICING_RULE` keletkezik. Inaktív szabály nem vehető figyelembe.

## Számítás

`accommodationSubtotal = nights × nightlyRate`. Az alap vendégszám feletti felnőttek díja személyenként és éjszakánként adódik hozzá. Minden gyermek életkorához pontosan egy korcsoportnak kell illeszkednie; a díj szintén éjszakánként számolódik. A takarítás egyszeri tétel. A turisztikai adó és kedvezmény jelenleg nulla, de explicit snapshot mezőként szerepel.

A `BookingPriceSnapshot` minden részösszeget, végösszeget, pénznemet, szabályazonosítót, szabályverziót és JSON bontást rögzít. A későbbi árszabály-módosítás ezért nem változtatja meg a korábbi foglalás árát.
