import { DecodeError } from './formControl';

const nbsp = '\u00A0';

const pad = (lvl: number) => nbsp.repeat(lvl * 4);

const fmtRecord = (e: { [k: string]: DecodeError }, lvl = 0): string => {
  const padding = pad(lvl);
  let str = '';
  for (const [key, errorValue] of Object.entries(e)) {
    const content =
      typeof errorValue === 'string'
        ? `${key}:${nbsp}${errorValue}`
        : `${key}:\n${fmtRecord(errorValue, lvl + 1)}`;
    str += padding + content + '\n';
  }
  return str;
};

export const fmtDecodeError = (e: DecodeError): string => {
  if (typeof e === 'string') return e;
  return fmtRecord(e);
};
