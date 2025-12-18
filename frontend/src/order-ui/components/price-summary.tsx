import React from 'react';
import styles from '../order-ui.module.css';
import type { Pricing } from '../types';
import { formatPKR } from '../utils/format';

type Props = {
  pricing: Pricing;
};

export function PriceSummary({ pricing }: Props): React.ReactElement {
  return (
    <div className={styles.priceCard} aria-live="polite">
      <div className={styles.priceRow}>
        <span>Unit price</span>
        <strong>{formatPKR(pricing.unitPrice)}</strong>
      </div>
      <div className={styles.priceRow}>
        <span>
          Quantity <span style={{ color: 'rgba(84, 97, 117, 0.95)' }}>× {pricing.quantity}</span>
        </span>
        <strong>{formatPKR(pricing.subtotal)}</strong>
      </div>

      {pricing.discountAmount > 0 && (
        <div className={styles.priceRow}>
          <span>Discount</span>
          <strong className={styles.priceAnim} key={`disc-${pricing.discountAmount}`}>
            −{formatPKR(pricing.discountAmount)}
            {typeof pricing.discountPercent === 'number' ? ` (${pricing.discountPercent}%)` : ''}
          </strong>
        </div>
      )}

      <div className={styles.priceRow} style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', marginTop: 8, paddingTop: 10 }}>
        <span className={styles.total}>Total</span>
        <strong className={`${styles.total} ${styles.priceAnim}`} key={`tot-${pricing.total}`}>
          {pricing.discountAmount > 0 ? (
            <>
              <span className={styles.strike}>{formatPKR(pricing.subtotal)}</span>
              {formatPKR(pricing.total)}
            </>
          ) : (
            formatPKR(pricing.total)
          )}
        </strong>
      </div>
    </div>
  );
}


