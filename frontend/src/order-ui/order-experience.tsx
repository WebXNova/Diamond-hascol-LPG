import React, { useEffect, useMemo, useState } from 'react';
import styles from './order-ui.module.css';
import type { CouponResult, CylinderType, OrderConfirmation, OrderDraft, OrderStatus, Pricing } from './types';
import { useMediaQuery } from './hooks/use-media-query';
import { clampInt } from './utils/format';
import { computePricing, mockSubmitOrder, mockValidateCoupon } from './utils/mock-api';
import { OrderCylinderPanel } from './ui/order-cylinder-panel';
import { LeftOrderCard } from './ui/left-order-card';
import { Toast } from './ui/toast';
import { OrderForm, type FieldErrors } from './components/order-form';
import type { CouponUIState } from './components/coupon-input';

const INITIAL_DRAFT: OrderDraft = {
  name: '',
  phone: '',
  address: '',
  cylinderType: 'domestic',
  quantityInput: '1',
  couponCode: '',
};

function parseQuantity(input: string): { value: number; ok: boolean } {
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return { value: 1, ok: false };
  return { value: clampInt(n, 1, 999), ok: Number.isInteger(n) && n > 0 };
}

function validateDraft(draft: OrderDraft): { errors: FieldErrors; quantity: number } {
  const errors: FieldErrors = {};

  if (!draft.name.trim()) errors.name = 'Customer name is required.';

  const phoneDigits = draft.phone.replace(/[^\d]/g, '');
  if (!phoneDigits) errors.phone = 'Phone number is required.';
  else if (phoneDigits.length < 10 || phoneDigits.length > 15) errors.phone = 'Enter a valid phone number.';

  if (!draft.address.trim()) errors.address = 'Exact address is required.';

  const q = parseQuantity(draft.quantityInput);
  if (!q.ok) errors.quantity = 'Quantity must be a whole number greater than 0.';

  return { errors, quantity: q.value };
}

function nextStatuses(): OrderStatus[] {
  return ['preparing', 'out_for_delivery', 'delivered'];
}

