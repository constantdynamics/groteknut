#!/usr/bin/env node
// Controleert knutselideeën op structuur, verwijzingen en een paar veiligheidsregels.
// Gebruik:  node tools/validate.mjs [bestand.json ...]
// Zonder argumenten wordt js/data/activities.js gecontroleerd.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { CATEGORIES, THEMES, LEARN, PLACES, LONG_PLAY } = await import(pathToFileURL(resolve(root, 'js/data/meta.js')));
const { MATERIALS } = await import(pathToFileURL(resolve(root, 'js/data/materials.js')));

const catIds = new Set(CATEGORIES.map((c) => c.id));
const themeIds = new Set(THEMES.map((t) => t.id));
const learnIds = new Set(LEARN.map((l) => l.id));
const placeIds = new Set(PLACES.map((p) => p.id));
const matById = new Map(MATERIALS.map((m) => [m.id, m]));

const ALLOWED_KEYS = new Set([
  'id', 'title', 'emoji', 'category', 'summary', 'ageMin', 'ageMax', 'mess', 'wet', 'dirty',
  'prepMinutes', 'duration', 'supervision', 'soloFrom', 'cleanupMinutes', 'noise', 'energy', 'places',
  'materials', 'optional', 'steps', 'ageTips', 'safety', 'say', 'words', 'learn', 'tips', 'extenders',
  'variations', 'themes', 'canStay', 'stayTips', 'pinQuery', 'roles',
]);

