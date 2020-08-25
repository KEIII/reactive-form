import { Validator } from './formControl';

export const requiredStr: Validator<string | null | undefined> = str => {
  return str?.trim() ? null : 'Required';
};
