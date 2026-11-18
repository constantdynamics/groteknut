// Eenvoudige opslag: alles blijft lokaal in de browser (localStorage).

const KEY = 'groteknut:v1';

export const DEFAULT_FILTERS = {
  ages: [],
  mess: 3,
  wet: true,
  dirty: true,
  stock: 'all', // all | now | one
  cats: [],
  themes: [],
  learn: [],
  timeMax: 999,
  prepMax: 999,
  solo: false,
  q: '',
  sort: 'best',
};

const DEFAULTS = {
  ...DEFAULT_FILTERS,
  have: {}, // materiaal-id -> true
  favs: {}, // idee-id -> tijdstip
  done: {}, // idee-id -> [tijdstippen]
  shop: {}, // materiaal-id -> tijdstip
  shopDone: {}, // materiaal-id -> true (afgestreept)
  custom: [], // [{ id, text, done }]
  theme: 'auto',
  welcomed: false,
  moreOpen: false,
};

const clone = (o) => JSON.parse(JSON.stringify(o));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULTS);
    const data = JSON.parse(raw);
    return { ...clone(DEFAULTS), ...data, q: "" };
  } catch {
    return clone(DEFAULTS);
  }
}

let state = load();
const listeners = new Set();
let saveTimer;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const { q, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      /* opslag niet beschikbaar (privévenster): app werkt gewoon door */
    }
  }, 120);
}

export const store = {
  get: () => state,
  set(patch, { silent = false } = {}) {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
    persist();
    if (!silent) listeners.forEach((fn) => fn(state, next));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
