import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import { Decode, FormControl } from './form/formControl';
import { useBehaviourSubject } from './form/utils/useBehaviourSubject';
import css from './style.module.css';
import { ChangeEvent } from 'react';

export const intoNumber = (v: unknown) => {
  const d = t.number.asDecoder().decode(v);
  return E.mapLeft(() => 'Not a number')(d);
};

export const intoString = (v: unknown) => {
  v = v ?? '';
  return typeof v === 'string' ? E.right(v) : E.left('Not a string');
};

export const required = function <T>(d: Decode<T>): Decode<T> {
  return v => {
    if (!(typeof v === 'string' ? v.trim() : v)) return E.left('Required');
    return d(v);
  };
};

export const intoEmail = (v: unknown) => {
  return typeof v === 'string' && v.includes('@')
    ? E.right(v)
    : E.left('Not a email');
};

type Props<T> = {
  label: string;
  control: FormControl<T>;
};

type BaseProps = {
  type: string;
  inputValue: (raw: unknown) => string | number;
  getRaw: (event: ChangeEvent<HTMLInputElement>) => unknown;
};

const BaseInput = function <T>({
  label,
  control,
  type,
  inputValue,
  getRaw,
}: Props<T> & BaseProps) {
  const { value, ...state } = useBehaviourSubject(control.state$);
  return (
    <div className={css.row}>
      <label>
        <div>
          <strong>{label}</strong>
          {value._tag === 'Left' && (
            <span style={{ color: 'red', marginLeft: '0.25rem' }}>
              {value.left}
            </span>
          )}
        </div>
        <input
          type={type}
          disabled={state.disabled}
          value={inputValue(state.rawValue)}
          onChange={event => {
            control.change(
              { dirty: true, rawValue: getRaw(event) },
              { emitEvent: true },
            );
          }}
          onBlur={() => control.change({ touched: true }, { emitEvent: true })}
        />
        <pre>{JSON.stringify(state)}</pre>
      </label>
    </div>
  );
};

export const InputNumber = (props: Props<number>) => {
  return (
    <BaseInput
      {...props}
      type='number'
      inputValue={x => (typeof x === 'number' ? x : '')}
      getRaw={e => e.currentTarget.valueAsNumber}
    />
  );
};

export const InputString = ({
  type = 'text',
  ...props
}: Props<string> & { type?: 'text' | 'email' }) => {
  return (
    <BaseInput
      {...props}
      type={type}
      inputValue={x => (typeof x === 'string' ? x : '')}
      getRaw={e => e.currentTarget.value}
    />
  );
};
