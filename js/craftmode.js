// Knutselmodus: één stap per scherm, groot. Het scherm blijft aan, stappen kunnen worden voorgelezen en er loopt een timer mee.

import { esc } from './util.js';

// Bouwt de reeks kaarten: klaarzetten (met ‘Let op’), stappen met tussendoor ‘Wat kun je zeggen?’, verlengers en ‘Klaar!’.
function buildCards(a, matLabel) {
  const cards = [];
  const mats = a.materials.map((m) => `${matLabel(m.id)}${m.note ? ` (${m.note})` : ''}`);
  const opt = (a.optional || []).map((m) => matLabel(m.id));
  cards.push({
    kind: 'prep',
    html: `<p class="craft-kicker">🧺 Klaarzetten</p>
      <ul class="craft-mats">${mats.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      ${opt.length ? `<p class="craft-small">Handig, niet nodig: ${esc(opt.join(', '))}</p>` : ''}
      <div class="craft-warn"><p class="craft-kicker">⚠️ Let op</p><ul>${a.safety.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>`,
    speak: `Klaarzetten. Je hebt nodig: ${mats.join(', ')}. Let op: ${a.safety.join(' ')}`,
  });
  const n = a.steps.length;
  const sayAfter = new Set(n >= 4 ? [Math.round(n / 3), Math.round((2 * n) / 3)] : [Math.ceil(n / 2)]);
  const say = [...a.say];
  const perCard = Math.max(1, Math.ceil(say.length / sayAfter.size));
  let sayIdx = 0;
  a.steps.forEach((s, i) => {
    cards.push({ kind: 'step', html: `<p class="craft-kicker">Stap ${i + 1} van ${n}</p><p class="craft-step">${esc(s)}</p>`, speak: `Stap ${i + 1}. ${s}` });
    if (sayAfter.has(i + 1) && sayIdx < say.length) {
      const lines = say.slice(sayIdx, sayIdx + perCard);
      sayIdx += perCard;
      const last = sayIdx >= say.length;
      cards.push({
        kind: 'say',
        html: `<p class="craft-kicker">💬 Wat kun je zeggen?</p>
          <div class="craft-bubbles">${lines.map((l) => `<p class="bubble">“${esc(l)}”</p>`).join('')}</div>
          ${last ? `<p class="craft-small">Woordjes: ${esc(a.words.join(' · '))}</p>` : ''}`,
        speak: lines.join(' '),
      });
    }
  });
  if (a.extenders?.length) {
    cards.push({
      kind: 'extend',
      html: `<p class="craft-kicker">⏳ Nog langer bezig?</p><ul class="extenders">${a.extenders.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`,
      speak: `Nog langer bezig? ${a.extenders.join(' ')}`,
    });
  }
  cards.push({
    kind: 'done',
    html: `<p class="craft-big" aria-hidden="true">🎉</p><p class="craft-step">Klaar! Goed gedaan samen.</p>
      <div class="btn-row craft-done-actions">
        <button class="btn btn-primary" type="button" data-c="done">✅ Gedaan!</button>
        <button class="btn" type="button" data-c="photo">📷 Foto toevoegen</button>
        <button class="btn btn-ghost" type="button" data-c="close">Terug naar het idee</button>
      </div>
      <p class="craft-small">🧹 Opruimen duurt ongeveer ${a.cleanupMinutes} min. Tip: ruim samen op met een liedje.</p>`,
    speak: 'Klaar! Goed gedaan samen.',
  });
  return cards;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = [660, 880, 990][i];
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.32);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* geen geluid mogelijk */ }
}

/**
 * @param a          het idee
 * @param deps       { matLabel(id), minutes, onDone(id), onPhoto(id), onClose(), toast(msg) }
 */
