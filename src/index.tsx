import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import css from './style.module.css';
import { FormControl, formControl } from './form/formControl';
import { useBehaviourSubject } from './form/utils/useBehaviourSubject';
import * as D from 'io-ts/Decoder';

const InputString = ({
  label,
  control,
}: {
  label: string;
  control: FormControl<string>;
}) => {
  const state = useBehaviourSubject(control.state$);
  const err = ((): string | null => {
    if (state.value._tag === 'Left') {
      if (state.value.left._tag === 'Of') {
        if (state.value.left.value._tag === 'Leaf') {
          return state.value.left.value.error;
        }
      }
    }
    return null;
  })();
  return (
    <div className={css.row}>
      <label>
        <div>
          <strong>{label}</strong>
          {err && (
            <span style={{ color: 'red', marginLeft: '0.25rem' }}>{err}</span>
          )}
        </div>
        <input
          type='text'
          disabled={state.disabled}
          value={typeof state.rawValue === 'number' ? state.rawValue : ''}
          onChange={event => {
            const rawValue = Number(event.currentTarget.value);
            control.change({ dirty: true, rawValue }, { emitEvent: true });
          }}
          onBlur={() => control.change({ touched: true }, { emitEvent: true })}
        />
        <pre>{JSON.stringify(state)}</pre>
      </label>
    </div>
  );
};

const testString: D.Decoder<unknown, string> = {
  decode: (value: unknown) => {
    return typeof value === 'string' && value === 'test'
      ? D.success(value)
      : D.failure(value, 'Value no "test" string');
  },
};

const App = () => {
  const control = useMemo(() => {
    return formControl({
      decoder: testString,
      rawValue: 7,
    });
  }, []);
  const controlState = useBehaviourSubject(control.state$);
  return (
    <div>
      <InputString label='String' control={control} />
      <div className={css.row}>
        <strong>Form state</strong>
        <pre>{JSON.stringify(controlState, null, 2)}</pre>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
