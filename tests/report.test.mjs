import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { canonicalKey, createDraft, scheduledWindow, validateReport, validateCollection, renderDaily, renderOutputs, buildRepository, main, isDate } from '../scripts/report.mjs';

// Synthetic content is deliberately isolated from data/reports and is never published.
const taxonomy = { version: 1, groups: [{ id: 'llm-recipe', title: 'LLM Recipe', topics: [{ id: '1.1', slug: 'data-curation-tokenization', title: 'Data Curation & Tokenization', description: 'Training data research.' }, { id: '1.2', slug: 'model-architecture-scaling-laws', title: 'Architecture', description: 'Model architecture research.' }] }] };
const config = { schema_version: 1, timezone: 'America/Los_Angeles', schedule: { local_time: '03:00' }, max_entries: 10, lookback_hours: 24, discovery_lookback_hours: 72, summary_sentences: { min: 2, max: 3 } };
const now = new Date('2026-09-30T13:00:00Z');
const options = { taxonomy, config, now };
function report(date = '2026-09-29') {
  return { schema_version: 1, date, timezone: config.timezone, generated_at: `${date}T03:30:00-07:00`, coverage: scheduledWindow(date, config), search: { status: 'complete', notes: '', sources_checked: [{ name: 'arXiv', url: 'https://arxiv.org/list/cs.CL/recent', status: 'ok' }] }, entries: [{ id: 'synthetic-test-item', title: 'Synthetic test research item', category: '1.1', tags: ['Data', 'Training'], published_on: date, first_seen_at: `${date}T03:20:00-07:00`, canonical_url: 'https://arxiv.org/abs/2609.12345v1', links: { paper: 'https://arxiv.org/pdf/2609.12345v1' }, summary: ['A synthetic study evaluates a training data selection method.', 'It illustrates how the report pipeline represents useful research.'], evidence: { type: 'research-paper', access: 'full-text', rationale: 'This is a synthetic fixture used for validation tests.', limitations: 'This is not an actual research result.' }, novelty: 'new' }] };
}
function record(value) { return { report: value, filePath: `data/reports/${value.date.slice(0, 4)}/${value.date.slice(5, 7)}/${value.date}.json` }; }
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'llm-report-test-'));
  t.after(async () => {
    const resolved = path.resolve(root);
    assert.equal(resolved, root);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('llm-report-test-'));
    await rm(resolved, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'config'), { recursive: true });
  await writeFile(path.join(root, 'config/taxonomy.json'), JSON.stringify(taxonomy));
  await writeFile(path.join(root, 'config/report.json'), JSON.stringify(config));
  return root;
}
async function saveReport(root, value) {
  const file = path.join(root, record(value).filePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value));
  return file;
}

