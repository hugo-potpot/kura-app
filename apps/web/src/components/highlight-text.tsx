import React from 'react';

export function highlightText(text: string, term: string): React.ReactNode {
  if (!term || term.trim().length < 2) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="bg-yellow-100 font-semibold rounded-sm px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}
