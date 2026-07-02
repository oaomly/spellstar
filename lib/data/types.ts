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
  /** Image url or base64 data URI. Optional; emoji is the fallback. */
  img?: string;
  emoji?: string;
  /** Sight word — skips phonics segmentation, uses memorize card. */
  tricky: boolean;
  /** Sound chunks. Ignored/empty when tricky === true. */
  chunks: PhonicsChunk[];
  /** 'manual' once a parent edits chunks, so re-running the splitter won't clobber. */
  chunksSource?: 'auto' | 'manual';
}

export type GradeKey = number | 'custom';

export interface WordList {
  grade: GradeKey;
  week: number;
  title?: string;
  words: Word[];
  /** Set when a visitor customizes the list in their own browser. */
  updatedAt?: string;
}

export type Accent = 'en-US' | 'en-GB' | 'en-AU' | 'en-IN';

export interface Settings {
  accent: Accent;
  rate: number; // 0.5 - 1.5
  confetti: boolean;
  autospeak: boolean;
  /** Soft client-side edit gate. null = no PIN set. Replaces hardcoded 'SpellABC'. */
  editPin: string | null;
  /** A parent's OWN Google Vision key, localStorage-only, never bundled. */
  visionApiKey?: string;
  lastVisitedGrade?: GradeKey;
  lastVisitedWeek?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  accent: 'en-US',
  rate: 0.85,
  confetti: true,
  autospeak: true,
  editPin: null,
};

export type GameId =
  | 'picture-match'
  | 'unscramble'
  | 'word-match'
  | 'fill-blank'
  | 'listen-write'
  | 'hangman'
  | 'sound-hunt'
  | 'word-builder'
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
