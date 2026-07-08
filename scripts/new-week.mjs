// Interactive "add a new week" tool for the site owner. Prompts for a
// grade/week (e.g. grade 1, week 9), lets you type in words one at a time
// (or "remove" to drop the last one), looks each word up in the Merriam-
// Webster dictionary automatically (same lookup as scripts/enrich-wordlists.mjs),
// then writes:
//   - data/wordlists/grade<G>/week<W>.json   (the new bundled word list)
//   - data/wordlists/manifest.json           (adds/updates the week entry)
//   - lib/data/defaultWordLists.ts           (registers the import)
//
// Nothing is deployed automatically — this only prepares the files. Review
// the result, run `npm run build` to sanity-check, then commit & push;
// Netlify redeploys and the new week is live for every visitor.
//
// Run:  npm run new-week   (needs DICTIONARY_API_KEY in .env.local, like `npm run enrich`)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { loadDictionaryKey, lookupWord } from './lib/dictionaryLookup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORDLIST_DIR = join(ROOT, 'data', 'wordlists');
const MANIFEST_PATH = join(WORDLIST_DIR, 'manifest.json');
const REGISTRY_FILE = join(ROOT, 'lib', 'data', 'defaultWordLists.ts');

const EMOJIS = ['📝', '🌟', '🎯', '🌈', '🐶', '🐱', '🦊', '🐸', '🌺', '⭐', '🍎', '🎈', '🚀', '🏆', '🎵', '🚢', '🌧️', '💬'];

