import { RefObject, useEffect } from 'react';

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(selector));
  return nodes.filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden') && el.tabIndex !== -1);
}

export function useFocusTrap(containerRef: RefObject<HTMLElement>, active: boolean, onEscape?: () => void): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const focusables = getFocusable(container);
      (focusables[0] ?? container).focus?.();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusables = getFocusable(container);
      if (!focusables.length) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!current || current === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Focus ASAP after paint to avoid scroll jumps.
    const raf = window.requestAnimationFrame(focusFirst);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef, onEscape]);
}


