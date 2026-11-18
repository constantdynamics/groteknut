// Groteknut – hoofdbestand: router, schermen en acties.

import { CATEGORIES, THEMES, LEARN, MESS, SUPERVISION } from './data/meta.js';
import { MATERIALS, MATERIAL_GROUPS, PRESETS } from './data/materials.js';
import ACTIVITIES from './data/activities.js';
import { RECIPES } from './data/recipes.js';
import { GUIDE } from './data/guide.js';
import { store, DEFAULT_FILTERS } from './store.js';
import { esc, md, $, $$, normalize, ageLabel, minutes, plural, debounce, hashSeed, todayKey, shortDate } from './util.js';
import { activeThemes } from './season.js';

/* ================= Indexen ================= */

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const CAT = byId(CATEGORIES);
const THEME = byId(THEMES);
const LRN = byId(LEARN);
const MAT = byId(MATERIALS);
const ACT = byId(ACTIVITIES);
const REC = byId(RECIPES);
const GUIDE_BY = byId(GUIDE);
const MESS_BY = Object.fromEntries(MESS.map((m) => [m.level, m]));
const SUP_BY = Object.fromEntries(SUPERVISION.map((m) => [m.level, m]));
const NON_BASIC = MATERIALS.filter((m) => !m.basic);
const ACTIVE_THEMES = activeThemes(THEMES);
const ACTIVE_IDS = new Set(ACTIVE_THEMES.map((t) => t.id));

// Hoe vaak wordt elk materiaal (als benodigd) gebruikt?
const USAGE = {};
for (const a of ACTIVITIES) for (const m of a.materials) USAGE[m.id] = (USAGE[m.id] || 0) + 1;

// Zoekindex
for (const a of ACTIVITIES) {
  const mats = [...a.materials, ...(a.optional || [])];
  a._q = normalize([
    a.title, a.summary, CAT[a.category]?.label,
    ...mats.map((m) => `${MAT[m.id]?.label ?? ''} ${m.note ?? ''}`),
    ...a.themes.map((t) => THEME[t]?.label), ...a.words, ...a.learn.map((l) => LRN[l]?.label),
  ].join(' '));
  a._full = normalize([a._q, ...a.steps, ...a.tips, ...a.variations].join(' '));
}

// Welke recepten horen bij welke ideeën?
const RECIPE_KEYWORDS = {
  speeldeeg: ['speeldeeg'], zoutdeeg: ['zoutdeeg'], vingerverf: ['vingerverf'], yoghurtverf: ['yoghurtverf', 'eetbare verf'],
  wolkendeeg: ['wolkendeeg', 'maanzand'], sneeuwdeeg: ['sneeuwdeeg'], maizenapap: ['maizenapap', 'oobleck'],
  zeepschuim: ['zeepschuim'], bellenblaas: ['bellenblaas'], 'gekleurde-rijst': ['gekleurde rijst', 'gekleurde pasta', 'rijst kleuren', 'pasta kleuren'],
  plaksel: ['plaksel'], 'eetbaar-deeg': ['eetbaar speeldeeg', 'havermoutdeeg', 'havermeel'], ijsverf: ['ijsverf'],
  'bolle-verf': ['bolle verf'], glazuur: ['glazuur'],
};
const RECIPE_USES = {};
const ACT_RECIPES = {};
for (const r of RECIPES) {
  const keys = (RECIPE_KEYWORDS[r.id] || [r.id]).map(normalize);
  RECIPE_USES[r.id] = ACTIVITIES.filter((a) =>
    keys.some((k) => a._full.includes(k)) || [...a.materials, ...(a.optional || [])].some((m) => MAT[m.id]?.recipe === r.id));
  for (const a of RECIPE_USES[r.id]) (ACT_RECIPES[a.id] ||= []).push(r.id);
}

/* ================= Iconen ================= */

const svg = (paths, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICON = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 'search-icon'),
  heart: svg('<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4 7.5 4c2 0 3.5 1.1 4.5 2.6C13 5.1 14.5 4 16.5 4c3.6 0 5.9 3.6 4.7 7.1-1.7 4.8-9.2 9.4-9.2 9.4z"/>'),
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  share: svg('<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
};

/* ================= Logica ================= */

const hasInventory = (s = store.get()) => Object.keys(s.have).some((k) => s.have[k]);
const missingOf = (a, have = store.get().have) => a.materials.filter((m) => MAT[m.id] && !MAT[m.id].basic && !have[m.id]);
const shortLabel = (id) => (MAT[id]?.label ?? id).replace(/\s*\(.*?\)/g, '').split(/ of |, /)[0];
const ARRAY_KEYS = ['ages', 'cats', 'themes', 'learn'];
const BOOL_KEYS = ['wet', 'dirty', 'solo'];
const NUM_KEYS = ['mess', 'timeMax', 'prepMax'];

function matches(a, s, ignore = []) {
  if (s.ages.length && !s.ages.every((g) => g >= a.ageMin && g <= a.ageMax)) return false;
  if (a.mess > s.mess) return false;
  if (!s.wet && a.wet) return false;
  if (!s.dirty && a.dirty) return false;
  if (!ignore.includes('cats') && s.cats.length && !s.cats.includes(a.category)) return false;
  if (s.themes.length && !a.themes.some((t) => s.themes.includes(t))) return false;
  if (s.learn.length && !a.learn.some((l) => s.learn.includes(l))) return false;
  if (a.durationMinutes > s.timeMax) return false;
  if (a.prepMinutes > s.prepMax) return false;
  if (s.solo && a.supervision < 3) return false;
  if (s.stock !== 'all') {
    const n = missingOf(a, s.have).length;
    if (s.stock === 'now' && n > 0) return false;
    if (s.stock === 'one' && n > 1) return false;
  }
  if (s.q) {
    const terms = normalize(s.q).split(' ').filter(Boolean);
    if (!terms.every((t) => a._q.includes(t))) return false;
  }
  return true;
}

function sortList(list, s = store.get()) {
  const seed = todayKey();
  const rnd = (a) => hashSeed(a.id + seed);
  const inv = hasInventory(s);
  const season = (a) => (a.themes.some((t) => ACTIVE_IDS.has(t)) ? 1 : 0);
  const title = (a, b) => a.title.localeCompare(b.title, 'nl');
  const SORTS = {
    best: (a, b) => (inv ? missingOf(a, s.have).length - missingOf(b, s.have).length : 0) || season(b) - season(a) || rnd(a) - rnd(b),
    snel: (a, b) => a.prepMinutes + a.durationMinutes - (b.prepMinutes + b.durationMinutes) || title(a, b),
    schoon: (a, b) => a.mess - b.mess || Number(a.dirty) - Number(b.dirty) || Number(a.wet) - Number(b.wet) || title(a, b),
    az: title,
  };
  return [...list].sort(SORTS[s.sort] || SORTS.best);
}

function applyFilter(key, value) {
  const s = store.get();
  if (ARRAY_KEYS.includes(key)) {
    const v = key === 'ages' ? Number(value) : value;
    store.set({ [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] });
  } else if (BOOL_KEYS.includes(key)) {
    store.set({ [key]: !s[key] });
  } else if (NUM_KEYS.includes(key)) {
    store.set({ [key]: Number(value) });
  } else {
    store.set({ [key]: value });
  }
}

function isOn(key, value, s = store.get()) {
  if (ARRAY_KEYS.includes(key)) return s[key].includes(key === 'ages' ? Number(value) : value);
  if (BOOL_KEYS.includes(key)) return !!s[key];
  if (NUM_KEYS.includes(key)) return s[key] === Number(value);
  return s[key] === value;
}

const moreCount = (s) => s.themes.length + s.learn.length + (s.timeMax !== 999) + (s.prepMax !== 999) + (s.solo ? 1 : 0);
const filtersActive = (s) =>
  s.ages.length || s.mess !== 3 || !s.wet || !s.dirty || s.stock !== 'all' || s.cats.length || moreCount(s) || s.q;

/* ================= Bouwstenen ================= */

const messPill = (level) => `<span class="pill mess-${level}" title="Rommel: ${esc(MESS_BY[level].label)}"><span class="mess-dots" aria-hidden="true"><i></i><i></i><i></i></span>${esc(MESS_BY[level].short)}</span>`;

