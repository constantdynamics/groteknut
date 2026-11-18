// Vaste lijsten: categorieën, thema's, ontwikkelgebieden, rommel-niveaus en toezicht.

export const CATEGORIES = [
  { id: 'verven', label: 'Verven & stempelen', emoji: '🎨', desc: 'Kliederen met kleur: vingerverf, stempels en toverschilderijen.' },
  { id: 'tekenen', label: 'Tekenen & krijten', emoji: '🖍️', desc: 'Krassen, kleuren en tekenen op allerlei plekken.' },
  { id: 'plakken', label: 'Plakken & knippen', emoji: '✂️', desc: 'Scheuren, knippen, plakken en collages maken.' },
  { id: 'deeg', label: 'Klei & deeg', emoji: '🥨', desc: 'Kneden, rollen en vormen met zelfgemaakt deeg.' },
  { id: 'zintuigen', label: 'Voelen & ontdekken', emoji: '👐', desc: 'Ontdekbakken en spelletjes voor alle zintuigen.' },
  { id: 'water', label: 'Water & ijs', emoji: '💧', desc: 'Spetteren, gieten en ijs ontdekken, gewoon binnen.' },
  { id: 'bouwen', label: 'Bouwen & recyclen', emoji: '📦', desc: 'Bouwen met dozen, kokers en ander restmateriaal.' },
  { id: 'proefjes', label: 'Proefjes & natuur', emoji: '🔬', desc: 'Kleine wetenschappers: bruisen, drijven, kiemen.' },
  { id: 'motoriek', label: 'Rijgen, knijpen & sorteren', emoji: '🧵', desc: 'Spelletjes voor handige handjes.' },
  { id: 'muziek', label: 'Muziek & bewegen', emoji: '🥁', desc: 'Instrumenten maken, dansen en binnen bewegen.' },
  { id: 'eetbaar', label: 'Eetbaar knutselen', emoji: '🍪', desc: 'Knutselen dat je daarna lekker op kunt eten.' },
  { id: 'fantasie', label: 'Verkleden & fantasie', emoji: '👑', desc: 'Kronen, poppen, maskers en doe-alsof-spel.' },
];

// Thema's met een periode (maand-dag). 'dynamic' wordt per jaar uitgerekend.
export const THEMES = [
  { id: 'herfst', label: 'Herfst', emoji: '🍂', window: ['09-01', '11-30'] },
  { id: 'winter', label: 'Winter', emoji: '❄️', window: ['12-01', '02-28'] },
  { id: 'lente', label: 'Lente', emoji: '🌷', window: ['03-01', '05-31'] },
  { id: 'zomer', label: 'Zomer', emoji: '☀️', window: ['06-01', '08-31'] },
  { id: 'halloween', label: 'Halloween', emoji: '🎃', window: ['10-10', '10-31'] },
  { id: 'sintmaarten', label: 'Sint-Maarten', emoji: '🏮', window: ['10-20', '11-11'] },
  { id: 'sinterklaas', label: 'Sinterklaas', emoji: '🎁', window: ['10-25', '12-05'] },
  { id: 'kerst', label: 'Kerst', emoji: '🎄', window: ['11-25', '12-26'] },
  { id: 'oudennieuw', label: 'Oud & nieuw', emoji: '🎆', window: ['12-20', '01-02'] },
  { id: 'carnaval', label: 'Carnaval', emoji: '🎭', dynamic: 'carnaval' },
  { id: 'pasen', label: 'Pasen', emoji: '🐣', dynamic: 'pasen' },
  { id: 'koningsdag', label: 'Koningsdag', emoji: '🧡', dynamic: 'koningsdag' },
  { id: 'moederdag', label: 'Moederdag', emoji: '💐', dynamic: 'moederdag' },
  { id: 'vaderdag', label: 'Vaderdag', emoji: '👔', dynamic: 'vaderdag' },
  { id: 'verjaardag', label: 'Verjaardag', emoji: '🎂' },
  { id: 'cadeau', label: 'Cadeautje maken', emoji: '🎀' },
];

