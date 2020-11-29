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
  const { group, controls, subControls } = useMemo(() => {
    const subControls = {
      str: formControl({ decode: intoString }),
      requiredStr: formControl({ decode: required(intoString) }),
    };
    const controls = {
      sub: formGroup(subControls),
      email: formControl({ decode: intoEmail }),
      num: formControl({ decode: intoNumber, rawValue: 7 }),
    };
    return { group: formGroup(controls), controls, subControls };
  }, []);
  return (
    <div>
      <button
        onClick={() => {
          group.change(
            {
              rawValue: {
                sub: { str: 'str', requiredStr: 'req' },
                email: 'email',
              },
            },
            { emitEvent: true },
          );
        }}
      >
        Set data
      </button>
      <button
        onClick={() => group.change({ touched: true }, { emitEvent: true })}
      >
        Touch
      </button>
      <InputString label='String' control={subControls.str} />
      <InputString label='Required String' control={subControls.requiredStr} />
      <InputString label='Email' type='email' control={controls.email} />
      <InputNumber label='Number' control={controls.num} />
      <div className={css.row}>
        <strong>Form state</strong>
        <PrintStreamValue stream={group.state$} />
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
