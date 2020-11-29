import { BehaviourSubject, behaviourSubject } from './utils/behaviourSubject';
import { Either } from './utils/either';

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
};

export type InitState<T> = Partial<Omit<State<T>, 'decode'>> &
  Pick<State<T>, 'decode'>;

export type StateChanges<T> = Partial<Omit<State<T>, 'value'>>;

export type ChangeListener<T> = (prev: State<T>, curr: State<T>) => void;

type ChangeState<T> = (
  patch: StateChanges<T>,
  config?: { emitEvent: boolean },
) => void;

export type FormControl<T> = {
  readonly state$: BehaviourSubject<State<T>>;
  readonly change: ChangeState<T>;
  readonly addChangeListener: (f: ChangeListener<T>) => void;
  readonly removeChangeListener: (f: ChangeListener<T>) => void;
};

const withChanges = <T>(
  state: State<T>,
  changes: StateChanges<T>,
): State<T> => {
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
  let listeners: ChangeListener<T>[] = [];

  const state$ = behaviourSubject<State<T>>({
    dirty: initState.dirty ?? false,
    disabled: initState.disabled ?? false,
    touched: initState.touched ?? false,
    rawValue: initState.rawValue,
    decode: initState.decode,
    value: initState.decode(initState.rawValue),
  });

  const change: ChangeState<T> = (changes, config = { emitEvent: false }) => {
    const prevState = state$.value;
    const nextState = withChanges(prevState, changes);
    state$.next(nextState); // notify changes
    if (config.emitEvent) {
      listeners.forEach(f => f(prevState, nextState));
    }
  };

  return {
    state$,
    change,
    addChangeListener: f => (listeners = [...listeners, f]),
    removeChangeListener: f => (listeners = listeners.filter(i => i !== f)),
  };
};