export const LEARN = [
  { id: 'fijne-motoriek', label: 'Fijne motoriek', emoji: '✋', desc: 'Kleine bewegingen met handen en vingers: pakken, knijpen, knippen.' },
  { id: 'grove-motoriek', label: 'Grove motoriek', emoji: '🤸', desc: 'Bewegen met het hele lijf: kruipen, springen, gooien, balanceren.' },
  { id: 'zintuigen', label: 'Zintuigen', emoji: '👃', desc: 'Voelen, ruiken, horen, kijken en proeven.' },
  { id: 'creativiteit', label: 'Creativiteit', emoji: '🌈', desc: 'Eigen ideeën bedenken, fantaseren en uitproberen.' },
  { id: 'taal', label: 'Taal', emoji: '💬', desc: 'Nieuwe woorden leren, vertellen en vragen stellen.' },
  { id: 'rekenen', label: 'Tellen & vormen', emoji: '🔢', desc: 'Tellen, sorteren, vergelijken, patronen en vormen.' },
  { id: 'ontdekken', label: 'Ontdekken', emoji: '🔍', desc: 'Oorzaak en gevolg: wat gebeurt er als…?' },
  { id: 'concentratie', label: 'Concentratie', emoji: '🎯', desc: 'Even rustig en geconcentreerd met één ding bezig zijn.' },
  { id: 'samen', label: 'Samen spelen', emoji: '🤝', desc: 'Om de beurt gaan, delen en samenwerken.' },
];

export const MESS = [
  { level: 1, label: 'Bijna schoon', short: 'Schoon', emoji: '✨', desc: 'Nauwelijks opruimen.' },
  { level: 2, label: 'Beetje rommel', short: 'Beetje rommel', emoji: '🧽', desc: 'Even de tafel afnemen en snippers opvegen.' },
  { level: 3, label: 'Lekker kliederen', short: 'Kliederen', emoji: '💥', desc: 'Knoeimat neerleggen en een doekje klaarhouden.' },
];

export const SUPERVISION = [
  { level: 1, label: 'Samen doen', emoji: '👫', desc: 'Jij doet actief mee en houdt alles goed in de gaten.' },
  { level: 2, label: 'Dichtbij blijven', emoji: '👀', desc: 'Blijf binnen handbereik; je kind doet veel zelf.' },
  { level: 3, label: 'In de buurt', emoji: '🙂', desc: 'Je kind speelt vrij zelfstandig, jij bent in dezelfde ruimte.' },
];

export const AGES = [
  { age: 1, label: '1 jaar', name: 'dreumes' },
  { age: 2, label: '2 jaar', name: 'peuter' },
  { age: 3, label: '3 jaar', name: 'peuter' },
  { age: 4, label: '4 jaar', name: 'kleuter' },
  { age: 5, label: '5 jaar', name: 'kleuter' },
];

// Geluid, energie en plek (voor filters en sorteren).
export const NOISE = [
  { level: 1, label: 'Stil', emoji: '🤫', desc: 'Kan prima als er iemand slaapt of als je belt.' },
  { level: 2, label: 'Gezellig geluid', emoji: '🙂', desc: 'Gewoon praten en spelen.' },
  { level: 3, label: 'Lawaaierig', emoji: '🥁', desc: 'Er wordt gerend, getrommeld of gegild.' },
];

export const ENERGY = [
  { level: 1, label: 'Rustig', emoji: '🧘', desc: 'Vooral zitten en geconcentreerd bezig zijn.' },
  { level: 2, label: 'Afwisselend', emoji: '🚶', desc: 'Af en toe opstaan en rondlopen.' },
  { level: 3, label: 'Actief', emoji: '🏃', desc: 'Rennen, springen, kruipen of gooien.' },
];

export const PLACES = [
  { id: 'tafel', label: 'Aan tafel', emoji: '🍽️' },
  { id: 'vloer', label: 'Op de vloer', emoji: '🧸' },
  { id: 'muur', label: 'Aan muur of raam', emoji: '🪟' },
  { id: 'bad', label: 'In bad of douche', emoji: '🛁' },
  { id: 'keuken', label: 'In de keuken', emoji: '🍳' },
];

// Wat is ‘lang bezig’ per leeftijd? (minuten)
export const LONG_PLAY = { 1: 15, 2: 20, 3: 30, 4: 45, 5: 45 };
