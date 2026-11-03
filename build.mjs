#!/usr/bin/env node
// Builds dist/chrome and dist/firefox and a zip of each for the stores. Nothing is bundled or minified:
// what you read in src/ is what runs. Only manifest.json differs between the browsers.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const base = JSON.parse(readFileSync(join(ROOT, 'manifest.base.json'), 'utf8'));
const TARGETS = {
    chrome: { ...base, minimum_chrome_version: '110', background: { service_worker: 'src/background.js' } },
    firefox: {
        ...base,
        background: { scripts: ['src/background.js'] },
        browser_specific_settings: {
            gecko: {
                id: 'character-ai-chat-exporter@amavie.ai',
                strict_min_version: '140.0',
                data_collection_permissions: { required: ['none'] },
            },
            gecko_android: { strict_min_version: '142.0' },
        },
    },
};

rmSync(join(ROOT, 'dist'), { recursive: true, force: true });
for (const [target, manifest] of Object.entries(TARGETS)) {
    const out = join(ROOT, 'dist', target);
    mkdirSync(out, { recursive: true });
    for (const dir of ['src', 'icons', '_locales']) cpSync(join(ROOT, dir), join(out, dir), { recursive: true });
    cpSync(join(ROOT, 'LICENSE'), join(out, 'LICENSE'));
    writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    const zip = join(ROOT, 'dist', `character-ai-chat-exporter-${base.version}-${target}.zip`);
    execFileSync('zip', ['-qr', '-X', zip, '.'], { cwd: out });
    console.log(zip);
}
