import { ControlErr, ValidationErrMap } from './formControl';

const _format = (err: ValidationErrMap, level: number): string => {
  let str = '';
  const padding = '\u00A0'.repeat(level * 4);
  Object.entries(err).forEach(([key, value]) => {
    str += padding;
    if (typeof value === 'string') {
      str += `${key}: ${value}`;
    } else {
      str += `${key}:\n${_format(value, level + 1)}`;
    }
    str += '\n';
  });
  return str;
};

export const formatErr = (err: ControlErr): string => {
  if (typeof err === 'string') return err;
  return _format(err, 0);
};
