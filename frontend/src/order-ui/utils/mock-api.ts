import type { CylinderType, CouponResult, OrderConfirmation, OrderDraft, Pricing } from '../types';
import { clampInt, digitsOnly } from './format';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function unitPriceFor(type: CylinderType): number {
  return type === 'domestic' ? 2500 : 3000;
}

export function computePricing(args: {
  cylinderType: CylinderType;
  quantity: number;
  coupon?: CouponResult | null;
}): Pricing {
  const quantity = clampInt(args.quantity, 1, 999);
  const unitPrice = unitPriceFor(args.cylinderType);
  const subtotal = unitPrice * quantity;

  let discountAmount = 0;
  let discountPercent: number | undefined;

  if (args.coupon?.ok) {
    if (args.coupon.kind === 'percent') {
      discountPercent = args.coupon.discountPercent ?? 0;
      discountAmount = Math.round((subtotal * discountPercent) / 100);
    } else {
      discountAmount = Math.min(subtotal, Math.round(args.coupon.discountAmount));
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  return { unitPrice, quantity, subtotal, discountAmount, total, discountPercent };
}

export async function mockValidateCoupon(codeRaw: string, pricing: Omit<Pricing, 'discountAmount' | 'total'>): Promise<CouponResult> {
  const code = codeRaw.trim().toUpperCase();
  await sleep(randomBetween(500, 700));

  if (code === 'WELCOME10') {
    return { ok: true, code: 'WELCOME10', kind: 'percent', discountPercent: 10, discountAmount: Math.round((pricing.subtotal * 10) / 100) };
  }

  if (code === 'FLAT500') {
    return { ok: true, code: 'FLAT500', kind: 'flat', discountAmount: 500 };
  }

  return { ok: false, code, reason: 'invalid' };
}

export async function mockSubmitOrder(args: {
  draft: OrderDraft;
  cylinderType: CylinderType;
  quantity: number;
  coupon: CouponResult | null;
  pricing: Pricing;
}): Promise<{ ok: true; data: OrderConfirmation } | { ok: false; message: string }> {
  await sleep(randomBetween(800, 1000));

  // Deterministic-ish failure trigger for UI testing + light random errors.
  const digits = digitsOnly(args.draft.phone);
  const shouldFail = digits.endsWith('000') || Math.random() < 0.12;

  if (shouldFail) {
    return { ok: false, message: 'Network error — please try again.' };
  }

  const createdAt = new Date();
  return {
    ok: true,
    data: {
      orderId: `ORD${Date.now()}`,
      status: 'confirmed',
      createdAt,
      estimatedDelivery: '+24 hours',
      cylinderType: args.cylinderType,
      quantity: args.quantity,
      couponCode: args.coupon?.ok ? args.coupon.code : undefined,
      pricing: args.pricing,
    },
  };
}


