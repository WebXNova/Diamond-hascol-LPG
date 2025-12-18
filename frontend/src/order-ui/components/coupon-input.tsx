import React from 'react';
import styles from '../order-ui.module.css';
import type { CouponResult } from '../types';

export type CouponUIState =
  | { status: 'idle' }
  | { status: 'applying' }
  | { status: 'applied'; result: CouponResult }
  | { status: 'invalid'; message: string };

type Props = {
  value: string;
  disabled?: boolean;
  state: CouponUIState;
  onChange: (value: string) => void;
  onApply: () => void;
};

export function CouponInput({ value, disabled, state, onChange, onApply }: Props): React.ReactElement {
  return (
    <div className={styles.field}>
      <label htmlFor="order-coupon">Coupon Code (optional)</label>
      <div className={styles.couponRow}>
        <input
          id="order-coupon"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || state.status === 'applying'}
          placeholder="WELCOME10 or FLAT500"
        />
        <button
          type="button"
          className={`${styles.smallBtn} ${styles.smallBtnPrimary}`}
          onClick={onApply}
          disabled={disabled || state.status === 'applying'}
          aria-label="Apply coupon"
        >
          {state.status === 'applying' ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {state.status === 'invalid' && <div className={styles.error}>{state.message}</div>}
      {state.status === 'applied' && <div className={styles.hint}>Applied: {state.result.code}</div>}
    </div>
  );
}


