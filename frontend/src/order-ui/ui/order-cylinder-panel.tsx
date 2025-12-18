import React, { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '../order-ui.module.css';
import { useFocusTrap } from '../hooks/use-focus-trap';
import { useLockBodyScroll } from '../hooks/use-lock-body-scroll';

type Props = {
  open: boolean;
  mode: 'mobile' | 'desktop';
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function OrderCylinderPanel({ open, mode, title, onClose, children }: Props): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(open);
  useFocusTrap(panelRef, open, onClose);

  const describedById = useMemo(() => `order-panel-desc-${mode}`, [mode]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={open ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={[
          styles.panel,
          mode === 'mobile' ? styles.panelMobile : styles.panelDesktop,
          open ? styles.panelOpen : '',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-panel-title"
        aria-describedby={describedById}
        tabIndex={-1}
      >
        <div className={styles.panelHeader}>
          <div>
            <div id="order-panel-title" className={styles.panelTitle}>
              {title}
            </div>
            <div id={describedById} className={styles.hint}>
              Pay on delivery · Fast confirmation · No page reloads
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close order panel">
            <svg className={styles.closeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 1 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
              />
            </svg>
          </button>
        </div>
        <div className={styles.panelBody}>{children}</div>
      </div>
    </>,
    document.body,
  );
}


