import { STORAGE_KEY, PERIODS, FACTORS, FIELDS, localDate, suggestedPeriod, scores, energyLabel, validateStep, decodeStorage, upsertRecord, latestRecord, getTips, createDemo } from './logic.mjs';

const paths = {
  bolt: '<path d="m13 2-8 12h7l-1 8 8-12h-7z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  circlecheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  sunrise: '<path d="M3 17h18M5 21h14M7 17a5 5 0 0 1 10 0M12 2v3M3 8l2 2m16-2-2 2M9 5l3-3 3 3"/>',
  moon: '<path d="M20.8 13a9 9 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z"/>',
  brain: '<path d="M12 4a3 3 0 0 0-5 1 3.5 3.5 0 0 0-3 5 4 4 0 0 0 1 7 3.5 3.5 0 0 0 7 2Zm0 0a3 3 0 0 1 5 1 3.5 3.5 0 0 1 3 5 4 4 0 0 1-1 7 3.5 3.5 0 0 1-7 2ZM7 9l2 1m-2 5 2-1m8-5-2 1m2 5-2-1"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  leaf: '<path d="M20 3C9 2 3 7 5 14c2 7 16 6 15-11Z"/><path d="M3 21 16 8m-7 7v-5m0 5h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  coffee: '<path d="M4 9h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm12 1h2a3 3 0 1 1 0 6h-2M7 3v2m5-2v2M2 22h17"/>',
  cup: '<path d="m6 3 1 18h10l1-18Zm0 6h12M14 3l2-2"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',
  walk: '<circle cx="14" cy="4" r="2"/><path d="m7 21 3-7 3 2 1 5m-9-9 5-4 4 1 2 4h4m-10 1 2-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7a3.5 3.5 0 0 0-5-5L4 14Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const capital = value => value[0].toUpperCase() + value.slice(1);
const periodIcon = period => ({ ochtend: 'sunrise', middag: 'sun', avond: 'moon' })[period];
const app = document.querySelector('#app');
const dialog = document.querySelector('#data-dialog');
const state = { records: [], demo: false, demoRecords: [], storageIssue: null, route: 'dashboard', period: null, draft: null, step: 0, errors: {}, result: null, saved: true };
try { state.records = decodeStorage(localStorage.getItem(STORAGE_KEY)); }
catch (error) { state.storageIssue = error instanceof SyntaxError || error.message.includes('gegevens') || error.message.includes('checkmomenten') ? 'corrupt' : 'blocked'; }

const records = () => state.demo ? state.demoRecords : state.records;
const todayRecords = () => records().filter(record => record.date === localDate());
const formatDate = (date, options = { day: 'numeric', month: 'long' }) => new Intl.DateTimeFormat('nl-NL', options).format(new Date(`${date}T12:00:00`));
const announce = message => { document.querySelector('#announcer').textContent = message; };

function go(route) {
  const hash = `#${route}`;
  if (location.hash === hash) routeFromHash();
  else location.hash = hash;
}

function routeFromHash() {
  const value = location.hash.slice(1);
  if (value === 'main' && document.querySelector('#main')) { document.querySelector('#main').focus(); return; }
  if (value.startsWith('check/')) {
    const period = value.split('/')[1];
    if (!PERIODS.includes(period)) { go('overzicht'); return; }
    state.route = 'check';
    state.period = period;
    const existing = todayRecords().find(record => record.period === period);
    state.draft = existing ? structuredClone(existing) : { date: localDate(), period, factors: [], note: '' };
    state.step = 0;
    state.errors = {};
  } else if (value === 'uitleg') state.route = 'about';
  else if (value === 'resultaat' && state.result) state.route = 'result';
  else state.route = 'dashboard';
  render();
  window.scrollTo(0, 0);
  document.querySelector('h1')?.focus({ preventScroll: true });
}

function navButton(route, label, name, selected) {
  return `<button class="nav-item ${selected ? 'active' : ''}" data-action="nav" data-route="${route}" aria-label="${label}" ${selected ? 'aria-current="page"' : ''}>${icon(name)}<span>${label}</span>${selected ? '<span class="nav-dot"></span>' : ''}</button>`;
}

function render() {
  const isCheck = state.route === 'check';
  const breadcrumb = state.route === 'about' ? 'Over deze check' : isCheck ? `${capital(state.period)}check` : state.route === 'result' ? 'Jouw resultaat' : 'Mijn overzicht';
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar" aria-label="Hoofdnavigatie">
      <a class="brand" href="#overzicht" aria-label="Student Energy Check, naar overzicht"><span class="brand-mark">${icon('bolt')}</span><span class="brand-name">energy<span>STUDENT CHECK</span></span></a>
      <div class="workspace-label">JOUW PLEK OM OP TE LADEN</div>
      <nav>
        ${navButton('overzicht', 'Mijn overzicht', 'grid', state.route === 'dashboard' || state.route === 'result')}
        ${navButton(`check/${suggestedPeriod()}`, 'Dagelijkse check', 'circlecheck', isCheck)}
        ${navButton('uitleg', 'Over deze check', 'info', state.route === 'about')}
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-note"><span class="note-leaf">${icon('leaf')}</span><p>Je hoeft niet altijd<br>op 100% te staan.</p><span>Een klein moment maakt ruimte.</span><div class="note-line"></div></div>
        <button class="data-button" data-action="data" aria-label="Mijn gegevens">${icon('lock')}<span>Mijn gegevens</span>${icon('arrow')}</button>
        <div class="school-label">GEMAAKT VOOR STUDENTEN · 18+</div>
      </div>
    </aside>
    <div class="main-shell">
      <header class="topbar"><div class="breadcrumb">${icon('grid')}<span>Mijn ruimte</span><span class="slash">/</span><strong>${breadcrumb}</strong></div><div class="topbar-right"><span class="date-label">${icon('calendar')}${formatDate(localDate(), { weekday: 'long', day: 'numeric', month: 'long' })}</span><span class="avatar" aria-label="Jouw persoonlijke ruimte">JIJ</span></div></header>
      <main id="main" tabindex="-1">
        ${state.demo ? `<div class="demo-banner">${icon('spark')}<span><strong>Je bekijkt een voorbeeld.</strong> Deze gegevens zijn fictief. Je eigen checks blijven apart bewaard.</span><button data-action="demo">Terug naar mijn gegevens ${icon('arrow')}</button></div>` : ''}
        ${state.storageIssue ? `<div class="notice warning" role="status">${icon('info')}<span>${state.storageIssue === 'corrupt' ? 'Je opgeslagen gegevens konden niet worden gelezen. Ze zijn niet overschreven. Via ‘Mijn gegevens’ kun je ze verwijderen en opnieuw beginnen.' : 'Opslaan in deze browser lukt niet. Je kunt de check gebruiken, maar nieuwe antwoorden blijven alleen tijdens deze sessie bewaard.'}</span></div>` : ''}
        ${state.route === 'dashboard' ? dashboard() : state.route === 'check' ? checkPage() : state.route === 'result' ? resultPage() : aboutPage()}
        <footer class="page-footer"><span>${icon('lock')} Alleen op jouw apparaat. Alleen voor jou.</span><span>Een reflectiemoment, geen medische meting.</span></footer>
      </main>
    </div>
  </div>`;
  bindForm();
}

function ring(score, size = '') {
  return `<div class="score-ring ${size}" style="--score:${score ?? 0}" role="img" aria-label="${score === null ? 'Nog geen energiescore' : `Energiescore ${score} van 100`}"><div class="ring-center"><span>${score ?? '—'}</span><small>${score === null ? 'jouw energie' : 'van de 100'}</small></div></div>`;
}

function dashboard() {
  const today = todayRecords();
  const latest = latestRecord(records());
  const current = latestRecord(today);
  const score = scores(current);
  const period = suggestedPeriod();
  const complete = today.some(record => record.period === period);
  return `<section class="page-intro"><div><div class="eyebrow"><span class="tiny-sun">${icon('sun')}</span> EVEN INCHECKEN BIJ JEZELF</div><h1 tabindex="-1">Een moment voor jezelf<span class="green-dot">.</span></h1><p>Hoe zit je in je energie? Ontdek wat jij vandaag nodig hebt.</p></div><button class="button primary" data-action="nav" data-route="check/${period}">${icon('circlecheck')}${complete ? 'Pas je check aan' : 'Start je check'}${icon('arrow')}</button></section>
    <div class="section-bar"><h2>Jouw energie vandaag</h2><button class="text-button" data-action="demo">${icon(state.demo ? 'back' : 'spark')}${state.demo ? 'Eigen gegevens bekijken' : 'Voorbeeld bekijken'}</button></div>
    <section class="overview-grid" aria-label="Energieoverzicht">
      <div class="energy-card"><div class="energy-copy"><span class="card-kicker"><span class="live-dot"></span>${current ? `${capital(current.period)}check · ${formatDate(current.date)}` : 'EEN NIEUWE DAG, EEN NIEUWE CHECK'} </span><h2>${current ? energyLabel(score.total) : 'Hoe vol is jouw batterij?'}</h2><p>${current ? 'Dit is hoe jij je voelde bij je laatste check. Elk energieniveau mag er zijn.' : 'Neem een minuut om stil te staan bij hoe je je voelt. Je hoeft niets te presteren.'}</p><div class="energy-subscore"><span>${icon('brain')} Mentaal <strong>${score?.mental ?? '—'}<small>/100</small></strong></span><span>${icon('heart')} Lichamelijk <strong>${score?.physical ?? '—'}<small>/100</small></strong></span></div></div>${ring(score?.total ?? null)}<div class="energy-decoration" aria-hidden="true"></div></div>
      <div class="rhythm-card"><div class="card-heading"><div><span class="card-kicker">KLEINE MOMENTEN, MEER INZICHT</span><h2>Jouw dag in beeld</h2></div><span class="small-icon">${icon('sun')}</span></div>${dayChart(today)}<div class="rhythm-bottom"><span class="mini-dots" aria-hidden="true">${PERIODS.map(p => `<i class="${today.some(r => r.period === p) ? 'filled' : ''}"></i>`).join('')}</span><span><strong>${today.length} van de 3</strong> checks ingevuld</span></div></div>
    </section>
    <section class="check-section" aria-labelledby="checks-title"><div class="section-bar"><h2 id="checks-title">Drie keer even stilstaan</h2><span class="muted small">Ongeveer 1 minuut per check</span></div><div class="check-cards">${PERIODS.map(p => periodCard(p, today)).join('')}</div></section>
    <section class="tips-section" aria-labelledby="tips-title"><div class="section-bar"><div class="heading-inline"><h2 id="tips-title">Een kleine stap voor jou</h2><span class="soft-badge">${latest ? 'Op basis van jouw check' : 'Op jouw tempo'}</span></div>${latest ? `<span class="muted small">${capital(latest.period)} · ${formatDate(latest.date)}</span>` : ''}</div>${latest ? `<div class="tips-grid">${getTips(latest).map(tipCard).join('')}</div>` : `<div class="empty-tips"><span class="empty-tips-icon">${icon('leaf')}</span><div><h3>Jouw tips beginnen bij jouw verhaal</h3><p>Vul je eerste check in en krijg praktische tips die passen bij jouw antwoorden.</p></div><button class="text-button" data-action="nav" data-route="check/${period}">Doe je eerste check ${icon('arrow')}</button></div>`}</section>
    <div class="gentle-reminder">${icon('heart')}<p>Je bent meer dan een score. Zie dit als een moment van aandacht, niet als een beoordeling.</p></div>`;
}

function dayChart(today) {
  const x = [45, 180, 315];
  const dots = PERIODS.map((period, i) => {
    const record = today.find(item => item.period === period);
    const score = scores(record)?.total;
    return score === undefined ? null : { x: x[i], y: 104 - score * .72, score };
  });
  const lines = dots.slice(1).map((point, i) => point && dots[i] ? `<line x1="${dots[i].x}" y1="${dots[i].y}" x2="${point.x}" y2="${point.y}" stroke="#53876a" stroke-width="2.5"/>` : '').join('');
  return `<div class="day-chart"><svg viewBox="0 0 360 143" role="img" aria-label="${today.length ? 'Energiescores per check vandaag: ' + PERIODS.map((p, i) => `${p} ${dots[i]?.score ?? 'niet ingevuld'}`).join(', ') : 'Je dagoverzicht verschijnt na je eerste check'}"><defs><linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c8dfbb" stop-opacity=".35"/><stop offset="100%" stop-color="#c8dfbb" stop-opacity="0"/></linearGradient></defs>${[32, 68, 104].map(y => `<line x1="20" y1="${y}" x2="340" y2="${y}" stroke="#e8ece6" stroke-dasharray="4 5"/>`).join('')}${dots[0] && dots[1] ? `<path d="M ${dots[0].x} ${dots[0].y} L ${dots[1].x} ${dots[1].y} L ${dots[1].x} 110 L ${dots[0].x} 110 Z" fill="url(#chartFade)"/>` : ''}${lines}${dots.map(point => point ? `<circle cx="${point.x}" cy="${point.y}" r="6" fill="#54816a" stroke="white" stroke-width="3"/><text x="${point.x}" y="${point.y - 14}" text-anchor="middle" class="chart-value">${point.score}</text>` : '').join('')}${!today.length ? '<text x="180" y="64" text-anchor="middle" class="chart-placeholder">Een nieuwe dag begint hier</text>' : ''}${PERIODS.map((p, i) => `<text x="${x[i]}" y="138" text-anchor="middle" class="chart-label">${capital(p)}</text>`).join('')}</svg></div>`;
}

function periodCard(period, today) {
  const record = today.find(item => item.period === period);
  const current = suggestedPeriod() === period;
  const descriptions = { ochtend: 'Hoe begin je aan je dag?', middag: 'Hoe gaat het tussendoor?', avond: 'Hoe sluit je de dag af?' };
  return `<article class="period-card ${current && !record ? 'suggested' : ''}"><div class="period-card-top"><span class="period-icon ${period}">${icon(periodIcon(period))}</span>${record ? `<span class="status done">${icon('check')} Ingevuld</span>` : current ? '<span class="status now">Jouw moment</span>' : '<span class="status">Nog open</span>'}</div><h3>${capital(period)}</h3><p>${descriptions[period]}</p><button class="period-link" data-action="nav" data-route="check/${period}"><span>${record ? `Bekijk en pas aan <span class="period-score">${scores(record).total}/100</span>` : 'Start check'}</span>${icon(record ? 'edit' : 'arrow')}</button></article>`;
}

function tipCard(tip, index) {
  return `<article class="tip-card tip-${index}"><span class="tip-icon">${icon(tip.icon)}</span><span class="tip-category">${tip.category}</span><h3>${tip.title}</h3><p>${tip.text}</p></article>`;
}

function scale(name, label, low, high) {
  return `<fieldset class="field-group ${state.errors[name] ? 'has-error' : ''}" ${state.errors[name] ? `aria-describedby="error-${name}"` : ''}><legend>${label}<span class="required-label">Verplicht</span></legend><div class="number-scale">${Array.from({ length: 11 }, (_, n) => `<label><input type="radio" name="${name}" value="${n}" ${state.draft[name] === n ? 'checked' : ''} aria-label="${n} van 10"/><span>${n}</span></label>`).join('')}</div><div class="scale-endpoints"><span>${low}</span><span>${high}</span></div>${fieldError(name)}</fieldset>`;
}

function fieldError(name) {
  return state.errors[name] ? `<p class="field-error" id="error-${name}">${icon('info')}${escape(state.errors[name])}</p>` : '';
}

function choice(field) {
  if (field.type === 'number') return `<div class="field-group ${state.errors[field.name] ? 'has-error' : ''}"><label class="field-label" for="${field.name}">${field.label}<span class="required-label">Verplicht</span></label><div class="number-input"><input id="${field.name}" name="${field.name}" type="number" inputmode="decimal" min="${field.min}" max="${field.max}" step="${field.step}" placeholder="Bijv. 7,5" value="${state.draft[field.name] ?? ''}" aria-describedby="hint-${field.name}${state.errors[field.name] ? ` error-${field.name}` : ''}" ${state.errors[field.name] ? 'aria-invalid="true"' : ''}/><span>${field.suffix}</span></div><p class="field-hint" id="hint-${field.name}">${field.hint}</p>${fieldError(field.name)}</div>`;
  return `<fieldset class="field-group ${state.errors[field.name] ? 'has-error' : ''}" ${state.errors[field.name] ? `aria-describedby="error-${field.name}"` : ''}><legend>${field.label}<span class="required-label">Verplicht</span></legend><div class="choice-options">${field.options.map(([value, label]) => `<label><input type="radio" name="${field.name}" value="${value}" ${state.draft[field.name] === value ? 'checked' : ''}/><span>${label}</span></label>`).join('')}</div>${fieldError(field.name)}</fieldset>`;
}

function checkPage() {
  const titles = ['Hoe voelt je energie?', 'Hoe is de balans?', 'Wat speelt er bij jou?'];
  const subtitles = ['Er is geen goed of fout. Kies wat op dit moment bij je past.', 'Een paar korte vragen over jouw ' + ({ ochtend: 'nacht en de dag die komt.', middag: 'ochtend.', avond: 'middag en avond.' })[state.period], 'Sta kort stil bij spanning en wat je bezighoudt.'];
  return `<div class="check-layout"><div class="check-main"><button class="text-button back-link" data-action="nav" data-route="overzicht">${icon('back')} Terug naar overzicht</button><div class="eyebrow check-eyebrow">${icon(periodIcon(state.period))} ${state.period.toUpperCase()}CHECK · ${formatDate(state.draft.date).toUpperCase()}</div><h1 tabindex="-1">${titles[state.step]}</h1><p class="page-description">${subtitles[state.step]}</p><ol class="stepper" aria-label="Voortgang">${['Je energie', 'Je balans', 'Jouw context'].map((label, i) => `<li class="${state.step === i ? 'current' : state.step > i ? 'complete' : ''}" ${state.step === i ? 'aria-current="step"' : ''}><span>${state.step > i ? icon('check') : i + 1}</span>${label}</li>`).join('')}</ol>
      <form id="check-form" novalidate><div class="form-card">${state.errors.save ? `<div class="notice warning" role="alert">${escape(state.errors.save)}</div>` : ''}${state.step === 0 ? `${scale('mental', 'Hoeveel mentale energie heb je?', 'Mijn hoofd is leeg / moe', 'Helder en vol energie')}${scale('physical', 'Hoeveel lichamelijke energie heb je?', 'Weinig energie in mijn lijf', 'Fit en vol energie')}` : state.step === 1 ? FIELDS[state.period].map(choice).join('') : `${scale('stress', 'Hoeveel stress ervaar je op dit moment?', 'Helemaal geen stress', 'Heel veel stress')}<fieldset class="field-group"><legend>Spelen er omstandigheden mee?<span class="optional-label">Optioneel · meerdere keuzes</span></legend><div class="factor-options">${FACTORS.map(factor => `<label><input type="checkbox" name="factors" value="${escape(factor)}" ${state.draft.factors.includes(factor) ? 'checked' : ''}/><span>${factor}</span></label>`).join('')}</div>${fieldError('factors')}</fieldset><div class="field-group"><label class="field-label" for="note">${state.period === 'avond' ? 'Wat gaf of kostte je energie?' : 'Wil je nog iets kwijt?'}<span class="optional-label">Optioneel</span></label><textarea id="note" name="note" rows="3" maxlength="300" placeholder="Een korte gedachte, alleen voor jezelf…">${escape(state.draft.note)}</textarea><div class="field-hint note-count"><span>Je hoeft geen persoonlijke details te delen.</span><span id="note-count">${state.draft.note.length}/300</span></div>${fieldError('note')}</div>`}</div><div class="form-actions">${state.step ? `<button type="button" class="button secondary" data-action="previous">${icon('back')} Vorige</button>` : '<span class="form-privacy">' + icon('lock') + 'Alleen in jouw browser</span>'}<button class="button primary" type="submit">${state.step === 2 ? 'Bekijk mijn resultaat' : 'Volgende'}${icon('arrow')}</button></div></form>
    </div><aside class="check-aside"><span class="aside-illustration">${icon('leaf')}<i></i><b></b></span><h2>Klein moment.<br>Meer aandacht.</h2><p>Je hoeft jezelf niet beter voor te doen. Deze check is er voor jou.</p><div class="aside-fact">${icon('clock')}<span>Ongeveer 1 minuut</span></div><div class="aside-fact">${icon('heart')}<span>Jouw gevoel telt</span></div><div class="aside-fact">${icon('lock')}<span>Geen account nodig</span></div><div class="aside-note">Slaap, stress en herstel helpen je tips persoonlijk te maken. Ze leveren geen strafpunten op.</div></aside></div>`;
}

function bindForm() {
  const form = document.querySelector('#check-form');
  if (!form) return;
  form.addEventListener('input', event => {
    const { name, value, type } = event.target;
    if (!name) return;
    if (name === 'factors') {
      state.draft.factors = Array.from(form.querySelectorAll('input[name="factors"]:checked')).map(input => input.value);
    } else if (name === 'note') {
      state.draft.note = value;
      document.querySelector('#note-count').textContent = `${value.length}/300`;
    } else if (type === 'radio' || type === 'number') state.draft[name] = value === '' ? null : Number(value);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    state.errors = validateStep(state.draft, state.step);
    if (Object.keys(state.errors).length) {
      render();
      const first = Object.keys(state.errors)[0];
      document.querySelector(`[name="${first}"]`)?.focus();
      announce('Er ontbreekt nog een antwoord. ' + state.errors[first]);
      return;
    }
    if (state.step < 2) {
      state.step++;
      render();
      document.querySelector('h1')?.focus();
      window.scrollTo(0, 0);
    } else saveCheck();
  });
}

function saveCheck() {
  // A check started before midnight retains the date shown when it was started.
  const record = { ...state.draft, id: `${state.draft.date}-${state.draft.period}`, updatedAt: new Date().toISOString() };
  const next = upsertRecord(records(), record);
  state.saved = true;
  if (state.demo) state.demoRecords = next;
  else {
    if (state.storageIssue === 'corrupt') {
      state.errors.save = 'Je bestaande opslag is niet leesbaar. Ga naar Mijn gegevens om deze te verwijderen voordat je een nieuwe check bewaart.';
      render();
      document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center' });
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, records: next }));
      state.storageIssue = null;
    } catch {
      state.storageIssue = 'blocked';
      state.saved = false;
    }
    state.records = next;
  }
  state.result = record;
  announce(state.demo ? 'Je voorbeeldcheck is ingevuld.' : state.saved ? 'Je check is opgeslagen.' : 'Je check is ingevuld, maar kon niet blijvend worden opgeslagen.');
  go('resultaat');
}