export function OrderExperience(): React.ReactElement {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<OrderDraft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [couponState, setCouponState] = useState<CouponUIState>({ status: 'idle' });

  const [bulkConfirmed, setBulkConfirmed] = useState(false);

  const [submitState, setSubmitState] = useState<{ status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string }>({
    status: 'idle',
  });

  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [toast, setToast] = useState<null | { title: string; text: string; cta?: { label: string; onClick: () => void } }>(null);

  const quantityParsed = useMemo(() => parseQuantity(draft.quantityInput), [draft.quantityInput]);
  const quantity = quantityParsed.value;
  const cylinderType: CylinderType = draft.cylinderType;

  const basePricing = useMemo(() => {
    const unitPrice = cylinderType === 'domestic' ? 2500 : 3000;
    const subtotal = unitPrice * quantity;
    return { unitPrice, quantity, subtotal };
  }, [cylinderType, quantity]);

  const appliedCoupon = couponState.status === 'applied' ? couponState.result : null;
  const pricing: Pricing = useMemo(() => computePricing({ cylinderType, quantity, coupon: appliedCoupon }), [cylinderType, quantity, appliedCoupon]);

  const needsBulkConfirm = quantity > 100 && !bulkConfirmed;

  useEffect(() => {
    // Reset bulk confirmation when user moves back into normal range
    if (quantity <= 100 && bulkConfirmed) setBulkConfirmed(false);
  }, [quantity, bulkConfirmed]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!order) return;
    // Simulate Foodpanda-style status progression
    const timeline = nextStatuses();
    const timers: number[] = [];

    timeline.forEach((status, i) => {
      const delay = 4200 + i * 4200;
      timers.push(
        window.setTimeout(() => {
          setOrder((prev) => (prev ? { ...prev, status } : prev));
        }, delay),
      );
    });

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [order?.orderId]);

  const openPanel = () => setPanelOpen(true);
  const closePanel = () => {
    setPanelOpen(false);
    setErrors({});
    setSubmitState({ status: 'idle' });
  };

  const onChange = (patch: Partial<OrderDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const applyCoupon = async () => {
    const code = draft.couponCode.trim();
    if (!code) {
      setCouponState({ status: 'idle' });
      return;
    }
    setCouponState({ status: 'applying' });

    const result = await mockValidateCoupon(code, basePricing);
    if (result.ok) {
      setCouponState({ status: 'applied', result });
      setErrors((e) => ({ ...e }));
      return;
    }

    setCouponState({ status: 'invalid', message: 'Invalid coupon code.' });
  };

  const submit = async () => {
    if (submitState.status === 'submitting') return;

    const v = validateDraft(draft);
    setErrors(v.errors);
    if (Object.keys(v.errors).length > 0) return;

    if (needsBulkConfirm) {
      setToast({
        title: 'Large quantity',
        text: `You selected ${quantity} cylinders — proceed?`,
        cta: { label: 'Proceed', onClick: () => setBulkConfirmed(true) },
      });
      return;
    }

    setSubmitState({ status: 'submitting' });

    const coupon = couponState.status === 'applied' ? couponState.result : null;
    const res = await mockSubmitOrder({ draft, cylinderType, quantity: v.quantity, coupon, pricing });
    if (!res.ok) {
      setSubmitState({ status: 'error', message: res.message });
      return;
    }

    setSubmitState({ status: 'idle' });
    setOrder(res.data);
    setLeftOpen(true);
    closePanel();

    setToast({
      title: 'Order confirmed',
      text: `Order ${res.data.orderId} — Pay on delivery`,
      cta: { label: 'View Order', onClick: () => setLeftOpen(true) },
    });
  };

  const retrySubmit = async () => {
    setSubmitState({ status: 'idle' });
    await submit();
  };

  const triggerLabel = 'Order LPG Cylinder';

  return (
    <>
      <button className={styles.orderTrigger} type="button" onClick={openPanel} aria-label={triggerLabel}>
        <svg className={styles.orderTriggerIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 2a1 1 0 0 1 1 1v1.06a4 4 0 0 1 3 3.88V10a3 3 0 0 1 2.4 2.94V20a2 2 0 0 1-2 2H7.6a2 2 0 0 1-2-2v-7.06A3 3 0 0 1 8 10V7.94a4 4 0 0 1 3-3.88V3a1 1 0 0 1 1-1Zm4.4 11H7.6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h8.8a1 1 0 0 0 1-1v-6.06a1 1 0 0 0-1-1ZM12 5a3 3 0 0 0-3 2.94V10h6V7.94A3 3 0 0 0 12 5Z"
          />
        </svg>
        <span>{triggerLabel}</span>
      </button>

      <OrderCylinderPanel open={panelOpen} onClose={closePanel} mode={isMobile ? 'mobile' : 'desktop'} title="Order LPG Cylinder">
        <OrderForm
          draft={draft}
          errors={errors}
          disabled={submitState.status === 'submitting'}
          quantity={quantity}
          pricing={pricing}
          couponState={couponState}
          needsBulkConfirm={needsBulkConfirm}
          bulkQuantity={quantity}
          onChange={(patch) => {
            onChange(patch);
            if (patch.couponCode !== undefined && couponState.status !== 'idle') setCouponState({ status: 'idle' });
          }}
          onApplyCoupon={applyCoupon}
          onConfirmBulk={() => setBulkConfirmed(true)}
          onSubmit={submit}
          submitState={submitState}
          onRetry={retrySubmit}
        />
      </OrderCylinderPanel>

      <LeftOrderCard
        order={order}
        open={leftOpen}
        onOpenChange={setLeftOpen}
        isMobile={isMobile}
      />

      {toast && (
        <div className={styles.toastWrap} aria-live="polite" aria-atomic="true">
          <Toast title={toast.title} text={toast.text} cta={toast.cta} onDismiss={() => setToast(null)} />
        </div>
      )}
    </>
  );
}


