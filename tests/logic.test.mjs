import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, suggestedPeriod, scores, validateStep, validRecord, decodeStorage, upsertRecord, latestRecord, getTips, createDemo } from '../logic.mjs';

const demo = () => createDemo(new Date(2026, 10, 9, 13));

test('de energiescore is het gemiddelde van de twee eigen beoordelingen', () => {
  assert.deepEqual(scores({ mental: 6, physical: 8 }), { mental: 60, physical: 80, total: 70 });
  assert.equal(scores({ mental: 0, physical: 0 }).total, 0);
  assert.equal(scores({ mental: 10, physical: 10 }).total, 100);
});

test('een ontbrekend antwoord is nooit nul of een deelscore', () => {
  for (const record of [null, {}, { mental: null, physical: 6 }, { mental: 5 }, { mental: '5', physical: 5 }, { mental: 11, physical: 5 }]) assert.equal(scores(record), null);
  assert.equal(Object.keys(validateStep({ mental: 0, physical: 0 }, 0)).length, 0);
});

test('dagdelen en datum gebruiken de lokale tijd', () => {
  assert.equal(localDate(new Date(2026, 0, 2, 0, 1)), '2026-01-02');
  assert.equal(suggestedPeriod(new Date(2026, 0, 2, 11, 59)), 'ochtend');
  assert.equal(suggestedPeriod(new Date(2026, 0, 2, 12)), 'middag');
  assert.equal(suggestedPeriod(new Date(2026, 0, 2, 18)), 'avond');
});

test('alleen de vragen van het gekozen dagdeel zijn verplicht', () => {
  assert.deepEqual(validateStep(demo()[0], 1), {});
  assert.deepEqual(validateStep(demo()[1], 1), {});
  assert.ok(validateStep({ period: 'ochtend' }, 1).sleepHours);
  assert.ok(!validateStep({ period: 'middag' }, 1).sleepHours);
  assert.ok(validateStep({ period: 'avond' }, 1).recovery);
});

test('slaapuren worden begrensd en ondersteunen halve uren', () => {
  const morning = demo()[0];
  assert.equal(validateStep({ ...morning, sleepHours: 7.5 }, 1).sleepHours, undefined);
  for (const sleepHours of [null, -1, 25, 7.2, '7.5', Infinity]) assert.ok(validateStep({ ...morning, sleepHours }, 1).sleepHours);
});

test('context ondersteunt overslaan van persoonlijke details, maar vraagt stress', () => {
  assert.deepEqual(validateStep({ stress: 0, factors: [], note: '' }, 2), {});
  assert.ok(validateStep({ factors: [], note: '' }, 2).stress);
  assert.ok(validateStep({ stress: 1, factors: ['onbekend'], note: '' }, 2).factors);
  assert.ok(validateStep({ stress: 1, factors: [], note: 'a'.repeat(301) }, 2).note);
});

test('opslag kan leeg zijn en bewaart geldige checks zonder verlies', () => {
  assert.deepEqual(decodeStorage(null), []);
  assert.deepEqual(decodeStorage(JSON.stringify({ version: 1, records: demo() })), demo());
});

test('beschadigde opslag, ongeldige datums en dubbele momenten worden geweigerd', () => {
  for (const raw of ['{', '{}', '{"version":2,"records":[]}', JSON.stringify({ version: 1, records: [demo()[0], demo()[0]] })]) assert.throws(() => decodeStorage(raw));
  assert.equal(validRecord({ ...demo()[0], date: '2026-02-30', id: '2026-02-30-ochtend' }), false);
  assert.equal(validRecord({ ...demo()[0], id: 'ander-id' }), false);
  assert.equal(validRecord({ ...demo()[0], note: undefined }), false);
});

test('aanpassen vervangt precies één check en laat de rest intact', () => {
  const original = demo();
  const updated = { ...original[0], mental: 3 };
  const result = upsertRecord(original, updated);
  assert.equal(result.length, 2);
  assert.deepEqual(result.find(record => record.period === 'middag'), original[1]);
  assert.equal(result.find(record => record.period === 'ochtend').mental, 3);
  assert.equal(original[0].mental, 7);
  assert.throws(() => upsertRecord(original, { ...updated, physical: null }));
});

test('laatste check volgt datum en dagdeel, ook na aanpassen van een eerdere check', () => {
  assert.equal(latestRecord([...demo()].reverse()).period, 'middag');
  assert.equal(latestRecord([]), null);
});

test('tips reageren op hoge stress en het ontbreken van pauzes', () => {
  const tips = getTips(demo()[1]);
  assert.equal(tips.length, 3);
  assert.equal(tips[0].id, 'stress');
  assert.ok(tips.some(tip => tip.id === 'pause'));
});

test('ziek zijn krijgt voorrang en leidt niet tot een beweegtip', () => {
  const tips = getTips({ ...demo()[1], movement: 0, physical: 4, factors: ['Niet fit / ziek'] });
  assert.equal(tips[0].id, 'gentle');
  assert.equal(tips.some(tip => tip.id === 'move'), false);
});

test('contextfactoren veranderen de energiescore niet', () => {
  const record = demo()[1];
  assert.deepEqual(scores(record), scores({ ...record, stress: 10, load: 3, breaks: 0, meals: 1 }));
});

test('voorbeeldgegevens worden telkens opnieuw aangemaakt en wijzigen elkaar niet', () => {
  const first = demo();
  const second = demo();
  first[0].mental = 0;
  first[1].factors.push('Anders');
  assert.equal(second[0].mental, 7);
  assert.deepEqual(second[1].factors, ['Studie & deadlines']);
  assert.ok(second.every(validRecord));
});
