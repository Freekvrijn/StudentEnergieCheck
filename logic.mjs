export const STORAGE_KEY = 'student-energy-check.v1';
export const PERIODS = ['ochtend', 'middag', 'avond'];
export const FACTORS = ['Studie & deadlines', 'Tentamens', 'Bijbaan', 'Geldzorgen', 'Sociale situaties', 'Thuis', 'Niet fit / ziek', 'Anders'];

export const FIELDS = {
  ochtend: [
    { name: 'sleepHours', label: 'Hoeveel uur heb je afgelopen nacht geslapen?', type: 'number', min: 0, max: 24, step: 0.5, suffix: 'uur', hint: 'Een schatting is prima. Bijvoorbeeld 7,5 uur.' },
    { name: 'sleepQuality', label: 'Hoe uitgerust werd je wakker?', options: [[1, 'Nog moe'], [2, 'Redelijk'], [3, 'Uitgerust']] },
    { name: 'load', label: 'Hoe druk verwacht je dat vandaag wordt?', options: [[1, 'Rustig'], [2, 'Goed te doen'], [3, 'Erg druk']] },
  ],
  middag: [
    { name: 'load', label: 'Hoe zwaar voelde je ochtend?', options: [[1, 'Licht'], [2, 'Goed te doen'], [3, 'Zwaar']] },
    { name: 'breaks', label: 'Heb je sinds vanochtend pauzes genomen?', options: [[0, 'Nog niet'], [1, 'Een beetje'], [2, 'Voldoende']] },
    { name: 'movement', label: 'Hoeveel heb je sinds vanochtend bewogen?', options: [[0, 'Nauwelijks'], [1, 'Licht bewogen'], [2, 'Actief / gesport']] },
    { name: 'meals', label: 'Heb je sinds vanochtend regelmatig gegeten en gedronken?', options: [[1, 'Nauwelijks'], [2, 'Gedeeltelijk'], [3, 'Ja']] },
  ],
  avond: [
    { name: 'load', label: 'Hoe zwaar voelde je middag en avond?', options: [[1, 'Licht'], [2, 'Goed te doen'], [3, 'Zwaar']] },
    { name: 'movement', label: 'Hoeveel heb je sinds de middag bewogen?', options: [[0, 'Nauwelijks'], [1, 'Licht bewogen'], [2, 'Actief / gesport']] },
    { name: 'recovery', label: 'Had je sinds de middag ruimte om te ontspannen?', options: [[0, 'Nog niet'], [1, 'Een beetje'], [2, 'Voldoende']] },
    { name: 'meals', label: 'Heb je sinds de middag regelmatig gegeten en gedronken?', options: [[1, 'Nauwelijks'], [2, 'Gedeeltelijk'], [3, 'Ja']] },
  ],
};

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function suggestedPeriod(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'ochtend' : hour < 18 ? 'middag' : 'avond';
}

const inRange = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
export function scores(record) {
  if (!record || !inRange(record.mental, 0, 10) || !inRange(record.physical, 0, 10)) return null;
  return { mental: record.mental * 10, physical: record.physical * 10, total: (record.mental + record.physical) * 5 };
}

export function energyLabel(score) {
  if (score === null || score === undefined) return 'Nog geen check';
  return score < 40 ? 'Weinig energie' : score < 70 ? 'Wisselende energie' : 'Veel energie';
}

export function validateStep(draft, step) {
  const errors = {};
  if (step === 0) {
    for (const key of ['mental', 'physical']) {
      if (!inRange(draft[key], 0, 10) || !Number.isInteger(draft[key])) errors[key] = 'Kies een getal van 0 tot en met 10.';
    }
  } else if (step === 1) {
    for (const field of FIELDS[draft.period] || []) {
      if (field.type === 'number') {
        if (!inRange(draft[field.name], field.min, field.max) || !Number.isInteger(draft[field.name] * 2)) errors[field.name] = 'Vul 0 tot en met 24 uur in, in stappen van een half uur.';
      } else if (!field.options.some(([value]) => draft[field.name] === value)) {
        errors[field.name] = 'Kies het antwoord dat het beste past.';
      }
    }
  } else if (step === 2) {
    if (!inRange(draft.stress, 0, 10) || !Number.isInteger(draft.stress)) errors.stress = 'Kies een getal van 0 tot en met 10.';
    if (typeof draft.note !== 'string' || draft.note.length > 300) errors.note = 'Gebruik maximaal 300 tekens.';
    if (!Array.isArray(draft.factors) || draft.factors.some(factor => !FACTORS.includes(factor))) errors.factors = 'Kies een van de getoonde omstandigheden.';
  }
  return errors;
}

