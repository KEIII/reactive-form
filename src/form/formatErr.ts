export type ValidationErrors = {
  key: string;
  value: string | ValidationErrors;
}[];

type ControlErr = string | ValidationErrors;

const _format = (err: ValidationErrors, level: number): string => {
  let str = '';
  const padding = '\u00A0'.repeat(level * 4);
  err.forEach(({ key, value }) => {
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
