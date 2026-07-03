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

## Adding your own weekly words (as the site owner)

Each week is a JSON file under `data/wordlists/`. To add Grade 1, Week 9:

1. Copy `data/wordlists/grade1/week7.json` to `week9.json` and edit the words.
   - `tricky: true` marks a sight word (skips phonics). The app auto-suggests this in the
     in-app form, but in JSON you set it yourself.
   - `chunks` is the phonics breakdown. You can leave it and fix it in the app's **Manage**
     screen (the auto-splitter fills it in), or write it by hand.
2. Add an entry for it in `data/wordlists/manifest.json` (drives which routes are built).
3. Commit and push — Netlify rebuilds and deploys automatically.

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
