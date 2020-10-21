import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import { formGroup } from './form/formGroup';
import { FormControl, formControl } from './form/formControl';
import { useBehaviourSubject } from './form/useBehaviourSubject';
import { requiredStr } from './form/validators';

const Input = ({
  label,
  control,
}: {
  label: string;
  control: FormControl<string>;
}) => {
  const state = useBehaviourSubject(control.state$);
  return (
    <label>
      <div>
        <strong>{label}</strong>
        {state.err && <span style={{ color: 'red', marginLeft: '0.25rem' }}>{state.err}</span>}
      </div>
      <input
        type='text'
        disabled={state.disabled}
        onChange={e => control.setValue(e.currentTarget.value)}
        onBlur={() => control.touch()}
      />
      <pre>{JSON.stringify(state)}</pre>
    </label>
  );
};

const App = () => {
  const form = useMemo(() => formGroup({
    firstname: formControl({ value: '', validators: [requiredStr] }),
    lastname: formControl({ value: '' }),
  }), []);
  const value = useBehaviourSubject(form.state$);
  return (
    <div>
      <Input label='Firstname' control={form.controls.firstname}/>
      <Input label='Lastname' control={form.controls.lastname}/>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
};

ReactDOM.render(<App/>, document.getElementById('root'));
