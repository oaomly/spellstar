# SpellStar ⭐

A phonics-first spelling practice site for kids. Words are taught by **sound chunks**
(e.g. `sh · o · p`, `st · ar`) rather than pure memorization, with tricky sight words
(`said`, `was`) handled as a separate look-say-remember drill. Ten games let the child
freely pick what to play.

The lesson has **two voicing modes** (toggle at the top, remembered in Settings):

- **🔊 Sounds** — plays the *phoneme* of each chunk (/g/ /l/ /a/ /s/), then blends into the
  word. This is true phonics, like a phonics song.
- **🔤 Letter names** — spells the word out by letter name (gee · ell · ay · ess · ess).

### Dictionary enrichment (Merriam-Webster)

Word cards can carry real data from Merriam-Webster's Elementary Dictionary: **recorded
audio** (the default word pronunciation — TTS is the fallback), **IPA** pronunciation,
**definition**, **example sentences**, and **part of speech**. The lesson also shows the IPA
phoneme under each sound chunk, aligned by a letter→sound aligner (`lib/phonics/align.ts`)
since English isn't one-letter-one-sound (`cookie` = k·ʊ·k·iː).

- **Default word lists** are enriched at build time — no runtime key, nothing exposed:
  1. Put your key in `.env.local`: `DICTIONARY_API_KEY=...` (copy `.env.local.example`).
  2. Run `npm run enrich`. It fetches audio/pronunciation/definitions/usage and writes them
     into `data/wordlists/**.json`. Commit the result (the key is never written to the JSON).
- **Words parents add at runtime** use the **Look up** button in the Add-Word form, which
  goes through the Netlify function `dictionary` (owner key in the `DICTIONARY_API_KEY`
  Netlify env var) or a parent's own key pasted in Settings.

Set `DICTIONARY_API_KEY` in Netlify (Site settings → Environment variables) to enable runtime
lookups. As with the Vision key, it stays server-side and never ships to the browser.

### Authentic phoneme audio

Tapping a sound chunk plays **real recorded phoneme audio** keyed by IPA (the chunk already
knows its IPA from the letter→sound aligner). The clips are the Wikimedia Commons IPA-chart
recordings, bundled under `public/audio/phonemes/` — 34 phonemes covering the common
consonants and monophthong vowels. Diphthongs/blends without a single clip fall back to the
tuned TTS approximations.

- Regenerate the set with `npm run audio` (`scripts/fetch-phoneme-audio.mjs`): it resolves the
  Commons files, downloads them, converts OGG→MP3 (ffmpeg required), trims/normalizes, and
  writes `data/phoneme-audio.json` + `public/audio/phonemes/CREDITS.md`.
- **License:** the clips are **CC BY-SA 3.0**. Attribution per file is in
  `public/audio/phonemes/CREDITS.md` — keep it when you deploy.
- The recordings are authentic but linguist-recorded (a neutral "/s/", "/æ/"), not the warm
  phonics-song style. To swap in a warmer licensed set, replace the MP3s (same IPA-keyed
  filenames in `data/phoneme-audio.json`) — no code changes needed.