test('a complete, correctly located report passes structural and editorial checks', () => {
  const value = report();
  assert.deepEqual(validateReport(value, { ...options, filePath: record(value).filePath }), []);
});
test('calendar dates and timestamps reject normalization, missing offsets and future publication', () => {
  assert.equal(isDate('2026-02-30'), false);
  assert.equal(isDate('2024-02-29'), true);
  const value = report();
  value.generated_at = '2026-09-29T24:00:00Z';
  value.entries[0].first_seen_at = '2026-09-29T03:00:00';
  value.entries[0].published_on = '2026-10-01';
  const errors = validateReport(value, options).join('\n');
  assert.match(errors, /generated_at/);
  assert.match(errors, /first_seen_at/);
  assert.match(errors, /future/);
});
test('wrong category, timezone, path, HTTP and missing evidence all fail', () => {
  const value = report();
  value.timezone = 'UTC';
  value.entries[0].category = '9.9';
  value.entries[0].canonical_url = 'http://arxiv.org/abs/2609.12345';
  delete value.entries[0].evidence;
  const errors = validateReport(value, { ...options, filePath: 'data/reports/wrong.json' }).join('\n');
  for (const pattern of [/timezone/, /path/, /category/, /HTTPS/, /evidence/]) assert.match(errors, pattern);
});
test('summaries require 2–3 English strings and reject placeholders without brittle sentence splitting', () => {
  const value = report();
  value.entries[0].summary = ['Only one sentence.'];
  assert.match(validateReport(value, options).join('\n'), /summary/);
  value.entries[0].summary = ['研究结果。', 'TODO: add the usefulness.'];
  const errors = validateReport(value, options).join('\n');
  assert.match(errors, /English/);
  assert.match(errors, /placeholder/);
  value.entries[0].summary = ['It uses e.g. a calibrated scoring function.', 'The result improves measured quality by 1.5 percentage points.'];
  assert.deepEqual(validateReport(value, options), []);
});
test('partial search requires explanation and successful retrieval; empty results remain publishable', () => {
  const value = report();
  value.search.status = 'partial';
  value.search.notes = '';
  assert.match(validateReport(value, options).join('\n'), /search.notes/);
  value.search.notes = 'One primary source was unavailable.';
  value.search.sources_checked.push({ name: 'Unavailable source', url: 'https://openreview.net', status: 'unavailable' });
  value.entries = [];
  assert.deepEqual(validateReport(value, options), []);
  const markdown = renderDaily(value, taxonomy);
  assert.match(markdown, /PARTIAL SEARCH/);
  assert.match(markdown, /not a complete no-results finding/);
  value.search.sources_checked[0].status = 'unavailable';
  assert.match(validateReport(value, options).join('\n'), /total retrieval failure/);
});
test('source unavailable cannot be mislabeled as a complete search', () => {
  const value = report();
  value.search.sources_checked.push({ name: 'Other source', url: 'https://openreview.net', status: 'unavailable' });
  assert.match(validateReport(value, options).join('\n'), /requires search.status partial/);
});
test('generation and first-seen chronology cannot invent future observations', () => {
  const value = report();
  value.generated_at = '2026-10-01T03:30:00-07:00';
  value.entries[0].first_seen_at = '2026-10-02T03:20:00-07:00';
  const errors = validateReport(value, options).join('\n');
  assert.match(errors, /generated_at cannot be in the future/);
  assert.match(errors, /first_seen_at cannot be after/);
  value.generated_at = '2026-09-28T03:30:00-07:00';
  assert.match(validateReport(value, options).join('\n'), /coverage.end must not be after/);
});
test('freshness gates late discoveries while explicitly dated material updates can cite older work', () => {
  const value = report();
  value.entries[0].id = 'doi:10.1234/synthetic-test';
  assert.deepEqual(validateReport(value, options), []);
  value.entries[0].published_on = '2026-09-26';
  assert.match(validateReport(value, options).join('\n'), /predates the daily coverage/);
  value.entries[0].novelty = 'newly-discovered';
  assert.deepEqual(validateReport(value, options), []);
  value.entries[0].published_on = '2026-09-25';
  assert.match(validateReport(value, options).join('\n'), /outside the discovery lookback/);
  value.entries[0].novelty = 'material-update';
  value.entries[0].update_note = '2026-09-29: New controlled evaluation results were published.';
  assert.deepEqual(validateReport(value, options), []);
});
test('canonical identities normalize arXiv PDF/version aliases, DOI aliases and tracking parameters', () => {
  assert.equal(canonicalKey('https://arxiv.org/abs/2609.12345v2'), canonicalKey('https://export.arxiv.org/pdf/2609.12345v1.pdf'));
  assert.equal(canonicalKey('https://doi.org/10.1234/ABC'), canonicalKey('https://dx.doi.org/10.1234/abc'));
  assert.equal(canonicalKey('https://research.test/paper?utm_source=digest#results'), canonicalKey('https://research.test/paper'));
});
test('within-report duplicate IDs and arXiv versions are rejected even as material updates', () => {
  const value = report();
  value.entries.push(structuredClone(value.entries[0]));
  value.entries[1].canonical_url = 'https://arxiv.org/abs/2609.12345v2';
  value.entries[1].novelty = 'material-update';
  value.entries[1].update_note = '2026-09-29: New evaluation results were added.';
  const errors = validateReport(value, options).join('\n');
  assert.match(errors, /duplicate id/);
  assert.match(errors, /duplicate canonical/);
});
test('distinct research can share project and code URLs without being treated as a duplicate', () => {
  const value = report();
  value.entries[0].links.project = 'https://github.com/vllm-project/vllm';
  const second = structuredClone(value.entries[0]);
  second.id = 'synthetic-second-item';
  second.canonical_url = 'https://arxiv.org/abs/2609.12346';
  second.links.paper = second.canonical_url;
  value.entries.push(second);
  assert.deepEqual(validateReport(value, options), []);
});
test('cross-date duplicates require an explicit material update with an explanation', () => {
  const first = report('2026-09-28');
  const second = report('2026-09-29');
  second.entries[0].id = 'another-stable-id';
  second.entries[0].canonical_url = 'https://arxiv.org/html/2609.12345v2';
  assert.match(validateCollection([record(second), record(first)], options).join('\n'), /repeats a source/);
  second.entries[0].novelty = 'material-update';
  assert.match(validateCollection([record(first), record(second)], options).join('\n'), /update_note/);
  second.entries[0].update_note = '2026-09-29: The new version adds a controlled comparison.';
  assert.deepEqual(validateCollection([record(first), record(second)], options), []);
});
test('03:00 windows use Los Angeles DST and remain contiguous across both transitions', () => {
  const spring = scheduledWindow('2026-03-08', config);
  const fall = scheduledWindow('2026-11-01', config);
  assert.equal(spring.start, '2026-03-07T03:00:00-08:00');
  assert.equal(spring.end, '2026-03-08T03:00:00-07:00');
  assert.equal((Date.parse(spring.end) - Date.parse(spring.start)) / 3_600_000, 23);
  assert.equal((Date.parse(fall.end) - Date.parse(fall.start)) / 3_600_000, 25);
  assert.equal(scheduledWindow('2026-03-09', config).start, spring.end);
  assert.equal(scheduledWindow('2026-11-02', config).start, fall.end);
});
test('draft coverage uses the scheduled cutoff rather than delayed execution time and cannot validate', () => {
  const draft = createDraft('2026-09-29', config, now);
  assert.equal(draft.coverage.end, '2026-09-29T03:00:00-07:00');
  assert.equal(draft.generated_at, now.toISOString());
  assert.match(validateReport(draft, options).join('\n'), /checked source/);
});
test('rendering is deterministic, escapes source text, includes populated daily sections and all topic indexes', () => {
  const value = report();
  value.entries[0].title = 'A <script> title [with brackets]';
  value.entries[0].evidence.access = 'abstract-only';
  const outputs = renderOutputs([record(value)], taxonomy);
  assert.deepEqual([...outputs], [...renderOutputs([record(value)], taxonomy)]);
  const daily = outputs.get('reports/2026/09/2026-09-29.md');
  assert.match(daily, /&lt;script&gt;/);
  assert.match(daily, /LOW CONFIDENCE/);
  assert.doesNotMatch(daily, /### 1\.2/);
  assert.match(outputs.get('topics/llm-recipe/model-architecture-scaling-laws/README.md'), /No research/);
  assert.equal(JSON.parse(outputs.get('data/index.json')).reports[0].source, 'data/reports/2026/09/2026-09-29.json');
  assert.equal(JSON.parse(outputs.get('data/index.json')).entries[0].report_date, '2026-09-29');
  assert.match(daily, /First seen/);
});
test('build then check passes; changed and stale extra generated files are detected without mutation', async t => {
  const root = await fixture(t);
  await saveReport(root, report());
  await buildRepository(root, { now });
  await buildRepository(root, { now, check: true });
  const daily = path.join(root, 'reports/2026/09/2026-09-29.md');
  const correct = await readFile(daily, 'utf8');
  await writeFile(daily, `${correct}\nchanged\n`);
  await assert.rejects(buildRepository(root, { now, check: true }), /Missing or changed/);
  assert.match(await readFile(daily, 'utf8'), /changed/);
  await buildRepository(root, { now });
  const extra = path.join(root, 'reports/2026/09/2026-09-28.md');
  await writeFile(extra, correct);
  await assert.rejects(buildRepository(root, { now, check: true }), /Extra generated path/);
  await buildRepository(root, { now });
  await assert.rejects(access(extra), { code: 'ENOENT' });
});
test('invalid input prevents every generated write, preserving a previously built archive', async t => {
  const root = await fixture(t);
  await saveReport(root, report());
  await buildRepository(root, { now });
  const archive = path.join(root, 'reports/README.md');
  const before = await readFile(archive, 'utf8');
  const invalid = report('2026-09-30');
  invalid.entries[0].evidence = null;
  await saveReport(root, invalid);
  await assert.rejects(buildRepository(root, { now }), /Validation failed/);
  assert.equal(await readFile(archive, 'utf8'), before);
  await assert.rejects(access(path.join(root, 'reports/2026/09/2026-09-30.md')), { code: 'ENOENT' });
});
test('build preserves unrelated files and refuses to delete unrecognized managed-path content', async t => {
  const root = await fixture(t);
  await buildRepository(root, { now });
  await writeFile(path.join(root, 'topics/notes.txt'), 'User notes.');
  await buildRepository(root, { now });
  assert.equal(await readFile(path.join(root, 'topics/notes.txt'), 'utf8'), 'User notes.');
  const unknown = path.join(root, 'topics/user/custom/README.md');
  await mkdir(path.dirname(unknown), { recursive: true });
  await writeFile(unknown, 'User-owned content.');
  await assert.rejects(buildRepository(root, { now }), /Unrecognized files/);
  assert.equal(await readFile(unknown, 'utf8'), 'User-owned content.');
});
test('new creates an unpublished draft and refuses to overwrite existing work', async t => {
  const root = await fixture(t);
  await main(['new', '2026-09-29'], root);
  assert.equal(JSON.parse(await readFile(path.join(root, 'drafts/2026-09-29.json'), 'utf8')).search.status, 'partial');
  await assert.rejects(access(path.join(root, 'data/reports')), { code: 'ENOENT' });
  await assert.rejects(main(['new', '2026-09-29'], root), { code: 'EEXIST' });
});