export function validRecord(record) {
  if (!record || typeof record !== 'object' || !PERIODS.includes(record.period)) return false;
  if (typeof record.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) return false;
  const parsed = new Date(`${record.date}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || localDate(parsed) !== record.date) return false;
  if (record.id !== `${record.date}-${record.period}`) return false;
  return [0, 1, 2].every(step => Object.keys(validateStep(record, step)).length === 0);
}

export function decodeStorage(raw) {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !Array.isArray(data.records) || !data.records.every(validRecord)) throw new Error('Ongeldige opgeslagen gegevens');
  if (new Set(data.records.map(record => record.id)).size !== data.records.length) throw new Error('Dubbele checkmomenten');
  return data.records;
}

export function upsertRecord(records, record) {
  if (!validRecord(record)) throw new Error('Deze check is nog niet compleet');
  return [...records.filter(item => item.id !== record.id), record];
}

export function latestRecord(records) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date) || PERIODS.indexOf(b.period) - PERIODS.indexOf(a.period))[0] || null;
}

export function getTips(record) {
  if (!record || !scores(record)) return [];
  const tips = [];
  const add = (id, category, title, text, icon) => tips.push({ id, category, title, text, icon });
  if (record.factors?.includes('Niet fit / ziek')) add('gentle', 'Ruimte voor herstel', 'Je mag je tempo aanpassen', 'Kies vandaag een kleinere taak of neem rust als dat beter bij je past.', 'heart');
  if (record.stress >= 7) add('stress', 'Rust in je hoofd', 'Even één ding tegelijk', 'Schrijf op wat nu echt aandacht vraagt. Kies één kleine stap en parkeer de rest even.', 'spark');
  if (record.sleepQuality === 1) add('sleep', 'Een rustige start', 'Begin met iets haalbaars', 'Je gaf aan moe wakker te zijn. Maak je eerste taak klein en plan ruimte voor een pauze.', 'moon');
  if (record.breaks === 0 || record.recovery === 0) add('pause', 'Tijd voor herstel', 'Maak ruimte voor een pauze', 'Leg je werk vijf minuten weg. Kies iets wat voor jou als ontspanning voelt.', 'coffee');
  if (record.load === 3) add('load', 'Meer overzicht', 'Wat kan wachten?', 'Kies wat vandaag het belangrijkste is. Kijk of je een andere taak kunt verkleinen of verplaatsen.', 'list');
  if (record.meals === 1) add('food', 'Even voor jezelf zorgen', 'Plan een eet- en drinkmoment', 'Je gaf aan weinig te hebben gegeten of gedronken. Kijk of je daar nu een rustig moment voor kunt nemen.', 'cup');
  if (record.physical <= 3 && !tips.some(tip => tip.id === 'gentle')) add('rest', 'Luister naar jezelf', 'Kies een lager tempo', 'Je lichamelijke energie voelt laag. Kies een activiteit die past bij wat je nu aankunt.', 'heart');
  if (record.movement === 0 && record.physical > 3 && !record.factors?.includes('Niet fit / ziek')) add('move', 'Een andere omgeving', 'Even van je plek', 'Als het goed voelt: loop een klein rondje of doe een paar rustige bewegingen, op jouw manier.', 'walk');
  if (record.mental <= 3) add('mental', 'Ruimte in je hoofd', 'Maak je volgende stap kleiner', 'Begin met één overzichtelijke handeling. Je hoeft niet alles tegelijk op te lossen.', 'spark');
  if (record.period === 'avond') add('evening', 'De dag afronden', 'Morgen is er weer ruimte', 'Schrijf één ding op voor morgen en kies daarna iets waarmee je de dag rustig afsluit.', 'moon');
  add('pleasant', 'Wat werkt voor jou?', 'Geef iets fijns een plek', 'Kies iets kleins waar je naar uitkijkt: muziek, even buiten zijn of contact met iemand.', 'sun');
  add('reflect', 'Een klein inzicht', 'Sta stil bij wat goed ging', 'Wat gaf je vandaag een beetje energie? Neem dat mee naar je volgende check.', 'leaf');
  add('pace', 'Jouw eigen ritme', 'Houd ruimte tussen je taken', 'Plan niet elke minuut vol. Laat een klein stukje van je dag open voor wat jij nodig hebt.', 'coffee');
  return tips.slice(0, 3);
}

export function createDemo(today = new Date()) {
  const date = localDate(today);
  return [
    { id: `${date}-ochtend`, date, period: 'ochtend', mental: 7, physical: 6, sleepHours: 7.5, sleepQuality: 2, load: 2, stress: 4, factors: [], note: '' },
    { id: `${date}-middag`, date, period: 'middag', mental: 6, physical: 8, load: 3, breaks: 0, movement: 1, meals: 3, stress: 7, factors: ['Studie & deadlines'], note: 'Veel te doen voor het groepsproject. Een rondje buiten was fijn.' },
  ];
}
