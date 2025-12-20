import React from 'react';
import styles from '../order-ui.module.css';

type Props = {
  title: string;
  text: string;
  cta?: { label: string; onClick: () => void };
  onDismiss: () => void;
};

export function Toast({ title, text, cta, onDismiss }: Props): React.ReactElement {
  return (
    <div className={styles.toast} role="status">
      <div>
        <div className={styles.toastTitle}>{title}</div>
        <div className={styles.toastText}>{text}</div>
      </div>
      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        {cta && (
          <button type="button" className={styles.smallBtn} onClick={cta.onClick} aria-label={cta.label}>
            {cta.label}
          </button>
        )}
        <button type="button" className={styles.closeBtn} onClick={onDismiss} aria-label="Dismiss">
          <svg className={styles.closeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 1 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}