function resultPage() {
  const record = state.result;
  const score = scores(record);
  return `<section class="result-intro"><div class="eyebrow">${icon('circlecheck')} ${state.demo ? 'VOORBEELDCHECK AFGEROND' : state.saved ? 'JE CHECK IS OPGESLAGEN' : 'CHECK AFGEROND · NIET BLIJVEND OPGESLAGEN'}</div><h1 tabindex="-1">Goed dat je even stil stond<span class="green-dot">.</span></h1><p>${capital(record.period)}check · ${formatDate(record.date)}. Dit is jouw momentopname.</p></section><section class="result-summary"><div>${ring(score.total, 'result-ring')}<h2>${energyLabel(score.total)}</h2><p>Jouw totale energie</p></div><div class="result-details"><div class="result-subscore">${icon('brain')}<div><h3>Mentale energie</h3><p>Hoe helder en energiek je hoofd voelt.</p></div><strong>${score.mental}<small>/100</small></strong></div><div class="result-subscore">${icon('heart')}<div><h3>Lichamelijke energie</h3><p>Hoeveel energie je in je lijf ervaart.</p></div><strong>${score.physical}<small>/100</small></strong></div><div class="score-explanation">${icon('info')}<p>Je antwoorden (${record.mental} en ${record.physical}) × 10 geven je deelscores. Het gemiddelde is <strong>${score.total}/100</strong>. Je andere antwoorden bepalen je tips.</p></div></div></section><section class="tips-section"><div class="section-bar"><h2>Een kleine stap voor jou</h2><span class="soft-badge">Kies wat bij je past</span></div><div class="tips-grid">${getTips(record).map(tipCard).join('')}</div></section>${record.note ? `<div class="reflection"><span class="eyebrow">JOUW GEDACHTE BIJ DEZE CHECK</span><p>“${escape(record.note)}”</p></div>` : ''}<div class="result-actions"><button class="button primary" data-action="nav" data-route="overzicht">Naar mijn overzicht ${icon('arrow')}</button><button class="text-button" data-action="nav" data-route="check/${record.period}">${icon('edit')} Antwoorden aanpassen</button></div><div class="gentle-reminder">${icon('heart')}<p>Je hoeft niet op 100 te staan. Je score is een reflectie van je eigen gevoel, geen beoordeling van je gezondheid.</p></div>`;
}

