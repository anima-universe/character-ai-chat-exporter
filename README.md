# Chat Exporter for Character.AI

Save your own Character.AI chats, the characters you talked to and made, your personas and memory boxes to one file on
your computer. It takes minutes, where the official export [can take 3 to 4 weeks](https://amavie.ai/is-character-ai-shutting-down).
The file stays on your device; nothing is uploaded anywhere.

- **Read it anywhere.** One JSON file, plus plain text if you want it.
- **Both sides labelled.** Every line says who wrote it and when, which the official export does not.
- **Your own characters with their definitions.** Characters made by other people come with what the site shows publicly.
- **Stop any time.** Stop saves every chat read so far.

**Open the file in the free viewer: [amavie.ai/character-ai-export](https://amavie.ai/character-ai-export).** It reads the
file in your browser, and the same viewer is [open source](https://github.com/anima-universe/character-ai-export-viewer).

## Install

- Chrome, Edge, Brave and other Chromium browsers: from the Chrome Web Store *(in review)*.
- Firefox: from Firefox Add-ons *(in review)*.
- By hand: run `npm run build`, open `chrome://extensions`, turn on Developer mode, press **Load unpacked** and choose
  `dist/chrome`.

## How to use

1. Sign in to Character.AI in a browser tab.
2. Press the extension's button in the toolbar. A small panel opens on the page.
3. Press **Save my chats** and leave the tab open. A long history can take a while: it asks for one thing at a time, so it
   does not load the site.

## What it does and does not do

- **It asks for no access in advance.** The permissions are `activeTab` and `scripting`: it can touch a tab only after you
  press its button on that tab, and only until you leave the site.
- **It only reads.** It never changes or deletes anything on your account.
- **It talks only to Character.AI**, with your own signed-in session, the way the site itself does. The session stays in the
  tab and is never saved or sent anywhere else.
- **No analytics, no servers, no remote code.** Nothing is bundled or minified: what you read in `src/` is what runs. The one
  outside address is the link to the viewer, which opens only if you press it.

## The file

```jsonc
{
  "format": "amavie.character-ai-export",
  "version": 1,
  "exported_at": "2026-11-03T10:00:00.000Z",
  "partial": false,                // true if you pressed Stop, or something failed halfway
  "user": { "username": "…", "name": "…" },
  "personas": [ … ],
  "characters": [ { "external_id": "…", "name": "…", "greeting": "…", "definition": "…", "mine": true } ],
  "chats": [ {
    "chat_id": "…", "character_id": "…", "character_name": "…", "memory": "…", "message_count": 2,
    "messages": [ {
      "chat_id": "…", "turn_id": "…", "create_time": "2025-01-01T10:00:00Z",
      "raw_content": "The line as it was chosen",
      "author": { "name": "…", "is_human": true },
      "alternatives": [ "Replies you could have swiped to" ]
    } ]
  } ]
}
```

## Develop

```bash
npm test        # how it reads an account, against a stand-in for the API, and what the package promises
npm run build   # dist/chrome, dist/firefox and a zip of each
```

Requires Node.js 20 or newer. `store/make-assets.mjs` draws the icons and store pictures and runs the extension in Chromium
against a stand-in for the API (it needs Playwright).

This repository is generated from Amavie's codebase, where a test keeps the file readable by the viewer.

## Not affiliated

Character.AI is a trademark of its owner. This extension is made by [Amavie](https://amavie.ai) and is not affiliated with,
endorsed by or sponsored by Character Technologies, Inc. You are responsible for how you use your own data; only keep
characters you have the right to use.

MIT licensed. Questions: support@amavie.ai.
