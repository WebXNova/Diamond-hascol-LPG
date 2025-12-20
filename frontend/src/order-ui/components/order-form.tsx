import React from 'react';
import styles from '../order-ui.module.css';
import type { CylinderType, OrderDraft } from '../types';
import { clampInt, formatPKPhoneLoose, titleCaseWords } from '../utils/format';
import { CouponInput, type CouponUIState } from './coupon-input';
import { PriceSummary } from './price-summary';
import type { Pricing } from '../types';

export type FieldErrors = Partial<Record<'name' | 'phone' | 'address' | 'quantity', string>>;

type Props = {
  draft: OrderDraft;
  errors: FieldErrors;
  disabled: boolean;

  quantity: number;
  pricing: Pricing;

  couponState: CouponUIState;
  needsBulkConfirm: boolean;
  bulkQuantity: number;

  onChange: (patch: Partial<OrderDraft>) => void;
  onApplyCoupon: () => void;
  onConfirmBulk: () => void;

  onSubmit: () => void;

  submitState: { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string };
  onRetry: () => void;
};

export function OrderForm({
  draft,
  errors,
  disabled,
  quantity,
  pricing,
  couponState,
  needsBulkConfirm,
  bulkQuantity,
  onChange,
  onApplyCoupon,
  onConfirmBulk,
  onSubmit,
  submitState,
  onRetry,
}: Props): React.ReactElement {
  const cylinderType: CylinderType = draft.cylinderType;

  return (
    <div className={styles.stack}>
      <div className={styles.section}>
        <div className={styles.stack} aria-disabled={disabled}>
          <div className={styles.field}>
            <label htmlFor="order-name">Customer Name</label>
            <input
              id="order-name"
              className={styles.input}
              type="text"
              inputMode="text"
              autoComplete="name"
              autoCapitalize="words"
              value={draft.name}
              onChange={(e) => onChange({ name: e.target.value })}
              onBlur={() => onChange({ name: titleCaseWords(draft.name) })}
              disabled={disabled}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'order-name-error' : undefined}
            />
            {errors.name && (
              <div id="order-name-error" className={styles.error}>
                {errors.name}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="order-phone">Phone Number</label>
            <input
              id="order-phone"
              className={styles.input}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+92 300 3411169"
              value={draft.phone}
              onChange={(e) => onChange({ phone: formatPKPhoneLoose(e.target.value) })}
              disabled={disabled}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'order-phone-error' : undefined}
            />
            {errors.phone && (
              <div id="order-phone-error" className={styles.error}>
                {errors.phone}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="order-address">Exact Address</label>
            <textarea
              id="order-address"
              className={styles.textarea}
              value={draft.address}
              onChange={(e) => onChange({ address: e.target.value })}
              disabled={disabled}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'order-address-error' : undefined}
            />
            {errors.address && (
              <div id="order-address-error" className={styles.error}>
                {errors.address}
              </div>
            )}
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Cylinder Type</label>
              <div className={styles.radioRow} role="radiogroup" aria-label="Cylinder Type">
                <button
                  type="button"
                  className={styles.radioPill}
                  data-checked={cylinderType === 'domestic'}
                  onClick={() => onChange({ cylinderType: 'domestic' })}
                  disabled={disabled}
                >
                  Domestic
                </button>
                <button
                  type="button"
                  className={styles.radioPill}
                  data-checked={cylinderType === 'commercial'}
                  onClick={() => onChange({ cylinderType: 'commercial' })}
                  disabled={disabled}
                >
                  Commercial
                </button>
              </div>
              <div className={styles.hint}>Domestic ₨2500 · Commercial ₨3000</div>
            </div>

            <div className={styles.field}>
              <label htmlFor="order-qty">Quantity</label>
              <div className={styles.qtyWrap}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => onChange({ quantityInput: String(clampInt(quantity - 1, 1, 999)) })}
                  disabled={disabled || quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  id="order-qty"
                  className={styles.input}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={draft.quantityInput}
                  onChange={(e) => onChange({ quantityInput: e.target.value.replace(/[^\d]/g, '') })}
                  disabled={disabled}
                  aria-invalid={!!errors.quantity}
                  aria-describedby={errors.quantity ? 'order-qty-error' : 'order-qty-hint'}
                />
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => onChange({ quantityInput: String(clampInt(quantity + 1, 1, 999)) })}
                  disabled={disabled || quantity >= 999}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div id="order-qty-hint" className={styles.hint}>
                Min 1 · Max 999 · Bulk orders welcome (100+)
              </div>
              {errors.quantity && (
                <div id="order-qty-error" className={styles.error}>
                  {errors.quantity}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.stack}>
          <CouponInput
            value={draft.couponCode}
            onChange={(v) => onChange({ couponCode: v })}
            onApply={onApplyCoupon}
            state={couponState}
            disabled={disabled}
          />

          <PriceSummary pricing={pricing} />

          {needsBulkConfirm && (
            <div className={styles.bulkNotice} role="status">
              <div>You selected {bulkQuantity} cylinders — proceed?</div>
              <button type="button" className={styles.smallBtn} onClick={onConfirmBulk}>
                Proceed
              </button>
            </div>
          )}

          <div className={styles.submitRow}>
            <button type="button" className={styles.submitBtn} onClick={onSubmit} disabled={submitState.status === 'submitting'}>
              {submitState.status === 'submitting' && <span className={styles.spinner} aria-hidden="true" />}
              Confirm Order — Pay on Delivery
            </button>

            {submitState.status === 'error' && (
              <div
                className={styles.bulkNotice}
                role="status"
                style={{ borderColor: 'rgba(180,35,24,0.35)', background: 'rgba(180,35,24,0.08)' }}
              >
                <div>{submitState.message}</div>
                <button type="button" className={styles.smallBtn} onClick={onRetry}>
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


