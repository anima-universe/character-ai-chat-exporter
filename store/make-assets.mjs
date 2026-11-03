#!/usr/bin/env node
// Icons, store pictures and a real run of the extension in Chromium against a stand-in for Character.AI:
// the panel opens, the button reads the account, the file downloads and parses. Needs Playwright:
//   npm i playwright && node store/make-assets.mjs [folder for the pictures]
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || join(ROOT, 'dist', 'store');
mkdirSync(OUT, { recursive: true });

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
<rect x="8" y="8" width="112" height="112" rx="26" fill="#C4F59C"/>
<path d="M30 34a10 10 0 0 1 10-10h48a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10H58L40 102V84a10 10 0 0 1-10-10z" fill="#10140F"/>
<path d="M64 36v26M52 52l12 12 12-12" stroke="#C4F59C" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const browser = await chromium.launch();
for (const size of [16, 32, 48, 128]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<!doctype html><style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${ICON}`);
    await page.screenshot({ path: join(ROOT, 'icons', `icon${size}.png`), omitBackground: true });
    await page.close();
}
await browser.close();

execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'ignore' });
// The stores' build asks for the tab when you press the button; a script cannot press it, so this copy may run on the stand-in by itself.
const dir = mkdtempSync(join(tmpdir(), 'cai-exporter-'));
cpSync(join(ROOT, 'dist', 'chrome'), dir, { recursive: true });
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
manifest.host_permissions = ['https://character.ai/*'];
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));

const context = await chromium.launchPersistentContext('', {
    headless: false,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
    args: ['--headless=new', `--disable-extensions-except=${dir}`, `--load-extension=${dir}`],
});

const backdrop = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Your chats</title>
<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"token":"stand-in"}}}</script>
<style>body{margin:0;background:#f2f3f1;font:15px system-ui;color:#23261f}main{max-width:640px;margin:0 auto;padding:48px 24px}
.b{max-width:70%;padding:12px 16px;border-radius:16px;margin:10px 0;background:#fff;line-height:1.45}.me{margin-left:auto;background:#dfe7d8}</style>
<main><div class="b">The rain stopped an hour ago, but the lanterns are still dripping on the pier.</div>
<div class="b me">Then we still have time. Did you bring the map?</div>
<div class="b">Of course. Though you may not like where it goes.</div>
<div class="b me">I never do. Show me.</div>
<div class="b">Here. The old lighthouse, then north along the cliffs.</div></main></html>`;
const turn = (id, at, text, human, name) => ({
    turn_key: { chat_id: 'c', turn_id: id }, create_time: at, author: { name, is_human: human },
    primary_candidate_id: `${id}-a`, candidates: [{ candidate_id: `${id}-a`, raw_content: text }],
});
const manyTurns = (chat, count) =>
    Array.from({ length: count }, (_, i) => turn(`${chat}-${count - i}`, new Date(Date.UTC(2025, 0, 1) + (count - i) * 60000).toISOString(), `Line ${count - i}`, i % 2 === 0, i % 2 === 0 ? 'You' : 'Mira'));
const CHARS = ['mira', 'orin', 'tess', 'kai', 'lena', 'bram'];
const NAMES = { mira: 'Mira', orin: 'Orin', tess: 'Tess', kai: 'Kai', lena: 'Lena', bram: 'Bram' };
let slow = 0;
await context.route('https://character.ai/**', (route) => route.fulfill({ contentType: 'text/html', body: backdrop }));
await context.route('https://neo.character.ai/**', async (route) => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': 'https://character.ai', 'access-control-allow-headers': 'authorization,content-type,accept', 'access-control-allow-methods': 'GET,POST' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    assert.equal(route.request().headers().authorization, 'Token stand-in');
    if (slow) await new Promise((done) => setTimeout(done, slow));
    const json = (body) => route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(body) });
    const p = url.pathname;
    if (p === '/user/') return json({ user: { name: 'You', user: { username: 'you', account: { name: 'You' } } } });
    if (p.endsWith('get_user_personas')) return json({ personas: [{ name: 'Traveller' }] });
    if (p.endsWith('get_characters_created_by_user')) return json({ characters: [{ external_id: 'orin', name: 'Orin' }] });
    if (p === '/chats/recent/') return json({ chats: CHARS.map((c) => ({ chat_id: `${c}-1`, character_id: c, character_name: NAMES[c], create_time: '2025-01-01T00:00:00Z' })) });
    if (p === '/chats/') {
        const c = url.searchParams.get('character_ids');
        return json({ chats: [{ chat_id: `${c}-1`, character_id: c }, { chat_id: `${c}-2`, character_id: c }] });
    }
    if (p.includes('get_character')) {
        const id = JSON.parse(route.request().postData()).external_id;
        return json({ character: { external_id: id, name: NAMES[id], greeting: 'Hi', ...(id === 'orin' && { definition: 'Keeper of the lighthouse.' }) } });
    }
    if (p.startsWith('/turns/')) {
        const chat = p.split('/')[2];
        return json({ turns: manyTurns(chat, 40), meta: {} });
    }
    return route.fulfill({ status: 404, headers, body: '{}' });
});

