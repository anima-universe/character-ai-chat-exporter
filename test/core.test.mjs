// How the exporter reads an account, against a stand-in for Character.AI's API.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import '../src/core.js';

const core = globalThis.CaiExporterCore;
const turn = (id, at, text, human, name, extra = {}) => ({
    turn_key: { chat_id: 'c', turn_id: id },
    create_time: at,
    author: { name, is_human: human },
    primary_candidate_id: `${id}-a`,
    candidates: [{ candidate_id: `${id}-a`, raw_content: text }],
    ...extra,
});

/** Answers by path; a function answers from what was asked. */
function stand(routes) {
    const asked = [];
    const fetch = async (url, init) => {
        const path = url.replace('https://neo.character.ai', '');
        asked.push({ path, init });
        const route = routes[path];
        const answer = typeof route === 'function' ? route(asked) : route;
        if (answer === undefined) return { ok: false, status: 404, json: async () => ({}) };
        if (typeof answer === 'number') return { ok: answer < 400, status: answer, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => answer };
    };
    return { fetch, asked };
}
const quick = { sleep: async () => {}, gapMs: 0, busyMs: 0, onBusy: () => {} };
const never = () => false;
const account = {
    '/user/': { user: { name: 'Sam', user: { username: 'sam', account: { name: 'Sam' } } } },
    '/character/v1/get_user_personas?force_refresh=0': { personas: [{ name: 'Me' }] },
    '/character/v1/get_characters_created_by_user': { characters: [{ external_id: 'mine', name: 'Own' }] },
    '/chats/recent/': { chats: [{ chat_id: 'c1', character_id: 'other', character_name: 'Mira', create_time: '2025-01-01T00:00:00Z' }] },
    '/chats/?character_ids=other&num_preview_turns=2': { chats: [{ chat_id: 'c1', character_id: 'other' }, { chat_id: 'c2', character_id: 'other' }] },
    '/chats/?character_ids=mine&num_preview_turns=2': { chats: [] },
    '/character/v1/get_character_info': { character: { external_id: 'other', name: 'Mira', greeting: 'Hi' } },
    '/character/v1/get_character': { character: { external_id: 'mine', name: 'Own', definition: 'Secret words', greeting: 'Hello' } },
    '/turns/c1/': { turns: [turn('t3', '2025-01-03T00:00:00Z', 'Third', true, 'Sam'), turn('t2', '2025-01-02T00:00:00Z', 'Second', false, 'Mira')], meta: { next_token: 'older' } },
    '/turns/c1/?next_token=older': { turns: [turn('t1', '2025-01-01T00:00:00Z', 'First', false, 'Mira')], meta: { next_token: null } },
    '/turns/c2/': { turns: [turn('z', '2025-02-01T00:00:00Z', 'Only', true, 'Sam')], meta: {} },
    '/chat/c1/conversation-facts/': { conversation_fact_overrides: { narrator: { overrides: { 'MEMORY BOX': { value: 'Likes tea' } } } } },
};
const read = (routes, isStopped = never) => {
    const { fetch } = stand(routes);
    const api = core.createApi({ fetch, token: 'Token x', isStopped, ...quick });
    return core.readAccount({ api, isStopped, say: () => {} });
};

test('reads chats oldest first, both sides labelled, each chat once', async () => {
    const { out } = await read(account);
    assert.equal(out.format, 'amavie.character-ai-export');
    assert.deepEqual(out.chats.map((c) => c.chat_id), ['c1', 'c2']);
    const c1 = out.chats[0];
    assert.deepEqual(c1.messages.map((m) => m.raw_content), ['First', 'Second', 'Third']);
    assert.deepEqual(c1.messages.map((m) => m.author.is_human), [false, false, true]);
    assert.equal(c1.memory, 'Likes tea');
    assert.equal(c1.messages[0].chat_id, 'c1');
    assert.equal(out.partial, false);
});

test('your own characters keep their definition, others do not ask for it, personas come along', async () => {
    const { out } = await read(account);
    const own = out.characters.find((c) => c.external_id === 'mine');
    const other = out.characters.find((c) => c.external_id === 'other');
    assert.equal(own.definition, 'Secret words');
    assert.equal(own.mine, true);
    assert.equal(other.mine, false);
    assert.equal(other.definition, undefined);
    assert.equal(out.personas[0].name, 'Me');
    assert.deepEqual(out.user, { username: 'sam', name: 'Sam' });
});

