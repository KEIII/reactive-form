import { behaviourSubject } from './utils/behaviourSubject';
import { ChangeListener, DecodeError, FormControl, State } from './formControl';
import { isLeft, left, right } from './utils/either';

type unsafe = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type KeyValue<T> = { [P in keyof T]: T[P] };

export type FormControls<T> = {
  [P in keyof T]: FormControl<T[P]> & { controls?: FormControls<T[P]> }; // todo: find better way to replace optional `controls`
};

export type FormGroup<T> = FormControl<T> & {
  readonly controls: FormControls<T>;
};

type ControlItem<T, K extends keyof T = keyof T> = {
  key: K;
  control: FormControl<T[K]>;
};

const intoFormState = <T>(controlsArr: ControlItem<T>[]): State<T> => {
  let touched = false;
  let dirty = false;
  let disabled = false;
  const errors: { [k: string]: DecodeError } = {};
  const rawValue = {} as unsafe;
  for (const { key, control } of controlsArr) {
    const state = control.state$.value;
    rawValue[key] = state.rawValue;
    if (isLeft(state.value)) {
      errors[key as string] = state.value.left;
    }
    if (state.disabled) disabled = true;
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
    value: Object.keys(errors).length > 0 ? left(errors) : right(rawValue),
  };
};

export const formGroup = <T extends KeyValue<T>>(
  controls: FormControls<T>,
): FormGroup<T> => {
  const changeListener = () => {
    const prevState = formState;
    formState = intoFormState(controlsAsArray);
    formState$.next(formState); // notify changes
    listeners.forEach(f => f(prevState, formState));
  };

  const controlsAsArray = (() => {
    const arr: ControlItem<T>[] = [];
    type I = [keyof T, FormControl<T[keyof T]>];
    for (const [key, control] of Object.entries(controls) as I[]) {
      arr.push({ key, control });
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
      type I = [keyof T, FormControl<T>];
      for (const [key, control] of Object.entries(controls) as I[]) {
        const controlChanges = {} as unsafe;
        {
          const raw = groupChanges.rawValue;
          if (
            'rawValue' in groupChanges &&
            typeof raw === 'object' &&
            raw !== null &&
            key in raw
          ) {
            type R = Record<keyof T, unknown>;
            controlChanges.rawValue = (raw as R)[key];
          }
        }
        if ('dirty' in groupChanges) {
          controlChanges.dirty = groupChanges.dirty;
        }
        if ('touched' in groupChanges) {
          controlChanges.touched = groupChanges.touched;
        }
        if ('disabled' in groupChanges) {
          controlChanges.disabled = groupChanges.disabled;
        }
        control.change(controlChanges, { emitEvent: false });
      }
      if (config.emitEvent) changeListener();
    },
    controls,
    addChangeListener: f => (listeners = [...listeners, f]),
    removeChangeListener: f => (listeners = listeners.filter(i => i !== f)),
  };
};
