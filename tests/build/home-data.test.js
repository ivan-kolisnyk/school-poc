import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const raw = readFileSync(new URL('../../src/index.md', import.meta.url), 'utf8');
const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
const fm = parse(m[1]);
const body = m[2];

test('home front matter has exactly 3 pride items with value and label', () => {
  assert.ok(Array.isArray(fm.pride));
  assert.equal(fm.pride.length, 3);
  for (const p of fm.pride) {
    assert.ok(String(p.value ?? '').trim());
    assert.ok(String(p.label ?? '').trim());
  }
  assert.deepEqual(
    fm.pride.map((p) => [String(p.value), p.label]),
    [['000', 'Students'], ['PRE-K–8', 'Grades'], ['00:1', 'Student–teacher ratio']]
  );
});

test('hero heading + highlight is at most 8 words', () => {
  const words = `${fm.hero_heading} ${fm.hero_highlight}`.trim().split(/\s+/);
  assert.ok(words.length <= 8);
  assert.equal(fm.hero_heading, 'Curious minds.');
  assert.equal(fm.hero_highlight, 'Kind hearts.');
});

test('home front matter has the remaining content fields', () => {
  for (const k of ['hero_sub', 'hero_placeholder', 'welcome_title', 'welcome_photo_placeholder', 'welcome_link']) {
    assert.ok(String(fm[k] ?? '').trim(), k);
  }
  assert.equal(fm.welcome_link, '/about/principal/');
  assert.match(body, /Mrs\. Keri Mendez, Principal/);
  assert.doesNotMatch(body, /^## /m);
});
