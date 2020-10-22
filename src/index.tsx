import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import css from './style.module.css';
import { formGroup } from './form/formGroup';
import { FormControl, formControl } from './form/formControl';
import { useBehaviourSubject } from './form/useBehaviourSubject';
import { requiredStr } from './form/validators';

const InputString = ({
  label,
  control,
}: {
  label: string;
  control: FormControl<string>;
}) => {
  const state = useBehaviourSubject(control.state$);
  return (
    <div className={css.row}>
      <label>
        <div>
          <strong>{label}</strong>
          {state.err && <span style={{ color: 'red', marginLeft: '0.25rem' }}>{state.err}</span>}
        </div>
        <input
          type='text'
          disabled={state.disabled}
          value={state.value}
          onChange={e => {
            const value = e.currentTarget.value;
            control.change({ dirty: true, value }, { emitEvent: true });
          }}
          onBlur={() => control.change({ touched: true }, { emitEvent: true })}
        />
        <pre>{JSON.stringify(state)}</pre>
      </label>
    </div>
  );
};

const InputNumber = ({
  label,
  control,
}: {
  label: string;
  control: FormControl<number>;
}) => {
  const state = useBehaviourSubject(control.state$);
  return (
    <div className={css.row}>
      <label>
        <div>
          <strong>{label}</strong>
          {state.err && <span style={{ color: 'red', marginLeft: '0.25rem' }}>{state.err}</span>}
        </div>
        <input
          type='number'
          disabled={state.disabled}
          value={Number.isFinite(state.value) ? state.value : ''}
          onChange={e => {
            const value = e.currentTarget.valueAsNumber;
            control.change({ touched: true, dirty: true, value }, { emitEvent: true });
          }}
          onBlur={() => control.change({ touched: true }, { emitEvent: true })}
        />
        <pre>{JSON.stringify(state)}</pre>
      </label>
    </div>
  );
};

const InputBoolean = ({
  label,
  control,
}: {
  label: string;
  control: FormControl<boolean>;
}) => {
  const state = useBehaviourSubject(control.state$);
  return (
    <div className={css.row}>
      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type='checkbox'
          disabled={state.disabled}
          checked={state.value}
          onChange={e => {
            const value = e.currentTarget.checked;
            control.change({ touched: true, dirty: true, value }, { emitEvent: true });
          }}
          onBlur={() => control.change({ touched: true }, { emitEvent: true })}
          style={{ marginRight: '0.35rem' }}
        />
        <strong>{label}</strong>
      </label>
      <div>
        {state.err && <span style={{ color: 'red', marginLeft: '0.25rem' }}>{state.err}</span>}
      </div>
      <pre>{JSON.stringify(state)}</pre>
    </div>
  );
};

const App = () => {
  const form = useMemo(() => formGroup({
    string: formControl({ value: '', validators: [requiredStr] }),
    number: formControl({ value: NaN }),
    boolean: formControl({ value: false }),
  }), []);
  const formState = useBehaviourSubject(form.state$);
  return (
    <div>
      <InputString label='String' control={form.controls.string}/>
      <InputNumber label='Number' control={form.controls.number}/>
      <InputBoolean label='Boolean' control={form.controls.boolean}/>
      <div className={css.row}>
        <button
          onClick={() => {
            form.change(
              { disabled: !formState.disabled },
              { emitEvent: true },
            );
          }}
        >
          Disable/Enable
        </button>
      </div>
      <div className={css.row}>
        <strong>Form state</strong>
        <pre>{JSON.stringify(formState, null, 2)}</pre>
      </div>
    </div>
  );
};

ReactDOM.render(<App/>, document.getElementById('root'));
