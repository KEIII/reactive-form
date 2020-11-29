import { Decode, FormControl } from './form/formControl';
import { useBehaviourSubject } from './form/utils/useBehaviourSubject';
import css from './style.module.css';
import { ChangeEvent } from 'react';
import { fmtDecodeError } from './form/fmtDecodeError';
import { isLeft, left, right } from './form/utils/either';

export const intoNumber = (v: unknown) => {
  return typeof v === 'number' && Number.isFinite(v)
    ? right(v)
    : left('Invalid number');
};

export const intoString = (v: unknown) => {
  v = v ?? '';
  return typeof v === 'string' ? right(v) : left('Not a string');
};

export const required = function <T>(d: Decode<T>): Decode<T> {
  return v => {
    if (!(typeof v === 'string' ? v.trim() : v)) return left('Required');
    return d(v);
  };
};

export const intoEmail = (v: unknown) => {
  return typeof v === 'string' && v.includes('@')
    ? right(v)
    : left('Not a email');
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
          {state.touched && isLeft(value) && (
            <span style={{ color: 'red', marginLeft: '0.25rem' }}>
              {fmtDecodeError(value.left)}
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
