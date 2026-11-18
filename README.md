# Groteknut 🎨

**Knutselideeën voor kinderen van 1 t/m 5 jaar. Alles kan binnen.**

👉 **Open de app: https://constantdynamics.github.io/groteknut/**

Groteknut is een gratis web-app voor ouders. Je kiest de leeftijd van je kind, hoeveel rommel er mag komen,
of het nat of vies mag worden en wat je in huis hebt. Dan krijg je ideeën die bij jullie passen.

## Wat zit erin?

- **Ruim 130 knutselideeën** in 12 soorten: verven, tekenen, plakken, klei en deeg, voelen en ontdekken, water en ijs,
  bouwen, proefjes, rijgen en sorteren, muziek en bewegen, eetbaar knutselen en verkleden.
- Per idee: **wat heb je nodig**, **stap voor stap**, **makkelijker/moeilijker per leeftijd**, **waar moet je op letten**,
  **wat kun je zeggen** (plus woordjes om te oefenen), handige tips en **meer inspiratie** (seizoenen en feestdagen).
- **Filters**: leeftijd (ook meerdere kinderen tegelijk), rommel, nat, vlekken, wat je in huis hebt, seizoen en feestdag,
  tijdsduur, voorbereiding, toezicht en wat je kind ervan leert.
- **Mijn spullen**: vink aan wat je in huis hebt (met snelle pakketten). Bij elk idee zie je dan wat je mist,
  plus een alternatief als je iets niet hebt.
- **Bewaard**: favorieten, een **boodschappenlijstje** (te delen via WhatsApp) en een overzicht van wat jullie al gedaan hebben.
- **15 basisrecepten**: speeldeeg, zoutdeeg, vingerverf, eetbare verf, wolkendeeg, sneeuwdeeg, maizenapap, zeepschuim, bellenblaas en meer.
- **Gids**: veilig knutselen, wat je kunt zeggen tijdens het knutselen, wat je per leeftijd kunt verwachten, rommel de baas.
- **Nu in het seizoen**: herfst, Sint-Maarten, Sinterklaas, kerst, carnaval, Pasen, Koningsdag, Moederdag… (rekent zelf de data uit).
- Werkt **offline** en is te **installeren** op je beginscherm. Licht en donker thema.
- **Privacy**: alles blijft op je eigen apparaat (localStorage). Geen account, geen tracking.

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

De validator controleert verplichte velden, geldige materiaal-id's, leeftijden en een paar veiligheidsregels
(bijv. kleine onderdelen bij kinderen onder de 3 zonder waarschuwing).

## Publiceren

Bij elke push naar `main` controleert de workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) de ideeën
en zet de site op de branch `gh-pages`. GitHub Pages serveert die branch.

Staat de site nog niet online? Kies dan één keer in **Settings → Pages → Build and deployment**:
*Source: Deploy from a branch*, *Branch: `gh-pages` / (root)*.

## Licentie

Code en teksten: vrij te gebruiken voor niet-commerciële doeleinden. Lettertype Nunito: SIL Open Font License (zie `fonts/`).

> Jij kent je kind het best. De ideeën zijn met zorg samengesteld, maar schat altijd zelf in wat veilig is en blijf in de buurt.
