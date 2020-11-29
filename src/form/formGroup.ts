import { behaviourSubject } from './utils/behaviourSubject';
import { DecodeError, FormControl, State } from './formControl';

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

const intoFormState = <T>(controlsArr: ControlItem<T>[]): State<T> => {
  let touched = false;
  let dirty = false;
  let disabled = false;
  const errors: { [k: string]: DecodeError } = {};
  const value: T = {} as unsafe;
  for (const { key, control } of controlsArr) {
    const state = control.state$.value;
    if (state.value._tag === 'Right') {
      value[key] = state.value.right;
    } else {
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
    rawValue: value,
    decode: () => {
      throw new Error('not implemented');
    },
    value:
      Object.keys(errors).length > 0
        ? { _tag: 'Left', left: errors }
        : { _tag: 'Right', right: value },
  };
};

export const formGroup = <T extends KeyValue<T>>(
  controls: FormControls<T>,
): FormGroup<T> => {
  const changeListener = () => {
    formState = intoFormState(controlsAsArray);
    formState$.next(formState); // notify changes
  };

  const controlsAsArray = (() => {
    const arr: ControlItem<T>[] = [];
    type I = [keyof T, FormControl<T[keyof T]>];
    for (const [key, control] of Object.entries(controls) as I[]) {
      arr.push({ key, control });
      const onChange = control.state$.value.onChange ?? [];
      control.change(
        { onChange: [...onChange, changeListener] },
        { emitEvent: false },
      );
    }
    return arr;
  })();

  let formState = intoFormState(controlsAsArray);
  const formState$ = behaviourSubject(formState);

  return {
    state$: formState$,
    change: (changes, config = { emitEvent: false }) => {
      type I = [keyof T, FormControl<T>];
      for (const [key, control] of Object.entries(controls) as I[]) {
        const _changes = {} as unsafe;
        if ('rawValue' in changes) {
          _changes.rawValue = (changes.rawValue as unsafe)[key]; // todo: fixme unsafe
        }
        if ('dirty' in changes) {
          _changes.dirty = changes.dirty;
        }
        if ('touched' in changes) {
          _changes.touched = changes.touched;
        }
        if ('disabled' in changes) {
          _changes.disabled = changes.disabled;
        }
        control.change(_changes, { emitEvent: false });
      }
      if (config.emitEvent) changeListener();
    },
    controls,
  };
};
