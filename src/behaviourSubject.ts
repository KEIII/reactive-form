type Observer<T> = { next: (value: T) => void };

export type BehaviourSubject<T> = {
  value: T;
  next: (value: T) => void;
  subscribe: (observer: Observer<T>) => { unsubscribe: () => void };
};

export const behaviourSubject = <T>(initValue: T): BehaviourSubject<T> => {
  let currentValue = initValue;
  let observers: Observer<T>[] = [];
  return {
    get value() {
      return currentValue;
    },
    next: value => {
      currentValue = value;
      observers.forEach(observer => observer.next(value));
    },
    subscribe: observer => {
      observers = [...observers, observer];
      observer.next(currentValue);
      return {
        unsubscribe: () => {
          observers = observers.filter(o => o !== observer);
        },
      };
    },
  };
};
