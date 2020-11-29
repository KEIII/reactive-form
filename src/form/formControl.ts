import { BehaviourSubject, behaviourSubject } from './utils/behaviourSubject';

export type Either<A, B> =
  | { _tag: 'Left'; left: A }
  | { _tag: 'Right'; right: B };

export type DecodeError = string | { [k: string]: DecodeError }; // todo: find a way for better errors type

export type Value<T> = Either<DecodeError, T>;

export type Decode<T> = (value: unknown) => Value<T>;

export type State<T> = {
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly touched: boolean;
  readonly rawValue: unknown;
  readonly decode: Decode<T>;
  readonly value: Value<T>;
  readonly onChange?: OnChangeFn<T>[];
};

export type InitState<T> = Partial<Omit<State<T>, 'decode'>> &
  Pick<State<T>, 'decode'>;

export type StateChanges<T> = Partial<Omit<State<T>, 'value'>>;

export type OnChangeFn<T> = (prev: State<T>, curr: State<T>) => void;

type ChangeStateFn<T> = (
  patch: StateChanges<T>,
  config?: { emitEvent: boolean },
) => void;

export type FormControl<T> = {
  readonly state$: BehaviourSubject<State<T>>;
  readonly change: ChangeStateFn<T>;
};

const withChanges = <T>(
  state: State<T>,
  changes: StateChanges<T>,
): State<T> => {
  if (!('rawValue' in changes || 'decode' in changes)) {
    return { ...state, ...changes };
  }
  const decode = changes.decode ?? state.decode;
  const rawValue = changes.rawValue ?? state.rawValue;
  const value = decode(rawValue);
  return { ...state, decode, rawValue, value };
};

export const formControl = <T>(initState: InitState<T>): FormControl<T> => {
  const state$ = behaviourSubject<State<T>>({
    dirty: initState.dirty ?? false,
    disabled: initState.disabled ?? false,
    touched: initState.touched ?? false,
    rawValue: initState.rawValue,
    decode: initState.decode,
    value: initState.decode(initState.rawValue),
    onChange: initState.onChange,
  });

  const change: ChangeStateFn<T> = (changes, config = { emitEvent: false }) => {
    const prev = state$.value;
    const nextState = withChanges(prev, changes);
    state$.next(nextState); // notify changes
    if (config.emitEvent) {
      nextState.onChange?.forEach(f => f(prev, nextState));
    }
  };

  return { state$, change };
};