function card(a, { compact = false } = {}) {
  const s = store.get();
  const fav = !!s.favs[a.id];
  const doneN = (s.done[a.id] || []).length;
  let stock = '';
  if (!compact && hasInventory(s)) {
    const miss = missingOf(a, s.have);
    stock = miss.length
      ? `<p class="stock miss">Mist ${miss.length}<span class="lst">· ${esc(miss.map((m) => shortLabel(m.id)).join(', '))}</span></p>`
      : '<p class="stock ok">✓ Alles in huis</p>';
  }
  return `<article class="card${compact ? ' card--compact' : ''}" style="--cat:var(--c-${a.category})">
    <div class="card-art" aria-hidden="true"><span class="card-emoji">${a.emoji}</span></div>
    <div class="card-body">
      <p class="card-cat">${esc(CAT[a.category].label)}</p>
      <h3 class="card-title"><a class="card-link" href="#/idee/${a.id}">${esc(a.title)}</a></h3>
      ${compact ? '' : `<p class="card-sum">${esc(a.summary)}</p>`}
      <div class="card-meta">
        <span class="pill" title="Leeftijd">${ageLabel(a.ageMin, a.ageMax)}</span>
        <span class="pill" title="Duur">⏱ ${minutes(a.durationMinutes)}</span>
        ${compact ? '' : messPill(a.mess)}
        ${a.wet ? '<span class="pill" title="Kan nat worden">💧<span class="sr-only">nat</span></span>' : ''}
        ${a.dirty ? '<span class="pill" title="Kan vlekken geven">🎨<span class="sr-only">kan vlekken</span></span>' : ''}
      </div>
      ${stock}
    </div>
    <button class="fav-btn" type="button" data-action="fav" data-id="${a.id}" aria-pressed="${fav}" aria-label="Bewaar: ${esc(a.title)}">${ICON.heart}</button>
    ${doneN ? `<span class="done-badge" title="${doneN}× gedaan"><span aria-hidden="true">✓</span><span class="sr-only">${doneN} keer gedaan</span></span>` : ''}
  </article>`;
}

const emptyBox = (emoji, title, text, actions = '') =>
  `<div class="empty"><div class="big" aria-hidden="true">${emoji}</div><h3>${title}</h3><p>${text}</p>${actions ? `<div class="btn-row">${actions}</div>` : ''}</div>`;

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Goedenacht';
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

/* ================= Scherm: Ontdek ================= */

