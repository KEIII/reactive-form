import { behaviourSubject } from './utils/behaviourSubject';
import { ChangeListener, DecodeError, FormControl, State } from './formControl';
import { isRight, left, right } from './utils/either';

type unsafe = any; // eslint-disable-line @typescript-eslint/no-explicit-any

type KeyValue<T> = { [P in keyof T]: T[P] };

type KeyControl<T> = [keyof T, FormControl<T[keyof T]>];

const decode = () => {
  throw new Error('not implemented');
};

const intoGroupState = <T>(controlsAsArray: KeyControl<T>[]): State<T> => {
  let touched = false;
  let dirty = false;
  let disabled = true;
  const errors: { [k: string]: DecodeError } = {};
  let hasError = false;
  const rawValue = {} as unsafe;
  const validValue = {} as unsafe;
  for (const [key, control] of controlsAsArray) {
    const state = control.state$.value;
    rawValue[key] = state.rawValue;
    if (isRight(state.value)) {
      validValue[key] = state.value.right;
    } else {
      errors[key as string] = state.value.left;
      hasError = true;
    }
    if (!state.disabled) disabled = false;
    if (state.dirty) dirty = true;
    if (state.touched) touched = true;
  }
  const value = hasError ? left(errors) : right(validValue);
  return { dirty, disabled, touched, rawValue, decode, value };
};

export const formGroup = <T extends KeyValue<T>>(
  controls: { [P in keyof T]: FormControl<T[P]> },
): FormControl<T> => {
  const changeListener = () => {
    const prevState = groupState;
    groupState = intoGroupState(controlsAsArray);
    groupState$.next(groupState); // notify changes
    listeners.forEach(f => f(prevState, groupState));
  };

  const controlsAsArray = (() => {
    const arr: KeyControl<T>[] = [];
    type I = [keyof T, FormControl<T[keyof T]>];
    for (const [key, control] of Object.entries(controls) as I[]) {
      arr.push([key, control]);
      control.addChangeListener(changeListener);
    }
    return arr;
  })();

  let listeners: ChangeListener<T>[] = [];
  let groupState = intoGroupState(controlsAsArray);
  const groupState$ = behaviourSubject(groupState);

  return {
    state$: groupState$,
    change: (groupChanges, config = { emitEvent: false }) => {
      const { rawValue: _rawValue, decode, ...restChanges } = groupChanges;
      const rawValue = (typeof _rawValue === 'object' && _rawValue !== null
        ? _rawValue
        : {}) as Record<keyof T, unknown>;
      for (const [key, control] of controlsAsArray) {
        const controlChanges = { ...restChanges } as unsafe;
        if (key in rawValue) controlChanges.rawValue = rawValue[key];
        control.change(controlChanges, config);
      }
      if (config.emitEvent) changeListener();
    },
    addChangeListener: f => (listeners = [...listeners, f]),
    removeChangeListener: f => (listeners = listeners.filter(i => i !== f)),
  };
};
