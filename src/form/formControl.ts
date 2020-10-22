import { BehaviourSubject, behaviourSubject } from './behaviourSubject';

export type ValidationErr = string;

export type ValidationErrMap = {
  [k: string]: ValidationErr | ValidationErrMap;
};

export type ControlErr = ValidationErr | ValidationErrMap;

export type Validator<T> = (value: T) => ValidationErr | null;

export type FormControlState<T> = {
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly err: ControlErr | null;
  readonly touched: boolean;
  readonly validators?: Validator<T>[];
  readonly value: T;
};

export type StateChangeFn<T> = (
  prev: FormControlState<T>,
  curr: FormControlState<T>,
  control: FormControl<T>,
) => void;

type PatchFn<T> = (
  patch: Partial<FormControlState<T>>,
  config?: { emitEvent: boolean },
) => void;

export type FormControl<T> = {
  readonly state$: BehaviourSubject<FormControlState<T>>;
  readonly change: PatchFn<T>;
  readonly addChangeListener: (f: StateChangeFn<T>) => void;
  readonly removeChangeListener: (f: StateChangeFn<T>) => void;
};

const getErr = <T>(
  value: T,
  validators: Validator<T>[],
): ValidationErr | null => {
  let err: ValidationErr | null = null;
  for (const validator of validators) {
    err = validator(value);
    if (err !== null) return err;
  }
  return null;
};

const setErr = <T>(state: FormControlState<T>): FormControlState<T> => {
  if (state.validators === undefined) return state;
  return { ...state, err: getErr(state.value, state.validators) };
};

export const formControl = <T>(
  s: Partial<FormControlState<T>> & { value: T },
  onChange?: StateChangeFn<T>,
): FormControl<T> => {
  let listeners: StateChangeFn<T>[] = onChange !== undefined ? [onChange] : [];
  let state: FormControlState<T> = {
    dirty: s.dirty ?? false,
    disabled: s.disabled ?? false,
    err: s.err ?? getErr(s.value, s.validators ?? []),
    touched: s.touched ?? false,
    validators: s.validators,
    value: s.value,
  };

  const state$ = behaviourSubject(state);

  const change: PatchFn<T> = (
    changes: Partial<FormControlState<T>>,
    config = { emitEvent: false },
  ) => {
    const prev = state;
    state =
      ('value' in changes || 'validators' in changes)
        ? setErr({ ...state, ...changes })
        : { ...state, ...changes };
    state$.next(state); // notify changes
    if (config.emitEvent) {
      for (const fn of listeners) {
        fn(prev, state, control);
      }
    }
  };

  const control: FormControl<T> = {
    state$,
    change,
    addChangeListener: fn => (listeners = [...listeners, fn]),
    removeChangeListener: fn => (listeners = listeners.filter(i => i !== fn)),
  };

  return control;
};
