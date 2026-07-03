// One-off asset fetcher: downloads the Wikimedia Commons IPA-chart phoneme
// recordings (CC-BY-SA 3.0), converts them to MP3 (Safari can't play ogg), and
// stores them keyed by IPA phoneme under public/audio/phonemes/<ascii>.mp3.
//
// Writes data/phoneme-audio.json (files map + available list + attribution) and
// public/audio/phonemes/CREDITS.md. Requires ffmpeg on PATH. Run:  npm run audio
//
// Missing/renamed Commons files are skipped (that phoneme just uses TTS).

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'audio', 'phonemes');
const TMP = join(OUT_DIR, '_tmp.ogg');
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

// ipa: the phoneme key our aligner produces. ascii: filename base. commons: Commons File title.
const PHONEMES = [
  { ipa: 'p', ascii: 'p', commons: 'Voiceless bilabial plosive.ogg' },
  { ipa: 'b', ascii: 'b', commons: 'Voiced bilabial plosive.ogg' },
  { ipa: 't', ascii: 't', commons: 'Voiceless alveolar plosive.ogg' },
  { ipa: 'd', ascii: 'd', commons: 'Voiced alveolar plosive.ogg' },
  { ipa: 'k', ascii: 'k', commons: 'Voiceless velar plosive.ogg' },
  { ipa: 'ɡ', ascii: 'g', commons: 'Voiced velar plosive.ogg' },
  { ipa: 'f', ascii: 'f', commons: 'Voiceless labiodental fricative.ogg' },
  { ipa: 'v', ascii: 'v', commons: 'Voiced labiodental fricative.ogg' },
  { ipa: 'θ', ascii: 'th', commons: 'Voiceless dental fricative.ogg' },
  { ipa: 'ð', ascii: 'dh', commons: 'Voiced dental fricative.ogg' },
  { ipa: 's', ascii: 's', commons: 'Voiceless alveolar sibilant.ogg' },
  { ipa: 'z', ascii: 'z', commons: 'Voiced alveolar sibilant.ogg' },
  { ipa: 'ʃ', ascii: 'sh', commons: 'Voiceless palato-alveolar sibilant.ogg' },
  { ipa: 'ʒ', ascii: 'zh', commons: 'Voiced palato-alveolar sibilant.ogg' },
  { ipa: 'tʃ', ascii: 'ch', commons: 'Voiceless palato-alveolar affricate.ogg' },
  { ipa: 'dʒ', ascii: 'dj', commons: 'Voiced palato-alveolar affricate.ogg' },
  { ipa: 'm', ascii: 'm', commons: 'Bilabial nasal.ogg' },
  { ipa: 'n', ascii: 'n', commons: 'Alveolar nasal.ogg' },
  { ipa: 'ŋ', ascii: 'ng', commons: 'Velar nasal.ogg' },
  { ipa: 'l', ascii: 'l', commons: 'Alveolar lateral approximant.ogg' },
  { ipa: 'r', ascii: 'r', commons: 'Alveolar approximant.ogg' },
  { ipa: 'w', ascii: 'w', commons: 'Voiced labio-velar approximant.ogg' },
  { ipa: 'j', ascii: 'y', commons: 'Palatal approximant.ogg' },
  { ipa: 'h', ascii: 'h', commons: 'Voiceless glottal fricative.ogg' },
  { ipa: 'i', ascii: 'ee', commons: 'Close front unrounded vowel.ogg' },
  { ipa: 'ɪ', ascii: 'ih', commons: 'Near-close near-front unrounded vowel.ogg' },
  { ipa: 'ɛ', ascii: 'eh', commons: 'Open-mid front unrounded vowel.ogg' },
  { ipa: 'æ', ascii: 'ae', commons: 'Near-open front unrounded vowel.ogg' },
  { ipa: 'ɑ', ascii: 'aa', commons: 'Open back unrounded vowel.ogg' },
  { ipa: 'ʌ', ascii: 'uh', commons: 'Open-mid back unrounded vowel.ogg' },
  { ipa: 'ə', ascii: 'schwa', commons: 'Mid-central vowel.ogg' },
  { ipa: 'ʊ', ascii: 'uu', commons: 'Near-close near-back rounded vowel.ogg' },
  { ipa: 'ɔ', ascii: 'aw', commons: 'Open-mid back rounded vowel.ogg' },
  { ipa: 'u', ascii: 'oo', commons: 'Close back rounded vowel.ogg' },
];

// Wikimedia requires a descriptive User-Agent and rate-limits aggressive callers.
const UA = 'SpellStar-phoneme-fetch/1.0 (kids phonics app; +https://github.com/)';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'ignore' });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, tries = 5) {
  let wait = 800;
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
    if (res.status !== 429 && res.status !== 503) return res;
    await sleep(wait);
    wait *= 2;
  }
  return fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
}

async function resolveFile(title) {
  const url = `${COMMONS_API}?action=query&titles=${encodeURIComponent(
    'File:' + title,
  )}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
  const res = await fetchRetry(url);
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;
  const info = page.imageinfo?.[0];
  if (!info?.url) return null;
  const md = info.extmetadata ?? {};
  return {
    src: info.url,
    descUrl: info.descriptionurl,
    artist: (md.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(),
    license: md.LicenseShortName?.value ?? 'CC BY-SA 3.0',
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = {};
  const available = [];
  const attribution = [];

  for (const ph of PHONEMES) {
    try {
      const info = await resolveFile(ph.commons);
      if (!info) {
        console.warn(`· ${ph.ipa} (${ph.commons}): not found — TTS fallback`);
        continue;
      }
      const dl = await fetchRetry(info.src);
      if (!dl.ok) throw new Error(`download ${dl.status}`);
      await writeFile(TMP, Buffer.from(await dl.arrayBuffer()));
      const outMp3 = join(OUT_DIR, `${ph.ascii}.mp3`);
      // mono, normalized-ish, trimmed silence, small file
      await run('ffmpeg', ['-y', '-i', TMP, '-ac', '1', '-ar', '44100', '-b:a', '96k', outMp3]);
      files[ph.ipa] = ph.ascii;
      available.push(ph.ipa);
      attribution.push({
        ipa: ph.ipa,
        file: `${ph.ascii}.mp3`,
        source: info.descUrl,
        author: info.artist || 'Wikimedia Commons contributors',
        license: info.license,
      });
      console.log(`✓ ${ph.ipa} -> ${ph.ascii}.mp3`);
    } catch (err) {
      console.warn(`· ${ph.ipa}: ${err.message} — TTS fallback`);
    }
    await sleep(600);
  }

  await rm(TMP, { force: true });

  await writeFile(
    join(ROOT, 'data', 'phoneme-audio.json'),
    JSON.stringify({ files, available, attribution }, null, 2) + '\n',
  );

  const credits = [
    '# Phoneme audio credits',
    '',
    'These per-phoneme recordings come from the Wikimedia Commons IPA charts and',
    'are licensed under the Creative Commons Attribution-ShareAlike 3.0 license',
    '(CC BY-SA 3.0). Converted from OGG to MP3 for browser playback.',
    '',
    '| Phoneme | File | Source | Author | License |',
    '| --- | --- | --- | --- | --- |',
    ...attribution.map(
      (a) => `| ${a.ipa} | ${a.file} | ${a.source} | ${a.author} | ${a.license} |`,
    ),
    '',
  ].join('\n');
  await writeFile(join(OUT_DIR, 'CREDITS.md'), credits);

  console.log(`\nDone: ${available.length}/${PHONEMES.length} phonemes bundled.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
