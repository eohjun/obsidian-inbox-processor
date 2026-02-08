/**
 * Keyword extraction service ported from inbox-helper.ts L81~140.
 * Extracts keywords from note title, content, and frontmatter tags.
 */

import {
  KEYWORD_SPLIT_REGEX,
  HANGUL_REGEX,
  MAX_KEYWORDS,
} from '../../domain/constants/patterns';

function normalizeKeywordToken(token: string): string | null {
  if (!token) return null;
  const trimmed = token.replace(/^#+/, '').trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/[^0-9A-Za-z가-힣]/gu, '')
    .replace(/^-+|-+$/g, '');
  if (!normalized) return null;
  if (HANGUL_REGEX.test(normalized)) return normalized;
  return normalized.toLowerCase();
}

function splitTokens(text: string): string[] {
  return text
    .split(KEYWORD_SPLIT_REGEX)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export class KeywordExtractor {
  extract(
    basename: string,
    content: string,
    frontmatter: Record<string, any> | null,
  ): string[] {
    const candidates: string[] = [];

    // 1. Title tokens
    candidates.push(...splitTokens(basename));

    // 2. Frontmatter tags (high priority, prepend)
    if (frontmatter) {
      const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      const tagStrings = tags
        .filter((t: unknown): t is string => typeof t === 'string' && t.length > 0);
      candidates.unshift(...tagStrings);

      // frontmatter keywords field
      const keywords = Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [];
      const kwStrings = keywords
        .filter((k: unknown): k is string => typeof k === 'string')
        .map(String);
      if (kwStrings.length > 0) {
        candidates.unshift(...kwStrings);
      }

      // frontmatter summary
      if (typeof frontmatter.summary === 'string' && frontmatter.summary) {
        candidates.push(...splitTokens(frontmatter.summary));
      }
    }

    // 3. Body first 500 characters tokens
    const bodySlice = content.slice(0, 500);
    candidates.push(...splitTokens(bodySlice));

    // 4. Normalize and deduplicate
    const hangul: string[] = [];
    const latin: string[] = [];
    const seen = new Set<string>();

    for (const candidate of candidates) {
      const normalized = normalizeKeywordToken(candidate);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      if (HANGUL_REGEX.test(normalized)) {
        hangul.push(normalized);
      } else {
        latin.push(normalized);
      }
    }

    return [...hangul, ...latin].slice(0, MAX_KEYWORDS);
  }
}
