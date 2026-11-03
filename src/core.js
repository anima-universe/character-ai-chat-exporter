// The exporter without a browser in it: how to ask Character.AI for your data, one request at a time,
// and what the file looks like. page.js gives it fetch, the session and the words on screen.
// It only reads. It never changes or deletes anything on the account, and it talks to Character.AI alone.
(() => {
    const FORMAT = 'amavie.character-ai-export';
    const API = 'https://neo.character.ai';
    /** Time between requests, so a long history does not load the site. */
    const GAP_MS = 300;
    /** How long to rest when the site asks for a pause (429). */
    const BUSY_MS = 10_000;
    const TRIES = 4;

    const listOf = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) : []);
    const str = (v) => (typeof v === 'string' && v.trim() ? v : undefined);

    /**
     * One request after the gap since the last. A pause the site asks for is waited out however often it
     * comes; server and network errors get a few tries. Null for a 404. A 401 or 403 means signed out only
     * if the profile is refused too; otherwise it is this one thing the site will not give.
     */
    function createApi({ fetch, token, sleep, isStopped, onBusy, gapMs = GAP_MS, busyMs = BUSY_MS }) {
        let last = 0;
        const api = async (path, body) => {
            for (let tries = 0; ;) {
                const wait = last + gapMs - Date.now();
                if (wait > 0) await sleep(wait);
                if (isStopped()) throw new Error('stopped');
                last = Date.now();
                let res;
                try {
                    res = await fetch(API + path, {
                        method: body ? 'POST' : 'GET',
                        headers: { accept: 'application/json', 'content-type': 'application/json', authorization: token },
                        ...(body && { body: JSON.stringify(body) }),
                    });
                } catch (error) {
                    if (isStopped()) throw new Error('stopped');
                    if (tries >= TRIES) throw error;
                    await sleep(1000 * 2 ** tries++);
                    continue;
                }
                if (res.status === 429) {
                    onBusy();
                    await sleep(busyMs);
                    continue;
                }
                if (res.status === 401 || res.status === 403) {
                    if (path === '/user/') throw new Error('signed-out');
                    const me = await fetch(API + '/user/', { headers: { accept: 'application/json', authorization: token } }).catch(() => null);
                    throw new Error(me && (me.status === 401 || me.status === 403) ? 'signed-out' : 'refused');
                }
                if (res.status === 404) return null;
                if (!res.ok) {
                    if (tries >= TRIES) throw new Error(`Character.AI answered ${res.status}`);
                    await sleep(1000 * 2 ** tries++);
                    continue;
                }
                return res.json();
            }
        };
        return api;
    }

    /** A request the export can go without (a character's details, a memory box). */
    const optional = (asked) =>
        asked.catch((error) => {
            if (error?.message === 'stopped' || error?.message === 'signed-out') throw error;
            return null;
        });

    /** The line a turn shows: its chosen reply, with the other replies you could swipe to kept beside it. */
    function messageOf(turn, chatId) {
        const candidates = listOf(turn?.candidates);
        const primary = candidates.find((c) => c.candidate_id === turn.primary_candidate_id) ?? candidates[candidates.length - 1];
        const text = str(primary?.raw_content);
        if (!text) return null;
        const others = candidates.filter((c) => c !== primary).map((c) => str(c.raw_content)).filter(Boolean);
        return {
            chat_id: chatId,
            turn_id: turn.turn_key?.turn_id,
            create_time: turn.create_time,
            raw_content: text,
            author: { name: str(turn.author?.name) ?? '', is_human: turn.author?.is_human === true },
            ...(others.length > 0 && { alternatives: others }),
            ...(turn.is_pinned === true && { is_pinned: true }),
        };
    }

    /**
     * Every line of a chat, oldest first, or null when Stop came before its oldest page: a chat saved
     * without its start would look whole. The API pages newest first; a page with nothing new, or a next
     * page asked for already, ends the chat, so an answer naming the same page cannot loop forever.
     */
    async function linesOf(api, chatId, isStopped, onPage) {
        const pages = [];
        const asked = new Set();
        const seen = new Set();
        let next;
        let fresh;
        do {
            if (isStopped()) return null;
            const page = await api(`/turns/${encodeURIComponent(chatId)}/${next ? `?next_token=${encodeURIComponent(next)}` : ''}`);
            fresh = listOf(page?.turns).filter((t) => {
                const id = t.turn_key?.turn_id;
                if (id === undefined) return true;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
            pages.push(fresh);
            onPage(fresh.length);
            asked.add(next);
            next = page?.meta?.next_token;
        } while (next && fresh.length > 0 && !asked.has(next));
        const turns = pages.reverse().flatMap((p) => [...p].reverse());
        const at = (t) => Date.parse(t.create_time);
        if (turns.every((t) => Number.isFinite(at(t)))) turns.sort((a, b) => at(a) - at(b));
        return turns.map((t) => messageOf(t, chatId)).filter(Boolean);
    }

    /** A character's details: your own with the definition, anyone else's as the site shows them. */
    async function characterOf(api, id, mine) {
        const ask = (what) => optional(api(`/character/v1/${what}`, { external_id: id }));
        const first = await ask(mine ? 'get_character' : 'get_character_info');
        if (str(first?.character?.name) || str(first?.character?.participant__name)) return first.character;
        return null;
    }

    /**
     * Reads the account into the export. `say` hears the progress, `keep` gets the export as it grows, so
     * Stop or a failure halfway still saves what is done: the file says `partial`, and a chat is either
     * whole or not there.
     */
    async function readAccount({ api, isStopped, say, keep = () => {} }) {
        const out = {
            format: FORMAT,
            version: 1,
            source: 'character.ai',
            exported_at: new Date().toISOString(),
            partial: false,
            user: null,
            personas: [],
            characters: [],
            chats: [],
        };
        const counts = { characters: 0, chats: 0, messages: 0 };
        keep(out, counts);
        const me = await api('/user/');
        const user = me?.user?.user;
        if (user && typeof user === 'object') out.user = { username: user.username, name: user.account?.name ?? me.user.name };

        say({ step: 'finding', counts });
        out.personas = listOf((await optional(api('/character/v1/get_user_personas?force_refresh=0')))?.personas);
        const mine = new Map();
        for (const c of listOf((await optional(api('/character/v1/get_characters_created_by_user')))?.characters)) {
            if (str(c.external_id)) mine.set(c.external_id, c);
        }
        const recent = listOf((await optional(api('/chats/recent/')))?.chats);
        const ids = [];
        for (const c of recent) if (str(c.character_id) && !ids.includes(c.character_id)) ids.push(c.character_id);
        for (const id of mine.keys()) if (!ids.includes(id)) ids.push(id);

        const taken = new Set();
        for (const [i, id] of ids.entries()) {
            if (isStopped()) break;
            const listed = await optional(api(`/chats/?character_ids=${encodeURIComponent(id)}&num_preview_turns=2`));
            const known = [...listOf(listed?.chats), ...recent.filter((c) => c.character_id === id)];
            const chats = known.filter((c) => {
                if (!str(c.chat_id) || taken.has(c.chat_id)) return false;
                if (str(c.character_id) && c.character_id !== id) return false;
                taken.add(c.chat_id);
                return true;
            });
            const own = mine.get(id);
            const details = await characterOf(api, id, Boolean(own));
            const named = known.map((c) => str(c.character_name)).find(Boolean);
            const character = { ...own, ...details, external_id: id, mine: Boolean(own) };
            const name = str(character.name) ?? str(character.participant__name) ?? named ?? '';
            if (name) character.name = name;
            out.characters.push(character);
            counts.characters += 1;
            for (const [j, c] of chats.entries()) {
                if (isStopped()) break;
                const tell = () => say({ step: 'reading', name, character: i + 1, characters: ids.length, chat: j + 1, chats: chats.length, counts });
                tell();
                let messages;
                try {
                    messages = await linesOf(api, c.chat_id, isStopped, (n) => {
                        counts.messages += n;
                        tell();
                    });
                } catch (error) {
                    if (error?.message !== 'refused') throw error;
                    continue;
                }
                if (!messages) break;
                const facts = await optional(api(`/chat/${encodeURIComponent(c.chat_id)}/conversation-facts/`));
                const memory = str(facts?.conversation_fact_overrides?.narrator?.overrides?.['MEMORY BOX']?.value);
                out.chats.push({
                    chat_id: c.chat_id,
                    character_id: id,
                    character_name: name,
                    create_time: c.create_time,
                    ...(memory && { memory }),
                    message_count: messages.length,
                    messages,
                });
                counts.chats += 1;
            }
        }
        out.partial = isStopped();
        return { out, counts };
    }

    /** The file in pieces: one history can outgrow what a single string may hold. */
    function jsonParts(out) {
        const { chats, ...head } = out;
        const parts = [JSON.stringify(head).slice(0, -1), ',"chats":['];
        chats.forEach((c, i) => parts.push(i ? ',' : '', JSON.stringify(c)));
        parts.push(']}');
        return parts;
    }

    /** The same chats as plain text, readable anywhere, years from now, without any app. */
    function textParts(out) {
        const parts = [];
        for (const chat of out.chats) {
            const first = chat.messages[0]?.create_time ?? '';
            const last = chat.messages[chat.messages.length - 1]?.create_time ?? '';
            parts.push(`=== ${chat.character_name || 'Chat'} (${chat.messages.length}) ${first.slice(0, 10)} – ${last.slice(0, 10)} ===\n`);
            if (chat.memory) parts.push(`[Memory] ${chat.memory}\n`);
            parts.push('\n');
            for (const m of chat.messages) {
                const when = typeof m.create_time === 'string' ? `[${m.create_time.slice(0, 16).replace('T', ' ')}] ` : '';
                parts.push(`${when}${m.author.name || (m.author.is_human ? 'You' : 'Character')}: ${m.raw_content}\n\n`);
            }
            parts.push('\n');
        }
        return parts;
    }

    /** What the file holds, counted from the file: chats dropped by Stop are not in it. */
    function countsOf(out) {
        return { characters: out.characters.length, chats: out.chats.length, messages: out.chats.reduce((sum, c) => sum + c.messages.length, 0) };
    }

    function fileName(out, ext) {
        return `character-ai-chats-${out.exported_at.slice(0, 10)}${out.partial ? '-partial' : ''}.${ext}`;
    }

    globalThis.CaiExporterCore = { FORMAT, createApi, messageOf, linesOf, readAccount, jsonParts, textParts, countsOf, fileName };
})();
