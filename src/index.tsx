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

const App = () => {
  const controls = useMemo(() => {
    return {
      str: formControl({ decode: intoString }),
      requiredStr: formControl({ decode: required(intoString) }),
      email: formControl({ decode: intoEmail }),
      num: formControl({ decode: intoNumber, rawValue: 7 }),
    };
  }, []);
  const controlState = useBehaviourSubject(controls.num.state$);
  return (
    <div>
      <InputString label='String' control={controls.str} />
      <InputString label='Required String' control={controls.requiredStr} />
      <InputString label='Email' type='email' control={controls.email} />
      <InputNumber label='Number' control={controls.num} />
      <div className={css.row}>
        <strong>Form state</strong>
        <pre>{JSON.stringify(controlState, null, 2)}</pre>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
