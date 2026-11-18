#!/usr/bin/env node
// Controleert knutselideeën op structuur en verwijzingen.
// Gebruik:  node tools/validate.mjs [bestand.json ...]
// Zonder argumenten wordt js/data/activities.js gecontroleerd.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { CATEGORIES, THEMES, LEARN } = await import(pathToFileURL(resolve(root, 'js/data/meta.js')));
const { MATERIALS } = await import(pathToFileURL(resolve(root, 'js/data/materials.js')));

const catIds = new Set(CATEGORIES.map((c) => c.id));
const themeIds = new Set(THEMES.map((t) => t.id));
const learnIds = new Set(LEARN.map((l) => l.id));
const matById = new Map(MATERIALS.map((m) => [m.id, m]));

const ALLOWED_KEYS = new Set([
  'id', 'title', 'emoji', 'category', 'summary', 'ageMin', 'ageMax', 'mess', 'wet', 'dirty',
  'prepMinutes', 'durationMinutes', 'supervision', 'materials', 'optional', 'steps', 'ageTips',
  'safety', 'say', 'words', 'learn', 'tips', 'variations', 'themes',
]);

async function loadFile(file) {
  const abs = resolve(process.cwd(), file);
  if (abs.endsWith('.json')) return JSON.parse(readFileSync(abs, 'utf8'));
  const mod = await import(pathToFileURL(abs));
  return mod.default ?? mod.ACTIVITIES;
}

const files = process.argv.slice(2);
const targets = files.length ? files : [resolve(root, 'js/data/activities.js')];

let errors = 0;
let warnings = 0;
const seen = new Map();

const isStr = (v, max = 10000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const strArr = (v, min, max, maxLen = 400) => Array.isArray(v) && v.length >= min && v.length <= max && v.every((s) => isStr(s, maxLen));

for (const file of targets) {
  let list;
  try {
    list = await loadFile(file);
  } catch (e) {
    console.error(`✖ ${file}: kan niet lezen/parsen: ${e.message}`);
    errors++;
    continue;
  }
  if (!Array.isArray(list)) {
    console.error(`✖ ${file}: verwacht een array`);
    errors++;
    continue;
  }
  for (const a of list) {
    const where = `${file} › ${a?.id ?? '(geen id)'}`;
    const err = (msg) => { console.error(`✖ ${where}: ${msg}`); errors++; };
    const warn = (msg) => { console.warn(`⚠ ${where}: ${msg}`); warnings++; };

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
    if (!isInt(a.durationMinutes, 5, 240)) err('durationMinutes moet 5-240 zijn');
    if (!isInt(a.supervision, 1, 3)) err('supervision moet 1, 2 of 3 zijn');

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
    if (req.length && req.every((id) => matById.get(id)?.basic)) warn('alle benodigde materialen zijn basis; prima, maar check of dat klopt');

    if (!strArr(a.steps, 3, 9, 320)) err('steps: 3-9 stappen, elk max 320 tekens');
    if (!a.ageTips || !isStr(a.ageTips.young, 320) || !isStr(a.ageTips.old, 320)) err('ageTips.young en ageTips.old zijn verplicht (max 320 tekens)');
    if (!strArr(a.safety, 1, 5, 320)) err('safety: 1-5 punten, elk max 320 tekens');
    if (!strArr(a.say, 3, 6, 200)) err('say: 3-6 zinnen, elk max 200 tekens');
    if (!strArr(a.words, 3, 10, 40)) err('words: 3-10 woorden, elk max 40 tekens');
    if (!Array.isArray(a.learn) || a.learn.length < 1 || a.learn.length > 4 || !a.learn.every((l) => learnIds.has(l))) err('learn: 1-4 geldige ids');
    if (!strArr(a.tips, 1, 4, 320)) err('tips: 1-4 tips, elk max 320 tekens');
    if (!strArr(a.variations, 2, 5, 320)) err('variations: 2-5 ideeën, elk max 320 tekens');
    if (!Array.isArray(a.themes) || !a.themes.every((t) => themeIds.has(t))) err('themes: alleen geldige thema-ids');

    // Inhoudelijke checks
    const safetyText = (a.safety || []).join(' ').toLowerCase();
    const smallOnes = all.filter((id) => matById.get(id)?.small);
    if (a.ageMin < 3 && smallOnes.length && !/verstik|klein|mond|inslikken|slikken/.test(safetyText)) {
      warn(`klein materiaal (${smallOnes.join(', ')}) bij leeftijd < 3 zonder waarschuwing over verstikking`);
    }
    if (all.includes('ballonnen') && !/ballon/.test(safetyText)) warn('ballonnen zonder ballon-waarschuwing');
    if (a.wet && a.ageMin <= 2 && !/water|alleen|toezicht/.test(safetyText)) warn('nat + jonge kinderen zonder water/toezicht-waarschuwing');
    if ((a.say || []).some((s) => /^["“„']/.test(s.trim()))) warn('say-zinnen zonder aanhalingstekens schrijven (die voegt de app toe)');
  }
}

const total = seen.size;
console.log(`\n${total} ideeën gecontroleerd · ${errors} fout(en) · ${warnings} waarschuwing(en)`);
process.exit(errors ? 1 : 0);
