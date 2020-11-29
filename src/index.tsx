import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import css from './style.module.css';
import { formControl } from './form/formControl';
import { useBehaviourSubject } from './form/utils/useBehaviourSubject';
import {
  InputNumber,
  InputString,
  intoEmail,
  intoNumber,
  intoString,
  required,
} from './inputs';
import { formGroup } from './form/formGroup';
import { BehaviourSubject } from './form/utils/behaviourSubject';

const PrintStreamValue = function <T>({
  stream,
}: {
  stream: BehaviourSubject<T>;
}) {
  const v = useBehaviourSubject(stream);
  return <pre>{JSON.stringify(v, null, 2)}</pre>;
};

const App = () => {
  const group = useMemo(() => {
    return formGroup({
      str: formControl({ decode: intoString }),
      requiredStr: formControl({ decode: required(intoString) }),
      email: formControl({ decode: intoEmail }),
      num: formControl({ decode: intoNumber, rawValue: 7 }),
    });
  }, []);
  return (
    <div>
      <InputString label='String' control={group.controls.str} />
      <InputString
        label='Required String'
        control={group.controls.requiredStr}
      />
      <InputString label='Email' type='email' control={group.controls.email} />
      <InputNumber label='Number' control={group.controls.num} />
      <div className={css.row}>
        <strong>Form state</strong>
        <PrintStreamValue stream={group.state$} />
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
