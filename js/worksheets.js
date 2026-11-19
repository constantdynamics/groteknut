// Werkbladen om te printen: doolhofjes, lijnen overtrekken, mandala's en patronen, papieren poppetjes en ‘maak de tekening af’.
// Alles wordt als SVG getekend (maten in millimeters), dus elke keer kan er een nieuw blad uitkomen.

export const WORKSHEETS = [
  {
    id: 'doolhof', emoji: '🌀', title: 'Doolhofjes', ideas: ['doolhofjes'],
    desc: 'Help de muis naar de kaas of de bij naar de bloem. Elke keer een nieuw doolhof.',
    levels: [['makkelijk', 'Makkelijk (3 jaar)'], ['midden', 'Midden (4 jaar)'], ['moeilijk', 'Moeilijk (5 jaar)']],
  },
  {
    id: 'lijnen', emoji: '〰️', title: 'Lijnen overtrekken', ideas: ['doolhofjes'],
    desc: 'Volg de stippellijn: rechte lijnen, golfjes, zigzag, bogen, trapjes en krullen.',
    levels: [['mix', 'Mix'], ['golfjes', 'Golfjes en bogen'], ['zigzag', 'Zigzag en trapjes'], ['krullen', 'Krullen']],
  },
  {
    id: 'mandala', emoji: '🌸', title: 'Mandala’s en patronen', ideas: ['patronen-kleuren'],
    desc: 'Kleur vakje voor vakje een mandala, of maak de patronen af.',
    levels: [['groot', 'Mandala met grote vlakken'], ['fijn', 'Mandala met kleine vlakken'], ['patronen', 'Patronen afmaken']],
  },
  {
    id: 'poppetjes', emoji: '👗', title: 'Papieren poppetjes', ideas: ['papieren-poppetjes'],
    desc: 'Een poppetje om te kleuren en uit te knippen, met een blad vol kleertjes met vouwlipjes.',
    levels: [['beide', 'Pop en kleertjes'], ['kleren', 'Alleen extra kleertjes']],
  },
  {
    id: 'afmaken', emoji: '✏️', title: 'Maak de tekening af', ideas: ['tekening-afmaken'],
    desc: 'Een huis zonder dak, een kat zonder staart: je kind tekent de rest erbij.',
    levels: [['mix', 'Zes tekeningen']],
  },
];
export const WS = Object.fromEntries(WORKSHEETS.map((w) => [w.id, w]));

const W = 180; // tekenvlak in mm
const H = 228;
const INK = '#2a2238';
const GUIDE = '#8f88a0';

// Kleine, voorspelbare toevalsgenerator: hetzelfde getal geeft hetzelfde blad.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const shuffle = (r, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const f1 = (n) => Math.round(n * 10) / 10;
const svg = (body, w = W, h = H) => `<svg class="ws-svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="werkblad">${body}</svg>`;
const emoji = (x, y, size, e) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(size)}" text-anchor="middle" dominant-baseline="central">${e}</text>`;

/* ---------------- Doolhof ---------------- */

const MAZE_THEMES = [
  ['🐭', '🧀', 'Help de muis naar de kaas'],
  ['🐝', '🌸', 'Help de bij naar de bloem'],
  ['🚗', '🏠', 'Rijd de auto naar huis'],
  ['🐶', '🦴', 'Help de hond naar het bot'],
  ['🐰', '🥕', 'Help het konijn naar de wortel'],
  ['🐸', '🪷', 'Help de kikker naar het waterlelieblad'],
];

