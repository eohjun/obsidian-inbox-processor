/**
 * Summary callout detection patterns ported from inbox-helper.ts L49~57.
 */
export const SUMMARY_CALLOUT_PATTERNS: RegExp[] = [
  />\s*\[!summary\]/i,
  />\s*\[!abstract\]/i,
  />\s*\[!tldr\]/i,
  />\s*\[!note\]\s*(요약|Summary)/i,
  />\s*\[!info\]\s*(AI\s*요약|요약)/i,
  /##\s*(요약|Summary|AI\s*요약)/i,
  />\s*\[!quote\]\s*(요약|핵심)/i,
];

/** Regex to split text into keyword tokens */
export const KEYWORD_SPLIT_REGEX = /[\s,.;:?!()\[\]{}"""''`~·•_=+\\|/<>-]+/u;

/** Regex to detect Hangul characters */
export const HANGUL_REGEX = /[가-힣]/;

/** Maximum keywords to extract per note */
export const MAX_KEYWORDS = 8;