export function craftView(a, deps) {
  const cards = buildCards(a, deps.matLabel);
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const html = `
  <section class="craft" style="--cat:var(--c-${a.category})" aria-label="Knutselmodus: ${esc(a.title)}">
    <header class="craft-top">
      <button class="icon-btn" type="button" data-c="close" aria-label="Knutselmodus sluiten">✕</button>
      <p class="craft-title"><span aria-hidden="true">${a.emoji}</span> ${esc(a.title)}</p>
      ${canSpeak ? '<button class="craft-chip" type="button" data-c="speak" aria-pressed="false">🔊 <span>Voorlezen</span></button>' : ''}
      <button class="craft-chip" type="button" data-c="timer" aria-label="Timer starten of pauzeren">⏱ <span id="craft-time">${mmss(deps.minutes * 60)}</span></button>
    </header>
    <div class="craft-progress" aria-hidden="true"><span id="craft-bar"></span></div>
    <div class="craft-stage" id="craft-stage" tabindex="-1"></div>
    <footer class="craft-nav">
      <button class="btn" type="button" data-c="prev">‹ Vorige</button>
      <span class="craft-count" id="craft-count"></span>
      <button class="btn btn-primary" type="button" data-c="next">Volgende ›</button>
    </footer>
    <p class="craft-hint" id="craft-hint"></p>
  </section>`;

  let i = 0;
  let wake = null;
  let left = deps.minutes * 60;
  let timerId = null;
  let speaking = false;
  let root = null;
  const cleanups = [];

  function show(n, focus = true) {
    i = Math.max(0, Math.min(cards.length - 1, n));
    stopSpeak();
    const c = cards[i];
    const stage = root.querySelector('#craft-stage');
    stage.className = `craft-stage craft-${c.kind}`;
    stage.innerHTML = c.html;
    root.querySelector('#craft-count').textContent = `${i + 1} / ${cards.length}`;
    root.querySelector('#craft-bar').style.width = `${((i + 1) / cards.length) * 100}%`;
    root.querySelector('[data-c="prev"]').disabled = i === 0;
    const next = root.querySelector('[data-c="next"]');
    next.hidden = i === cards.length - 1;
    if (focus) stage.focus({ preventScroll: true });
  }

  function stopSpeak() {
    if (canSpeak) window.speechSynthesis.cancel();
    speaking = false;
    root?.querySelector('[data-c="speak"]')?.setAttribute('aria-pressed', 'false');
  }

  function speak() {
    if (!canSpeak) return;
    if (speaking) { stopSpeak(); return; }
    const u = new SpeechSynthesisUtterance(cards[i].speak);
    u.lang = 'nl-NL';
    u.rate = 0.95;
    const voice = window.speechSynthesis.getVoices().find((v) => /^nl(-|_|$)/i.test(v.lang));
    if (voice) u.voice = voice;
    u.onend = () => stopSpeak();
    u.onerror = () => stopSpeak();
    speaking = true;
    root.querySelector('[data-c="speak"]')?.setAttribute('aria-pressed', 'true');
    window.speechSynthesis.speak(u);
  }

  function tick() {
    left -= 1;
    root.querySelector('#craft-time').textContent = mmss(left);
    if (left <= 0) {
      clearInterval(timerId);
      timerId = null;
      root.querySelector('[data-c="timer"]').classList.add('is-done');
      chime();
      navigator.vibrate?.([200, 120, 200]);
      deps.toast('⏰ De speeltijd is om. Tijd om af te ronden!');
    }
  }

  function toggleTimer() {
    const btn = root.querySelector('[data-c="timer"]');
    if (left <= 0) { // opnieuw beginnen
      left = deps.minutes * 60;
      btn.classList.remove('is-done');
      root.querySelector('#craft-time').textContent = mmss(left);
      return;
    }
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      btn.classList.remove('is-running');
    } else {
      timerId = setInterval(tick, 1000);
      btn.classList.add('is-running');
    }
  }

  async function lock() {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        wake = await navigator.wakeLock.request('screen');
        root.querySelector('#craft-hint').textContent = '🔆 Je scherm blijft aan zolang de knutselmodus open is.';
      }
    } catch { /* niet toegestaan, bijv. batterijbesparing */ }
  }

  function onClick(e) {
    const el = e.target.closest('[data-c]');
    if (!el || !root.contains(el)) return;
    const c = el.dataset.c;
    if (c === 'next') show(i + 1);
    else if (c === 'prev') show(i - 1);
    else if (c === 'close') deps.onClose();
    else if (c === 'speak') speak();
    else if (c === 'timer') toggleTimer();
    else if (c === 'done') deps.onDone(a.id);
    else if (c === 'photo') deps.onPhoto(a.id);
  }

  function onKey(e) {
    if (e.target.closest?.('input, textarea')) return;
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  }

  return {
    html,
    title: `Knutselmodus · ${a.title}`,
    tab: 'ontdek',
    restoreScroll: false,
    mount() {
      root = document.querySelector('.craft');
      document.body.classList.add('craft-open');
      show(0, false);
      root.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey);
      // vegen
      let x0 = null;
      let y0 = null;
      const stage = root.querySelector('#craft-stage');
      const down = (e) => { x0 = e.clientX; y0 = e.clientY; };
      const up = (e) => {
        if (x0 == null) return;
        const dx = e.clientX - x0;
        const dy = e.clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(i + (dx < 0 ? 1 : -1));
      };
      stage.addEventListener('pointerdown', down);
      stage.addEventListener('pointerup', up);
      // Een wake lock vervalt als de app naar de achtergrond gaat: vraag hem opnieuw aan bij terugkomst.
      const vis = () => { if (document.visibilityState === 'visible') lock(); };
      document.addEventListener('visibilitychange', vis);
      lock();
      cleanups.push(() => document.removeEventListener('keydown', onKey), () => document.removeEventListener('visibilitychange', vis));
    },
    unmount() {
      document.body.classList.remove('craft-open');
      stopSpeak();
      if (timerId) clearInterval(timerId);
      wake?.release?.().catch(() => {});
      wake = null;
      cleanups.forEach((f) => f());
    },
  };
}