function maze(seed, level) {
  const r = rng(seed);
  const [cols, rows] = { makkelijk: [5, 6], midden: [7, 9], moeilijk: [10, 13] }[level] || [5, 6];
  const [from, to, title] = pick(r, MAZE_THEMES);
  const cell = Math.min((W - 20) / cols, (H - 44) / rows);
  const mw = cell * cols;
  const mh = cell * rows;
  const x0 = (W - mw) / 2;
  const y0 = 24;
  // muren: rechts en onder per cel
  const right = Array.from({ length: rows }, () => Array(cols).fill(true));
  const down = Array.from({ length: rows }, () => Array(cols).fill(true));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const next = shuffle(r, [[1, 0], [-1, 0], [0, 1], [0, -1]])
      .map(([dx, dy]) => [cx + dx, cy + dy, dx, dy])
      .find(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny][nx]);
    if (!next) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = next;
    if (dx === 1) right[cy][cx] = false;
    if (dx === -1) right[ny][nx] = false;
    if (dy === 1) down[cy][cx] = false;
    if (dy === -1) down[ny][nx] = false;
    seen[ny][nx] = true;
    stack.push([nx, ny]);
  }
  const sw = f1(Math.max(1.6, cell * 0.11));
  const lines = [];
  const L = (x1, y1, x2, y2) => lines.push(`M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}`);
  // buitenrand met een opening linksboven (start) en rechtsonder (finish)
  L(x0 + cell, y0, x0 + mw, y0);
  L(x0, y0, x0, y0 + mh);
  L(x0, y0 + mh, x0 + mw - cell, y0 + mh);
  L(x0 + mw, y0, x0 + mw, y0 + mh);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x0 + x * cell;
      const py = y0 + y * cell;
      if (right[y][x] && x < cols - 1) L(px + cell, py, px + cell, py + cell);
      if (down[y][x] && y < rows - 1) L(px, py + cell, px + cell, py + cell);
    }
  }
  const icon = Math.min(16, cell * 0.95);
  const body = `<path d="${lines.join('')}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>
    ${emoji(x0 + cell / 2, y0 - icon / 2 - 2, icon, from)}
    ${emoji(x0 + mw - cell / 2, y0 + mh + icon / 2 + 2, icon, to)}
    <path d="M${f1(x0 + cell / 2)} ${f1(y0 + 1)}l0 ${f1(cell * 0.35)}" stroke="#2fa36b" stroke-width="${f1(sw * 0.8)}" stroke-dasharray="1.2 2" stroke-linecap="round"/>`;
  return { title, svg: svg(body) };
}

/* ---------------- Lijnen overtrekken ---------------- */

const LINE_ICONS = [['🐝', '🌸'], ['🚂', '🏠'], ['🐌', '🍓'], ['🐟', '🐚'], ['🦋', '🌼'], ['🐞', '🍃'], ['🚀', '🌙'], ['🐻', '🍯']];

function linePath(type, x1, x2, y, amp) {
  const pts = [];
  const len = x2 - x1;
  if (type === 'recht') return `M${x1} ${y}L${x2} ${y}`;
  if (type === 'golfjes') {
    for (let i = 0; i <= 120; i++) { const t = i / 120; pts.push([x1 + t * len, y + Math.sin(t * Math.PI * 2 * (len / 26)) * amp]); }
  } else if (type === 'zigzag') {
    const n = Math.round(len / 13);
    for (let i = 0; i <= n; i++) pts.push([x1 + (i / n) * len, y + (i % 2 ? -amp : amp)]);
  } else if (type === 'bogen') {
    const n = Math.round(len / 24);
    const step = len / n;
    let d = `M${f1(x1)} ${f1(y + amp)}`;
    for (let i = 0; i < n; i++) d += `A${f1(step / 2)} ${f1(amp * 2)} 0 0 1 ${f1(x1 + (i + 1) * step)} ${f1(y + amp)}`;
    return d;
  } else if (type === 'trapjes') {
    const n = Math.round(len / 14);
    const step = len / n;
    let d = `M${f1(x1)} ${f1(y + amp)}`;
    for (let i = 0; i < n; i++) d += `L${f1(x1 + i * step)} ${f1(y + (i % 2 ? -amp : amp))}L${f1(x1 + (i + 1) * step)} ${f1(y + (i % 2 ? -amp : amp))}`;
    return d;
  } else if (type === 'krullen') {
    const loops = Math.round(len / 22);
    for (let i = 0; i <= loops * 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      pts.push([x1 + (t / (Math.PI * 2)) * (len / loops) + Math.sin(t) * amp * 0.8, y - Math.cos(t) * amp + amp * 0.2]);
    }
  }
  return `M${pts.map(([a, b]) => `${f1(a)} ${f1(b)}`).join('L')}`;
}

