import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../order-ui.module.css';
import type { OrderConfirmation, OrderStatus } from '../types';
import { useFocusTrap } from '../hooks/use-focus-trap';
import { useLockBodyScroll } from '../hooks/use-lock-body-scroll';
import { formatPKR } from '../utils/format';

const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

function formatDateTime(d: Date): string {
  try {
    return new Intl.DateTimeFormat('en-PK', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function badgeStyle(status: OrderStatus): React.CSSProperties {
  if (status === 'delivered') return { background: 'rgba(22, 163, 74, 0.12)', color: 'rgba(22, 101, 52, 0.95)', borderColor: 'rgba(22, 163, 74, 0.22)' };
  if (status === 'out_for_delivery') return { background: 'rgba(37, 99, 235, 0.10)', color: 'rgba(29, 78, 216, 0.95)', borderColor: 'rgba(37, 99, 235, 0.20)' };
  if (status === 'preparing') return { background: 'rgba(208, 138, 10, 0.10)', color: 'rgba(140, 92, 3, 0.95)', borderColor: 'rgba(208, 138, 10, 0.22)' };
  return { background: 'rgba(11, 58, 91, 0.08)', color: 'rgba(11, 58, 91, 0.96)', borderColor: 'rgba(11, 58, 91, 0.18)' };
}

type Props = {
  order: OrderConfirmation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
};

export function LeftOrderCard({ order, open, onOpenChange, isMobile }: Props): React.ReactElement | null {
  const [expanded, setExpanded] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(open && isMobile);
  useFocusTrap(panelRef, open && isMobile, () => onOpenChange(false));

  const discountLine = useMemo(() => {
    if (!order) return null;
    const d = order.pricing.discountAmount;
    if (!d) return null;
    const pct = typeof order.pricing.discountPercent === 'number' ? ` (${order.pricing.discountPercent}%)` : '';
    return `−${formatPKR(d)}${pct}`;
  }, [order]);

  if (!order) return null;

  if (isMobile) {
    return createPortal(
      <>
        {!open && (
          <button type="button" className={styles.miniCart} onClick={() => onOpenChange(true)} aria-label="View Order">
            <svg className={styles.miniCartIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6.2 6l.25 2H19a1 1 0 0 1 .98 1.2l-1.2 6A2 2 0 0 1 16.82 17H8a2 2 0 0 1-1.96-1.6L4.1 3H2a1 1 0 1 1 0-2h2.9a1 1 0 0 1 .98.8L6.2 6Z"
              />
            </svg>
          </button>
        )}

        <div
          className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
          onClick={open ? () => onOpenChange(false) : undefined}
          aria-hidden="true"
        />

        <div
          ref={panelRef}
          className={[
            styles.panel,
            styles.leftPanelMobile,
            open ? styles.panelOpen : '',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-labelledby="left-order-title"
          tabIndex={-1}
        >
          <div className={styles.panelHeader}>
            <div>
              <div id="left-order-title" className={styles.panelTitle}>
                Your Order
              </div>
              <div className={styles.hint}>Track status in real-time (mocked)</div>
            </div>
            <button type="button" className={styles.closeBtn} onClick={() => onOpenChange(false)} aria-label="Close order">
              <svg className={styles.closeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 1 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                />
              </svg>
            </button>
          </div>

          <div className={styles.panelBody}>
            <OrderDetails order={order} discountLine={discountLine} />
          </div>
        </div>
      </>,
      document.body,
    );
  }

  return (
    <div className={styles.leftDock} aria-live="polite">
      <div className={`${styles.leftCard} ${open ? styles.leftCardOpen : ''}`}>
        <div className={styles.leftCardHeader}>
          <div>
            <div style={{ fontWeight: 900, color: 'rgba(15,23,42,0.95)' }}>{order.orderId}</div>
            <div className={styles.hint} style={{ marginTop: 2 }}>
              {formatDateTime(order.createdAt)} · ETA {order.estimatedDelivery}
            </div>
          </div>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <span className={styles.badge} style={badgeStyle(order.status)}>
              {STATUS_LABEL[order.status]}
            </span>
            <button type="button" className={styles.smallBtn} onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? 'Collapse' : 'Expand'}
            </button>
            <button type="button" className={styles.closeBtn} onClick={() => onOpenChange(false)} aria-label="Hide order card">
              <svg className={styles.closeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 1 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <div className={styles.leftCardBody}>
            <OrderDetails order={order} discountLine={discountLine} />
          </div>
        )}
      </div>

      {!open && (
        <button type="button" className={styles.miniCart} onClick={() => onOpenChange(true)} aria-label="View Order">
          <svg className={styles.miniCartIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6.2 6l.25 2H19a1 1 0 0 1 .98 1.2l-1.2 6A2 2 0 0 1 16.82 17H8a2 2 0 0 1-1.96-1.6L4.1 3H2a1 1 0 1 1 0-2h2.9a1 1 0 0 1 .98.8L6.2 6Z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function OrderDetails({ order, discountLine }: { order: OrderConfirmation; discountLine: string | null }): React.ReactElement {
  return (
    <>
      <div className={styles.kv}>
        <div>Status</div>
        <span>{STATUS_LABEL[order.status]}</span>
      </div>
      <div className={styles.kv}>
        <div>Type</div>
        <span>{order.cylinderType === 'domestic' ? 'Domestic' : 'Commercial'}</span>
      </div>
      <div className={styles.kv}>
        <div>Quantity</div>
        <span>{order.quantity}</span>
      </div>
      <div className={styles.kv}>
        <div>Coupon</div>
        <span>{order.couponCode ? order.couponCode : 'No coupon'}</span>
      </div>

      <div style={{ height: 1, background: 'rgba(15,23,42,0.08)', margin: '8px 0' }} />

      <div className={styles.kv}>
        <div>Unit price</div>
        <span>{formatPKR(order.pricing.unitPrice)}</span>
      </div>
      <div className={styles.kv}>
        <div>Subtotal</div>
        <span>{formatPKR(order.pricing.subtotal)}</span>
      </div>
      {discountLine && (
        <div className={styles.kv}>
          <div>Discount</div>
          <span>{discountLine}</span>
        </div>
      )}
      <div className={styles.kv} style={{ fontWeight: 900 }}>
        <div>Total</div>
        <span>{formatPKR(order.pricing.total)}</span>
      </div>
    </>
  );
}


