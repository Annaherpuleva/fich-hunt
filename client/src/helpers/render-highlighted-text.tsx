import React from "react";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const renderHighlightedText = (text: string, phrases: string[] | undefined) => {

  const lines = text.split('\n');

  if (!lines.length) {
    return renderHighlightedTextLine(text, phrases);
  }

  return lines.map((line, idx) => (
    <p
      key={`${line}-${idx}`}
      className={`mb-4 sm:mb-7 last:mb-0 text-white/85`}
    >
      {renderHighlightedTextLine(line, phrases)}
    </p>
  ));
};
const renderHighlightedTextLine = (text: string, phrases: string[] | undefined) => {
  if (!phrases?.length) {
    return text;
  }

  const uniquePhrases = Array.from(new Set(phrases.filter(Boolean)));
  if (!uniquePhrases.length) {
    return text;
  }

  const regex = new RegExp(`(${uniquePhrases.map(escapeRegExp).join('|')})`, 'g');
  return text.split(regex).map((part, index) => uniquePhrases.includes(part)
    ? (
      <span key={`${part}-${index}`} className="font-bold text-white">
        {part}
      </span>
    )
    : (
      <React.Fragment key={`${part || 'text'}-${index}`}>{addBr(part)}</React.Fragment>
    )
  );
};
const addBr = (text: string) => {
  const rows = text.split('<br/>');

  return rows.map((row, index) => <React.Fragment key={index}>{row}{index !== rows.length - 1 && <br />}</React.Fragment>);
};