let worker = context.serviceWorkers()[0];
if (!worker) worker = await context.waitForEvent('serviceworker');
const page = await context.newPage();
await page.goto('https://character.ai/chat/demo');
const press = () => worker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/core.js', 'src/page.js'] });
});
await page.bringToFront();
await press();
const panel = page.locator('section.panel');
await panel.waitFor();
await panel.getByText('Save my chats').waitFor();
await page.screenshot({ path: join(OUT, 'screenshot-1-start.png') });

slow = 120;
await panel.getByRole('button', { name: 'Save my chats' }).click();
await panel.getByText(/chat 1 of 2 \(character 3 of 6\)/).waitFor({ timeout: 60000 });
await page.screenshot({ path: join(OUT, 'screenshot-2-reading.png') });
slow = 0;
const download = await page.waitForEvent('download', { timeout: 120000 });
const saved = join(dir, download.suggestedFilename());
await download.saveAs(saved);
await panel.getByText('Done. Your file is in Downloads.').waitFor();
await page.screenshot({ path: join(OUT, 'screenshot-3-done.png') });

const file = JSON.parse(readFileSync(saved, 'utf8'));
assert.match(download.suggestedFilename(), /^character-ai-chats-\d{4}-\d{2}-\d{2}\.json$/);
assert.equal(file.format, 'amavie.character-ai-export');
assert.equal(file.characters.length, 6);
assert.equal(file.chats.length, 12);
assert.equal(file.chats[0].messages.length, 40);
assert.equal(file.chats[0].messages[0].raw_content, 'Line 1');
assert.equal(file.characters.find((c) => c.external_id === 'orin').definition, 'Keeper of the lighthouse.');
await panel.getByText('Characters: 6 · Chats: 12 · Messages: 480').waitFor();
writeFileSync(join(OUT, 'sample-export.json'), JSON.stringify(file));

const textDownload = page.waitForEvent('download');
await panel.getByRole('button', { name: 'Also save as text' }).click();
assert.match((await textDownload).suggestedFilename(), /\.txt$/);
assert.ok((await panel.getByRole('link', { name: 'Read it in the free viewer' }).getAttribute('href')).startsWith('https://amavie.ai/character-ai-export?utm_source=cai_exporter'));

// The small tile for the store.
const tile = await context.newPage();
await tile.setViewportSize({ width: 440, height: 280 });
await tile.setContent(`<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{width:440px;height:280px;background:#161917;color:#f3f5f2;
font:600 30px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;padding:36px;display:flex;flex-direction:column;justify-content:space-between}
svg{width:72px;height:72px;display:block}small{display:block;font:400 16px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#c9d0c8;margin-top:8px}</style>
${ICON}<div>Save your Character.AI chats<small>To a file on your computer. Nothing uploaded.</small></div>`);
await tile.screenshot({ path: join(OUT, 'promo-tile-440x280.png') });

await context.close();
console.log('ok, pictures in', OUT);
