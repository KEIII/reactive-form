import { Either } from './either';

export type DecodeError = string | { [k: string]: DecodeError }; // todo: find a way for better errors type

export type ControlValue<T> = Either<DecodeError, T>;

export type Decode<T> = (value: unknown) => ControlValue<T>;

export type State<T> = {
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly touched: boolean;
  readonly rawValue: unknown;
  readonly decode: Decode<T>;
  readonly value: ControlValue<T>;
};

export type InitState<T> = Partial<Omit<State<T>, 'decode' | 'value'>> &
  Pick<State<T>, 'decode'>;

export type StateChanges<T> = Partial<Omit<State<T>, 'value'>>;

export type StateDiff<T> = {
  readonly prev: State<T>;
  readonly current: State<T>;
};

export type ChangeObserver<T> = (diff: StateDiff<T>) => void;

type ChangeAction<T> = (
  changes: StateChanges<T>,
  config?: { emit: boolean },
) => void;

export type FormControl<T> = {
  readonly value: StateDiff<T>;
  readonly change: ChangeAction<T>;
  readonly subscribe: (observer: {
    next: ChangeObserver<T>;
  }) => { unsubscribe: () => void };
};

const nextState = <T>(state: State<T>, changes: StateChanges<T>): State<T> => {
  if ('rawValue' in changes || 'decode' in changes) {
    const decode = changes.decode ?? state.decode;
    const rawValue = changes.rawValue ?? state.rawValue;
    const value = decode(rawValue);
    return { ...state, decode, rawValue, value };
  } else {
    return { ...state, ...changes };
  }
};

export const formControl = <T>(initState: InitState<T>): FormControl<T> => {
  let current: State<T> = {
    dirty: initState.dirty ?? false,
    disabled: initState.disabled ?? false,
    touched: initState.touched ?? false,
    rawValue: initState.rawValue,
    decode: initState.decode,
    value: initState.decode(initState.rawValue),
  };

  let prev = current;

  const observers = new Map<symbol, ChangeObserver<T>>();

  const change: ChangeAction<T> = (changes, config = { emit: false }) => {
    prev = current;
    current = nextState(current, changes);
    if (config.emit) {
      const v = { prev, current };
      observers.forEach(observer => observer(v));
    }
  };

  return {
    get value() {
      return { prev, current };
    },
    change,
    subscribe: ({ next }) => {
      const uid = Symbol();
      observers.set(uid, next);
      return { unsubscribe: () => observers.delete(uid) };
    },
  };
};