function lines(seed, level) {
  const r = rng(seed);
  const types = {
    mix: ['recht', 'golfjes', 'zigzag', 'bogen', 'trapjes', 'krullen'],
    golfjes: ['golfjes', 'bogen', 'golfjes', 'bogen', 'golfjes', 'bogen'],
    zigzag: ['zigzag', 'trapjes', 'zigzag', 'trapjes', 'zigzag', 'trapjes'],
    krullen: ['krullen', 'krullen', 'golfjes', 'krullen', 'krullen', 'golfjes'],
  }[level] || ['recht', 'golfjes', 'zigzag', 'bogen', 'trapjes', 'krullen'];
  const icons = shuffle(r, LINE_ICONS);
  const rowH = (H - 16) / types.length;
  let body = '';
  types.forEach((t, i) => {
    const y = 12 + rowH * i + rowH / 2;
    const [a, b] = icons[i % icons.length];
    const amp = t === 'recht' ? 0 : Math.min(9, rowH * 0.24);
    body += emoji(14, y, 13, a) + emoji(W - 12, y, 13, b);
    body += `<circle cx="27" cy="${f1(y + (t === 'zigzag' || t === 'bogen' || t === 'trapjes' ? amp : t === 'krullen' ? -amp * 0.8 : 0))}" r="1.8" fill="#2fa36b"/>`;
    body += `<path d="${linePath(t, 27, W - 26, y, amp)}" stroke="${GUIDE}" stroke-width="1.5" stroke-dasharray="2 2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  });
  return { title: 'Volg de lijntjes', svg: svg(body) };
}

/* ---------------- Mandala en patronen ---------------- */

function petal(cx, cy, r1, r2, ang, width) {
  // druppelvorm van straal r1 tot r2 onder hoek ang
  const a = (ang * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const px = -uy;
  const py = ux;
  const p1 = [cx + ux * r1, cy + uy * r1];
  const p2 = [cx + ux * r2, cy + uy * r2];
  const mid = (r1 + r2) / 2;
  const c1 = [cx + ux * mid + px * width, cy + uy * mid + py * width];
  const c2 = [cx + ux * mid - px * width, cy + uy * mid - py * width];
  return `M${f1(p1[0])} ${f1(p1[1])}Q${f1(c1[0])} ${f1(c1[1])} ${f1(p2[0])} ${f1(p2[1])}Q${f1(c2[0])} ${f1(c2[1])} ${f1(p1[0])} ${f1(p1[1])}Z`;
}

function mandala(seed, level) {
  const r = rng(seed);
  const cx = W / 2;
  const cy = H / 2 - 4;
  const fine = level === 'fijn';
  const R = 84;
  const ringsN = fine ? 6 : 3;
  const radii = Array.from({ length: ringsN + 1 }, (_, i) => 8 + ((R - 8) * i) / ringsN);
  const sw = fine ? 0.6 : 0.9;
  let d = '';
  let circles = `<circle cx="${cx}" cy="${cy}" r="${radii[0]}"/>`;
  for (let i = 0; i < ringsN; i++) {
    const r1 = radii[i];
    const r2 = radii[i + 1];
    const n = fine ? pick(r, [8, 10, 12, 16]) : pick(r, [6, 8]);
    const kind = pick(r, ['petal', 'petal', 'circle', 'arch']);
    const off = r() < 0.5 ? 0 : 180 / n;
    for (let k = 0; k < n; k++) {
      const ang = (360 / n) * k + off;
      const a = (ang * Math.PI) / 180;
      if (kind === 'petal') d += petal(cx, cy, r1, r2, ang, ((r2 - r1) * Math.PI) / n * 1.1 + 2);
      else if (kind === 'circle') {
        const rr = Math.min((r2 - r1) / 2, (Math.PI * (r1 + r2)) / (2 * n)) * 0.82;
        circles += `<circle cx="${f1(cx + Math.cos(a) * (r1 + r2) / 2)}" cy="${f1(cy + Math.sin(a) * (r1 + r2) / 2)}" r="${f1(rr)}"/>`;
      } else {
        const a2 = ((ang + 360 / n) * Math.PI) / 180;
        d += `M${f1(cx + Math.cos(a) * r1)} ${f1(cy + Math.sin(a) * r1)}Q${f1(cx + Math.cos((a + a2) / 2) * r2 * 1.02)} ${f1(cy + Math.sin((a + a2) / 2) * r2 * 1.02)} ${f1(cx + Math.cos(a2) * r1)} ${f1(cy + Math.sin(a2) * r1)}`;
      }
    }
    circles += `<circle cx="${cx}" cy="${cy}" r="${f1(r2)}"/>`;
  }
  const body = `<g fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round">${circles}<path d="${d}"/></g>`;
  return { title: fine ? 'Mandala met kleine vlakjes' : 'Mandala om te kleuren', svg: svg(body) };
}

const SHAPES = {
  rond: (x, y, s) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s / 2)}"/>`,
  vierkant: (x, y, s) => `<rect x="${f1(x - s / 2)}" y="${f1(y - s / 2)}" width="${f1(s)}" height="${f1(s)}" rx="1"/>`,
  driehoek: (x, y, s) => `<path d="M${f1(x)} ${f1(y - s / 2)}L${f1(x + s / 2)} ${f1(y + s / 2)}L${f1(x - s / 2)} ${f1(y + s / 2)}Z"/>`,
  hart: (x, y, s) => `<path d="M${f1(x)} ${f1(y + s / 2)}C${f1(x - s * 0.9)} ${f1(y - s * 0.1)} ${f1(x - s * 0.35)} ${f1(y - s * 0.75)} ${f1(x)} ${f1(y - s * 0.22)}C${f1(x + s * 0.35)} ${f1(y - s * 0.75)} ${f1(x + s * 0.9)} ${f1(y - s * 0.1)} ${f1(x)} ${f1(y + s / 2)}Z"/>`,
  ster: (x, y, s) => {
    let p = '';
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? s * 0.22 : s * 0.52;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      p += `${i ? 'L' : 'M'}${f1(x + Math.cos(a) * rr)} ${f1(y + Math.sin(a) * rr)}`;
    }
    return `<path d="${p}Z"/>`;
  },
  maan: (x, y, s) => `<path d="M${f1(x + s * 0.2)} ${f1(y - s / 2)}A${f1(s / 2)} ${f1(s / 2)} 0 1 0 ${f1(x + s * 0.2)} ${f1(y + s / 2)}A${f1(s * 0.38)} ${f1(s * 0.42)} 0 1 1 ${f1(x + s * 0.2)} ${f1(y - s / 2)}Z"/>`,
};

