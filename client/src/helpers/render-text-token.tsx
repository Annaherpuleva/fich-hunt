import React from "react";
import { TextToken } from "../locales/translations";

type Args = {[key: string]: string | number};

export const replacePlaceholders = (text: string, args?: Args): string => {
  if (!args) return text;
  let result = text;
  Object.entries(args).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  return result;
};

export const renderTextToken = (value: TextToken, args?: Args) => {
  return typeof value === 'string'
    ? replacePlaceholders(value, args)
    : value.map((text, i) => <span key={i} style={text.style} className={text.class}>{replacePlaceholders(text.text, args)}</span>);
};