const isStr = (v, max = 10000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const strArr = (v, min, max, maxLen = 400) => Array.isArray(v) && v.length >= min && v.length <= max && v.every((s) => isStr(s, maxLen));

// Speeltijd op een bepaalde leeftijd (lineair tussen ageMin en ageMax).
export function durAt(a, age) {
  const [d0, d1] = a.duration;
  if (a.ageMax === a.ageMin) return d0;
  const t = (Math.min(Math.max(age, a.ageMin), a.ageMax) - a.ageMin) / (a.ageMax - a.ageMin);
  return Math.round((d0 + (d1 - d0) * t) / 5) * 5;
}

// Is dit idee ‘lang zoet’ over de hele leeftijdsrange?
export const isLongPlay = (a) => a.duration[0] >= LONG_PLAY[a.ageMin] && a.duration[1] >= LONG_PLAY[a.ageMax];

export function validateList(list, { file = 'lijst', seen = new Map() } = {}) {
  const errors = [];
  const warnings = [];
  for (const a of list) {
    const where = `${file} › ${a?.id ?? '(geen id)'}`;
    const err = (msg) => errors.push(`✖ ${where}: ${msg}`);
    const warn = (msg) => warnings.push(`⚠ ${where}: ${msg}`);

    if (!a || typeof a !== 'object') { err('geen object'); continue; }
    for (const k of Object.keys(a)) if (!ALLOWED_KEYS.has(k)) warn(`onbekend veld "${k}"`);

    if (!isStr(a.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.id)) err('id moet kebab-case zijn');
    if (seen.has(a.id)) err(`dubbel id (ook in ${seen.get(a.id)})`); else seen.set(a.id, file);
    if (!isStr(a.title, 70)) err('title ontbreekt of is langer dan 70 tekens');
    if (!isStr(a.emoji, 16)) err('emoji ontbreekt');
    if (!catIds.has(a.category)) err(`onbekende category "${a.category}"`);
    if (!isStr(a.summary, 220)) err('summary ontbreekt of is langer dan 220 tekens');
    if (!isInt(a.ageMin, 1, 5) || !isInt(a.ageMax, 1, 5) || a.ageMin > a.ageMax) err('ageMin/ageMax moeten 1-5 zijn en min ≤ max');
    if (!isInt(a.mess, 1, 3)) err('mess moet 1, 2 of 3 zijn');
    if (typeof a.wet !== 'boolean') err('wet moet true/false zijn');
    if (typeof a.dirty !== 'boolean') err('dirty moet true/false zijn');
    if (!isInt(a.prepMinutes, 0, 120)) err('prepMinutes moet 0-120 zijn');
    if (!Array.isArray(a.duration) || a.duration.length !== 2 || !isInt(a.duration[0], 5, 240) || !isInt(a.duration[1], 5, 240) || a.duration[1] < a.duration[0]) {
      err('duration moet [minuten bij ageMin, minuten bij ageMax] zijn (5-240, tweede ≥ eerste)');
    } else if (a.ageMin === a.ageMax && a.duration[0] !== a.duration[1]) warn('duration: bij één leeftijd twee keer hetzelfde getal');
    if (!isInt(a.supervision, 1, 3)) err('supervision moet 1, 2 of 3 zijn');
    if (!(a.soloFrom === null || (isInt(a.soloFrom, 1, 5) && a.soloFrom >= a.ageMin && a.soloFrom <= a.ageMax))) err('soloFrom moet null zijn of een leeftijd binnen ageMin-ageMax');
    if (!isInt(a.cleanupMinutes, 0, 60)) err('cleanupMinutes moet 0-60 zijn');
    if (!isInt(a.noise, 1, 3)) err('noise moet 1, 2 of 3 zijn');
    if (!isInt(a.energy, 1, 3)) err('energy moet 1, 2 of 3 zijn');
    if (!Array.isArray(a.places) || a.places.length < 1 || a.places.length > 3 || !a.places.every((p) => placeIds.has(p))) err(`places: 1-3 van ${[...placeIds].join(', ')}`);

    const checkMats = (arr, name, min) => {
      if (!Array.isArray(arr) || arr.length < min) { err(`${name} moet een array zijn (min. ${min})`); return []; }
      const ids = [];
      for (const m of arr) {
        if (!m || typeof m !== 'object' || !isStr(m.id)) { err(`${name}: item zonder id`); continue; }
        if (!matById.has(m.id)) err(`${name}: onbekend materiaal "${m.id}"`);
        if (m.note !== undefined && !isStr(m.note, 120)) err(`${name}: note van "${m.id}" is leeg of te lang (max 120)`);
        for (const k of Object.keys(m)) if (k !== 'id' && k !== 'note') warn(`${name}: onbekend veld "${k}" bij ${m.id}`);
        ids.push(m.id);
      }
      return ids;
    };
    const req = checkMats(a.materials, 'materials', 1);
    const opt = checkMats(a.optional ?? [], 'optional', 0);
    const all = [...req, ...opt];
    const dup = all.filter((id, i) => all.indexOf(id) !== i);
    if (dup.length) err(`materiaal dubbel genoemd: ${[...new Set(dup)].join(', ')}`);

    if (!strArr(a.steps, 3, 9, 320)) err('steps: 3-9 stappen, elk max 320 tekens');
    if (!a.ageTips || !isStr(a.ageTips.young, 320) || !isStr(a.ageTips.old, 320)) err('ageTips.young en ageTips.old zijn verplicht (max 320 tekens)');
    if (!strArr(a.safety, 1, 5, 320)) err('safety: 1-5 punten, elk max 320 tekens');
    if (!strArr(a.say, 3, 6, 200)) err('say: 3-6 zinnen, elk max 200 tekens');
    if (!strArr(a.words, 3, 10, 40)) err('words: 3-10 woorden, elk max 40 tekens');
    if (!Array.isArray(a.learn) || a.learn.length < 1 || a.learn.length > 4 || !a.learn.every((l) => learnIds.has(l))) err('learn: 1-4 geldige ids');
    if (!strArr(a.tips, 1, 4, 320)) err('tips: 1-4 tips, elk max 320 tekens');
    if (!strArr(a.extenders, 2, 5, 320)) err('extenders: 2-5 verlengers, elk max 320 tekens');
    if (!strArr(a.variations, 2, 5, 320)) err('variations: 2-5 ideeën, elk max 320 tekens');
    if (!Array.isArray(a.themes) || !a.themes.every((t) => themeIds.has(t))) err('themes: alleen geldige thema-ids');
    if (typeof a.canStay !== 'boolean') err('canStay moet true/false zijn');
    if (a.canStay && !isStr(a.stayTips, 400)) err('stayTips is verplicht als canStay true is (max 400 tekens)');
    if (!a.canStay && a.stayTips !== undefined) warn('stayTips zonder canStay');
    if (!isStr(a.pinQuery, 60)) err('pinQuery ontbreekt (max 60 tekens)');
    if (a.roles !== undefined) {
      if (!a.roles || !isStr(a.roles.young, 320) || !isStr(a.roles.old, 320)) err('roles: { young, old } met elk max 320 tekens');
      if (a.ageMin > 2 || a.ageMax < 4) warn('roles (broertjes en zusjes) hoort bij een leeftijdsrange van ≤ 2 tot ≥ 4 jaar');
    }

    // Inhoudelijke checks
    const safetyText = (a.safety || []).join(' ').toLowerCase();
    const smallOnes = all.filter((id) => matById.get(id)?.small);
    if (a.ageMin < 3 && smallOnes.length && !/verstik|klein|mond|inslikken|slikken/.test(safetyText)) {
      warn(`klein materiaal (${smallOnes.join(', ')}) bij leeftijd < 3 zonder waarschuwing over verstikking`);
    }
    if (all.includes('ballonnen') && !/ballon/.test(safetyText)) warn('ballonnen zonder ballon-waarschuwing');
    if (a.wet && a.ageMin <= 2 && !/water|alleen|toezicht/.test(safetyText)) warn('nat + jonge kinderen zonder water/toezicht-waarschuwing');
    if ((a.say || []).some((s) => /^["“„']/.test(s.trim()))) warn('say-zinnen zonder aanhalingstekens schrijven (die voegt de app toe)');
    if (a.soloFrom !== null && a.soloFrom !== undefined) {
      if (a.places?.includes('bad')) err('in bad of douche nooit zelfstandig: soloFrom moet null zijn');
      if (a.wet && a.soloFrom < 4) warn('nat spel: zelfstandig pas vanaf 4 jaar (soloFrom ≥ 4)');
      if (smallOnes.length && a.soloFrom < 3) warn('kleine onderdelen: zelfstandig pas vanaf 3 jaar');
      if (all.includes('ballonnen')) err('ballonnen: nooit zelfstandig (soloFrom null)');
    }
  }
  return { errors, warnings };
}

// Foto's en video's (js/data/media.js): bestaan de bestanden, zijn licentie en maker ingevuld?
export async function validateMedia(activityIds, recipeIds) {
  const errors = [];
  const { MEDIA_DIR, PHOTOS, VIDEOS } = await import(pathToFileURL(resolve(root, 'js/data/media.js')));
  const { existsSync } = await import('node:fs');
  const LIC = /^(CC BY(-SA|-NC|-NC-SA)? \d\.\d|CC0( 1\.0)?|Publiek domein)$/;
  let n = 0;
  for (const [id, list] of Object.entries(PHOTOS)) {
    const where = `media › ${id}`;
    if (!activityIds.has(id)) errors.push(`✖ ${where}: onbekend idee`);
    if (!Array.isArray(list) || list.length < 1 || list.length > 4) errors.push(`✖ ${where}: 1 tot 4 foto's`);
    for (const p of list || []) {
      n++;
      if (!/^[a-z0-9-]+-[0-9a-f]{6}$/.test(p.f || '') || !p.f.startsWith(`${id}-`)) errors.push(`✖ ${where}: ongeldige bestandsnaam "${p.f}"`);
      for (const s of ['s', 'm', 'l']) if (!existsSync(resolve(root, `${MEDIA_DIR}${p.f}-${s}.webp`))) errors.push(`✖ ${where}: bestand ontbreekt: ${p.f}-${s}.webp`);
      if (!isInt(p.w, 100, 4000) || !isInt(p.h, 100, 4000)) errors.push(`✖ ${where}: w/h ontbreken bij ${p.f}`);
      if (!isStr(p.by, 120)) errors.push(`✖ ${where}: maker ontbreekt bij ${p.f}`);
      if (!/^https:\/\//.test(p.src || '')) errors.push(`✖ ${where}: bronlink ontbreekt bij ${p.f}`);
      if (!LIC.test(p.lic || '')) errors.push(`✖ ${where}: licentie "${p.lic}" niet toegestaan bij ${p.f}`);
      if (/^CC BY/.test(p.lic || '') && !/^https:\/\/creativecommons\.org\//.test(p.licUrl || '')) errors.push(`✖ ${where}: licentielink ontbreekt bij ${p.f}`);
    }
  }
  const videoCheck = (kind, ids) => {
    for (const [id, v] of Object.entries(VIDEOS[kind] || {})) {
      const where = `video › ${kind} › ${id}`;
      if (!ids.has(id)) errors.push(`✖ ${where}: onbekend ${kind}`);
      if (!/^[\w-]{11}$/.test(v.id || '')) errors.push(`✖ ${where}: ongeldig YouTube-id`);
      if (!isStr(v.t, 200) || !isStr(v.c, 120)) errors.push(`✖ ${where}: titel of kanaal ontbreekt`);
      if (!['geen', 'nl', 'en'].includes(v.lang)) errors.push(`✖ ${where}: lang moet geen, nl of en zijn`);
      if (!isInt(v.s, 5, 3600)) errors.push(`✖ ${where}: lengte (s) ontbreekt`);
    }
  };
  videoCheck('idee', activityIds);
  videoCheck('recept', recipeIds);
  const listFile = resolve(root, 'media-list.json');
  if (existsSync(listFile)) {
    for (const f of JSON.parse(readFileSync(listFile, 'utf8'))) if (!existsSync(resolve(root, f))) errors.push(`✖ media-list.json: bestand ontbreekt: ${f}`);
  }
  const nv = Object.keys(VIDEOS.idee || {}).length + Object.keys(VIDEOS.recept || {}).length;
  return { errors, summary: `${Object.keys(PHOTOS).length} ideeën met ${n} foto's · ${nv} video's` };
}

// CLI
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = process.argv.slice(2);
  const targets = files.length ? files : [resolve(root, 'js/data/activities.js')];
  const seen = new Map();
  let nErr = 0;
  let nWarn = 0;
  for (const file of targets) {
    let list;
    try {
      const abs = resolve(process.cwd(), file);
      list = abs.endsWith('.json') ? JSON.parse(readFileSync(abs, 'utf8')) : (await import(pathToFileURL(abs))).default;
    } catch (e) {
      console.error(`✖ ${file}: kan niet lezen/parsen: ${e.message}`);
      nErr++;
      continue;
    }
    if (!Array.isArray(list)) { console.error(`✖ ${file}: verwacht een array`); nErr++; continue; }
    const { errors, warnings } = validateList(list, { file, seen });
    errors.forEach((e) => console.error(e));
    warnings.forEach((w) => console.warn(w));
    nErr += errors.length;
    nWarn += warnings.length;
  }
  if (!files.length) {
    const { RECIPES } = await import(pathToFileURL(resolve(root, 'js/data/recipes.js')));
    const media = await validateMedia(new Set(seen.keys()), new Set(RECIPES.map((r) => r.id)));
    media.errors.forEach((e) => console.error(e));
    nErr += media.errors.length;
    console.log(`media: ${media.summary} · ${media.errors.length} fout(en)`);
  }
  console.log(`\n${seen.size} ideeën gecontroleerd · ${nErr} fout(en) · ${nWarn} waarschuwing(en)`);
  process.exit(nErr ? 1 : 0);
}
