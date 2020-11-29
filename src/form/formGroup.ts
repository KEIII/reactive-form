import { behaviourSubject } from './utils/behaviourSubject';
import { ChangeListener, DecodeError, FormControl, State } from './formControl';
import { isRight, left, right } from './utils/either';

type unsafe = any; // eslint-disable-line @typescript-eslint/no-explicit-any

type KeyValue<T> = { [P in keyof T]: T[P] };

type KeyControl<T> = [keyof T, FormControl<T[keyof T]>];

const intoFormState = <T>(controlsAsArray: KeyControl<T>[]): State<T> => {
  let touched = false;
  let dirty = false;
  let disabled = true;
  const errors: { [k: string]: DecodeError } = {};
  const rawValue = {} as unsafe;
  const value = {} as unsafe;
  for (const [key, control] of controlsAsArray) {
    const state = control.state$.value;
    rawValue[key] = state.rawValue;
    if (isRight(state.value)) {
      value[key] = state.value.right;
    } else {
      errors[key as string] = state.value.left;
    }
    if (!state.disabled) disabled = false;
    if (state.dirty) dirty = true;
    if (state.touched) touched = true;
  }
  return {
    dirty,
    disabled,
    touched,
    rawValue,
    decode: () => {
      throw new Error('not implemented');
    },
    value: Object.keys(errors).length > 0 ? left(errors) : right(value),
  };
};

export const formGroup = <T extends KeyValue<T>>(
  controls: { [P in keyof T]: FormControl<T[P]> },
): FormControl<T> => {
  const changeListener = () => {
    const prevState = formState;
    formState = intoFormState(controlsAsArray);
    formState$.next(formState); // notify changes
    listeners.forEach(f => f(prevState, formState));
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
  let formState = intoFormState(controlsAsArray);
  const formState$ = behaviourSubject(formState);

  return {
    state$: formState$,
    change: (groupChanges, config = { emitEvent: false }) => {
      const raw = (() => {
        type R = Record<keyof T, unknown>;
        const raw = groupChanges.rawValue;
        return typeof raw === 'object' && raw !== null ? (raw as R) : ({} as R);
      })();
      for (const [key, control] of controlsAsArray) {
        const controlChanges = {} as unsafe;
        if (key in raw) {
          controlChanges.rawValue = raw[key];
        }
        if (groupChanges.dirty !== undefined) {
          controlChanges.dirty = groupChanges.dirty;
        }
        if (groupChanges.touched !== undefined) {
          controlChanges.touched = groupChanges.touched;
        }
        if (groupChanges.disabled !== undefined) {
          controlChanges.disabled = groupChanges.disabled;
        }
        control.change(controlChanges, config);
      }
      if (config.emitEvent) changeListener();
    },
    addChangeListener: f => (listeners = [...listeners, f]),
    removeChangeListener: f => (listeners = listeners.filter(i => i !== f)),
  };
};