function patterns(seed) {
  const r = rng(seed);
  const names = Object.keys(SHAPES);
  const rows = 7;
  const rowH = (H - 10) / rows;
  let body = '';
  for (let i = 0; i < rows; i++) {
    const y = 8 + rowH * i + rowH / 2;
    const kind = i < 2 ? 'ab' : pick(r, ['ab', 'aab', 'abc', 'groot-klein']);
    const [a, b, c] = shuffle(r, names);
    const unit = { ab: [a, b], aab: [a, a, b], abc: [a, b, c], 'groot-klein': [a, a] }[kind];
    const count = 9;
    const step = (W - 16) / count;
    for (let k = 0; k < count; k++) {
      const shape = unit[k % unit.length];
      const big = kind === 'groot-klein' ? (k % 2 ? 0.55 : 1) : 1;
      const s = Math.min(step, rowH) * 0.68 * big;
      const solid = k < unit.length * 2;
      body += `<g fill="none" stroke="${solid ? INK : GUIDE}" stroke-width="${solid ? 1 : 0.9}" ${solid ? '' : 'stroke-dasharray="1.6 1.8"'}>${SHAPES[shape](12 + step * k + step / 2, y, s)}</g>`;
    }
    if (i < rows - 1) body += `<path d="M6 ${f1(y + rowH / 2)}H${W - 6}" stroke="#e3dcd2" stroke-width="0.5"/>`;
  }
  return { title: 'Maak het patroon af', svg: svg(body) };
}

