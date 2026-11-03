// What the extension asks for and what it says: the promises in the README and the stores, as checks.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.base.json'), 'utf8'));
const locales = readdirSync(join(ROOT, '_locales'));
const messages = (lang) => JSON.parse(readFileSync(join(ROOT, '_locales', lang, 'messages.json'), 'utf8'));
const source = (name) => readFileSync(join(ROOT, 'src', name), 'utf8');

test('asks only for the tab you press the button on: no standing access to any site', () => {
    assert.deepEqual([...manifest.permissions].sort(), ['activeTab', 'scripting']);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(manifest.content_scripts, undefined);
});

test('talks only to Character.AI: no other address in the code that runs on the page, apart from the link to the viewer', () => {
    const addresses = (name) => [...source(name).matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(addresses('core.js'))], ['neo.character.ai']);
    assert.deepEqual([...new Set(addresses('page.js'))], ['amavie.ai']);
    assert.ok(!/sendBeacon|XMLHttpRequest|WebSocket|eval\(|new Function|analytics/i.test(source('core.js') + source('page.js')));
});

test('every language has every string, with the same placeholders, within store limits', () => {
    assert.ok(locales.length >= 12);
    const en = messages('en');
    const slots = (m) => [...m.matchAll(/\$([A-Z]+)\$/g)].map((x) => x[1]).sort().join();
    for (const lang of locales) {
        const table = messages(lang);
        assert.deepEqual(Object.keys(table).sort(), Object.keys(en).sort(), lang);
        for (const [key, entry] of Object.entries(table)) {
            assert.equal(slots(entry.message), slots(en[key].message), `${lang}.${key}`);
            assert.deepEqual(Object.values(entry.placeholders ?? {}).map((p) => p.content).sort(), Object.values(en[key].placeholders ?? {}).map((p) => p.content).sort(), `${lang}.${key}`);
        }
        assert.ok(table.name.message.length <= 45, `${lang} name`);
        assert.ok(table.description.message.length <= 132, `${lang} description`);
    }
});

test('every word the panel asks for exists', () => {
    const en = messages('en');
    const used = [...source('page.js').matchAll(/\bt\('(\w+)'/g)].map((m) => m[1]);
    assert.ok(used.length > 10);
    for (const key of used) assert.ok(en[key], key);
});
