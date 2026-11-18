# Groteknut 🎨

**Knutselideeën voor kinderen van 1 t/m 5 jaar. Alles kan binnen.**

👉 **Open de app: https://constantdynamics.github.io/groteknut/**

Groteknut is een gratis web-app voor ouders. Je kiest de leeftijd van je kind, hoeveel rommel er mag komen,
of het nat of vies mag worden en wat je in huis hebt. Dan krijg je ideeën die bij jullie passen.

## Wat zit erin?

- **227 knutselideeën** in 12 soorten: verven, tekenen, plakken, klei en deeg, voelen en ontdekken, water en ijs,
  bouwen, proefjes, rijgen en sorteren, muziek en bewegen, eetbaar knutselen en verkleden.
  Waaronder **81 ‘lang zoet’-ideeën**: hooguit 5 minuten voorbereiding en lang bezig voor de leeftijd
  (1 jaar 15+, 2 jaar 20+, 3 jaar 30+, 4–5 jaar 45+ minuten).
- **Voor dreumesen, broertjes en zusjes en tijdens een slaapje**: 15 extra lang-zoet-ideeën voor 1–2 jaar,
  15 ideeën voor een dreumes of peuter **samen met een kleuter** (met een eigen rol voor de jongste en de oudste)
  en 15 fluisterstille ideeën voor een kind van 3–5 jaar terwijl een broertje of zusje slaapt
  (te vinden met Geluid ‘Stil’ en ‘Kan (bijna) zelf’).
- Per idee: **wat heb je nodig**, **stap voor stap**, **verlengers** (als de aandacht wegzakt), **makkelijker/moeilijker per leeftijd**,
  **waar moet je op letten**, **wat kun je zeggen** (plus woordjes om te oefenen), tips, **meer inspiratie**,
  en bij ideeën die kunnen blijven staan: **tips om morgen verder te spelen**.
- **Filters**: leeftijd (ook meerdere kinderen tegelijk), rommel, nat, vlekken, wat je in huis hebt, **speeltijd**
  (ook ‘lang voor de leeftijd’), **voorbereiding**, **opruimtijd**, **geluid**, **energie**, **plek**, **zelfstandig vanaf** (jij in de buurt),
  **broertjes & zusjes**, **kan blijven staan**, seizoen en feestdag en wat je kind ervan leert.
- **Sorteren** op beste match, **lang zoet** (speeltijd per minuut voorbereiding), langst bezig, minste voorbereiding,
  meest zelfstandig, minste rommel, snelst opgeruimd, snelst klaar en A–Z.
- **Mijn spullen**: vink aan wat je in huis hebt (met snelle pakketten). Bij elk idee zie je dan wat je mist,
  plus een alternatief als je iets niet hebt.
- **Bewaard**: favorieten, een **boodschappenlijstje** (te delen via WhatsApp), wat jullie al gedaan hebben en een **fotoboek**.
- **Weekplan** (‘Regenachtige week?’): voor zeven dagen vanaf vandaag een idee, automatisch gekozen met je filters
  (weinig voorbereiding, lang zoet, elke dag een andere soort). Per dag wisselen of afvinken, een boodschappenlijst
  voor de hele week, delen en printen. Het plan blijft bewaard en vernieuwt zich na een week.
- **Oppaskaart**: kies favorieten en print per idee één A4 voor de oppas, opa of oma, met wat je nodig hebt,
  stap voor stap, waar je op let, wat je kunt zeggen, verlengers en (bij broertjes en zusjes) de rol van de jongste en de oudste.
  Elke kaart wordt gemeten en krijgt zo nodig een kleinere letter, zodat hij op één pagina past.
- **Eigen foto’s**: voeg foto’s toe aan een idee (ook direct na ‘Gedaan!’). Ze verschijnen groot op de ideepagina,
  als miniatuur op het kaartje en in een galerij. Ze blijven alleen op je eigen apparaat (IndexedDB).
- **Voorbeelden op Pinterest**: per idee een knop die een passende zoekopdracht op Pinterest opent
  (er worden geen foto’s van anderen overgenomen).
- **15 basisrecepten**: speeldeeg, zoutdeeg, vingerverf, eetbare verf, wolkendeeg, sneeuwdeeg, maizenapap, zeepschuim, bellenblaas en meer.
- **Gids**: veilig knutselen, wat je kunt zeggen tijdens het knutselen, wat je per leeftijd kunt verwachten, rommel de baas.
- **Nu in het seizoen**: herfst, Sint-Maarten, Sinterklaas, kerst, carnaval, Pasen, Koningsdag, Moederdag… (rekent zelf de data uit).
- Werkt **offline** en is te **installeren** op je beginscherm. Licht en donker thema.
- **Privacy**: alles blijft op je eigen apparaat (localStorage en IndexedDB). Geen account, geen tracking.

## Lokaal draaien

Er is geen build-stap nodig: het is gewone HTML, CSS en JavaScript (ES-modules).

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Ideeën toevoegen of aanpassen

- Ideeën staan in [`js/data/activities.js`](js/data/activities.js).
- Materialen (met alternatieven en waarschuwingen) in [`js/data/materials.js`](js/data/materials.js).
- Soorten, thema's en ontwikkelgebieden in [`js/data/meta.js`](js/data/meta.js).
- Recepten in [`js/data/recipes.js`](js/data/recipes.js), de gids in [`js/data/guide.js`](js/data/guide.js).

Controleer na een wijziging of alles klopt:

```bash
node tools/validate.mjs
```

De validator controleert verplichte velden, geldige materiaal-id's, leeftijden, speeltijd en een paar veiligheidsregels
(bijv. kleine onderdelen bij kinderen onder de 3 zonder waarschuwing, nooit ‘zelfstandig’ in bad of met ballonnen,
nat spel pas zelfstandig vanaf 4 jaar).

## Publiceren

Bij elke push naar `main` controleert de workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) de ideeën
en zet de site op de branch `gh-pages`. GitHub Pages serveert die branch.

Staat de site nog niet online? Kies dan één keer in **Settings → Pages → Build and deployment**:
*Source: Deploy from a branch*, *Branch: `gh-pages` / (root)*.

## Licentie

Code en teksten: vrij te gebruiken voor niet-commerciële doeleinden. Lettertype Nunito: SIL Open Font License (zie `fonts/`).

> Jij kent je kind het best. De ideeën zijn met zorg samengesteld, maar schat altijd zelf in wat veilig is en blijf in de buurt.