/* ---------------- Papieren poppetjes ---------------- */

// De pop staat in ‘popcoördinaten’ (mm); kleertjes gebruiken dezelfde maten, zodat ze passen.
const DOLL = `
  <circle cx="90" cy="30" r="17"/>
  <path d="M84 46.5v6h12v-6"/>
  <path d="M70 53Q90 49 110 53Q114 54 114 60L111 108Q90 112 69 108L66 60Q66 54 70 53Z"/>
  <path d="M67 56Q58 58 55 66L49 104Q48 110 53 111Q57 111 58 106L66.4 66"/>
  <path d="M113 56Q122 58 125 66L131 104Q132 110 127 111Q123 111 122 106L113.6 66"/>
  <path d="M71 107L72 186Q72 192 79 192Q87 192 87 186L89 112"/>
  <path d="M109 107L108 186Q108 192 101 192Q93 192 93 186L91 112"/>
  <path d="M70 186Q62 194 70 197H88V188"/><path d="M110 186Q118 194 110 197H92V188"/>
  <path d="M69 94Q90 99 111 94" stroke-dasharray="1.4 1.6"/>
  <path d="M70 100L70 118Q80 121 89 117L90 108L91 117Q100 121 110 118L110 100"/>
  <circle cx="84" cy="28" r="1.6" fill="${INK}"/><circle cx="96" cy="28" r="1.6" fill="${INK}"/>
  <path d="M84 36Q90 41 96 36"/>`;

const CLOTHES = {
  shirt: { label: 'T-shirt', box: [46, 46, 88, 72], d: 'M68 50Q90 46 112 50L132 62L126 76L114 70L112 110Q90 114 68 110L66 70L54 76L48 62Z', tabs: ['M74 50v-6h10v5', 'M96 49v-5h10v6'] },
  trui: { label: 'Trui', box: [42, 44, 96, 76], d: 'M68 50Q90 46 112 50Q122 54 125 64L133 104L122 108L115 78L112 112Q90 116 68 112L65 78L58 108L47 104L55 64Q58 54 68 50Z', tabs: ['M74 50v-6h10v5', 'M96 49v-5h10v6'] },
  broek: { label: 'Broek', box: [64, 96, 52, 100], d: 'M68 100Q90 103 112 100L111 190H93L91 120H89L87 190H69Z', tabs: ['M70 100v-6h8v6.5', 'M102 100.5v-6.5h8v6'] },
  jurk: { label: 'Jurk', box: [48, 44, 84, 112], d: 'M76 50L80 50L82 60Q90 62 98 60L100 50L104 50L110 64L112 96L126 150Q90 158 54 150L68 96L70 64Z', tabs: ['M76 50v-6h6v6', 'M98 50v-6h6v6'] },
  jas: { label: 'Jas', box: [42, 44, 96, 92], d: 'M66 50Q90 45 114 50Q124 54 127 64L134 106L122 110L116 82L116 132Q90 136 64 132L64 82L58 110L46 106L53 64Q56 54 66 50Z', tabs: ['M72 50v-6h10v5', 'M98 49v-5h10v6'], extra: '<path d="M90 52V134"/><circle cx="94" cy="72" r="1.6"/><circle cx="94" cy="92" r="1.6"/><circle cx="94" cy="112" r="1.6"/>' },
  muts: { label: 'Muts', box: [68, 4, 44, 36], d: 'M71 28Q71 10 90 10Q109 10 109 28Q90 24 71 28Z', tabs: ['M71 28l-4 5h8z', 'M109 28l4 5h-8z'], extra: '<circle cx="90" cy="8" r="4"/><path d="M71 28Q90 33 109 28" />' },
  laarzen: { label: 'Laarzen', box: [60, 162, 60, 38], d: 'M70 166H86V190Q86 198 78 198H63Q60 192 66 188L70 186ZM94 166H110V186L114 188Q120 192 117 198H102Q94 198 94 190Z', tabs: ['M72 166v-5h12v5', 'M96 166v-5h12v5'] },
  rok: { label: 'Rok', box: [56, 96, 68, 50], d: 'M70 102Q90 106 110 102L122 140Q90 146 58 140Z', tabs: ['M72 102.5v-6h8v6.5', 'M100 103v-6.5h8v6'] },
};