function aboutPage() {
  return `<section class="page-intro"><div><div class="eyebrow">${icon('leaf')} KLEINE CHECK, BEWUST MOMENT</div><h1 tabindex="-1">Jouw energie, jouw verhaal<span class="green-dot">.</span></h1><p>Een hulpmiddel om stil te staan bij hoe jij je voelt.</p></div></section><div class="about-grid"><article class="about-card"><span class="about-number">01</span><h2>Drie momenten voor jezelf</h2><p>Check in de ochtend, middag en avond in. Elke check duurt ongeveer een minuut. Je kunt ook een moment overslaan: een gemiste check telt niet als nul.</p><p>De ochtend gaat over je slaap en de dag die komt. In de middag kijk je terug op de ochtend. In de avond blik je terug op de middag en avond.</p></article><article class="about-card"><span class="about-number">02</span><h2>Zo werkt je score</h2><p>Je geeft je mentale en lichamelijke energie elk een cijfer van 0 tot 10. We vermenigvuldigen die met 10 en nemen het gemiddelde voor je totale energie.</p><div class="formula">Bijvoorbeeld: 6 mentaal + 8 lichamelijk<br><strong>(60 + 80) ÷ 2 = 70/100</strong></div><p>Een hoge score is geen doel dat je moet halen. Het is je eigen gevoel op één moment.</p></article><article class="about-card"><span class="about-number">03</span><h2>Tips die bij je passen</h2><p>Je antwoorden over slaap, stress, belasting, beweging en herstel bepalen welke tips je ziet. We gebruiken vaste beslisregels, geen AI en geen verborgen medische formule.</p><p>Deze factoren zijn context. Ze trekken geen punten af van je energie en verklaren niet met zekerheid waarom je je zo voelt.</p></article><article class="about-card"><span class="about-number">04</span><h2>Je gegevens blijven bij jou</h2><p>Je antwoorden staan alleen in deze browser op dit apparaat. Er is geen account, serveropslag of koppeling met je school. Gebruik je een gedeeld apparaat, dan kunnen andere gebruikers van deze browser je antwoorden zien.</p><p>Via ‘Mijn gegevens’ kun je alles verwijderen. Wissen van browsergegevens verwijdert ook je checks. De voorbeeldmodus is apart van je eigen gegevens.</p><button class="text-button" data-action="data">${icon('lock')} Bekijk mijn gegevens ${icon('arrow')}</button></article></div><div class="about-disclaimer">${icon('info')}<div><h2>Een reflectiehulpmiddel voor studenten van 18+</h2><p>Student Energy Check is een schoolprototype. De score is niet wetenschappelijk gevalideerd en doet geen medische uitspraken. De app stelt geen diagnoses en biedt geen medische beoordeling.</p></div></div><button class="button primary" data-action="nav" data-route="check/${suggestedPeriod()}">Neem een moment voor jezelf ${icon('arrow')}</button>`;
}

