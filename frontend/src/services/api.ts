/**
 * Centralized API Service
 * All API calls go through this service for consistency and error handling
 */

const API_BASE_URL = 'http://localhost:5000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
}

/**
 * Base API request function with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: data.success !== false,
      data: data.data || data,
      error: data.error,
      message: data.message,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error — please check your connection and try again.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}

// ============================================
// PUBLIC API ENDPOINTS
// ============================================

export interface OrderRequest {
  name: string;
  phone: string;
  address: string;
  cylinderType: 'Domestic' | 'Commercial';
  quantity: number;
  couponCode?: string;
}

export interface OrderResponse {
  orderId: number;
  status: string;
  createdAt: string;
  pricePerCylinder: number;
  subtotal: number;
  discount: number;
  totalPrice: number;
  couponCode?: string | null;
  message?: string;
}

/**
 * Create a new order
 */
export async function createOrder(data: OrderRequest): Promise<ApiResponse<OrderResponse>> {
  return apiRequest<OrderResponse>('/api/order', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface CouponValidationRequest {
  code: string;
  subtotal: number;
  cylinderType: 'Domestic' | 'Commercial';
}

export interface CouponValidationResponse {
  code: string;
  kind: 'percent' | 'flat';
  discountPercent?: number;
  discountAmount: number;
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  data: CouponValidationRequest
): Promise<ApiResponse<CouponValidationResponse>> {
  return apiRequest<CouponValidationResponse>('/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface Product {
  id: number;
  name: string;
  type: 'Domestic' | 'Commercial';
  price: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all products
 */
export async function getProducts(): Promise<ApiResponse<Product[]>> {
  return apiRequest<Product[]>('/api/products');
}

/**
 * Get product by ID
 */
export async function getProductById(id: string | number): Promise<ApiResponse<Product>> {
  return apiRequest<Product>(`/api/products/${id}`);
}

export interface ContactMessageRequest {
  name: string;
  phone: string;
  message: string;
}

/**
 * Submit contact message
 */
export async function submitContactMessage(
  data: ContactMessageRequest
): Promise<ApiResponse<void>> {
  return apiRequest<void>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string | number): Promise<ApiResponse<OrderResponse>> {
  return apiRequest<OrderResponse>(`/api/orders/${id}`);
}

// ============================================
// ADMIN API ENDPOINTS
// ============================================

export interface AdminOrder {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  cylinderType: string;
  quantity: number;
  pricePerCylinder: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  status: string;
  createdAt: string;
}

/**
 * Get all orders (admin)
 */
export async function getAdminOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<AdminOrder[]>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  const endpoint = `/api/admin/orders${query ? `?${query}` : ''}`;
  
  return apiRequest<AdminOrder[]>(endpoint);
}

/**
 * Get order by ID (admin)
 */
export async function getAdminOrderById(id: string | number): Promise<ApiResponse<AdminOrder>> {
  return apiRequest<AdminOrder>(`/api/admin/orders/${id}`);
}

/**
 * Update order status (admin)
 */
export async function updateOrderStatus(
  id: string | number,
  status: string
): Promise<ApiResponse<AdminOrder>> {
  return apiRequest<AdminOrder>(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Delete order (admin)
 */
export async function deleteOrder(id: string | number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/admin/orders/${id}`, {
    method: 'DELETE',
  });
}

export interface AdminMessage {
  id: number;
  name: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Get all messages (admin)
 */
export async function getAdminMessages(params?: {
  isRead?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<AdminMessage[]>> {
  const queryParams = new URLSearchParams();
  if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  const endpoint = `/api/admin/messages${query ? `?${query}` : ''}`;
  
  return apiRequest<AdminMessage[]>(endpoint);
}

/**
 * Mark message as read (admin)
 */
export async function markMessageAsRead(id: string | number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/admin/messages/${id}/read`, {
    method: 'PATCH',
  });
}

/**
 * Delete message (admin)
 */
export async function deleteMessage(id: string | number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/admin/messages/${id}`, {
    method: 'DELETE',
  });
}

export interface AdminCoupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  applicableCylinderType: 'Domestic' | 'Commercial' | 'Both';
  minOrderAmount?: number;
  expiryDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  applicableCylinderType: 'Domestic' | 'Commercial' | 'Both';
  minOrderAmount?: number;
  expiryDate?: string;
  isActive?: boolean;
}

/**
 * Get all coupons (admin)
 */
export async function getAdminCoupons(): Promise<ApiResponse<AdminCoupon[]>> {
  return apiRequest<AdminCoupon[]>('/api/admin/coupons');
}

/**
 * Get coupon by code (admin)
 */
export async function getAdminCouponByCode(code: string): Promise<ApiResponse<AdminCoupon>> {
  return apiRequest<AdminCoupon>(`/api/admin/coupons/${code}`);
}

/**
 * Create coupon (admin)
 */
export async function createCoupon(
  data: CreateCouponRequest
): Promise<ApiResponse<AdminCoupon>> {
  return apiRequest<AdminCoupon>('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update coupon (admin)
 */
export async function updateCoupon(
  code: string,
  data: Partial<CreateCouponRequest>
): Promise<ApiResponse<AdminCoupon>> {
  return apiRequest<AdminCoupon>(`/api/admin/coupons/${code}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete coupon (admin)
 */
export async function deleteCoupon(code: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/admin/coupons/${code}`, {
    method: 'DELETE',
  });
}

// ============================================
// ADMIN PRODUCT ENDPOINTS
// ============================================

export interface AdminProduct {
  id: number;
  name: string;
  type: string | null;
  weight: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
  isActive: boolean;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all products (admin)
 */
export async function getAdminProducts(): Promise<ApiResponse<AdminProduct[]>> {
  return apiRequest<AdminProduct[]>('/api/admin/products');
}

/**
 * Get product by ID (admin)
 */
export async function getAdminProductById(id: string | number): Promise<ApiResponse<AdminProduct>> {
  return apiRequest<AdminProduct>(`/api/admin/products/${id}`);
}

/**
 * Create product (admin) - with FormData for image upload
 */
export async function createAdminProduct(formData: FormData): Promise<ApiResponse<AdminProduct>> {
  const API_BASE_URL = 'http://localhost:5000';
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: data.success !== false,
      data: data.data as AdminProduct,
      error: data.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Update product (admin) - with FormData for image upload
 */
export async function updateAdminProduct(
  id: string | number,
  formData: FormData
): Promise<ApiResponse<AdminProduct>> {
  const API_BASE_URL = 'http://localhost:5000';
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
      method: 'PATCH',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: data.success !== false,
      data: data.data as AdminProduct,
      error: data.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Toggle product stock (admin)
 */
export async function toggleProductStock(
  id: string | number
): Promise<ApiResponse<AdminProduct>> {
  return apiRequest<AdminProduct>(`/api/admin/products/${id}/stock`, {
    method: 'PATCH',
  });
}

/**
 * Delete product (admin)
 */
export async function deleteAdminProduct(id: string | number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}

