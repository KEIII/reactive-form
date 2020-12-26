import { Reducer, useLayoutEffect, useReducer } from 'react';

export type Unsubscribable = {
  readonly unsubscribe: () => void;
};

export type Observer<T> = {
  readonly next: (value: T) => void;
};

export type Observable<T> = {
  readonly value: T;
  readonly subscribe: (o: Observer<T>) => Unsubscribable;
};

export const useObservable = <T>(observable: Observable<T>): T => {
  const [value, next] = useReducer<Reducer<T, T>>(
    (_, action) => action,
    observable.value,
  );

  useLayoutEffect(() => {
    next(observable.value); // set current value again because observed value may have changed async
    return observable.subscribe({ next }).unsubscribe;
  }, [observable]);

  return value;
};