function dollPage() {
  const body = `<g fill="none" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round" transform="translate(0 8)">${DOLL}
    <path d="M58 197H122V215H58Z" stroke-dasharray="2 1.6"/><path d="M58 206H122" stroke-dasharray="0.8 1.4" stroke="${GUIDE}"/>
    <text x="90" y="212" font-size="3.6" text-anchor="middle" fill="${GUIDE}" stroke="none">vouw hier, dan blijft je pop staan</text></g>`;
  return { title: 'Mijn papieren poppetje', svg: svg(body) };
}

function clothesPage(seed, set) {
  const r = rng(seed);
  const items = set || shuffle(r, Object.keys(CLOTHES)).slice(0, 6);
  // In een raster van 2 kolommen zetten; elk kledingstuk krijgt een vak.
  const cells = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]];
  const cw = W / 2;
  const ch = H / 3;
  let body = '';
  items.slice(0, 6).forEach((key, i) => {
    const c = CLOTHES[key];
    const [bx, by, bw, bh] = c.box;
    const scale = Math.min(1, (cw - 12) / bw, (ch - 24) / bh);
    const [gx, gy] = cells[i];
    const tx = gx * cw + (cw - bw * scale) / 2 - bx * scale;
    const ty = gy * ch + 6 + (ch - 24 - bh * scale) / 2 - by * scale;
    const bottom = ty + (by + bh) * scale;
    body += `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${f1(scale)})" fill="none" stroke="${INK}" stroke-width="${f1(0.9 / scale)}" stroke-linejoin="round">
      <path d="${c.d}"/>${c.extra || ''}${(c.tabs || []).map((t) => `<path d="${t}" stroke-dasharray="${f1(1.6 / scale)} ${f1(1.4 / scale)}"/>`).join('')}</g>
      <text x="${f1(gx * cw + cw / 2)}" y="${f1(Math.min(gy * ch + ch - 3, bottom + 7))}" font-size="4" text-anchor="middle" fill="${GUIDE}">${c.label}</text>`;
  });
  return { title: 'Kleertjes: kleuren, knippen en de lipjes omvouwen', svg: svg(body) };
}

/* ---------------- Maak de tekening af ---------------- */

