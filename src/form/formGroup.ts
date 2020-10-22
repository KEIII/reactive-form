import { behaviourSubject } from './behaviourSubject';

import { FormControl, FormControlState, ValidationErrMap } from './formControl';

type unsafe = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type KeyValue<T> = { [P in keyof T]: T[P] };

export type FormControls<T> = {
  [P in keyof T]: FormControl<T[P]> & { controls?: FormControls<T[P]> };
};

export type FormGroup<T> = FormControl<T> & {
  readonly controls: FormControls<T>;
};

type ControlItem<T, K extends keyof T = keyof T> = {
  key: K;
  control: FormControl<T[K]>;
};

type StateChangeFn<T> = (
  prev: FormControlState<T>,
  curr: FormControlState<T>,
  group: FormGroup<T>,
) => void;

const intoFormState = <T>(
  controlsArr: ControlItem<T>[],
): FormControlState<T> => {
  let touched = false;
  let dirty = false;
  let disabled = false;
  const errors: ValidationErrMap = {};
  const value: T = {} as unsafe; // eslint-disable-line
  for (const { key, control } of controlsArr) {
    const state = control.state$.value;
    value[key] = state.value;
    if (state.err !== null) {
      errors[key as string] = state.err;
    }
    if (state.disabled) disabled = true;
    if (state.dirty) dirty = true;
    if (state.touched) touched = true;
  }
  const err = Object.values(errors).length > 0 ? errors : null;
  return {
    dirty,
    disabled,
    err,
    touched,
    value,
  };
};

export const formGroup = <T extends KeyValue<T>>(
  controls: FormControls<T>,
  onChange?: StateChangeFn<T>,
): FormGroup<T> => {
  const controlsArr: ControlItem<T>[] = [];

  const changeListener = () => {
    const prev = formState;
    formState = intoFormState(controlsArr);
    formState$.next(formState); // notify changes
    listeners.forEach(listener => listener(prev, formState, group));
  };

  Object.entries(controls).forEach(([key, control]) => {
    const controlItem: ControlItem<T> = {
      key: key as keyof T,
      control: control as FormControl<T[keyof T]>,
    };
    controlsArr.push(controlItem);
    controlItem.control.addChangeListener(changeListener);
  });

  let listeners: StateChangeFn<T>[] = onChange !== undefined ? [onChange] : [];
  let formState = intoFormState(controlsArr);
  const formState$ = behaviourSubject(formState);

  const group: FormGroup<T> = {
    state$: formState$,
    change: (changes, config = { emitEvent: false }) => {
      for (const [key, control] of Object.entries(controls) as [keyof T, FormControl<T>][]) {
        const _changes = {} as unsafe;
        if (changes.value !== undefined) _changes.value = changes.value[key];
        if (changes.dirty !== undefined) _changes.dirty = changes.dirty;
        if (changes.touched !== undefined) _changes.touched = changes.touched;
        if (changes.disabled !== undefined) _changes.disabled = changes.disabled;
        control.change(_changes, { emitEvent: false });
      }
      if (config.emitEvent) changeListener();
    },
    addChangeListener: fn => (listeners = [...listeners, fn]),
    removeChangeListener: fn => (listeners = listeners.filter(i => i !== fn)),
    controls,
  };

  return group;
};