test('the chosen reply is the line; the others are kept beside it', () => {
    const t = {
        turn_key: { turn_id: 't' },
        primary_candidate_id: 'b',
        author: { is_human: false, name: 'Mira' },
        candidates: [{ candidate_id: 'a', raw_content: 'Old' }, { candidate_id: 'b', raw_content: 'Chosen' }],
    };
    const m = core.messageOf(t, 'c');
    assert.equal(m.raw_content, 'Chosen');
    assert.deepEqual(m.alternatives, ['Old']);
    assert.equal(core.messageOf({ candidates: [] }, 'c'), null);
});

test('an answer that names the same page again ends the chat instead of looping', async () => {
    let calls = 0;
    const { out } = await read({
        ...account,
        '/turns/c1/': () => {
            calls += 1;
            return { turns: [turn(`t${calls}`, '2025-01-01T00:00:00Z', `L${calls}`, true, 'Sam')], meta: { next_token: 'same' } };
        },
        '/turns/c1/?next_token=same': () => ({ turns: [], meta: { next_token: 'same' } }),
    });
    assert.equal(out.chats[0].messages.length, 1);
});

test('a pause the site asks for is waited out, and the request goes again', async () => {
    let first = true;
    let rests = 0;
    const routes = {
        ...account,
        '/turns/c2/': () => {
            if (first) {
                first = false;
                return 429;
            }
            return account['/turns/c2/'];
        },
    };
    const { fetch } = stand(routes);
    const api = core.createApi({ fetch, token: 'Token x', isStopped: never, ...quick, onBusy: () => (rests += 1) });
    const { out } = await core.readAccount({ api, isStopped: never, say: () => {} });
    assert.equal(rests, 1);
    assert.equal(out.chats.length, 2);
});

test('a chat the site refuses is left out; a dead session ends the export as signed out', async () => {
    const { out } = await read({ ...account, '/turns/c2/': 403 });
    assert.deepEqual(out.chats.map((c) => c.chat_id), ['c1']);
    await assert.rejects(read({ ...account, '/user/': 401 }), /signed-out/);
    await assert.rejects(read({ ...account, '/turns/c2/': 401, '/user/': (asked) => (asked.length > 1 ? 401 : account['/user/']) }), /signed-out/);
});

test('Stop keeps whole chats only and marks the file partial', async () => {
    let stop = false;
    const routes = {
        ...account,
        '/turns/c1/?next_token=older': () => {
            stop = false;
            return account['/turns/c1/?next_token=older'];
        },
        '/chat/c1/conversation-facts/': () => {
            stop = true;
            return {};
        },
    };
    const { out } = await read(routes, () => stop);
    assert.deepEqual(out.chats.map((c) => c.chat_id), ['c1']);
    assert.equal(out.partial, true);
    assert.deepEqual(core.countsOf(out), { characters: 1, chats: 1, messages: 3 });
});

test('the file in pieces is the same JSON, and the text names who said what', async () => {
    const { out } = await read(account);
    assert.deepEqual(JSON.parse(core.jsonParts(out).join('')), JSON.parse(JSON.stringify(out)));
    const text = core.textParts(out).join('');
    assert.match(text, /=== Mira \(3\) 2025-01-01 – 2025-01-03 ===/);
    assert.match(text, /\[Memory\] Likes tea/);
    assert.match(text, /\[2025-01-03 00:00\] Sam: Third/);
    assert.equal(core.fileName({ ...out, exported_at: '2026-11-03T10:00:00Z' }, 'json'), 'character-ai-chats-2026-11-03.json');
    assert.equal(core.fileName({ ...out, exported_at: '2026-11-03T10:00:00Z', partial: true }, 'txt'), 'character-ai-chats-2026-11-03-partial.txt');
});

test('the token goes to the API and nowhere else', async () => {
    const { fetch, asked } = stand(account);
    const api = core.createApi({ fetch, token: 'Token x', isStopped: never, ...quick });
    const seen = [];
    await core.readAccount({
        api: async (path, body) => {
            seen.push(path);
            return api(path, body);
        },
        isStopped: never,
        say: () => {},
    });
    assert.ok(asked.every((a) => a.init.headers.authorization === 'Token x'));
    assert.ok(seen.every((p) => p.startsWith('/')));
});
