import type { CylinderType, CouponResult, Pricing } from '../types';
import { clampInt } from './format';

/**
 * Utility functions for pricing calculations (UI display only)
 * Backend is the single source of truth for actual pricing
 */

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