const UNFINISHED = [
  ['Zet een dak op het huis', '<rect x="-16" y="-6" width="32" height="26"/><rect x="-5" y="6" width="10" height="14"/><rect x="-13" y="-1" width="7" height="7"/><rect x="6" y="-1" width="7" height="7"/>'],
  ['Teken ogen, een neus en een mond', '<circle r="18"/><path d="M-18 -2Q-23 -2 -22 4Q-21 8 -17 7M18 -2Q23 -2 22 4Q21 8 17 7"/><path d="M-12 -14Q-4 -22 4 -17Q10 -22 14 -12"/>'],
  ['Geef de auto wielen', '<path d="M-24 6V-4Q-24 -8 -18 -8H-12L-6 -18H10L18 -8Q24 -8 25 -2V6Z"/><path d="M-4 -8V-15H8L13 -8Z"/>'],
  ['Teken blaadjes of appels aan de boom', '<path d="M-4 24V0L-14 -12M-4 4L-18 -2M4 24V-4L14 -16M4 2L18 -6M0 -4V-20"/>'],
  ['Geef de zon stralen', '<circle r="13"/><circle cx="-5" cy="-3" r="1.3" fill="currentColor"/><circle cx="5" cy="-3" r="1.3" fill="currentColor"/><path d="M-6 4Q0 9 6 4"/>'],
  ['Teken bloemblaadjes aan de bloem', '<circle cy="-8" r="6"/><path d="M0 -2V26M0 16Q-10 12 -12 4Q-2 6 0 14M0 20Q9 15 12 8Q2 10 0 18"/>'],
  ['Geef de kat pootjes en een staart', '<ellipse cx="2" cy="6" rx="18" ry="11"/><circle cx="-16" cy="-8" r="9"/><path d="M-23 -14L-22 -22L-16 -17M-10 -14L-9 -22L-15 -17"/><circle cx="-19" cy="-9" r="1" fill="currentColor"/><circle cx="-13" cy="-9" r="1" fill="currentColor"/>'],
  ['Zet kaarsjes op de taart', '<path d="M-22 4H22V22H-22Z"/><path d="M-18 -8H18V4H-18Z"/><path d="M-22 12Q-16 16 -11 12Q-5 16 0 12Q5 16 11 12Q16 16 22 12"/>'],
  ['Geef de vis vinnen en strepen', '<path d="M-20 0Q0 -16 18 0Q0 16 -20 0Z"/><circle cx="10" cy="-2" r="1.6" fill="currentColor"/>'],
  ['Geef de slak een huisje', '<path d="M-24 14Q-10 14 10 14Q20 14 22 6Q24 -2 18 -6"/><path d="M18 -6L16 -14M20 -6L24 -13"/>'],
  ['Geef het lieveheersbeestje stippen', '<ellipse cy="4" rx="17" ry="15"/><path d="M0 -11V19"/><path d="M-9 -9Q0 -20 9 -9"/><path d="M-4 -16L-8 -22M4 -16L8 -22"/>'],
  ['Zet bolletjes op het ijsje', '<path d="M-12 -4L0 24L12 -4Z"/><path d="M-8 4L4 0M-6 10L6 6M-4 16L4 13"/>'],
  ['Teken haren en een mooie hoed', '<circle cy="6" r="15"/><circle cx="-5" cy="4" r="1.4" fill="currentColor"/><circle cx="5" cy="4" r="1.4" fill="currentColor"/><path d="M-5 12Q0 16 5 12"/>'],
  ['Teken touwtjes aan de ballonnen', '<ellipse cx="-10" cy="-8" rx="9" ry="11"/><ellipse cx="10" cy="-4" rx="9" ry="11"/>'],
];

function unfinished(seed) {
  const r = rng(seed);
  const items = shuffle(r, UNFINISHED).slice(0, 6);
  const cw = W / 2;
  const ch = H / 3;
  let body = '';
  items.forEach(([label, art], i) => {
    const gx = i % 2;
    const gy = Math.floor(i / 2);
    const x = gx * cw;
    const y = gy * ch;
    body += `<rect x="${f1(x + 3)}" y="${f1(y + 3)}" width="${f1(cw - 6)}" height="${f1(ch - 6)}" rx="4" fill="none" stroke="#e3dcd2" stroke-width="0.6"/>
      <g transform="translate(${f1(x + cw / 2)} ${f1(y + ch / 2 - 4)}) scale(1.25)" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round" color="${INK}">${art}</g>
      <text x="${f1(x + cw / 2)}" y="${f1(y + ch - 8)}" font-size="4.2" text-anchor="middle" fill="${INK}">${label}</text>`;
  });
  return { title: 'Maak de tekening af', svg: svg(body) };
}

/* ---------------- Samen ---------------- */

// Geeft de pagina's van een werkblad: [{ title, svg }]
export function buildSheet(id, level, seed) {
  switch (id) {
    case 'doolhof': return [maze(seed, level)];
    case 'lijnen': return [lines(seed, level)];
    case 'mandala': return [level === 'patronen' ? patterns(seed) : mandala(seed, level)];
    case 'poppetjes': return level === 'kleren' ? [clothesPage(seed)] : [dollPage(), clothesPage(seed, ['shirt', 'broek', 'jurk', 'jas', 'muts', 'laarzen'])];
    case 'afmaken': return [unfinished(seed)];
    default: return [];
  }
}
