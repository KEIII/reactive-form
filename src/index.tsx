import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import css from './style.module.css';
import { FormControl, formControl } from './form/formControl';
import {
  InputNumber,
  InputString,
  intoEmail,
  intoNumber,
  intoString,
  required,
} from './inputs';
import { formGroup } from './form/formGroup';
import { isRight } from './form/either';
import { fmtDecodeError } from './form/fmtDecodeError';
import { FormArray, formArray } from './form/formArray';
import { useObservable } from './form/observable';

const PrintFormState = function <T>({ control }: { control: FormControl<T> }) {
  const { current } = useObservable(control);
  return <pre>{JSON.stringify(current, null, 2)}</pre>;
};

const ArrayControls = function ({
  formArray,
}: {
  formArray: FormArray<string>;
}) {
  const controls = useObservable(formArray.controls);
  return (
    <div style={{ margin: '1rem', background: '#eee', padding: '1rem' }}>
      {controls.map((control, key) => {
        return (
          <div key={key} style={{ display: 'flex' }}>
            <div style={{ flexGrow: 1 }}>
              <InputString type={'email'} control={control} label={`#${key}`} />
            </div>
            <button onClick={() => formArray.remove(control)}>Remove</button>
          </div>
        );
      })}
      <button onClick={() => formArray.add({ decode: intoEmail })}>Add</button>
    </div>
  );
};

const App = () => {
  const { group, controls, subControls, emails } = useMemo(() => {
    const subControls = {
      str: formControl({ decode: intoString }),
      requiredStr: formControl({ decode: required(intoString) }),
    };
    const emails = formArray({ decode: intoEmail });
    const controls = {
      sub: formGroup(subControls),
      emails: emails.control,
      num: formControl({ decode: intoNumber, rawValue: 7 }),
    };
    return {
      emails,
      group: formGroup(controls),
      controls,
      subControls,
    };
  }, []);
  return (
    <div>
      <div>
        <button
          onClick={() => {
            group.change(
              {
                rawValue: {
                  sub: { str: 'str', requiredStr: 'req' },
                  emails: ['email1', 'email@2'],
                },
              },
              { emit: true },
            );
          }}
        >
          Set data
        </button>
        <button onClick={() => group.change({ touched: true }, { emit: true })}>
          Touch
        </button>
        <button
          onClick={() => {
            const formValue = group.value.current.value;
            if (isRight(formValue)) {
              console.log(formValue.right);
            } else {
              console.log(fmtDecodeError(formValue.left));
              group.change({ touched: true }, { emit: true });
            }
          }}
        >
          Log Value
        </button>
      </div>
      <div style={{ display: 'flex' }}>
        <div>
          <InputString label='String' control={subControls.str} />
          <InputString
            label='Required String 3'
            control={subControls.requiredStr}
          />
          <InputNumber label='Number' control={controls.num} />
          <ArrayControls formArray={emails} />
        </div>
        <div className={css.row}>
          <strong>Form state</strong>
          <PrintFormState control={group} />
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
