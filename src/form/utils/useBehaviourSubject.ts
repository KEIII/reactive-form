import { useLayoutEffect, useState } from 'react';
import { BehaviourSubject } from './behaviourSubject';

export const useBehaviourSubject = <T>(s: BehaviourSubject<T>): T => {
  const [value, setValue] = useState<T>(s.value);
  useLayoutEffect(() => {
    const next = (v: T) => setValue(typeof v === 'function' ? () => v : v);
    return s.subscribe({ next }).unsubscribe;
  }, [s]);
  return value;
};