function showData(confirm = false) {
  dialog.innerHTML = `<div class="dialog-heading"><span class="small-icon">${icon(confirm ? 'trash' : 'lock')}</span><button class="icon-button" data-action="close-dialog" aria-label="Sluiten">${icon('close')}</button></div><h2 id="dialog-title">${confirm ? 'Je eigen checks verwijderen?' : 'Jouw gegevens, jouw keuze'}</h2><p>${confirm ? 'Alle eigen checks in deze browser worden verwijderd. Dit kun je niet ongedaan maken. Voorbeeldgegevens horen niet bij je eigen checks.' : `Er ${state.records.length === 1 ? 'staat' : 'staan'} <strong>${state.records.length} eigen check${state.records.length === 1 ? '' : 's'}</strong> in deze browsersessie. Opgeslagen checks blijven op dit apparaat; ze worden niet naar je school of een server verstuurd.`}</p>${!confirm ? '<p class="dialog-small">Op een gedeeld apparaat kunnen anderen met toegang tot deze browser je checks zien. Deze app heeft geen account of synchronisatie.</p>' : ''}<div class="dialog-actions">${confirm ? '<button class="button secondary" data-action="data">Annuleren</button><button class="button danger" data-action="delete-data">Ja, verwijder mijn checks</button>' : `<button class="button secondary" data-action="close-dialog">Sluiten</button><button class="button danger-outline" data-action="confirm-delete">${icon('trash')} Verwijder eigen gegevens</button>`}</div><p id="dialog-error" class="field-error" role="alert"></p>`;
  if (!dialog.open) dialog.showModal();
  if (confirm) dialog.querySelector('[data-action="data"]').focus();
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'nav') go(button.dataset.route);
  else if (action === 'previous') {
    state.step = Math.max(0, state.step - 1);
    state.errors = {};
    render();
    document.querySelector('h1')?.focus();
    window.scrollTo(0, 0);
  } else if (action === 'demo') {
    state.demo = !state.demo;
    if (state.demo) state.demoRecords = createDemo();
    state.result = null;
    announce(state.demo ? 'Voorbeeldmodus ingeschakeld. Je eigen gegevens blijven apart.' : 'Je bekijkt weer je eigen gegevens.');
    go('overzicht');
  } else if (action === 'data') showData();
  else if (action === 'close-dialog') dialog.close();
  else if (action === 'confirm-delete') showData(true);
  else if (action === 'delete-data') {
    try { localStorage.removeItem(STORAGE_KEY); }
    catch { document.querySelector('#dialog-error').textContent = 'Verwijderen uit de browseropslag lukt niet. Verwijder de websitegegevens via je browserinstellingen.'; return; }
    state.records = [];
    state.storageIssue = null;
    if (!state.demo) state.result = null;
    dialog.close();
    announce('Je eigen gegevens zijn verwijderd.');
    go('overzicht');
  }
});

window.addEventListener('hashchange', routeFromHash);
// Keep a second open tab from silently overwriting newer answers.
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  try { state.records = decodeStorage(localStorage.getItem(STORAGE_KEY)); state.storageIssue = null; }
  catch { state.storageIssue = 'corrupt'; }
  if (state.route !== 'check') render();
});
routeFromHash();