function viewDiscover() {
  const s = store.get();
  const chip = (key, value, label, extra = '') =>
    `<button class="chip${extra}" type="button" data-action="filter" data-key="${key}" data-value="${value}" aria-pressed="false">${label}</button>`;
  const seg = (key, value, emoji, label) =>
    `<button class="seg-btn" type="button" data-action="filter" data-key="${key}" data-value="${value}" aria-pressed="false"><span class="e" aria-hidden="true">${emoji}</span><span>${esc(label)}</span></button>`;
  const html = `
  <section class="hero" aria-labelledby="hero-title">
    <p class="eyebrow">${greeting()}! 👋</p>
    <h1 id="hero-title" tabindex="-1">Wat gaan we doen?</h1>
    <p class="lead">Kies wat bij vandaag past. Alle <strong>${ACTIVITIES.length}</strong> ideeën kunnen binnen.</p>
    <div class="search${s.q ? ' has-value' : ''}" id="search-wrap">
      ${ICON.search}
      <label class="sr-only" for="q">Zoek een idee of materiaal</label>
      <input id="q" type="search" placeholder="Zoek: verf, rijst, kerst, auto’s…" value="${esc(s.q)}" autocomplete="off" enterkeyhint="search">
      <button class="search-clear" type="button" data-action="clear-q" aria-label="Zoekterm wissen">✕</button>
    </div>
    <div class="filters">
      <div class="filter-row">
        <span class="filter-label" id="lbl-age">Leeftijd</span>
        <div class="chips" role="group" aria-labelledby="lbl-age">
          ${[1, 2, 3, 4, 5].map((n) => `<button class="chip chip-age" type="button" data-action="filter" data-key="ages" data-value="${n}" aria-pressed="false" aria-label="${n} jaar">${n}</button>`).join('')}
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label" id="lbl-mess">Hoeveel rommel mag het zijn?</span>
        <div class="seg" role="group" aria-labelledby="lbl-mess">
          ${MESS.map((m) => seg('mess', m.level, m.emoji, m.label)).join('')}
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">Nat en vies</span>
        <div class="switches">
          <button class="switch" type="button" role="switch" data-action="filter" data-key="wet" aria-checked="true"><span class="switch-track"></span><span>💧 Nat mag<small>water en spetters</small></span></button>
          <button class="switch" type="button" role="switch" data-action="filter" data-key="dirty" aria-checked="true"><span class="switch-track"></span><span>🎨 Vies mag<small>vlekken van verf, lijm</small></span></button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label" id="lbl-stock">Wat heb je in huis?</span>
        <div class="seg" role="group" aria-labelledby="lbl-stock">
          ${seg('stock', 'all', '🌈', 'Alles tonen')}${seg('stock', 'now', '✅', 'Kan meteen')}${seg('stock', 'one', '🛒', 'Mist max. 1')}
        </div>
        <p class="hint" id="stock-hint"></p>
      </div>
      <div class="more-filters" id="more"${s.moreOpen ? '' : ' hidden'}>
        <div class="filter-row">
          <span class="filter-label" id="lbl-theme">Seizoen en feestdagen</span>
          <div class="chips" role="group" aria-labelledby="lbl-theme">${THEMES.map((t) => chip('themes', t.id, `${t.emoji} ${esc(t.label)}`)).join('')}</div>
        </div>
        <div class="filter-row">
          <span class="filter-label" id="lbl-time">Hoe lang?</span>
          <div class="chips" role="group" aria-labelledby="lbl-time">
            ${chip('timeMax', 999, 'Maakt niet uit')}${chip('timeMax', 10, 'Kort (≤ 10 min)')}${chip('timeMax', 20, '≤ 20 min')}${chip('timeMax', 30, '≤ 30 min')}
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label" id="lbl-prep">Voorbereiding</span>
          <div class="chips" role="group" aria-labelledby="lbl-prep">
            ${chip('prepMax', 999, 'Maakt niet uit')}${chip('prepMax', 2, 'Bijna niets')}${chip('prepMax', 5, '≤ 5 min')}${chip('prepMax', 15, '≤ 15 min')}
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label">Toezicht</span>
          <div class="switches">
            <button class="switch" type="button" role="switch" data-action="filter" data-key="solo" aria-checked="false"><span class="switch-track"></span><span>🙂 Kan (bijna) zelf<small>jij blijft in de buurt</small></span></button>
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label" id="lbl-learn">Wat leert je kind?</span>
          <div class="chips" role="group" aria-labelledby="lbl-learn">${LEARN.map((l) => chip('learn', l.id, `${l.emoji} ${esc(l.label)}`)).join('')}</div>
        </div>
      </div>
      <div class="filter-actions">
        <div class="left">
          <button class="btn btn-small" type="button" data-action="toggle-more" aria-expanded="${s.moreOpen}" aria-controls="more">⚙️ Meer filters <span class="badge" id="more-count" hidden></span></button>
          <button class="btn btn-small btn-ghost" type="button" data-action="reset-filters" id="reset-btn" hidden>Wis filters</button>
        </div>
        <button class="btn btn-primary" type="button" data-action="surprise"><span class="dice" aria-hidden="true">🎲</span> Verras me!</button>
      </div>
    </div>
  </section>
  <div id="welcome-slot"></div>
  <p class="season" id="season-slot"></p>
  <section class="section" aria-labelledby="cats-title">
    <div class="section-title"><h2 id="cats-title">Kies een soort</h2></div>
    <div class="chips scroll" role="group" aria-labelledby="cats-title">
      ${CATEGORIES.map((c) => `<button class="chip chip-cat" type="button" style="--cat:var(--c-${c.id})" data-action="filter" data-key="cats" data-value="${c.id}" aria-pressed="false">${c.emoji} ${esc(c.label)} <span class="count" data-cat-count="${c.id}"></span></button>`).join('')}
    </div>
  </section>
  <div id="rows"></div>
  <section class="section" id="results"></section>
  <p class="sr-only" aria-live="polite" id="live"></p>`;

  function update() {
    const st = store.get();
    $$('[data-action="filter"]', app).forEach((btn) => {
      const on = isOn(btn.dataset.key, btn.dataset.value, st);
      btn.setAttribute(btn.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(on));
    });
    const more = $('#more');
    if (more) more.hidden = !st.moreOpen;
    const tm = $('[data-action="toggle-more"]');
    if (tm) tm.setAttribute('aria-expanded', String(st.moreOpen));
    const mc = $('#more-count');
    const n = moreCount(st);
    if (mc) { mc.hidden = !n; mc.textContent = n; }
    const rb = $('#reset-btn');
    if (rb) rb.hidden = !filtersActive(st);
    $('#search-wrap')?.classList.toggle('has-value', !!st.q);

    // Hint bij 'wat heb je in huis'
    const hint = $('#stock-hint');
    if (hint) {
      hint.innerHTML = hasInventory(st)
        ? `Je hebt ${Object.values(st.have).filter(Boolean).length} spullen aangevinkt. <a href="#/spullen">Aanpassen</a>`
        : 'Nog niets aangevinkt. <a href="#/spullen">Vul je spullen in</a> om te zien wat je meteen kunt doen.';
    }

    for (const c of CATEGORIES) {
      const el = app.querySelector(`[data-cat-count="${c.id}"]`);
      if (el) el.textContent = ACTIVITIES.filter((a) => a.category === c.id && matches(a, st, ['cats'])).length;
    }

    // Welkom
    const ws = $('#welcome-slot');
    if (ws) {
      ws.innerHTML = st.welcomed ? '' : `
        <section class="welcome" aria-labelledby="welcome-title">
          <h2 id="welcome-title">👋 Welkom bij Groteknut!</h2>
          <p>Zo vind je in een paar tikken een idee dat bij jullie past:</p>
          <ol>
            <li>Kies de leeftijd van je kind (of kinderen).</li>
            <li>Kies hoeveel rommel mag en of het nat of vies mag worden.</li>
            <li>Vink aan wat je in huis hebt: dan zie je meteen wat je nú kunt doen.</li>
          </ol>
          <div class="btn-row">
            <a class="btn btn-primary" href="#/spullen">🧺 Mijn spullen invullen</a>
            <button class="btn" type="button" data-action="dismiss-welcome">Begrepen</button>
          </div>
        </section>`;
    }

    // Seizoen
    const ss = $('#season-slot');
    if (ss) {
      const seasonal = ACTIVE_THEMES.filter((t) => ACTIVITIES.some((a) => a.themes.includes(t.id)));
      ss.innerHTML = seasonal.length && !st.q
        ? `<span>Nu in het seizoen:</span> ${seasonal.map((t) => `<button class="chip" type="button" data-action="filter" data-key="themes" data-value="${t.id}" aria-pressed="${st.themes.includes(t.id)}">${t.emoji} ${esc(t.label)}</button>`).join('')}`
        : '';
    }

    const list = sortList(ACTIVITIES.filter((a) => matches(a, st)), st);
    $('#rows').innerHTML = rowsHtml(st, list);
    $('#results').innerHTML = resultsHtml(st, list);
    const live = $('#live');
    if (live) live.textContent = `${plural(list.length, 'idee', 'ideeën')} gevonden`;
  }

  return {
    html,
    title: '',
    tab: 'ontdek',
    restoreScroll: true,
    mount() {
      const input = $('#q');
      const push = debounce((v) => store.set({ q: v }), 140);
      input.addEventListener('input', () => {
        $('#search-wrap').classList.toggle('has-value', !!input.value);
        push(input.value.trim());
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { input.blur(); $('#results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
      update();
    },
    update,
  };
}

function rowsHtml(s, base) {
  if (s.q) return '';
  const rows = [];
  const seasonal = ACTIVE_THEMES.filter((t) => base.some((a) => a.themes.includes(t.id)));
  if (seasonal.length && !s.themes.length) {
    const ids = new Set(seasonal.map((t) => t.id));
    rows.push({ title: `${seasonal.map((t) => t.emoji).join(' ')} Nu in het seizoen`, sub: seasonal.map((t) => t.label).join(' & '), list: base.filter((a) => a.themes.some((t) => ids.has(t))) });
  }
  if (hasInventory(s) && s.stock !== 'now') rows.push({ title: '✅ Kan meteen met jouw spullen', sub: 'Je hebt alles in huis', list: base.filter((a) => !missingOf(a, s.have).length) });
  if (s.prepMax > 5) rows.push({ title: '⚡ Snel te starten', sub: 'Hooguit 5 minuten klaarzetten', list: base.filter((a) => a.prepMinutes <= 5) });
  if (s.mess > 1 || s.wet || s.dirty) rows.push({ title: '✨ Bijna geen rommel', sub: 'Schoon en droog', list: base.filter((a) => a.mess === 1 && !a.wet && !a.dirty) });
  if (!s.ages.length || s.ages.includes(1)) rows.push({ title: '🐣 Voor de allerkleinsten', sub: 'Al vanaf 1 jaar', list: base.filter((a) => a.ageMin === 1) });
  if (!s.solo) rows.push({ title: '🙂 Even zelf bezig', sub: 'Jij kunt in de buurt blijven', list: base.filter((a) => a.supervision === 3) });
  return rows
    .filter((r) => r.list.length >= 3)
    .map((r) => `<section class="section">
      <div class="section-title"><h2>${esc(r.title)}</h2><span class="muted">${esc(r.sub)}</span></div>
      <div class="row-scroll">${r.list.slice(0, 14).map((a) => card(a, { compact: true })).join('')}</div>
    </section>`)
    .join('');
}

function resultsHtml(s, list) {
  const sortSel = `<label class="sr-only" for="sort">Sorteren</label>
    <select id="sort" class="select" data-change="sort">
      ${[['best', 'Beste match'], ['snel', 'Snelst klaar'], ['schoon', 'Minste rommel'], ['az', 'A tot Z']].map(([v, l]) => `<option value="${v}"${s.sort === v ? ' selected' : ''}>${l}</option>`).join('')}
    </select>`;
  let body;
  if (list.length) {
    body = `<div class="grid">${list.map((a) => card(a)).join('')}</div>`;
  } else if (s.stock !== 'all' && !hasInventory(s)) {
    body = emptyBox('🧺', 'Vertel eerst wat je in huis hebt', 'Vink je spullen aan, dan laten we zien wat je meteen kunt doen.', `<a class="btn btn-primary" href="#/spullen">Spullen invullen</a><button class="btn" type="button" data-action="filter" data-key="stock" data-value="all">Toon alles</button>`);
  } else {
    body = emptyBox('🙈', 'Geen ideeën gevonden', 'Met deze combinatie vinden we niets. Zet een paar filters uit of zoek op iets anders.', '<button class="btn btn-primary" type="button" data-action="reset-filters">Wis alle filters</button>');
  }
  return `<div class="results-head"><h2>${s.q ? `Zoekresultaten voor ‘${esc(s.q)}’` : 'Alle ideeën'} <span class="muted">(${list.length})</span></h2>${sortSel}</div>${body}
    <p class="footer-note">Groteknut · alle ideeën kunnen binnen · <a href="#/gids/over">over deze app</a></p>`;
}

/* ================= Scherm: idee ================= */

const stepState = {};

function viewActivity(id) {
  const a = ACT[id];
  if (!a) return viewNotFound();
  const s = store.get();
  const fav = !!s.favs[a.id];
  const done = s.done[a.id] || [];
  const sup = SUP_BY[a.supervision];
  const steps = (stepState[a.id] ||= new Set());
  const recipes = (ACT_RECIPES[a.id] || []).map((rid) => REC[rid]);

  const fact = (k, v, sub = '') => `<div class="fact"><span class="k">${k}</span><span class="v">${v}</span>${sub ? `<span class="muted" style="font-size:.84rem">${sub}</span>` : ''}</div>`;
  const wetDirty = [a.wet ? '💧 wordt nat' : 'droog', a.dirty ? '🎨 kan vlekken' : 'geen vlekken'].join(' · ');

  const related = ACTIVITIES
    .filter((x) => x.id !== a.id)
    .map((x) => ({ x, score: (x.category === a.category ? 3 : 0) + x.themes.filter((t) => a.themes.includes(t)).length * 2 + x.learn.filter((l) => a.learn.includes(l)).length + (Math.min(x.ageMax, a.ageMax) >= Math.max(x.ageMin, a.ageMin) ? 1 : 0) + (hashSeed(x.id + a.id) % 100) / 100 }))
    .sort((p, q) => q.score - p.score)
    .slice(0, 8)
    .map((p) => p.x);

  const html = `
  <button class="btn btn-ghost back" type="button" data-action="back">${ICON.back} Terug</button>
  <article class="detail" style="--cat:var(--c-${a.category})">
    <header class="detail-hero">
      <span class="detail-emoji" aria-hidden="true">${a.emoji}</span>
      <p class="detail-cat">${CAT[a.category].emoji} ${esc(CAT[a.category].label)}</p>
      <h1 tabindex="-1">${esc(a.title)}</h1>
      <p class="lead">${esc(a.summary)}</p>
      <div class="facts">
        ${fact('Leeftijd', ageLabel(a.ageMin, a.ageMax))}
        ${fact('Tijd', `⏱ ${minutes(a.durationMinutes)}`, a.prepMinutes ? `+ ${minutes(a.prepMinutes)} klaarzetten` : 'niets klaarzetten')}
        ${fact('Rommel', messPill(a.mess), wetDirty)}
        ${fact('Toezicht', `${sup.emoji} ${esc(sup.label)}`)}
      </div>
      <div class="actions">
        <button class="btn btn-toggle" type="button" data-action="fav" data-id="${a.id}" aria-pressed="${fav}">${fav ? '❤️ Bewaard' : '🤍 Bewaar'}</button>
        <button class="btn" type="button" data-action="done" data-id="${a.id}">✅ Gedaan!</button>
        <button class="btn" type="button" data-action="share" data-id="${a.id}">${ICON.share.replace('<svg', '<svg width="18" height="18"')} Delen</button>
        <button class="btn btn-ghost" type="button" data-action="print">🖨️ Print</button>
      </div>
      ${done.length ? `<p class="hint">✓ ${done.length}× gedaan, laatst ${shortDate(done[done.length - 1])}.</p>` : ''}
    </header>
    <div class="learn-chips" aria-label="Wat leert je kind">${a.learn.map((l) => `<span class="learn-chip" title="${esc(LRN[l].desc)}">${LRN[l].emoji} ${esc(LRN[l].label)}</span>`).join('')}
      ${a.themes.map((t) => `<a class="learn-chip" href="#/" data-action="go-theme" data-theme="${t}">${THEME[t].emoji} ${esc(THEME[t].label)}</a>`).join('')}
    </div>
    <div class="detail-grid">
      <div class="detail-main">
        <section class="panel" style="--o:3">
          <h2><span class="ic" aria-hidden="true">📝</span> Zo doe je het</h2>
          <ol class="steps">${a.steps.map((st, i) => `<li data-action="step" data-id="${a.id}" data-i="${i}" role="checkbox" aria-checked="${steps.has(i)}" tabindex="0" class="${steps.has(i) ? 'is-done' : ''}">${esc(st)}</li>`).join('')}</ol>
          <p class="hint">Tik op een stap om hem af te vinken.</p>
        </section>
        <section class="panel" style="--o:5">
          <h2><span class="ic" aria-hidden="true">🌱</span> Makkelijker of moeilijker</h2>
          <div class="age-tips">
            <div class="age-tip"><h3>🐣 Makkelijker <span class="muted">(${a.ageMin} jaar)</span></h3><p>${esc(a.ageTips.young)}</p></div>
            <div class="age-tip"><h3>🚀 Uitdagender <span class="muted">(${a.ageMax} jaar)</span></h3><p>${esc(a.ageTips.old)}</p></div>
          </div>
        </section>
        <section class="panel" style="--o:6">
          <h2><span class="ic" aria-hidden="true">💬</span> Wat kun je zeggen?</h2>
          <div class="bubbles">${a.say.map((x) => `<p class="bubble">“${esc(x)}”</p>`).join('')}</div>
          <p class="subhead">Woordjes om te oefenen</p>
          <div class="words">${a.words.map((w) => `<span class="word">${esc(w)}</span>`).join('')}</div>
          <p class="hint"><a href="#/gids/praten">Meer over praten tijdens het knutselen →</a></p>
        </section>
        <section class="panel" style="--o:7">
          <h2><span class="ic" aria-hidden="true">💡</span> Handige tips</h2>
          <ul class="bullets">${a.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </section>
        <section class="panel" style="--o:8">
          <h2><span class="ic" aria-hidden="true">🌈</span> Meer inspiratie</h2>
          <ul class="inspo stack">${a.variations.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </section>
      </div>
      <aside class="detail-side">
        ${materialsPanel(a)}
        ${recipes.length ? `<section class="panel" style="--o:2"><h2><span class="ic" aria-hidden="true">🥣</span> Zelf maken</h2><div class="stack">${recipes.map((r) => `<a class="tile" href="#/recept/${r.id}"><span class="e">${r.emoji}</span><span><h3>${esc(r.title)}</h3><p>Recept · ${minutes(r.minutes)}</p></span></a>`).join('')}</div></section>` : ''}
        <section class="panel safety" style="--o:4">
          <h2><span class="ic" aria-hidden="true">⚠️</span> Let op</h2>
          <ul>${a.safety.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <p class="hint"><a href="#/gids/veiligheid">Meer over veilig knutselen →</a></p>
        </section>
      </aside>
    </div>
    <section class="section related" aria-labelledby="rel-title">
      <div class="section-title"><h2 id="rel-title">Dit vind je misschien ook leuk</h2></div>
      <div class="row-scroll">${related.map((x) => card(x, { compact: true })).join('')}</div>
    </section>
  </article>`;

  return { html, title: a.title, tab: 'ontdek', restoreScroll: false };
}

function materialsPanel(a) {
  const s = store.get();
  const inv = hasInventory(s);
  const miss = missingOf(a, s.have);
  let summary;
  if (!inv) summary = '<div class="mat-summary unknown">Tik op het vakje bij wat je in huis hebt. Dat onthouden we voor alle ideeën.</div>';
  else if (!miss.length) summary = '<div class="mat-summary ok">🎉 Je hebt alles in huis!</div>';
  else summary = `<div class="mat-summary miss"><span>Je mist ${plural(miss.length, 'ding', 'dingen')}</span><button class="btn btn-small btn-soft" type="button" data-action="shop-missing" data-id="${a.id}">🛒 Op mijn lijstje</button></div>`;
  const row = (m) => {
    const mat = MAT[m.id];
    if (!mat) return '';
    const have = mat.basic || !!s.have[m.id];
    const small = mat.small && a.ageMin < 3;
    const recipe = mat.recipe && REC[mat.recipe];
    const inShop = !!s.shop[m.id];
    const tags = [
      small ? '<span class="tag tag-warn">⚠️ klein: niet voor kinderen onder de 3</span>' : '',
      recipe ? `<a class="tag tag-recipe" href="#/recept/${recipe.id}">${recipe.emoji} zelf maken</a>` : '',
    ].join('');
    return `<li class="mat-row">
      ${mat.basic
        ? '<button class="mat-check" type="button" aria-pressed="true" disabled title="Heeft (bijna) iedereen">✓</button>'
        : `<button class="mat-check" type="button" data-action="have" data-mat="${m.id}" aria-pressed="${have}" aria-label="${esc(mat.label)}: in huis">✓</button>`}
      <div>
        <div class="mat-name">${esc(mat.label)}</div>
        ${m.note ? `<div class="mat-note">${esc(m.note)}</div>` : ''}
        ${!have && mat.alt ? `<div class="mat-alt">Niet in huis? Probeer ${esc(mat.alt)}.</div>` : ''}
        ${tags ? `<div class="mat-tags">${tags}</div>` : ''}
      </div>
      ${!have ? `<button class="shop-btn" type="button" data-action="shop" data-mat="${m.id}" aria-pressed="${inShop}">${inShop ? '✓ Op lijstje' : '+ Lijstje'}</button>` : '<span></span>'}
    </li>`;
  };
  return `<section class="panel" style="--o:1">
    <h2><span class="ic" aria-hidden="true">🧺</span> Wat heb je nodig?</h2>
    ${summary}
    <ul class="mat-list">${a.materials.map(row).join('')}</ul>
    ${a.optional?.length ? `<p class="optional-title">Handig, maar niet nodig</p><ul class="mat-list">${a.optional.map(row).join('')}</ul>` : ''}
  </section>`;
}

/* ================= Scherm: mijn spullen ================= */

let stockQuery = '';

function viewStock() {
  const s = store.get();
  const top = [...NON_BASIC].sort((x, y) => (USAGE[y.id] || 0) - (USAGE[x.id] || 0)).slice(0, 20);
  const matChip = (m) => `<button class="mat-chip" type="button" data-action="have" data-mat="${m.id}" data-label="${esc(normalize(m.label))}" aria-pressed="${!!s.have[m.id]}">${esc(m.label)} <span class="uses" title="Gebruikt in ${USAGE[m.id] || 0} ideeën">${USAGE[m.id] || 0}</span></button>`;
  const groups = MATERIAL_GROUPS.filter((g) => g.id !== 'basis').map((g) => {
    const items = NON_BASIC.filter((m) => m.group === g.id);
    return `<details class="group" data-group="${g.id}">
      <summary><span class="e" aria-hidden="true">${g.emoji}</span> ${esc(g.label)} <span class="muted"><span data-gcount="${g.id}">0</span>/${items.length}</span></summary>
      <div class="group-body">
        <div class="group-tools">
          <button class="btn btn-small" type="button" data-action="group-all" data-group="${g.id}">Alles aanvinken</button>
          <button class="btn btn-small btn-ghost" type="button" data-action="group-none" data-group="${g.id}">Niets</button>
        </div>
        <div class="chips">${items.map(matChip).join('')}</div>
      </div>
    </details>`;
  }).join('');
  const basics = MATERIALS.filter((m) => m.basic);

  const html = `
  <header class="page-head">
    <h1 tabindex="-1">Mijn spullen</h1>
    <p>Vink aan wat je wél in huis hebt; wat niet is aangevinkt, telt als ‘niet in huis’. Bij elk idee zie je dan meteen wat je mist (en wat je in plaats daarvan kunt gebruiken), en in Ontdek kies je voor ‘Kan meteen’.</p>
  </header>
  <div class="stock-stats">
    <div class="stat good"><div class="n" id="st-now">0</div><div class="l">ideeën kun je nu meteen doen</div></div>
    <div class="stat"><div class="n" id="st-one">0</div><div class="l">ideeën missen nog maar één ding</div></div>
  </div>
  <div class="progress" aria-hidden="true"><span id="st-bar" style="width:0%"></span></div>
  <p class="hint" id="st-have"></p>
  <section class="section">
    <div class="section-title"><h2>Snel aanvinken</h2><span class="muted">tik nog eens om uit te zetten</span></div>
    <div class="presets">${PRESETS.map((p) => `<button class="preset" type="button" data-action="preset" data-preset="${p.id}" aria-pressed="false"><span class="e" aria-hidden="true">${p.emoji}</span><span>${esc(p.label)}<small>${p.items.length} spullen</small></span></button>`).join('')}</div>
  </section>
  <section class="section">
    <div class="section-title"><h2>Alles per soort</h2><span class="muted">het getal = in hoeveel ideeën</span></div>
    <div class="search">${ICON.search}<label class="sr-only" for="mq">Zoek in spullen</label><input id="mq" type="search" placeholder="Zoek: tape, maizena, dozen…" value="${esc(stockQuery)}" autocomplete="off"></div>
    <details class="group" data-group="top" open>
      <summary><span class="e" aria-hidden="true">⭐</span> Meest gebruikt <span class="muted">top 20</span></summary>
      <div class="group-body"><div class="chips">${top.map(matChip).join('')}</div></div>
    </details>
    ${groups}
    <details class="group">
      <summary><span class="e" aria-hidden="true">🏠</span> Heeft (bijna) iedereen <span class="muted">telt altijd mee</span></summary>
      <div class="group-body"><p>Deze spullen tellen altijd als ‘in huis’: ${basics.map((m) => esc(m.label.toLowerCase())).join(', ')}.</p></div>
    </details>
  </section>
  <div class="btn-row section">
    <a class="btn btn-primary" href="#/" data-action="go-now">✅ Laat zien wat ik nu kan doen</a>
    <button class="btn btn-ghost" type="button" data-action="clear-have">Alles uitvinken</button>
  </div>`;

  function update() {
    const st = store.get();
    $$('[data-action="have"]', app).forEach((b) => b.setAttribute('aria-pressed', String(!!st.have[b.dataset.mat])));
    const haveN = NON_BASIC.filter((m) => st.have[m.id]).length;
    $('#st-now').textContent = ACTIVITIES.filter((a) => !missingOf(a, st.have).length).length;
    $('#st-one').textContent = ACTIVITIES.filter((a) => missingOf(a, st.have).length === 1).length;
    $('#st-bar').style.width = `${Math.round((haveN / NON_BASIC.length) * 100)}%`;
    $('#st-have').textContent = `${haveN} van ${NON_BASIC.length} spullen aangevinkt`;
    $$('[data-action="preset"]', app).forEach((b) => {
      const p = PRESETS.find((x) => x.id === b.dataset.preset);
      b.setAttribute('aria-pressed', String(p.items.every((id) => st.have[id])));
    });
    for (const g of MATERIAL_GROUPS) {
      const el = app.querySelector(`[data-gcount="${g.id}"]`);
      if (el) el.textContent = NON_BASIC.filter((m) => m.group === g.id && st.have[m.id]).length;
    }
  }

  function applyQuery() {
    const q = normalize(stockQuery);
    $$('.mat-chip', app).forEach((b) => { b.hidden = !!q && !b.dataset.label.includes(q); });
    $$('details.group[data-group]', app).forEach((d) => {
      if (q) {
        const any = $$('.mat-chip', d).some((b) => !b.hidden);
        d.hidden = !any;
        d.open = any && d.dataset.group !== 'top';
      } else {
        d.hidden = false;
      }
    });
  }

  return {
    html,
    title: 'Mijn spullen',
    tab: 'spullen',
    restoreScroll: true,
    mount() {
      const input = $('#mq');
      input.addEventListener('input', () => { stockQuery = input.value; applyQuery(); });
      applyQuery();
      update();
    },
    update,
  };
}

/* ================= Scherm: bewaard ================= */

function viewSaved(tab = 'favorieten') {
  const s = store.get();
  const favIds = Object.keys(s.favs).filter((id) => ACT[id]).sort((x, y) => s.favs[y] - s.favs[x]);
  const shopIds = Object.keys(s.shop).filter((id) => MAT[id]);
  const doneIds = Object.keys(s.done).filter((id) => ACT[id] && s.done[id].length);
  const shopN = shopIds.filter((id) => !s.shopDone[id]).length + s.custom.filter((c) => !c.done).length;
  const seg = (id, label, n) => `<a href="#/bewaard/${id}" aria-current="${tab === id ? 'page' : 'false'}">${label}${n ? ` (${n})` : ''}</a>`;

  let body = '';
  if (tab === 'favorieten') {
    const favMissing = new Set(favIds.flatMap((id) => missingOf(ACT[id], s.have).map((m) => m.id)));
    body = favIds.length
      ? `${favMissing.size && hasInventory(s) ? `<div class="btn-row" style="margin-bottom:14px"><button class="btn btn-soft" type="button" data-action="shop-favs">🛒 Zet wat ik mis op mijn lijstje (${favMissing.size})</button></div>` : ''}
         <div class="grid">${favIds.map((id) => card(ACT[id])).join('')}</div>`
      : emptyBox('🤍', 'Nog niets bewaard', 'Tik op het hartje bij een idee om het hier te bewaren. Handig voor een regenachtige middag!', '<a class="btn btn-primary" href="#/">Ideeën ontdekken</a>');
  } else if (tab === 'lijstje') {
    const neededFor = (mid) => favIds.filter((id) => ACT[id].materials.some((m) => m.id === mid)).map((id) => ACT[id].title);
    const items = shopIds.sort((x, y) => s.shop[x] - s.shop[y]).map((mid) => {
      const done = !!s.shopDone[mid];
      const used = neededFor(mid);
      return `<li class="shop-item${done ? ' is-done' : ''}">
        <button class="mat-check" type="button" data-action="shop-toggle" data-mat="${mid}" aria-pressed="${done}" aria-label="${esc(MAT[mid].label)} afstrepen">✓</button>
        <div><div class="name mat-name">${esc(MAT[mid].label)}</div><div class="for">${used.length ? `Voor: ${esc(used.slice(0, 3).join(', '))}${used.length > 3 ? '…' : ''}` : `Gebruikt in ${plural(USAGE[mid] || 0, 'idee', 'ideeën')}`}</div></div>
        <div class="btn-row">${done ? `<button class="btn btn-small btn-soft" type="button" data-action="shop-bought" data-mat="${mid}">In huis</button>` : ''}<button class="btn btn-small btn-ghost" type="button" data-action="shop-remove" data-mat="${mid}" aria-label="Verwijder ${esc(MAT[mid].label)}">✕</button></div>
      </li>`;
    });
    const custom = s.custom.map((c) => `<li class="shop-item${c.done ? ' is-done' : ''}">
        <button class="mat-check" type="button" data-action="custom-toggle" data-cid="${c.id}" aria-pressed="${!!c.done}" aria-label="${esc(c.text)} afstrepen">✓</button>
        <div><div class="name mat-name">${esc(c.text)}</div><div class="for">Zelf toegevoegd</div></div>
        <button class="btn btn-small btn-ghost" type="button" data-action="custom-remove" data-cid="${c.id}" aria-label="Verwijder ${esc(c.text)}">✕</button>
      </li>`);
    const all = [...items, ...custom];
    body = `
      ${all.length ? `<ul class="shop-list">${all.join('')}</ul>` : emptyBox('🛒', 'Je lijstje is leeg', 'Bij elk idee kun je ontbrekende spullen met één tik op je boodschappenlijstje zetten.')}
      <form class="add-form" data-form="custom"><label class="sr-only" for="custom-text">Zelf iets toevoegen</label><input id="custom-text" placeholder="Zelf iets toevoegen…" autocomplete="off" maxlength="80"><button class="btn btn-primary" type="submit">Voeg toe</button></form>
      ${all.length ? `<div class="btn-row section"><button class="btn" type="button" data-action="shop-share">📤 Deel lijstje</button><button class="btn btn-ghost" type="button" data-action="shop-clear-done">Afgestreepte weghalen</button></div>
      <p class="hint">Tip: streep iets af als je het gekocht hebt en tik op ‘In huis’, dan staat het meteen bij Mijn spullen.</p>` : ''}`;
  } else {
    const sorted = doneIds.sort((x, y) => s.done[y].at(-1) - s.done[x].at(-1));
    const total = sorted.reduce((n, id) => n + s.done[id].length, 0);
    body = sorted.length
      ? `<div class="celebrate">🎉 Jullie hebben al ${plural(sorted.length, 'idee', 'verschillende ideeën')} gedaan${total > sorted.length ? ` (${total} keer geknutseld)` : ''}. Goed bezig!</div>
         <ul class="done-list">${sorted.map((id) => {
           const a = ACT[id];
           const n = s.done[id].length;
           return `<li class="done-item" style="--cat:var(--c-${a.category})"><span class="e" aria-hidden="true">${a.emoji}</span><div style="flex:1;min-width:0"><a href="#/idee/${id}">${esc(a.title)}</a><div class="when">${n > 1 ? `${n}× · ` : ''}laatst ${shortDate(s.done[id].at(-1))}</div></div><button class="btn btn-small btn-ghost" type="button" data-action="undo-done" data-id="${id}" aria-label="Laatste keer weghalen">↶</button></li>`;
         }).join('')}</ul>`
      : emptyBox('✅', 'Nog niets gedaan', 'Tik na het knutselen op ‘Gedaan!’ bij een idee. Zo zie je hier wat jullie allemaal al gemaakt hebben.', '<a class="btn btn-primary" href="#/">Iets kiezen</a>');
  }

  const html = `
  <header class="page-head"><h1 tabindex="-1">Bewaard</h1><p>Je favorieten, je boodschappenlijstje en alles wat jullie al gedaan hebben.</p></header>
  <nav class="segments" aria-label="Bewaard">${seg('favorieten', '❤️ Favorieten', favIds.length)}${seg('lijstje', '🛒 Lijstje', shopN)}${seg('gedaan', '✅ Gedaan', doneIds.length)}</nav>
  <div class="section">${body}</div>`;

  return {
    html,
    title: 'Bewaard',
    tab: 'bewaard',
    restoreScroll: true,
    mount() {
      const form = app.querySelector('[data-form="custom"]');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('#custom-text');
        const text = input.value.trim();
        if (!text) return;
        store.set((st) => ({ custom: [...st.custom, { id: Date.now().toString(36), text, done: false }] }));
        setTimeout(() => $('#custom-text')?.focus(), 0);
      });
    },
  };
}

/* ================= Scherm: recepten ================= */

function viewRecipes() {
  const html = `
  <header class="page-head"><h1 tabindex="-1">Recepten</h1><p>Zelf deeg, verf en schuim maken met spullen uit de keuken. Goedkoop, en vaak al een activiteit op zich.</p></header>
  <div class="tile-grid">${RECIPES.map((r) => `<a class="tile" href="#/recept/${r.id}"><span class="e" aria-hidden="true">${r.emoji}</span><span><h3>${esc(r.title)}</h3><p>⏱ ${minutes(r.minutes)} · meehelpen vanaf ${r.ageMin} jaar</p></span></a>`).join('')}</div>`;
  return { html, title: 'Recepten', tab: 'recepten', restoreScroll: true };
}

function viewRecipe(id) {
  const r = REC[id];
  if (!r) return viewNotFound();
  const s = store.get();
  const inv = hasInventory(s);
  const uses = RECIPE_USES[r.id] || [];
  const ing = r.ingredients.map((i) => {
    const mat = i.mat && MAT[i.mat];
    let st = '<span class="st">•</span>';
    if (mat && (mat.basic || s.have[i.mat])) st = '<span class="st ok" title="In huis">✓</span>';
    else if (mat && inv) st = '<span class="st no" title="Niet in huis">✗</span>';
    return `<li>${st}<span>${esc(i.text)}</span></li>`;
  }).join('');
  const html = `
  <button class="btn btn-ghost back" type="button" data-action="back">${ICON.back} Terug</button>
  <article class="detail" style="--cat:var(--c-deeg)">
    <header class="detail-hero">
      <span class="detail-emoji" aria-hidden="true">${r.emoji}</span>
      <p class="detail-cat">🥣 Recept</p>
      <h1 tabindex="-1">${esc(r.title)}</h1>
      <p class="lead">${esc(r.intro)}</p>
      <div class="facts">
        <div class="fact"><span class="k">Tijd</span><span class="v">⏱ ${minutes(r.minutes)}</span></div>
        <div class="fact"><span class="k">Meehelpen</span><span class="v">vanaf ${r.ageMin} jaar</span></div>
        <div class="fact"><span class="k">Je maakt</span><span class="v">${esc(r.yield)}</span></div>
        <div class="fact"><span class="k">Bewaren</span><span class="v" style="font-weight:750;font-size:.92rem">${esc(r.keeps)}</span></div>
      </div>
      <div class="actions"><button class="btn btn-ghost" type="button" data-action="print">🖨️ Print</button></div>
    </header>
    <div class="detail-grid">
      <div class="detail-main">
        <section class="panel" style="--o:2"><h2><span class="ic" aria-hidden="true">📝</span> Zo maak je het</h2>
          <ol class="steps">${r.steps.map((st, i) => `<li data-action="step" data-id="recept-${r.id}" data-i="${i}" role="checkbox" aria-checked="false" tabindex="0">${esc(st)}</li>`).join('')}</ol>
        </section>
        ${r.tips?.length ? `<section class="panel" style="--o:4"><h2><span class="ic" aria-hidden="true">💡</span> Tips</h2><ul class="bullets">${r.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>` : ''}
      </div>
      <aside class="detail-side">
        <section class="panel" style="--o:1"><h2><span class="ic" aria-hidden="true">🧺</span> Je hebt nodig</h2><ul class="ingredients">${ing}</ul></section>
        <section class="panel safety" style="--o:3"><h2><span class="ic" aria-hidden="true">⚠️</span> Let op</h2><ul>${r.safety.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      </aside>
    </div>
    ${uses.length ? `<section class="section related"><div class="section-title"><h2>Hier gebruik je het voor</h2></div><div class="row-scroll">${uses.slice(0, 12).map((a) => card(a, { compact: true })).join('')}</div></section>` : ''}
  </article>`;
  return { html, title: r.title, tab: 'recepten', restoreScroll: false };
}

/* ================= Scherm: gids ================= */

function viewGuide() {
  const html = `
  <header class="page-head"><h1 tabindex="-1">Gids</h1><p>Achtergrond en tips: veilig knutselen, wat je kunt zeggen, wat je per leeftijd kunt verwachten en hoe je de rommel de baas blijft.</p></header>
  <div class="tile-grid">${GUIDE.map((g) => `<a class="tile" href="#/gids/${g.id}"><span class="e" aria-hidden="true">${g.emoji}</span><span><h3>${esc(g.title)}</h3><p>${esc(g.intro.split('. ')[0])}.</p></span></a>`).join('')}</div>
  <section class="section panel">
    <h2>🎨 Weergave</h2>
    <p class="muted" style="margin-bottom:10px">Licht, donker of automatisch (volgt je telefoon).</p>
    <div class="chips" role="group" aria-label="Weergave">
      ${[['auto', '🌗 Automatisch'], ['light', '☀️ Licht'], ['dark', '🌙 Donker']].map(([v, l]) => `<button class="chip" type="button" data-action="set-theme" data-value="${v}" aria-pressed="${store.get().theme === v}">${l}</button>`).join('')}
    </div>
  </section>`;
  return { html, title: 'Gids', tab: 'gids', restoreScroll: true };
}

function viewGuideSection(id) {
  const g = GUIDE_BY[id];
  if (!g) return viewNotFound();
  const block = (b) => {
    const title = b.title ? `<h2 class="subhead" style="font-size:.95rem;margin:4px 0 10px">${esc(b.title)}</h2>` : '';
    switch (b.type) {
      case 'p': return `<p>${md(b.text)}</p>`;
      case 'list': return `${title}<ul class="bullets">${b.items.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
      case 'compare': return `${title}<div class="compare">${b.items.map((x) => `<div class="compare-item"><span class="instead">${esc(x.instead)}</span><span class="try">💬 ${esc(x.try)}</span><span class="why">${esc(x.why)}</span></div>`).join('')}</div>`;
      case 'ages': return `${title}<div class="ages-list">${b.items.map((x) => `<div class="age-item"><span class="a">${esc(x.age)}</span><p>${md(x.text)}</p></div>`).join('')}</div>`;
      case 'tip': return `<div class="tipbox"><span aria-hidden="true">💡</span><p>${md(b.text)}</p></div>`;
      default: return '';
    }
  };
  const idx = GUIDE.indexOf(g);
  const next = GUIDE[idx + 1];
  const html = `
  <button class="btn btn-ghost back" type="button" data-action="back">${ICON.back} Terug</button>
  <header class="page-head"><h1 tabindex="-1">${g.emoji} ${esc(g.title)}</h1><p>${esc(g.intro)}</p></header>
  <div class="stack">${g.blocks.map((b) => `<section class="panel">${block(b)}</section>`).join('')}</div>
  ${next ? `<div class="section"><a class="tile" href="#/gids/${next.id}"><span class="e" aria-hidden="true">${next.emoji}</span><span><p class="muted">Volgende</p><h3>${esc(next.title)}</h3></span></a></div>` : ''}
  ${id === 'over' ? `<p class="footer-note">${ACTIVITIES.length} ideeën · ${RECIPES.length} recepten · ${NON_BASIC.length} soorten spullen<br><a href="https://github.com/constantdynamics/groteknut">Broncode op GitHub</a></p>` : ''}`;
  return { html, title: g.title, tab: 'gids', restoreScroll: false };
}

function viewNotFound() {
  return {
    html: emptyBox('🧐', 'Deze pagina bestaat niet (meer)', 'Misschien is het idee verhuisd. Kijk even in Ontdek.', '<a class="btn btn-primary" href="#/">Naar Ontdek</a>'),
    title: 'Niet gevonden',
    tab: 'ontdek',
  };
}

/* ================= Router ================= */

const app = document.getElementById('app');
const ROUTES = [
  [/^#?\/?$/, viewDiscover],
  [/^#\/spullen\/?$/, viewStock],
  [/^#\/bewaard\/?$/, () => viewSaved('favorieten')],
  [/^#\/bewaard\/(favorieten|lijstje|gedaan)$/, viewSaved],
  [/^#\/recepten\/?$/, viewRecipes],
  [/^#\/recept\/([\w-]+)$/, viewRecipe],
  [/^#\/gids\/?$/, viewGuide],
  [/^#\/gids\/([\w-]+)$/, viewGuideSection],
  [/^#\/idee\/([\w-]+)$/, viewActivity],
];
let current = null;
let depth = 0;
const scrollMemo = {};

function resolve(hash) {
  for (const [re, fn] of ROUTES) {
    const m = hash.match(re);
    if (m) return { fn, params: m.slice(1) };
  }
  return { fn: viewNotFound, params: [] };
}

function render(view) {
  app.innerHTML = view.html;
  view.mount?.();
}

function route() {
  const hash = location.hash || '#/';
  if (current) scrollMemo[current.hash] = window.scrollY;
  closeModal();
  const { fn, params } = resolve(hash);
  const view = fn(...params);
  current = { hash, fn, params, ...view };
  render(view);
  document.title = view.title ? `${view.title} · Groteknut` : 'Groteknut · knutselideeën voor 1 t/m 5 jaar';
  setActiveTab(view.tab);
  window.scrollTo(0, view.restoreScroll ? scrollMemo[hash] || 0 : 0);
  if (depth++ > 0) app.querySelector('h1')?.focus({ preventScroll: true });
}

function rerender() {
  if (!current) return;
  const y = window.scrollY;
  const active = document.activeElement;
  const key = active && active !== document.body ? focusKey(active) : null;
  const view = current.fn(...current.params);
  current = { ...current, ...view };
  render(view);
  window.scrollTo(0, y);
  if (key) app.querySelector(key)?.focus({ preventScroll: true });
}

function focusKey(el) {
  const d = el.dataset || {};
  if (!d.action) return el.id ? `#${CSS.escape(el.id)}` : null;
  let sel = `[data-action="${d.action}"]`;
  for (const k of ['id', 'mat', 'key', 'value', 'preset', 'group', 'i', 'cid']) if (d[k] !== undefined) sel += `[data-${k}="${CSS.escape(d[k])}"]`;
  return sel;
}

function setActiveTab(tab) {
  $$('[data-tab]').forEach((a) => a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false'));
}

function updateBadges() {
  const s = store.get();
  const n = Object.keys(s.favs).filter((id) => ACT[id]).length;
  $$('[data-tab="bewaard"]').forEach((a) => {
    let b = a.querySelector('.tab-count');
    if (!a.closest('.tabbar')) return;
    if (!n) { b?.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'tab-count'; a.appendChild(b); }
    b.textContent = n > 99 ? '99+' : n;
  });
}

store.subscribe(() => {
  const active = document.activeElement;
  const key = active && active !== document.body && app.contains(active) ? focusKey(active) : null;
  if (current?.update) current.update();
  else rerender();
  if (key && !app.contains(document.activeElement)) app.querySelector(key)?.focus({ preventScroll: true });
  updateBadges();
});

/* ================= Acties ================= */

const ACTIONS = {
  filter: (el) => applyFilter(el.dataset.key, el.dataset.value),
  'toggle-more': () => store.set({ moreOpen: !store.get().moreOpen }),
  'reset-filters': () => {
    store.set({ ...DEFAULT_FILTERS, sort: store.get().sort, moreOpen: store.get().moreOpen });
    const q = $('#q');
    if (q) q.value = '';
  },
  'clear-q': () => {
    const q = $('#q');
    if (q) { q.value = ''; q.focus(); }
    store.set({ q: '' });
  },
  'dismiss-welcome': () => store.set({ welcomed: true }),
  surprise: () => openSurprise(),
  fav: (el) => {
    const id = el.dataset.id;
    const favs = { ...store.get().favs };
    const on = !favs[id];
    if (on) favs[id] = Date.now(); else delete favs[id];
    store.set({ favs });
    const btn = app.querySelector(focusKey(el)) || el;
    btn.classList?.add('pop');
    toast(on ? '❤️ Bewaard bij je favorieten' : 'Uit je favorieten gehaald');
  },
  done: (el) => {
    const id = el.dataset.id;
    const done = { ...store.get().done };
    done[id] = [...(done[id] || []), Date.now()];
    store.set({ done, welcomed: true });
    confetti();
    toast('🎉 Goed gedaan! Bewaard bij ‘Gedaan’.', { action: 'Ongedaan', onAction: () => undoDone(id) });
  },
  'undo-done': (el) => undoDone(el.dataset.id),
  share: (el) => shareActivity(el.dataset.id),
  print: () => window.print(),
  back: () => {
    if (depth > 1 && history.length > 1) history.back();
    else location.hash = '#/';
  },
  have: (el) => {
    const id = el.dataset.mat;
    const have = { ...store.get().have };
    if (have[id]) delete have[id]; else have[id] = true;
    store.set({ have });
  },
  shop: (el) => {
    const id = el.dataset.mat;
    const shop = { ...store.get().shop };
    const on = !shop[id];
    if (on) shop[id] = Date.now(); else delete shop[id];
    store.set({ shop });
    toast(on ? `🛒 ${shortLabel(id)} staat op je lijstje` : 'Van je lijstje gehaald');
  },
  'shop-missing': (el) => {
    const a = ACT[el.dataset.id];
    const shop = { ...store.get().shop };
    const miss = missingOf(a);
    miss.forEach((m) => { shop[m.id] ||= Date.now(); });
    store.set({ shop });
    toast(`🛒 ${plural(miss.length, 'ding', 'dingen')} op je lijstje`, { action: 'Bekijk', onAction: () => { location.hash = '#/bewaard/lijstje'; } });
  },
  'shop-favs': () => {
    const s = store.get();
    const shop = { ...s.shop };
    let n = 0;
    Object.keys(s.favs).filter((id) => ACT[id]).forEach((id) => missingOf(ACT[id], s.have).forEach((m) => { if (!shop[m.id]) { shop[m.id] = Date.now(); n++; } }));
    store.set({ shop });
    toast(n ? `🛒 ${plural(n, 'ding', 'dingen')} toegevoegd` : 'Alles stond al op je lijstje', { action: 'Bekijk', onAction: () => { location.hash = '#/bewaard/lijstje'; } });
  },
  'shop-toggle': (el) => {
    const id = el.dataset.mat;
    const shopDone = { ...store.get().shopDone };
    if (shopDone[id]) delete shopDone[id]; else shopDone[id] = true;
    store.set({ shopDone });
  },
  'shop-bought': (el) => {
    const id = el.dataset.mat;
    const s = store.get();
    const shop = { ...s.shop };
    const shopDone = { ...s.shopDone };
    delete shop[id];
    delete shopDone[id];
    store.set({ shop, shopDone, have: { ...s.have, [id]: true } });
    toast(`✓ ${shortLabel(id)} staat nu bij Mijn spullen`);
  },
  'shop-remove': (el) => {
    const id = el.dataset.mat;
    const s = store.get();
    const shop = { ...s.shop };
    const shopDone = { ...s.shopDone };
    delete shop[id];
    delete shopDone[id];
    store.set({ shop, shopDone });
  },
  'custom-toggle': (el) => store.set((s) => ({ custom: s.custom.map((c) => (c.id === el.dataset.cid ? { ...c, done: !c.done } : c)) })),
  'custom-remove': (el) => store.set((s) => ({ custom: s.custom.filter((c) => c.id !== el.dataset.cid) })),
  'shop-clear-done': () => {
    const s = store.get();
    const shop = { ...s.shop };
    Object.keys(s.shopDone).forEach((id) => delete shop[id]);
    store.set({ shop, shopDone: {}, custom: s.custom.filter((c) => !c.done) });
  },
  'shop-share': async () => {
    const s = store.get();
    const lines = [
      ...Object.keys(s.shop).filter((id) => MAT[id] && !s.shopDone[id]).map((id) => `• ${MAT[id].label}`),
      ...s.custom.filter((c) => !c.done).map((c) => `• ${c.text}`),
    ];
    const text = `🛒 Knutsel-boodschappen\n${lines.join('\n')}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Knutsel-boodschappen', text }); } catch { /* geannuleerd */ }
      return;
    }
    copyText(text, 'Lijstje gekopieerd 📋');
  },
  step: (el) => toggleStep(el),
  'go-theme': (el, e) => {
    e.preventDefault();
    store.set({ ...DEFAULT_FILTERS, themes: [el.dataset.theme], moreOpen: true, sort: store.get().sort });
    location.hash = '#/';
  },
  'go-now': (el, e) => {
    e.preventDefault();
    store.set({ stock: 'now' });
    location.hash = '#/';
  },
  preset: (el) => {
    const p = PRESETS.find((x) => x.id === el.dataset.preset);
    const have = { ...store.get().have };
    const all = p.items.every((id) => have[id]);
    p.items.forEach((id) => { if (all) delete have[id]; else have[id] = true; });
    store.set({ have });
    toast(all ? `${p.label} uitgevinkt` : `✓ ${p.label} aangevinkt`);
  },
  'group-all': (el) => {
    const have = { ...store.get().have };
    NON_BASIC.filter((m) => m.group === el.dataset.group).forEach((m) => { have[m.id] = true; });
    store.set({ have });
  },
  'group-none': (el) => {
    const have = { ...store.get().have };
    NON_BASIC.filter((m) => m.group === el.dataset.group).forEach((m) => delete have[m.id]);
    store.set({ have });
  },
  'clear-have': () => {
    if (confirm('Weet je zeker dat je alle spullen wilt uitvinken?')) store.set({ have: {} });
  },
  theme: () => {
    const order = ['auto', 'light', 'dark'];
    setTheme(order[(order.indexOf(store.get().theme) + 1) % order.length]);
  },
  'set-theme': (el) => setTheme(el.dataset.value),
  install: async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
    $('#install')?.classList.remove('is-visible');
  },
  'modal-close': () => closeModal(),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el, e);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  const el = e.target.closest?.('[data-action="step"]');
  if (el && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    toggleStep(el);
  }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-change="sort"]')) store.set({ sort: e.target.value });
});

function toggleStep(el) {
  const set = (stepState[el.dataset.id] ||= new Set());
  const i = Number(el.dataset.i);
  if (set.has(i)) set.delete(i); else set.add(i);
  el.classList.toggle('is-done', set.has(i));
  el.setAttribute('aria-checked', String(set.has(i)));
}

function undoDone(id) {
  const done = { ...store.get().done };
  const list = [...(done[id] || [])];
  list.pop();
  if (list.length) done[id] = list; else delete done[id];
  store.set({ done });
}

/* ================= Delen, toast, modal, confetti ================= */

async function copyText(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    window.prompt('Kopieer de tekst:', text);
  }
}

async function shareActivity(id) {
  const a = ACT[id];
  const url = `${location.origin}${location.pathname}#/idee/${id}`;
  const text = `${a.emoji} ${a.title}: ${a.summary}`;
  if (navigator.share) {
    try { await navigator.share({ title: a.title, text, url }); } catch { /* geannuleerd */ }
    return;
  }
  copyText(`${text}\n${url}`, 'Link gekopieerd 📋');
}

let toastTimer;
function toast(msg, { action, onAction, ms = 2800 } = {}) {
  const wrap = $('#toasts');
  if (!wrap) return;
  wrap.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}</div>`;
  const btn = wrap.querySelector('button');
  if (btn) btn.addEventListener('click', () => { wrap.innerHTML = ''; onAction?.(); });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { wrap.innerHTML = ''; }, action ? ms + 1800 : ms);
}

let lastSurprise = null;
function openSurprise() {
  const s = store.get();
  const list = ACTIVITIES.filter((a) => matches(a, s));
  if (!list.length) {
    toast('Geen ideeën met deze filters. Zet er een paar uit.');
    return;
  }
  let pick = list[Math.floor(Math.random() * list.length)];
  if (list.length > 1) while (pick.id === lastSurprise) pick = list[Math.floor(Math.random() * list.length)];
  lastSurprise = pick.id;
  showModal(`
    <h2 id="modal-title"><span class="dice roll" aria-hidden="true">🎲</span> Wat dacht je hiervan?</h2>
    ${card(pick)}
    <div class="btn-row">
      <button class="btn" type="button" data-action="surprise">Nog eens</button>
      <a class="btn btn-primary" href="#/idee/${pick.id}">Doen we!</a>
    </div>`);
}

function showModal(inner) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.id = 'modal';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${inner}</div>`;
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeModal(); });
  document.body.appendChild(wrap);
  wrap.querySelector('.btn-primary, button')?.focus();
}

function closeModal() {
  $('#modal')?.remove();
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ff6f4f', '#ffc23d', '#4cb8e8', '#7ccf5a', '#b77cf2', '#ff8fb1'];
  for (let i = 0; i < 40; i++) {
    const d = document.createElement('i');
    d.className = 'confetti';
    d.style.left = `${Math.random() * 100}vw`;
    d.style.background = colors[i % colors.length];
    d.style.setProperty('--dx', `${Math.random() * 160 - 80}px`);
    d.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    d.style.animationDuration = `${1.3 + Math.random() * 1.3}s`;
    d.style.animationDelay = `${Math.random() * 0.25}s`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3200);
  }
}

/* ================= Thema, installeren, offline ================= */

function setTheme(t) {
  store.set({ theme: t });
  applyTheme(t);
}

function applyTheme(t) {
  const root = document.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
  const btn = $('#theme-btn');
  if (btn) {
    btn.textContent = t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '🌗';
    btn.setAttribute('aria-label', `Weergave: ${t === 'dark' ? 'donker' : t === 'light' ? 'licht' : 'automatisch'}. Tik om te wisselen.`);
  }
}

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  $('#install')?.classList.add('is-visible');
});

window.addEventListener('scroll', () => {
  $('.topbar')?.classList.toggle('is-scrolled', window.scrollY > 4);
}, { passive: true });

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

/* ================= Start ================= */

applyTheme(store.get().theme);
window.addEventListener('hashchange', route);
route();
updateBadges();