Built with **Next.js (App Router, static export)** — no accounts, no database. It runs
entirely in the browser (localStorage + Web Speech API), with one small Netlify function
for optional handwriting recognition.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # phonics + storage unit tests
npm run build      # static export into ./out
```

## Adding a new week of words (as the site owner)

Each week is a JSON file under `data/wordlists/`. There are two ways to add one.

### Option A — the interactive tool (recommended)

`npm run new-week` walks you through the whole thing and looks every word up in the dictionary
for you. Needs `DICTIONARY_API_KEY` in `.env.local` (same key as `npm run enrich`).

```bash
npm run new-week
```

It prompts for:

1. **Grade** and **week** number (e.g. `1` and `9` → publishes as `grade1/week9`), and a title.
2. **Words**, one at a time. Type a word and press Enter to add it — it's auto-looked-up
   (definition, example sentence, pronunciation, recorded audio, part of speech). Type
   `remove` to drop the last word, or press Enter on a blank line when you're done.

It then writes `data/wordlists/grade<G>/week<W>.json` **and** registers the week automatically in
`data/wordlists/manifest.json` and `lib/data/defaultWordLists.ts` — no hand-editing. Review the
result, then commit and push (see below). It does **not** deploy anything by itself.

### Option B — by hand

1. Copy `data/wordlists/grade1/week7.json` to e.g. `grade1/week9.json` and edit the `words`.
   - `tricky: true` marks a sight word.
   - Run `npm run enrich` to fill in dictionary data (audio/definition/usage), or fill it in
     via the app's **Manage** screen.
2. Add a matching entry in `data/wordlists/manifest.json` and an import + registry line in
   `lib/data/defaultWordLists.ts`.

### Adding pictures to words

Words show an emoji by default; you can give them a real photo instead:

1. Drop the image (PNG or JPG, any size) into the `img/` folder — this is a gitignored
   *drop folder*, not what gets served.
2. Run `npm run images`. It shrinks each one (max 640px wide) and writes a web-ready
   **`.jpg`** into `public/img/` (the folder that is actually served and committed).
3. In the word's JSON set `"img": "/img/<name>.jpg"` — always `.jpg`, even if you dropped a PNG.
   (Each run prints the exact line to paste.) If you drop a file named the same as the word,
   `npm run new-week` auto-links it for you.
4. **Optional — a different picture in the games:** also drop `<name>_games.png`, run
   `npm run images`, and set `"gameImg": "/img/<name>_games.jpg"`. Picture Match and Memory
   Match use `gameImg` when present and fall back to `img` otherwise.

### Publishing it

```bash
git add -A
git commit -m "Add week 9"
git push          # Netlify rebuilds and deploys automatically
```

## How other parents use it

They just open the deployed URL. On any week they can go to **Manage Words → Add Word** and
enter their own list. Their words are saved **only in their own browser** (localStorage) and
take precedence over the bundled default; a **Reset to Default** button restores yours. No
login, nothing is uploaded. Parents whose grade/week isn't bundled can use the **Make Your
Own List** bucket on the home screen.

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git**, pick the repo. Build settings come from
   `netlify.toml` (build `npm run build`, publish `out`, functions `netlify/functions`).
3. Deploy. Every push auto-deploys.

Alternatively, drag-and-drop the `out/` folder (after `npm run build`) into the Netlify
dashboard — but then you re-drag on every change and the handwriting function won't run.

### Optional: handwriting recognition (Listen & Write)

The **Listen & Write** game works with no setup — the child draws the word, taps "Show word",
and self-checks. To enable *automatic* grading of the handwriting:

- **For your default lists:** set a **Google Cloud Vision API key** as a private Netlify
  environment variable named `GOOGLE_VISION_KEY` (Site settings → Environment variables). It
  lives only on the server, behind the `vision-ocr` function — it is never sent to browsers.
  Restrict the key in Google Cloud (API + quota caps) as a safety net.
- **For other parents' custom lists:** they paste their *own* Vision key in **Settings**; it
  is stored only in their browser and used directly against Google.
- If neither is present, it falls back to the self-check flow automatically.

## Security note

The previous prototype (`week7.html`, kept only for reference) had a Google Vision API key
hardcoded in the page. That key was exposed and **should be rotated/deleted in Google Cloud**.
The new app never bundles any key.

## Project layout

- `app/` — routes (home, `grade/[grade]/week/[week]/{lesson,games,manage}`, settings)
- `components/` — UI (lesson cards, 10 games, word form + chunk editor, providers)
- `lib/phonics/` — the sound-chunk splitter, sight-word list, tricky-word suggester
- `lib/storage/` — localStorage word-list overrides + settings
- `lib/tts/` — Web Speech API hook
- `data/wordlists/` — bundled default content + manifest
- `netlify/functions/vision-ocr.ts` — the Vision proxy
