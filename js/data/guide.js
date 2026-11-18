// De gids: achtergrond, veiligheid, praten en praktische tips.
// Bloktypes: p, list, compare (in plaats van → probeer), ages, tip.

export const GUIDE = [
  {
    id: 'aan-de-slag',
    title: 'Zo begin je',
    emoji: '🚀',
    intro: 'Knutselen met jonge kinderen gaat vooral over samen ontdekken. Een paar dingen maken het een stuk ontspannener.',
    blocks: [
      {
        type: 'list',
        items: [
          '**Kies een goed moment.** Uitgerust en net gegeten. Een moe of hongerig kind heeft weinig geduld (en jij ook niet).',
          '**Zet alles klaar** voordat je je kind roept: verf in bakjes, papier vastgeplakt, een doekje binnen handbereik.',
          '**Geef kleine porties.** Een klodder verf of een handje rijst. Bijvullen kan altijd.',
          '**Laat los hoe het eruit moet zien.** Je kind wil voelen, mengen en proberen. Het eindresultaat is bijzaak.',
          '**Doe zelf mee**, naast je kind, met je eigen vel. Kinderen kijken veel af.',
          '**Stop op tijd.** Vijf tot tien minuten is voor een dreumes al lang. Lukt het vandaag niet? Probeer het een andere keer.',
          '**Ruim samen op.** Ook dat is spelen: wie vindt de blauwe dop?',
        ],
      },
      { type: 'tip', text: 'Wil je dreumes iets tien keer achter elkaar doen? Dat is geen verveling maar oefenen. Herhaling is goud.' },
    ],
  },
  {
    id: 'praten',
    title: 'Wat kun je zeggen?',
    emoji: '💬',
    intro: 'Wat je zegt tijdens het knutselen helpt je kind met taal, zelfvertrouwen en doorzetten. Je hoeft geen juf of meester te zijn: deze vuistregels werken goed.',
    blocks: [
      {
        type: 'compare',
        title: 'In plaats van… probeer eens',
        items: [
          { instead: 'Wat mooi!', try: 'Ik zie dat je heel veel rondjes hebt gemaakt.', why: 'Beschrijf wat je ziet.' },
          { instead: 'Wat is het?', try: 'Vertel eens over je tekening?', why: 'Het hoeft niets voor te stellen.' },
          { instead: 'Goed zo!', try: 'Wat heb je lang doorgezet, ook toen het bleef plakken!', why: 'Benoem de inzet, niet het resultaat.' },
          { instead: 'Nee, de lucht is blauw.', try: 'Jouw lucht is paars. Hoe komt dat?', why: 'Laat eigen keuzes toe.' },
          { instead: 'Laat mij maar even.', try: 'Zal ik het vasthouden, dan knip jij?', why: 'Help zonder het over te nemen.' },
          { instead: 'Niet knoeien!', try: 'De verf blijft op het papier. Kijk, hier is de rand.', why: 'Zeg wat wél mag.' },
        ],
      },
      {
        type: 'list',
        title: 'Vuistregels',
        items: [
          '**Praat als een sportverslaggever.** Je roert, je roert… nu wordt het groen!',
          '**Breid uit wat je kind zegt.** Kind: Auto! Jij: Ja, de rode auto rijdt door de verf.',
          '**Geef nieuwe woorden.** Plakkerig, glibberig, ruw, glad, bovenop, onder, naast, half, vol, leeg.',
          '**Denk hardop.** Hmm, het plakt niet. Wat kunnen we proberen? Zo leert je kind problemen oplossen.',
          '**Benoem gevoelens.** Je baalt dat het scheurt. Zullen we het samen plakken?',
          '**Laat stiltes toe.** Samen geconcentreerd zwijgen is ook fijn.',
        ],
      },
      {
        type: 'ages',
        title: 'Per leeftijd',
        items: [
          { age: '1 jaar', text: 'Korte woordjes en geluiden: Nat! Plak! Op! Wijs aan, benoem en herhaal veel.' },
          { age: '2 jaar', text: 'Maak van één woord een zinnetje en laat kiezen: wil je rood of geel?' },
          { age: '3 jaar', text: 'Waarom-vragen? Geef ze eens terug: wat denk jij, waarom zakt de rozijn?' },
          { age: '4 jaar', text: 'Vraag naar het plan: wat ga je eerst doen? En daarna? Laat vertellen wat er gemaakt is.' },
          { age: '5 jaar', text: 'Blik terug: wat was moeilijk, wat zou je de volgende keer anders doen? Schrijf het verhaal op bij de tekening.' },
        ],
      },
    ],
  },
  {
    id: 'veiligheid',
    title: 'Veilig knutselen',
    emoji: '🦺',
    intro: 'De meeste knutselspullen zijn prima, als je een paar dingen weet. Jij kent je kind het best: schat het altijd zelf in en blijf erbij.',
    blocks: [
      {
        type: 'list',
        items: [
          '🧻 **De wc-roltest.** Alles wat door een wc-rolletje past, is te klein voor kinderen onder de 3: verstikkingsgevaar. Denk aan pompons, wiebeloogjes, kralen, knopen, kastanjes, steentjes en kleine doppen.',
          '💧 **Water.** Laat een jong kind nooit alleen bij water, ook niet bij een laagje in een bak of in bad. Een paar centimeter is genoeg om te verdrinken. Dweil gemorst water meteen op.',
          '🔋 **Knoopcelbatterijen** zitten in led-waxinelichtjes, lampjes en speelgoed. Inslikken is levensgevaarlijk. Plak het klepje dicht en houd losse batterijen buiten bereik. Denk je dat je kind er een heeft ingeslikt? Ga direct naar de spoedeisende hulp of bel 112.',
          '🧲 **Magneetjes.** Kleine, sterke magneten zijn heel gevaarlijk als er meer dan één wordt ingeslikt. Niet gebruiken bij jonge kinderen.',
          '🎈 **Ballonnen** alleen onder toezicht; jij blaast ze op. Gooi kapotte ballonnen en losse stukjes meteen weg: ze zijn een grote oorzaak van verstikking bij kinderen.',
          '⛔ **Waterkralen (waterparels): nooit gebruiken.** Ze zwellen op in het lichaam en zijn levensgevaarlijk als ze worden ingeslikt of in neus of oor terechtkomen.',
          '🧵 **Touw, lint en kettingen**: wurggevaar. Nooit om de nek zonder toezicht en af voor het slapen. Houd koordjes kort.',
          '🔥 **Hitte.** Kokend water, oven, magnetron en lijmpistool doe jij. Laat alles afkoelen voordat je kind het aanraakt.',
          '✂️ **Scharen.** Een kinderschaar met ronde punt; jij knipt de lastige stukken. Leg scharen en messen na gebruik meteen weg.',
          '🍞 **Rauwe bloem** kan bacteriën bevatten: niet laten eten. Proeft je kind veel? Verhit de bloem eerst 5 minuten op 175 °C in de oven.',
          '🐶 **Huisdieren.** Zoutdeeg en speeldeeg zijn door het vele zout giftig voor honden en katten. Bewaar het buiten hun bereik.',
          '🥜 **Allergieën.** Let bij eetbaar knutselen op pinda, noten, ei, melk en gluten, ook bij vriendjes die komen spelen.',
          '🧴 **Zeep en schuim** horen niet in ogen of mond. Voor kinderen die alles proeven: kies eetbare alternatieven zoals slagroom of yoghurt.',
          '✨ **Glitter** liever niet bij jonge kinderen (ogen, inslikken) en het is slecht voor het milieu. Kies bio-glitter of laat het weg.',
          '🧪 **Schoonmaakmiddelen, wasmiddelcapsules en medicijnen** zijn nooit knutselmateriaal en horen altijd buiten bereik. Ook bruistabletten zijn medicijnen: bewaar ze weg.',
          '🎨 **Verf en lijm**: kies kinderverf en kinderlijm (ongiftig en afwasbaar, met CE-markering).',
        ],
      },
      { type: 'tip', text: 'Iets ingeslikt of in de ogen gekregen en twijfel je? Bel de huisarts of de huisartsenpost. Bij ernstige klachten: bel 112.' },
    ],
  },
  {
    id: 'leeftijd',
    title: 'Wat kan je kind per leeftijd?',
    emoji: '🌱',
    intro: 'Elk kind ontwikkelt zich in een eigen tempo. Dit geeft een idee van wat je ongeveer kunt verwachten. Lukt iets (nog) niet? Helemaal oké.',
    blocks: [
      {
        type: 'ages',
        items: [
          { age: '1 jaar', text: 'Ontdekt met de hele hand en de mond. Smeert, klopt, scheurt groot papier en stopt dingen in en uit een bak. Kan een paar minuten geconcentreerd bezig zijn. **Tip:** proefbare materialen, grote stukken, korte sessies.' },
          { age: '2 jaar', text: 'Krast met waskrijt in de vuist, stempelt, plakt met hulp, scheurt, schept en giet over. Wil alles zelf. **Tip:** weinig keuze (twee kleuren) en grote, dikke materialen.' },
          { age: '3 jaar', text: 'Tekent rondjes en lijntjes, knipt snippers met een kinderschaar, rolt balletjes en slangetjes van deeg en rijgt grote kralen. Begint te vertellen wat het tekent. **Tip:** laat het zelf doen, ook als het langer duurt.' },
          { age: '4 jaar', text: 'Knipt langs een rechte lijn, tekent een kopvoeter (poppetje met armen en benen aan het hoofd), vouwt dubbel en plakt al nauwkeuriger. Bedenkt zelf wat het gaat maken. **Tip:** geef een opdracht met ruimte voor eigen ideeën.' },
          { age: '5 jaar', text: 'Knipt eenvoudige vormen uit, tekent herkenbare mensen, huizen en dieren, schrijft soms al de eigen naam en kan een paar stappen plannen. **Tip:** maak samen een plan en laat je kind het uitvoeren.' },
        ],
      },
      { type: 'tip', text: 'Broertjes en zusjes samen? Kies in Ontdek beide leeftijden: dan zie je ideeën die voor allebei passen.' },
    ],
  },
  {
    id: 'rommel',
    title: 'Rommel de baas',
    emoji: '🧽',
    intro: 'Kliederen is goed voor je kind. Met deze trucs blijft het ook voor jou leuk.',
    blocks: [
      {
        type: 'list',
        items: [
          '**Knoeimat.** Een oud douchegordijn, tafelzeil of opengeknipte vuilniszak onder de tafel. Na afloop uitschudden of afspoelen.',
          '**Kleding.** Een oud T-shirt als schort, mouwen opgestroopt. Bij heel kliederige dingen in een warme kamer: gewoon in luier of onderbroek.',
          '**Grens.** Zet alles op een dienblad of bakplaat met randje. Alles blijft op het blad.',
          '**De badkuip** is de ideale plek voor kliederwerk. Daarna meteen afspoelen.',
          '**Vlak voor badtijd.** Plan kliederwerk net voordat je kind toch al in bad gaat.',
          '**Klein beginnen.** Een klodder verf, een handje rijst. Bijvullen kan altijd.',
          '**Vastplakken.** Plak papier met schilderstape vast op tafel of vloer, dan schuift er niets.',
          '**Opruimspullen klaar.** Een emmer sop, een doekje en een vuilniszak staan al klaar.',
          '**Vlekken** van verf en kleurstof zo snel mogelijk uitspoelen met koud water; warm water zet vlekken vast. Opgedroogde maizena en wolkendeeg laat je drogen en zuig je op.',
          '**Snippers, rijst en confetti**: de stofzuiger is je beste vriend.',
        ],
      },
      { type: 'tip', text: 'Hoeveel rommel oké is, bepaal jij. Kies in Ontdek ‘Bijna schoon’ op drukke dagen en ‘Lekker kliederen’ als je er zin in hebt.' },
    ],
  },
  {
    id: 'knutseldoos',
    title: 'Een slimme knutseldoos',
    emoji: '🧰',
    intro: 'Met een basisdoos en een bewaarbak voor restjes kun je bijna alles uit deze app maken.',
    blocks: [
      {
        type: 'list',
        title: 'De basis',
        items: [
          'Dikke waskrijtjes, afwasbare stiften en kleurpotloden',
          'Plakkaatverf in rood, geel en blauw, plus wit en zwart',
          'Dikke penselen en een paar sponsjes',
          'Kinderschaar, lijmstift, knutsellijm, plakband en schilderstape',
          'Wit en gekleurd papier, en een rol papier (oud behang werkt prima)',
          'Stickers',
        ],
      },
      {
        type: 'list',
        title: 'Bewaar uit de recyclebak',
        items: [
          'Wc-rolletjes, eierdozen, schoenendozen, lege flesjes met dop, deksels, kartonnen verpakkingen, noppenfolie en tijdschriften.',
          'Spoel bakjes en flessen eerst om en laat ze goed drogen.',
        ],
      },
      {
        type: 'list',
        title: 'Uit de keuken',
        items: ['Bloem, zout, maizena, kleurstof, azijn, baking soda en rijst. Daarmee maak je deeg, verf, proefjes en ontdekbakken.'],
      },
      { type: 'tip', text: 'Bewaar de knutseldoos hoog of in een kast. Dan blijft knutselen iets bijzonders en houd jij overzicht.' },
    ],
  },
  {
    id: 'bewaren',
    title: 'Al die kunstwerken',
    emoji: '🖼️',
    intro: 'Een week knutselen levert een flinke stapel kunst op. Zo houd je het overzichtelijk én bijzonder.',
    blocks: [
      {
        type: 'list',
        items: [
          '**Galerie.** Span een touw met wasknijpers als tentoonstelling. Komt er iets nieuws bij? Dan mag er een oude af.',
          '**Foto’s.** Maak een foto van je kind mét het kunstwerk en bewaar alleen de echte favorieten.',
          '**Cadeau.** Tekeningen zijn prachtig inpakpapier en mooie kaarten voor opa en oma.',
          '**Bewaarmap.** Eén map per jaar. Schrijf op de achterkant de datum en wat je kind erover vertelde.',
          '**Fotoboek.** Maak na een jaar een fotoboekje van alle kunstwerken.',
        ],
      },
      { type: 'tip', text: 'Vraag je kind wat het zelf wil bewaren. Je zult versteld staan van de keuzes.' },
    ],
  },
  {
    id: 'over',
    title: 'Over Groteknut',
    emoji: '💛',
    intro: 'Groteknut is een gratis knutselbibliotheek voor ouders van kinderen van 1 tot en met 5 jaar. Alle ideeën kunnen binnen.',
    blocks: [
      {
        type: 'list',
        items: [
          '**Privacy.** Alles wat je invult (je spullen, favorieten en lijstjes) blijft op je eigen telefoon of computer. Er is geen account, geen tracking en er worden geen gegevens verstuurd.',
          '**Werkt offline.** Na het eerste bezoek werkt de app ook zonder internet.',
          '**Op je beginscherm.** iPhone: tik in Safari op Deel en kies ‘Zet op beginscherm’. Android: tik in Chrome op het menu (⋮) en kies ‘App installeren’ of ‘Toevoegen aan startscherm’.',
          '**Jij kent je kind het best.** De ideeën zijn met zorg samengesteld, maar schat altijd zelf in wat veilig is en blijf in de buurt.',
        ],
      },
    ],
  },
];