async function main() {
  const key = await loadDictionaryKey(ROOT);
  if (!key) {
    console.error(
      'Missing DICTIONARY_API_KEY (set env var or put it in .env.local, like `npm run enrich` needs). Aborting.',
    );
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => rl.question(q);

  console.log('📚 New week setup\n');

  let grade;
  while (true) {
    const raw = (await ask('Grade number (e.g. 1): ')).trim();
    const n = Number(raw);
    if (Number.isInteger(n) && n > 0) {
      grade = n;
      break;
    }
    console.log('  Please enter a positive whole number.');
  }

  let week;
  while (true) {
    const raw = (await ask('Week number (e.g. 9): ')).trim();
    const n = Number(raw);
    if (Number.isInteger(n) && n > 0) {
      week = n;
      break;
    }
    console.log('  Please enter a positive whole number.');
  }

  const jsonPath = join(WORDLIST_DIR, `grade${grade}`, `week${week}.json`);
  if (existsSync(jsonPath)) {
    const ans = (await ask(`⚠️  data/wordlists/grade${grade}/week${week}.json already exists. Overwrite? (y/N): `))
      .trim()
      .toLowerCase();
    if (ans !== 'y' && ans !== 'yes') {
      console.log('Cancelled.');
      rl.close();
      return;
    }
  }

  const defaultTitle = `Grade ${grade} · Week ${week}`;
  const title = (await ask(`Title (default "${defaultTitle}"): `)).trim() || defaultTitle;

  console.log(
    '\nType a word and press Enter to add it (auto-looked-up in the dictionary).\n' +
      'Type "remove" to drop the last word. Press Enter on a blank line when you\'re done.\n',
  );

  const words = [];
  while (true) {
    const raw = (await ask(`Word #${words.length + 1} (or "remove", or blank to finish): `)).trim();
    if (!raw) break;

    if (raw.toLowerCase() === 'remove') {
      const dropped = words.pop();
      console.log(dropped ? `  ✗ removed "${dropped.word}"` : '  (nothing to remove)');
      continue;
    }

    const word = raw.toLowerCase().replace(/[^a-z' -]/g, '');
    if (!word) {
      console.log('  (ignored — not a word)');
      continue;
    }
    if (words.some((w) => w.word === word)) {
      console.log(`  (already added "${word}")`);
      continue;
    }

    process.stdout.write(`  looking up "${word}"… `);
    let info = null;
    try {
      info = await lookupWord(word, key);
      console.log(
        info ? `found ✓${info.pronMw ? ` /${info.pronMw}/` : ''}${info.audioUrl ? ' 🔊' : ''}` : 'not in dictionary — add a definition manually later',
      );
    } catch (err) {
      console.log(`network error (${err.message}) — added without dictionary data`);
    }
    await new Promise((r) => setTimeout(r, 120)); // be gentle on the API

    const imgPath = existsSync(join(ROOT, 'public', 'img', `${word}.jpg`)) ? `/img/${word}.jpg` : '';
    words.push({
      id: `g${grade}w${week}-${word}`,
      word,
      def: info?.definitions?.[0] ?? '',
      sentence: info?.usage?.[0] ?? '',
      img: imgPath,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      tricky: false,
      chunksSource: 'auto',
      chunks: [],
      ...(info?.pronMw ? { pronMw: info.pronMw } : {}),
      ...(info?.audioUrl ? { audioUrl: info.audioUrl } : {}),
      ...(info?.partOfSpeech ? { partOfSpeech: info.partOfSpeech } : {}),
      ...(info?.usage?.length ? { usage: info.usage } : {}),
    });
  }

  rl.close();

  if (words.length === 0) {
    console.log('\nNo words added — nothing written.');
    return;
  }

  const list = { grade, week, title, words };
  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(list, null, 2) + '\n');
  console.log(`\n✓ wrote data/wordlists/grade${grade}/week${week}.json (${words.length} words)`);

  await updateManifest(grade, week, title, words.length);
  await updateRegistry(grade, week);

  console.log(
    '\nNext steps:\n' +
      `  1. Review data/wordlists/grade${grade}/week${week}.json (and add photos: drop them in img/, run \`npm run images\`, set each word's "img").\n` +
      '  2. `npm run build` to sanity-check the site still builds.\n' +
      '  3. git add -A && git commit -m "Add week ' +
      week +
      '" && git push — Netlify redeploys and everyone sees it.',
  );
}

async function updateManifest(grade, week, title, count) {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  let group = manifest.grades.find((g) => String(g.grade) === String(grade));
  if (!group) {
    group = { grade, label: `Grade ${grade}`, weeks: [] };
    const customIdx = manifest.grades.findIndex((g) => g.grade === 'custom');
    if (customIdx === -1) manifest.grades.push(group);
    else manifest.grades.splice(customIdx, 0, group);
  }
  const existing = group.weeks.find((w) => w.week === week);
  if (existing) {
    existing.title = title;
    existing.count = count;
  } else {
    group.weeks.push({ week, title, count });
  }
  group.weeks.sort((a, b) => a.week - b.week);
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log('✓ updated data/wordlists/manifest.json');
}

async function updateRegistry(grade, week) {
  let src = await readFile(REGISTRY_FILE, 'utf8');
  const varName = `g${grade}w${week}`;
  const registryKey = `${grade}:${week}`;
  const importPath = `@/data/wordlists/grade${grade}/week${week}.json`;

  if (src.includes(`'${registryKey}':`)) {
    console.log('✓ lib/data/defaultWordLists.ts already registers this grade/week — left as-is');
    return;
  }

  const importLine = `import ${varName} from '${importPath}';`;
  const customImportMarker = "import customW1 from '@/data/wordlists/custom/week1.json';";
  if (src.includes(customImportMarker)) {
    src = src.replace(customImportMarker, `${importLine}\n${customImportMarker}`);
  } else {
    // Fallback: append after the last import line.
    src = src.replace(/(^import .+;\n)(?!import)/m, `$1${importLine}\n`);
  }

  const registryEntry = `  '${registryKey}': ${varName} as WordList,\n`;
  src = src.replace(
    /(const REGISTRY: Record<string, WordList> = \{\n(?:.*\n)*?)(\};)/,
    `$1${registryEntry}$2`,
  );

  await writeFile(REGISTRY_FILE, src);
  console.log('✓ updated lib/data/defaultWordLists.ts');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

