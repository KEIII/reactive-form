import { BehaviourSubject, behaviourSubject } from './utils/behaviourSubject';
import * as D from 'io-ts/Decoder';
import * as E from 'fp-ts/lib/Either';

export type State<T> = {
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly touched: boolean;
  readonly rawValue: unknown;
  readonly decoder: D.Decoder<unknown, T>;
  readonly value: E.Either<D.DecodeError, T>;
  readonly onChange?: OnChangeFn<T>;
};

export type InitState<T> = Partial<Omit<State<T>, 'decoder'>> &
  Pick<State<T>, 'decoder'>;

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
  if (!('rawValue' in changes || 'decoder' in changes)) {
    return { ...state, ...changes };
  }
  const decoder = changes.decoder ?? state.decoder;
  const rawValue = changes.rawValue ?? state.rawValue;
  const value = decoder.decode(rawValue);
  return { ...state, decoder, rawValue, value };
};

export const formControl = <T>(initState: InitState<T>): FormControl<T> => {
  const state$ = behaviourSubject<State<T>>({
    dirty: initState.dirty ?? false,
    disabled: initState.disabled ?? false,
    touched: initState.touched ?? false,
    rawValue: initState.rawValue,
    decoder: initState.decoder,
    value: initState.decoder.decode(initState.rawValue),
    onChange: initState.onChange,
  });

  const change: ChangeStateFn<T> = (changes, config = { emitEvent: false }) => {
    const prev = state$.value;
    const nextState = withChanges(prev, changes);
    state$.next(nextState); // notify changes
    if (config.emitEvent) {
      nextState.onChange?.(prev, nextState);
    }
  };

  return { state$, change };
};
