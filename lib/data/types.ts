// Core data model for SpellStar.

export type ChunkType =
  | 'consonant'
  | 'vowel'
  | 'digraph'
  | 'blend'
  | 'vowelTeam'
  | 'rControlled'
  | 'silentE'
  | 'other';

export interface PhonicsChunk {
  /** The grapheme(s) as they appear in the word, e.g. "sh", "o", "p". */
  text: string;
  /** Drives the default chunk color + teaching tooltip. */
  type: ChunkType;
}

export interface Word {
  id: string;
  word: string;
  def: string;
  sentence: string;
  /** Image url or base64 data URI (used in the lesson + manage thumbnails). Optional; emoji is the fallback. */
  img?: string;
  /** Optional separate image shown in image-based games (Picture Match, Memory Match). Falls back to `img`. */
  gameImg?: string;
  emoji?: string;
  /** Sight word — skips phonics segmentation, uses memorize card. */
  tricky: boolean;
  /** Sound chunks. Ignored/empty when tricky === true. */
  chunks: PhonicsChunk[];
  /** 'manual' once a parent edits chunks, so re-running the splitter won't clobber. */
  chunksSource?: 'auto' | 'manual';

  // --- Dictionary enrichment (Merriam-Webster). All optional. ---
  /** IPA transcription, e.g. "ˈstɑr". Drives letter↔sound alignment + display. */
  ipa?: string;
  /** Raw Merriam-Webster pronunciation notation, kept for reference. */
  pronMw?: string;
  /** Merriam-Webster audio mp3 URL — the DEFAULT word pronunciation (TTS is fallback). */
  audioUrl?: string;
  /** Extra example sentences from the dictionary (beyond `sentence`). */
  usage?: string[];
  partOfSpeech?: string;
}

export type GradeKey = number | 'custom';

export interface WordList {
  grade: GradeKey;
  week: number;
  title?: string;
  words: Word[];
  /** Set when a visitor customizes the list in their own browser. */
  updatedAt?: string;
  /**
   * For a local "Make Your Own List" draft: the grade/week the owner intends to
   * publish this as once exported and added to the bundled defaults, e.g. { grade: 1,
   * week: 9 } → "grade1/week9". Purely a label for the export step; doesn't change
   * where this draft lives in the app (still saved under grade/week 'custom'/1).
   */
  publishAs?: { grade: number; week: number };
}

export type Accent = 'en-US' | 'en-GB' | 'en-AU' | 'en-IN';

/** Lesson voicing: phoneme sounds vs. letter names (spell-out). */
export type LessonMode = 'sounds' | 'letters';

export interface Settings {
  accent: Accent;
  rate: number; // 0.5 - 1.5
  confetti: boolean;
  autospeak: boolean;
  lessonMode: LessonMode;
  /** Prefer the computer voice (TTS) over recorded dictionary audio. Default false. */
  preferTts: boolean;
  /** Soft client-side edit gate. null = no PIN set. Replaces hardcoded 'SpellABC'. */
  editPin: string | null;
  /** A parent's OWN Google Vision key, localStorage-only, never bundled. */
  visionApiKey?: string;
  /** A parent's OWN Merriam-Webster key for word lookups, localStorage-only. */
  dictionaryApiKey?: string;
  lastVisitedGrade?: GradeKey;
  lastVisitedWeek?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  accent: 'en-US',
  rate: 0.85,
  confetti: true,
  autospeak: true,
  lessonMode: 'sounds',
  preferTts: false,
  editPin: null,
};

export type GameId =
  | 'picture-match'
  | 'unscramble'
  | 'word-match'
  | 'fill-blank'
  | 'listen-write'
  | 'hangman'
  | 'speed-spell'
  | 'memory-match';

export interface GameResult {
  word: string;
  correct: boolean;
}

/** Manifest entry describing a bundled default word list. */
export interface ManifestEntry {
  grade: GradeKey;
  week: number;
  title: string;
  count: number;
}
