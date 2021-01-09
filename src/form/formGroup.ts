import { ChangeObserver, DecodeError, FormControl, State } from './formControl';
import { isRight, left, right } from './either';

type KeyValue<T> = { [P in keyof T]: T[P] };

type KeyControl<T> = [keyof T, FormControl<T[keyof T]>];

const decode = () => {
  throw new Error('formGroup `decode` not implemented');
};

const intoGroupState = <T>(controlsAsArray: KeyControl<T>[]): State<T> => {
  let touched = false;
  let dirty = false;
  let disabled = true;
  const errors: { [k: string]: DecodeError } = {};
  let hasError = false;
  const rawValue: { [P in keyof T]?: unknown } = {};
  const validValue: { [P in keyof T]?: T[P] } = {};
  for (const [key, control] of controlsAsArray) {
    const state = control.value.current;
    rawValue[key] = state.rawValue;
    if (isRight(state.value)) {
      validValue[key] = state.value.right;
    } else {
      errors[String(key)] = state.value.left;
      hasError = true;
    }
    if (!state.disabled) disabled = false;
    if (state.dirty) dirty = true;
    if (state.touched) touched = true;
  }
  const value = hasError ? left(errors) : right(validValue as T);
  return { dirty, disabled, touched, rawValue, decode, value };
};

const entries = <T extends KeyValue<T>>(record: T) => {
  return Object.entries(record) as [keyof T, T[keyof T]][];
};

/**
 * todo: missed addControl & removeControl
 */
export const formGroup = <T extends KeyValue<T>>(
  controls: { [P in keyof T]: FormControl<T[P]> },
): FormControl<T> => {
  const notifyChanges = () => {
    prev = current;
    current = intoGroupState(controlsAsArray);
    observers.forEach(observer => observer({ prev, current }));
  };

  const controlsAsArray = (() => {
    const arr: KeyControl<T>[] = [];
    for (const [key, control] of entries(controls)) {
      arr.push([key, control]);
      control.subscribe({ next: notifyChanges });
    }
    return arr;
  })();

  let current = intoGroupState(controlsAsArray);
  let prev = current;
  const observers = new Map<symbol, ChangeObserver<T>>();

  return {
    get value() {
      return { prev, current };
    },
    change: (changes, config = { emit: false }) => {
      const { rawValue: _rawValue, decode, ...restChanges } = changes;
      const rawValue: { [P in keyof T]?: unknown } =
        typeof _rawValue === 'object' && _rawValue !== null ? _rawValue : {};
      for (const [key, control] of controlsAsArray) {
        const controlChanges =
          key in rawValue
            ? { ...restChanges, rawValue: rawValue[key] }
            : restChanges;
        control.change(controlChanges, config);
      }
      if (config.emit) notifyChanges();
    },
    subscribe: ({ next }) => {
      const uid = Symbol();
      observers.set(uid, next);
      return { unsubscribe: () => observers.delete(uid) };
    },
  };
};
