export type CylinderType = 'domestic' | 'commercial';

export type OrderStatus = 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';

export type CouponKind = 'percent' | 'flat';

export type CouponResult =
  | {
      ok: true;
      code: string;
      kind: CouponKind;
      discountAmount: number;
      discountPercent?: number;
    }
  | { ok: false; code: string; reason: 'invalid' };

export type OrderDraft = {
  name: string;
  phone: string;
  address: string;
  cylinderType: CylinderType;
  quantityInput: string;
  couponCode: string;
};

export type Pricing = {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  discountPercent?: number;
};

export type OrderConfirmation = {
  orderId: string;
  status: OrderStatus;
  createdAt: Date;
  estimatedDelivery: string;
  cylinderType: CylinderType;
  quantity: number;
  couponCode?: string;
  pricing: Pricing;
};


