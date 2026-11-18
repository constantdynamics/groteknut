// Welke thema's zijn nu actueel? (seizoenen en feestdagen)

const dayNum = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Paaszondag (anonieme Gregoriaanse methode).
export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function nthSunday(year, monthIndex, n) {
  const first = new Date(year, monthIndex, 1);
  const offset = (7 - first.getDay()) % 7;
  return new Date(year, monthIndex, 1 + offset + 7 * (n - 1));
}

function windows(theme, year) {
  if (theme.window) {
    const [s, e] = theme.window.map((x) => x.split('-').map(Number));
    const start = new Date(year, s[0] - 1, s[1]);
    const end = new Date(year, e[0] - 1, e[1]);
    if (end < start) {
      // loopt over de jaarwisseling heen
      return [
        [new Date(year - 1, s[0] - 1, s[1]), end],
        [start, new Date(year + 1, e[0] - 1, e[1])],
      ];
    }
    return [[start, end]];
  }
  switch (theme.dynamic) {
    case 'pasen': {
      const e = easter(year);
      return [[addDays(e, -21), addDays(e, 1)]];
    }
    case 'carnaval': {
      const sunday = addDays(easter(year), -49);
      return [[addDays(sunday, -21), addDays(sunday, 2)]];
    }
    case 'koningsdag': {
      let d = new Date(year, 3, 27);
      if (d.getDay() === 0) d = new Date(year, 3, 26);
      return [[addDays(d, -20), d]];
    }
    case 'moederdag': {
      const d = nthSunday(year, 4, 2);
      return [[addDays(d, -14), d]];
    }
    case 'vaderdag': {
      const d = nthSunday(year, 5, 3);
      return [[addDays(d, -14), d]];
    }
    default:
      return [];
  }
}

// Geeft actieve thema's terug, feestdagen (korte periodes) eerst.
export function activeThemes(themes, date = new Date()) {
  const today = dayNum(date);
  const y = date.getFullYear();
  return themes
    .map((t) => {
      const hit = windows(t, y).find(([s, e]) => today >= dayNum(s) && today <= dayNum(e));
      return hit ? { theme: t, length: (hit[1] - hit[0]) / 864e5 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.length - b.length)
    .map((x) => x.theme);
}
