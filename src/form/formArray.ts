import {
  ChangeObserver,
  Decode,
  DecodeError,
  formControl,
  FormControl,
  InitState,
  State,
  StateDiff,
} from './formControl';
import { Observable, Unsubscribable } from './observable';
import { isLeft, isRight, left, right } from './either';

export type FormArray<T> = {
  control: FormControl<T[]>;
  controls: Observable<FormControl<T>[]>;
  add: (initState: InitState<T>) => void;
  remove: (control: FormControl<T>) => void;
};

const intoArrayState = <T>(
  decode: Decode<T[]>,
  controls: FormControl<T>[],
): State<T[]> => {
  let touched = false;
  let dirty = false;
  let disabled = true;
  const errors: { [k: string]: DecodeError } = {};
  let hasError = false;
  const rawValue: unknown[] = [];
  const validValue: T[] = [];
  for (const [idx, control] of controls.entries()) {
    const state = control.value.current;
    rawValue[idx] = state.rawValue;
    if (isRight(state.value)) {
      validValue[idx] = state.value.right;
    } else {
      errors[String(idx)] = state.value.left;
      hasError = true;
    }
    if (!state.disabled) disabled = false;
    if (state.dirty) dirty = true;
    if (state.touched) touched = true;
  }
  const value = hasError ? left(errors) : right(validValue);
  return { dirty, disabled, touched, rawValue, decode, value };
};

/**
 * todo: reorder array items
 */
export const formArray = <T>({
  decode,
}: {
  decode: Decode<T>;
}): FormArray<T> => {
  const { controls, add, remove, clear } = (() => {
    const subscriptions = new Map<FormControl<T>, Unsubscribable>();
    type I = FormControl<T>;
    type O = (value: I[]) => void;
    const observers = new Map<symbol, O>();
    let current: I[] = [];

    const next = (value: FormControl<T>[]) => {
      current = value;
      observers.forEach(observer => observer(current));
      notifyChanges();
    };

    const controls: Observable<FormControl<T>[]> = {
      get value() {
        return current;
      },
      subscribe: ({ next }: { next: O }) => {
        const uid = Symbol();
        observers.set(uid, next);
        return { unsubscribe: () => observers.delete(uid) };
      },
    };

    return {
      controls,
      add: (initState: Partial<Omit<State<T>, 'decode' | 'value'>>) => {
        const itemControl = formControl({ ...initState, decode });
        subscriptions.set(
          itemControl,
          itemControl.subscribe({ next: notifyChanges }),
        );
        next([...current, itemControl]);
      },
      remove: (control: FormControl<T>) => {
        subscriptions.get(control)?.unsubscribe();
        subscriptions.delete(control);
        next(current.filter(i => i !== control));
      },
      clear: () => {
        subscriptions.forEach(s => s.unsubscribe());
        subscriptions.clear();
        current = [];
      },
    };
  })();

  const { control, notifyChanges } = (() => {
    const decodeArr: Decode<T[]> = v => {
      if (!Array.isArray(v)) return left('Not an array');
      for (const i of v) {
        if (isLeft(decode(i))) return left('Err');
      }
      return right(v);
    };

    const onChanges = () => {
      stateHolder.invalidate();
      if (observers.size > 0) {
        const diff = stateHolder.get();
        observers.forEach(observer => observer(diff));
      }
    };

    const stateHolder = (() => {
      type StateHolder =
        | { valid: true; diff: StateDiff<T[]> }
        | { valid: false; diff: StateDiff<T[]> | null };
      let h: StateHolder = { valid: false, diff: null };
      return {
        invalidate: () => {
          h = { valid: false, diff: h.diff };
        },
        get: () => {
          if (!h.valid) {
            const current = intoArrayState<T>(decodeArr, controls.value);
            const prev = h.diff?.current ?? current;
            h = { valid: true, diff: { prev, current } };
          }
          return h.diff;
        },
      };
    })();

    const observers = new Map<symbol, ChangeObserver<T[]>>();

    const control: FormControl<T[]> = {
      get value() {
        return stateHolder.get();
      },
      change: (arrayChanges, config = { emit: false }) => {
        const { rawValue: _rawValue, decode, ...restChanges } = arrayChanges;
        if (decode !== undefined) {
          throw new Error('changing `decode` not implemented for formArray');
        }
        if (Array.isArray(_rawValue)) {
          clear();
          for (const rawValue of _rawValue) {
            add({ rawValue, ...restChanges });
          }
        }
        if (config.emit) onChanges();
      },
      subscribe: ({ next }) => {
        const uid = Symbol();
        observers.set(uid, next);
        return { unsubscribe: () => observers.delete(uid) };
      },
    };

    return { control, notifyChanges: onChanges };
  })();

  return {
    control,
    controls,
    add,
    remove,
  };
};
