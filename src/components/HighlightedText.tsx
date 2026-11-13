import React from 'react';

interface HighlightedTextProps {
  text?: string | null;
  query?: string | null;
  highlightClassName?: string;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders plain text with all case-insensitive occurrences of `query`
 * wrapped in a semantic <mark> element without using dangerouslySetInnerHTML.
 */
export default function HighlightedText({
  text,
  query,
  highlightClassName = 'bg-amber-200/90 text-stone-950 dark:bg-amber-400/90 dark:text-stone-950 px-0.5 rounded-[2px]'
}: HighlightedTextProps) {
  const safeText = text ?? '';
  const trimmedQuery = (query ?? '').trim();

  if (!safeText || !trimmedQuery) {
    return <>{safeText}</>;
  }

  // Support exact phrase match first; if query has multiple space-separated tokens,
  // build an alternation preferring the full trimmed query first.
  const tokens = trimmedQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const patternParts = Array.from(new Set([trimmedQuery, ...tokens]))
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);

  if (patternParts.length === 0) {
    return <>{safeText}</>;
  }

  const regex = new RegExp(`(${patternParts.join('|')})`, 'gi');
  const parts = safeText.split(regex);

  if (parts.length <= 1) {
    return <>{safeText}</>;
  }

  const normalizedTargets = new Set([trimmedQuery.toLowerCase(), ...tokens.map((t) => t.toLowerCase())]);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (normalizedTargets.has(part.toLowerCase())) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}
