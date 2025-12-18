/**
 * Mock Data for Admin Panel
 * This file contains all mock data structures that will be replaced with API calls later
 */

// Mock Admin Credentials (for testing)
export const MOCK_ADMIN = {
  email: 'admin@diamondhascol.com',
  password: 'admin123',
  id: 'admin-001',
  name: 'Admin User'
};

// Mock Dashboard Data
export const mockDashboard = {
  stats: {
    totalOrders: 156,
    pendingOrders: 12,
    deliveredOrders: 134,
    totalRevenue: 485600
  },
  recentOrders: [
    {
      id: 'ORD-001',
      customerName: 'John Doe',
      phone: '+923001234567',
      cylinderType: 'domestic',
      quantity: 2,
      total: 6400,
      status: 'pending',
      createdAt: '2025-01-15T10:30:00Z'
    },
    {
      id: 'ORD-002',
      customerName: 'Ahmed Khan',
      phone: '+923007654321',
      cylinderType: 'commercial',
      quantity: 1,
      total: 12800,
      status: 'confirmed',
      createdAt: '2025-01-15T09:15:00Z'
    },
    {
      id: 'ORD-003',
      customerName: 'Fatima Ali',
      phone: '+923001112233',
      cylinderType: 'domestic',
      quantity: 3,
      total: 9600,
      status: 'delivered',
      createdAt: '2025-01-14T16:45:00Z'
    }
  ],
  chartData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [45, 52, 48, 61, 55, 67]
  }
};

// Mock Orders Data
export const mockOrders = [
  {
    id: 'ORD-001',
    customerName: 'John Doe',
    phone: '+923001234567',
    cylinderType: 'domestic',
    quantity: 2,
    total: 6400,
    status: 'pending',
    createdAt: '2025-01-15T10:30:00Z',
    address: '123 Main St, Larkana',
    coupon: null
  },
  {
    id: 'ORD-002',
    customerName: 'Ahmed Khan',
    phone: '+923007654321',
    cylinderType: 'commercial',
    quantity: 1,
    total: 12800,
    status: 'confirmed',
    createdAt: '2025-01-15T09:15:00Z',
    address: '456 Business Ave, Larkana',
    coupon: 'WELCOME10'
  },
  {
    id: 'ORD-003',
    customerName: 'Fatima Ali',
    phone: '+923001112233',
    cylinderType: 'domestic',
    quantity: 3,
    total: 9600,
    status: 'delivered',
    createdAt: '2025-01-14T16:45:00Z',
    address: '789 Residential Rd, Larkana',
    coupon: null
  },
  {
    id: 'ORD-004',
    customerName: 'Muhammad Hassan',
    phone: '+923004445566',
    cylinderType: 'domestic',
    quantity: 1,
    total: 3200,
    status: 'in-transit',
    createdAt: '2025-01-14T14:20:00Z',
    address: '321 Park Lane, Larkana',
    coupon: 'FLAT500'
  },
  {
    id: 'ORD-005',
    customerName: 'Sara Ahmed',
    phone: '+923007778899',
    cylinderType: 'commercial',
    quantity: 2,
    total: 25600,
    status: 'pending',
    createdAt: '2025-01-14T11:10:00Z',
    address: '654 Market St, Larkana',
    coupon: null
  }
];

// Mock Messages Data
export const mockMessages = [
  {
    id: 'MSG-001',
    name: 'Ahmed Khan',
    email: 'ahmed@example.com',
    phone: '+923001234567',
    message: 'When will my order be delivered? I placed it 2 days ago.',
    isRead: false,
    createdAt: '2025-01-15T14:20:00Z'
  },
  {
    id: 'MSG-002',
    name: 'Fatima Ali',
    email: 'fatima@example.com',
    phone: '+923007654321',
    message: 'I need to change my delivery address. Can you help?',
    isRead: false,
    createdAt: '2025-01-15T12:30:00Z'
  },
  {
    id: 'MSG-003',
    name: 'Muhammad Hassan',
    email: 'hassan@example.com',
    phone: '+923001112233',
    message: 'Thank you for the quick delivery! Great service.',
    isRead: true,
    createdAt: '2025-01-14T18:45:00Z'
  },
  {
    id: 'MSG-004',
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    phone: '+923004445566',
    message: 'Do you offer bulk discounts for commercial orders?',
    isRead: false,
    createdAt: '2025-01-14T10:15:00Z'
  },
  {
    id: 'MSG-005',
    name: 'Ali Raza',
    email: 'ali@example.com',
    phone: '+923007778899',
    message: 'My cylinder seems to have a leak. What should I do?',
    isRead: true,
    createdAt: '2025-01-13T16:20:00Z'
  }
];

// Mock Coupons Data
export const mockCoupons = [
  {
    id: 'CPN-001',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    maxDiscount: 500,
    expiresAt: '2025-12-31T23:59:59Z',
    usageCount: 45,
    usageLimit: 100,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'CPN-002',
    code: 'FLAT500',
    type: 'fixed',
    value: 500,
    minPurchase: 5000,
    maxDiscount: 500,
    expiresAt: '2025-06-30T23:59:59Z',
    usageCount: 23,
    usageLimit: 50,
    isActive: true,
    createdAt: '2025-01-05T00:00:00Z'
  },
  {
    id: 'CPN-003',
    code: 'SUMMER20',
    type: 'percentage',
    value: 20,
    minPurchase: 10000,
    maxDiscount: 2000,
    expiresAt: '2025-08-31T23:59:59Z',
    usageCount: 12,
    usageLimit: 200,
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z'
  },
  {
    id: 'CPN-004',
    code: 'NEWYEAR15',
    type: 'percentage',
    value: 15,
    minPurchase: 3000,
    maxDiscount: 1000,
    expiresAt: '2025-01-31T23:59:59Z',
    usageCount: 8,
    usageLimit: 30,
    isActive: false,
    createdAt: '2024-12-20T00:00:00Z'
  }
];

// Export all as default object for convenience
export default {
  MOCK_ADMIN,
  mockDashboard,
  mockOrders,
  mockMessages,
  mockCoupons
};

