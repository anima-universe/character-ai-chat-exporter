// What you see on the page: a small panel in its own shadow root, so neither side's styles touch the
// other. The session comes from the page itself, the file is made here and saved by the browser. It runs
// only after you press the toolbar button, and it keeps nothing once the tab is closed.
(() => {
    if (globalThis.__caiExporterPanel) {
        globalThis.__caiExporterPanel.show();
        return;
    }
    const core = globalThis.CaiExporterCore;
    const t = (key, ...subs) => chrome.i18n.getMessage(key, subs.map(String)) || key;
    const lang = chrome.i18n.getUILanguage().toLowerCase().split(/[-_]/)[0];
    const n = (v) => Number(v).toLocaleString(lang);
    /** Documents of the viewer exist on these languages; elsewhere the English one. */
    const VIEWER_LANGS = ['ja', 'ko', 'zh', 'fr', 'pt', 'de', 'it', 'es', 'ru'];
    const viewerUrl = () =>
        `https://amavie.ai/${VIEWER_LANGS.includes(lang) ? `${lang}/` : ''}character-ai-export?utm_source=cai_exporter&utm_medium=extension`;
    // Firefox runs a content script's own fetch outside the page; `content.fetch` asks as the page does.
    const pageFetch = typeof content !== 'undefined' && content.fetch ? content.fetch.bind(content) : fetch.bind(globalThis);

    /** A request that hangs must not hold the export for good: it counts as a network error, and is tried again. */
    const timedFetch = (url, init) =>
        Promise.race([pageFetch(url, init), new Promise((_, fail) => setTimeout(() => fail(new Error('timeout')), 30_000))]);

    let stopped = false;
    const waits = new Set();
    const sleep = (ms) =>
        new Promise((done) => {
            const wake = () => {
                waits.delete(wake);
                clearTimeout(timer);
                done();
            };
            const timer = setTimeout(wake, ms);
            waits.add(wake);
        });

    /** The session: Character.AI's pages carry the signed-in user's API token in their Next.js data. */
    async function sessionToken() {
        const fromData = (text) => {
            try {
                const token = JSON.parse(text)?.props?.pageProps?.token;
                return typeof token === 'string' && token ? `Token ${token}` : undefined;
            } catch {
                return undefined;
            }
        };
        const here = document.getElementById('__NEXT_DATA__')?.textContent;
        const token = here && fromData(here);
        if (token) return token;
        try {
            const res = await timedFetch(`/?_d=${Date.now()}`, { cache: 'no-store' });
            const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
            const text = doc.getElementById('__NEXT_DATA__')?.textContent;
            return text ? fromData(text) : undefined;
        } catch {
            return undefined;
        }
    }

    function save(parts, name, type) {
        const url = URL.createObjectURL(new Blob(parts, { type }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.style.display = 'none';
        document.documentElement.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    // The panel.
    const CSS = `
:host { all: initial; }
.panel { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; width: 340px; max-width: calc(100vw - 32px); box-sizing: border-box;
  padding: 18px; border-radius: 16px; background: #161917; color: #f3f5f2; font: 14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .45); }
.head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.mark { width: 28px; height: 28px; flex: none; }
.mark svg { display: block; width: 100%; height: 100%; }
.head b { flex: 1; font-size: 15px; font-weight: 650; }
.x { all: unset; cursor: pointer; width: 28px; height: 28px; border-radius: 8px; text-align: center; line-height: 28px; font-size: 18px; color: #aab2a9; }
.x:hover, .x:focus-visible { background: #262b27; color: #fff; }
p { margin: 0 0 12px; color: #c9d0c8; }
.status { color: #f3f5f2; margin-bottom: 2px; overflow-wrap: anywhere; }
.counts { color: #aab2a9; font-variant-numeric: tabular-nums; margin-bottom: 12px; }
button.main, a.main { all: unset; box-sizing: border-box; display: block; width: 100%; cursor: pointer; text-align: center; padding: 11px 14px; border-radius: 12px;
  font-weight: 650; background: #c4f59c; color: #10140f; margin-top: 8px; }
button.main:hover, a.main:hover { background: #b4ec86; }
button.alt { all: unset; box-sizing: border-box; display: block; width: 100%; cursor: pointer; text-align: center; padding: 10px 14px; border-radius: 12px;
  background: #262b27; color: #f3f5f2; margin-top: 8px; }
button.alt:hover { background: #30362f; }
:focus-visible { outline: 2px solid #c4f59c; outline-offset: 2px; }
.note { margin: 12px 0 0; font-size: 12px; color: #8f978e; }
.error { color: #ffb4a8; }
`;
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.dir = chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
    panel.setAttribute('aria-label', t('name'));
    root.append(style, panel);
    // A page's rules can stop a style element; a constructed sheet is not touched by them, where the browser allows it here.
    try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(CSS);
        root.adoptedStyleSheets = [sheet];
    } catch {
        // Firefox does not allow it from an extension; the style element above does the work there.
    }
    document.documentElement.append(host);

    const el = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    /** The mark, drawn here: a picture from the package could be stopped by the page's own rules. */
    function markSvg() {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 128 128');
        svg.setAttribute('aria-hidden', 'true');
        const add = (name, attrs) => {
            const node = document.createElementNS(NS, name);
            for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
            svg.append(node);
        };
        add('rect', { x: 8, y: 8, width: 112, height: 112, rx: 26, fill: '#C4F59C' });
        add('path', { d: 'M30 34a10 10 0 0 1 10-10h48a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10H58L40 102V84a10 10 0 0 1-10-10z', fill: '#10140F' });
        add('path', { d: 'M64 36v26M52 52l12 12 12-12', stroke: '#C4F59C', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' });
        return svg;
    }

    function render(...children) {
        const head = el('div', 'head');
        const icon = el('span', 'mark');
        icon.append(markSvg());
        const close = el('button', 'x', '×');
        close.setAttribute('aria-label', t('close'));
        close.onclick = () => host.remove();
        head.append(icon, el('b', '', t('name')), close);
        panel.replaceChildren(head, ...children);
    }
    const button = (cls, text, onclick) => {
        const b = el('button', cls, text);
        b.onclick = onclick;
        return b;
    };
    const countsLine = (c) => t('counts', n(c.characters), n(c.chats), n(c.messages));

    function showIdle(problem) {
        render(
            problem ? el('p', 'error', problem) : el('p', '', t('intro')),
            button('main', t('start'), start),
            el('p', 'note', t('credit')),
        );
    }

    function showReading(step) {
        const line = step.step === 'reading' ? t('reading', step.name || '…', n(step.character), n(step.characters), n(step.chat), n(step.chats)) : t('finding');
        render(
            el('div', 'status', stopped ? t('stopping') : line),
            el('div', 'counts', step.counts ? countsLine(step.counts) : ''),
            button('alt', t('stop'), () => {
                stopped = true;
                for (const wake of [...waits]) wake();
                showReading(step);
            }),
        );
    }

    function showDone(out, problem) {
        const jsonName = core.fileName(out, 'json');
        const open = el('a', 'main', t('openViewer'));
        open.href = viewerUrl();
        open.target = '_blank';
        open.rel = 'noopener';
        render(
            ...(problem ? [el('p', 'error', problem)] : []),
            el('div', 'status', out.partial ? t('donePartial') : t('done')),
            el('div', 'counts', countsLine(core.countsOf(out))),
            el('p', '', t('where', jsonName)),
            open,
            button('alt', t('saveText'), () => save(core.textParts(out), core.fileName(out, 'txt'), 'text/plain;charset=utf-8')),
            button('alt', t('saveAgain'), () => save(core.jsonParts(out), jsonName, 'application/json')),
            el('p', 'note', t('viewerNote')),
        );
    }

    /** Saves what was read and says so; with nothing read there is no file to speak of. */
    function finish(out, problem) {
        if (!out || (out.characters.length === 0 && out.chats.length === 0)) {
            showIdle(problem ?? t('nothing'));
            return;
        }
        save(core.jsonParts(out), core.fileName(out, 'json'), 'application/json');
        showDone(out, problem);
    }

    async function start() {
        stopped = false;
        let step = { step: 'finding' };
        showReading(step);
        const token = await sessionToken();
        if (!token) {
            showIdle(t('signedOut'));
            return;
        }
        const api = core.createApi({
            fetch: timedFetch,
            token,
            sleep,
            isStopped: () => stopped,
            onBusy: () => render(el('div', 'status', t('busy')), el('div', 'counts', step.counts ? countsLine(step.counts) : '')),
        });
        let kept = null;
        try {
            const { out } = await core.readAccount({
                api,
                isStopped: () => stopped,
                say: (s) => {
                    step = s;
                    showReading(s);
                },
                keep: (out) => {
                    kept = out;
                },
            });
            finish(out);
        } catch (error) {
            if (kept) kept.partial = true;
            const message = error?.message;
            if (message === 'stopped') finish(kept);
            else finish(kept, message === 'signed-out' ? t('signedOut') : t('failed', message ?? ''));
        }
    }

    globalThis.__caiExporterPanel = {
        show() {
            if (!host.isConnected) document.documentElement.append(host);
        },
    };
    showIdle();
})();
