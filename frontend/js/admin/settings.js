/**
 * Settings Module
 * Comprehensive admin settings management for LPG Agency
 */

import { getCurrentAdmin } from './auth.js';

// Comprehensive settings data structure
let currentSettings = {
  profile: {
    name: 'Admin User',
    email: 'admin@diamondhascol.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  },
  system: {
    emailNotifications: true,
    orderNotifications: true,
    messageNotifications: true,
    dashboardRefresh: 30,
    itemsPerPage: 20,
    theme: 'light',
    language: 'en'
  },
  business: {
    companyName: 'Diamond Hascol LPG Agency',
    phone: '+92 300 341 1169',
    email: 'info@diamondhascol.com',
    address: 'Larkana, Sindh',
    city: 'Larkana',
    country: 'Pakistan',
    whatsappNumber: '923003411169',
    notificationBanner: 'Order LPG Cylinder in Seconds in Larkana'
  },
  pricing: {
    domesticPrice: 3200,
    commercialPrice: 12800,
    deliveryCharge: 0,
    freeDeliveryThreshold: 5000,
    bulkDiscountEnabled: true,
    bulkDiscountThreshold: 5,
    bulkDiscountPercent: 5
  },
  delivery: {
    defaultDeliveryTime: 24, // hours
    expressDeliveryAvailable: true,
    expressDeliveryTime: 6, // hours
    expressDeliveryCharge: 500,
    serviceAreas: ['Larkana', 'Nearby Areas'],
    deliveryHoursStart: '09:00',
    deliveryHoursEnd: '18:00',
    deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  },
  service: {
    refillingServiceAvailable: true,
    refillingPrice: 2500,
    maintenanceServiceAvailable: true,
    emergencyServiceAvailable: true,
    emergencyServiceCharge: 1000,
    serviceCommitment: 'We guarantee safe and timely delivery within 24 hours',
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:00',
    operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  inventory: {
    domesticStock: 50,
    commercialStock: 20,
    lowStockThreshold: 10,
    autoUpdateStock: false
  },
  payment: {
    cashOnDelivery: true,
    bankTransfer: true,
    mobilePayment: true,
    paymentTerms: 'Payment on delivery only'
  },
  orders: {
    autoConfirmOrders: false,
    requirePhoneVerification: false,
    minOrderQuantity: 1,
    maxOrderQuantity: 10,
    allowBulkOrders: true
  },
  communication: {
    orderConfirmationTemplate: 'Your order {ORDER_ID} has been confirmed. We will deliver within {DELIVERY_TIME} hours.',
    deliveryUpdateTemplate: 'Your order {ORDER_ID} is out for delivery. Expected delivery: {ETA}',
    defaultLanguage: 'en'
  }
};

/**
 * Load current settings
 */
function loadSettings() {
  const admin = getCurrentAdmin();
  if (admin) {
    currentSettings.profile.name = admin.name || 'Admin User';
    currentSettings.profile.email = admin.email || 'admin@diamondhascol.com';
  }

  // Load from localStorage (mock persistence)
  const savedSettings = localStorage.getItem('admin_settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      currentSettings = { ...currentSettings, ...parsed };
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  renderSettings();
}

/**
 * Save settings (mock - UI only)
 */
function saveSettings() {
  // In production: PATCH /api/admin/settings
  localStorage.setItem('admin_settings', JSON.stringify(currentSettings));
  showNotification('Settings saved successfully', 'success');
  
  // Update pricing in the main app if needed
  updateGlobalPricing();
}

/**
 * Update global pricing (sync with main app)
 */
function updateGlobalPricing() {
  // In production, this would update the pricing across the application
  if (window.PRICES) {
    window.PRICES.domestic = currentSettings.pricing.domesticPrice;
    window.PRICES.commercial = currentSettings.pricing.commercialPrice;
  }
}

/**
 * Render profile settings
 */
function renderProfileSettings() {
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  
  if (nameInput) nameInput.value = currentSettings.profile.name;
  if (emailInput) emailInput.value = currentSettings.profile.email;
}

/**
 * Render system settings
 */
function renderSystemSettings() {
  const emailNotif = document.getElementById('email-notifications');
  const orderNotif = document.getElementById('order-notifications');
  const messageNotif = document.getElementById('message-notifications');
  const dashboardRefresh = document.getElementById('dashboard-refresh');
  const itemsPerPage = document.getElementById('items-per-page');
  const theme = document.getElementById('theme');

  if (emailNotif) emailNotif.checked = currentSettings.system.emailNotifications;
  if (orderNotif) orderNotif.checked = currentSettings.system.orderNotifications;
  if (messageNotif) messageNotif.checked = currentSettings.system.messageNotifications;
  if (dashboardRefresh) dashboardRefresh.value = currentSettings.system.dashboardRefresh;
  if (itemsPerPage) itemsPerPage.value = currentSettings.system.itemsPerPage;
  if (theme) theme.value = currentSettings.system.theme;
}

/**
 * Render business settings
 */
function renderBusinessSettings() {
  const inputs = {
    'company-name': currentSettings.business.companyName,
    'company-phone': currentSettings.business.phone,
    'company-email': currentSettings.business.email,
    'company-address': currentSettings.business.address,
    'company-city': currentSettings.business.city,
    'company-country': currentSettings.business.country,
    'whatsapp-number': currentSettings.business.whatsappNumber,
    'notification-banner': currentSettings.business.notificationBanner
  };

  Object.entries(inputs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

/**
 * Render pricing settings
 */
function renderPricingSettings() {
  const inputs = {
    'domestic-price': currentSettings.pricing.domesticPrice,
    'commercial-price': currentSettings.pricing.commercialPrice,
    'delivery-charge': currentSettings.pricing.deliveryCharge,
    'free-delivery-threshold': currentSettings.pricing.freeDeliveryThreshold,
    'bulk-discount-threshold': currentSettings.pricing.bulkDiscountThreshold,
    'bulk-discount-percent': currentSettings.pricing.bulkDiscountPercent
  };

  Object.entries(inputs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  const bulkDiscountEnabled = document.getElementById('bulk-discount-enabled');
  if (bulkDiscountEnabled) bulkDiscountEnabled.checked = currentSettings.pricing.bulkDiscountEnabled;
}

/**
 * Render delivery settings
 */
function renderDeliverySettings() {
  const inputs = {
    'default-delivery-time': currentSettings.delivery.defaultDeliveryTime,
    'express-delivery-time': currentSettings.delivery.expressDeliveryTime,
    'express-delivery-charge': currentSettings.delivery.expressDeliveryCharge,
    'delivery-hours-start': currentSettings.delivery.deliveryHoursStart,
    'delivery-hours-end': currentSettings.delivery.deliveryHoursEnd
  };

  Object.entries(inputs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  const expressAvailable = document.getElementById('express-delivery-available');
  if (expressAvailable) expressAvailable.checked = currentSettings.delivery.expressDeliveryAvailable;

  // Service areas
  const serviceAreasInput = document.getElementById('service-areas');
  if (serviceAreasInput) {
    serviceAreasInput.value = currentSettings.delivery.serviceAreas.join(', ');
  }

  // Delivery days
  currentSettings.delivery.deliveryDays.forEach(day => {
    const checkbox = document.getElementById(`delivery-day-${day}`);
    if (checkbox) checkbox.checked = true;
  });
}

/**
 * Render service settings
 */
function renderServiceSettings() {
  const inputs = {
    'refilling-price': currentSettings.service.refillingPrice,
    'emergency-service-charge': currentSettings.service.emergencyServiceCharge,
    'service-commitment': currentSettings.service.serviceCommitment,
    'operating-hours-start': currentSettings.service.operatingHoursStart,
    'operating-hours-end': currentSettings.service.operatingHoursEnd
  };

  Object.entries(inputs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  const refillingAvailable = document.getElementById('refilling-service-available');
  const maintenanceAvailable = document.getElementById('maintenance-service-available');
  const emergencyAvailable = document.getElementById('emergency-service-available');

  if (refillingAvailable) refillingAvailable.checked = currentSettings.service.refillingServiceAvailable;
  if (maintenanceAvailable) maintenanceAvailable.checked = currentSettings.service.maintenanceServiceAvailable;
  if (emergencyAvailable) emergencyAvailable.checked = currentSettings.service.emergencyServiceAvailable;

  // Operating days
  currentSettings.service.operatingDays.forEach(day => {
    const checkbox = document.getElementById(`operating-day-${day}`);
    if (checkbox) checkbox.checked = true;
  });
}

/**
 * Render inventory settings
 */
function renderInventorySettings() {
  const inputs = {
    'domestic-stock': currentSettings.inventory.domesticStock,
    'commercial-stock': currentSettings.inventory.commercialStock,
    'low-stock-threshold': currentSettings.inventory.lowStockThreshold
  };

  Object.entries(inputs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  const autoUpdate = document.getElementById('auto-update-stock');
  if (autoUpdate) autoUpdate.checked = currentSettings.inventory.autoUpdateStock;
}

/**
 * Render payment settings
 */
function renderPaymentSettings() {
  const cashOnDelivery = document.getElementById('cash-on-delivery');
  const bankTransfer = document.getElementById('bank-transfer');
  const mobilePayment = document.getElementById('mobile-payment');
  const paymentTerms = document.getElementById('payment-terms');

  if (cashOnDelivery) cashOnDelivery.checked = currentSettings.payment.cashOnDelivery;
  if (bankTransfer) bankTransfer.checked = currentSettings.payment.bankTransfer;
  if (mobilePayment) mobilePayment.checked = currentSettings.payment.mobilePayment;
  if (paymentTerms) paymentTerms.value = currentSettings.payment.paymentTerms;
}

/**
 * Render order settings
 */
function renderOrderSettings() {
  const inputs = {
    'min-order-quantity': currentSettings.orders.minOrderQuantity,
    'max-order-quantity': currentSettings.orders.maxOrderQuantity
  };

  Object.entries(inputs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  const autoConfirm = document.getElementById('auto-confirm-orders');
  const phoneVerification = document.getElementById('require-phone-verification');
  const allowBulk = document.getElementById('allow-bulk-orders');

  if (autoConfirm) autoConfirm.checked = currentSettings.orders.autoConfirmOrders;
  if (phoneVerification) phoneVerification.checked = currentSettings.orders.requirePhoneVerification;
  if (allowBulk) allowBulk.checked = currentSettings.orders.allowBulkOrders;
}

/**
 * Render communication settings
 */
function renderCommunicationSettings() {
  const orderTemplate = document.getElementById('order-confirmation-template');
  const deliveryTemplate = document.getElementById('delivery-update-template');

  if (orderTemplate) orderTemplate.value = currentSettings.communication.orderConfirmationTemplate;
  if (deliveryTemplate) deliveryTemplate.value = currentSettings.communication.deliveryUpdateTemplate;
}

/**
 * Render all settings
 */
function renderSettings() {
  renderProfileSettings();
  renderSystemSettings();
  renderBusinessSettings();
  renderPricingSettings();
  renderDeliverySettings();
  renderServiceSettings();
  renderInventorySettings();
  renderPaymentSettings();
  renderOrderSettings();
  renderCommunicationSettings();
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe'};
    color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 2000;
    animation: slideIn 0.3s var(--ease-out);
    max-width: 400px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s var(--ease-out)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Handle profile form submission
 */
window.saveProfileSettings = function(e) {
  e.preventDefault();

  const name = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const currentPassword = document.getElementById('profile-current-password').value;
  const newPassword = document.getElementById('profile-new-password').value;
  const confirmPassword = document.getElementById('profile-confirm-password').value;

  if (!name) {
    showNotification('Name is required', 'error');
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }

  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword) {
      showNotification('Please enter your current password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
  }

  currentSettings.profile.name = name;
  currentSettings.profile.email = email;
  if (newPassword) {
    currentSettings.profile.newPassword = newPassword;
  }

  saveSettings();
  
  document.getElementById('profile-current-password').value = '';
  document.getElementById('profile-new-password').value = '';
  document.getElementById('profile-confirm-password').value = '';
};

/**
 * Handle system settings form submission
 */
window.saveSystemSettings = function(e) {
  e.preventDefault();

  currentSettings.system.emailNotifications = document.getElementById('email-notifications').checked;
  currentSettings.system.orderNotifications = document.getElementById('order-notifications').checked;
  currentSettings.system.messageNotifications = document.getElementById('message-notifications').checked;
  currentSettings.system.dashboardRefresh = parseInt(document.getElementById('dashboard-refresh').value);
  currentSettings.system.itemsPerPage = parseInt(document.getElementById('items-per-page').value);
  currentSettings.system.theme = document.getElementById('theme').value;

  saveSettings();
};

/**
 * Handle business settings form submission
 */
window.saveBusinessSettings = function(e) {
  e.preventDefault();

  currentSettings.business.companyName = document.getElementById('company-name').value.trim();
  currentSettings.business.phone = document.getElementById('company-phone').value.trim();
  currentSettings.business.email = document.getElementById('company-email').value.trim();
  currentSettings.business.address = document.getElementById('company-address').value.trim();
  currentSettings.business.city = document.getElementById('company-city').value.trim();
  currentSettings.business.country = document.getElementById('company-country').value.trim();
  currentSettings.business.whatsappNumber = document.getElementById('whatsapp-number').value.trim();
  currentSettings.business.notificationBanner = document.getElementById('notification-banner').value.trim();

  saveSettings();
};

/**
 * Handle pricing settings form submission
 */
window.savePricingSettings = function(e) {
  e.preventDefault();

  const domesticPrice = parseFloat(document.getElementById('domestic-price').value);
  const commercialPrice = parseFloat(document.getElementById('commercial-price').value);
  const deliveryCharge = parseFloat(document.getElementById('delivery-charge').value) || 0;
  const freeDeliveryThreshold = parseFloat(document.getElementById('free-delivery-threshold').value) || 0;

  if (domesticPrice <= 0 || commercialPrice <= 0) {
    showNotification('Prices must be greater than 0', 'error');
    return;
  }

  currentSettings.pricing.domesticPrice = domesticPrice;
  currentSettings.pricing.commercialPrice = commercialPrice;
  currentSettings.pricing.deliveryCharge = deliveryCharge;
  currentSettings.pricing.freeDeliveryThreshold = freeDeliveryThreshold;
  currentSettings.pricing.bulkDiscountEnabled = document.getElementById('bulk-discount-enabled').checked;
  currentSettings.pricing.bulkDiscountThreshold = parseInt(document.getElementById('bulk-discount-threshold').value) || 5;
  currentSettings.pricing.bulkDiscountPercent = parseFloat(document.getElementById('bulk-discount-percent').value) || 0;

  saveSettings();
};

/**
 * Handle delivery settings form submission
 */
window.saveDeliverySettings = function(e) {
  e.preventDefault();

  currentSettings.delivery.defaultDeliveryTime = parseInt(document.getElementById('default-delivery-time').value);
  currentSettings.delivery.expressDeliveryAvailable = document.getElementById('express-delivery-available').checked;
  currentSettings.delivery.expressDeliveryTime = parseInt(document.getElementById('express-delivery-time').value);
  currentSettings.delivery.expressDeliveryCharge = parseFloat(document.getElementById('express-delivery-charge').value) || 0;
  currentSettings.delivery.deliveryHoursStart = document.getElementById('delivery-hours-start').value;
  currentSettings.delivery.deliveryHoursEnd = document.getElementById('delivery-hours-end').value;

  // Service areas
  const serviceAreasInput = document.getElementById('service-areas').value.trim();
  currentSettings.delivery.serviceAreas = serviceAreasInput 
    ? serviceAreasInput.split(',').map(area => area.trim()).filter(area => area)
    : [];

  // Delivery days
  const deliveryDays = [];
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
    const checkbox = document.getElementById(`delivery-day-${day}`);
    if (checkbox && checkbox.checked) {
      deliveryDays.push(day);
    }
  });
  currentSettings.delivery.deliveryDays = deliveryDays;

  saveSettings();
};

/**
 * Handle service settings form submission
 */
window.saveServiceSettings = function(e) {
  e.preventDefault();

  currentSettings.service.refillingServiceAvailable = document.getElementById('refilling-service-available').checked;
  currentSettings.service.refillingPrice = parseFloat(document.getElementById('refilling-price').value) || 0;
  currentSettings.service.maintenanceServiceAvailable = document.getElementById('maintenance-service-available').checked;
  currentSettings.service.emergencyServiceAvailable = document.getElementById('emergency-service-available').checked;
  currentSettings.service.emergencyServiceCharge = parseFloat(document.getElementById('emergency-service-charge').value) || 0;
  currentSettings.service.serviceCommitment = document.getElementById('service-commitment').value.trim();
  currentSettings.service.operatingHoursStart = document.getElementById('operating-hours-start').value;
  currentSettings.service.operatingHoursEnd = document.getElementById('operating-hours-end').value;

  // Operating days
  const operatingDays = [];
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
    const checkbox = document.getElementById(`operating-day-${day}`);
    if (checkbox && checkbox.checked) {
      operatingDays.push(day);
    }
  });
  currentSettings.service.operatingDays = operatingDays;

  saveSettings();
};

/**
 * Handle inventory settings form submission
 */
window.saveInventorySettings = function(e) {
  e.preventDefault();

  currentSettings.inventory.domesticStock = parseInt(document.getElementById('domestic-stock').value) || 0;
  currentSettings.inventory.commercialStock = parseInt(document.getElementById('commercial-stock').value) || 0;
  currentSettings.inventory.lowStockThreshold = parseInt(document.getElementById('low-stock-threshold').value) || 10;
  currentSettings.inventory.autoUpdateStock = document.getElementById('auto-update-stock').checked;

  saveSettings();
};

/**
 * Handle payment settings form submission
 */
window.savePaymentSettings = function(e) {
  e.preventDefault();

  currentSettings.payment.cashOnDelivery = document.getElementById('cash-on-delivery').checked;
  currentSettings.payment.bankTransfer = document.getElementById('bank-transfer').checked;
  currentSettings.payment.mobilePayment = document.getElementById('mobile-payment').checked;
  currentSettings.payment.paymentTerms = document.getElementById('payment-terms').value.trim();

  saveSettings();
};

/**
 * Handle order settings form submission
 */
window.saveOrderSettings = function(e) {
  e.preventDefault();

  const minQty = parseInt(document.getElementById('min-order-quantity').value);
  const maxQty = parseInt(document.getElementById('max-order-quantity').value);

  if (minQty < 1 || maxQty < minQty) {
    showNotification('Invalid quantity limits. Max must be greater than or equal to min.', 'error');
    return;
  }

  currentSettings.orders.autoConfirmOrders = document.getElementById('auto-confirm-orders').checked;
  currentSettings.orders.requirePhoneVerification = document.getElementById('require-phone-verification').checked;
  currentSettings.orders.minOrderQuantity = minQty;
  currentSettings.orders.maxOrderQuantity = maxQty;
  currentSettings.orders.allowBulkOrders = document.getElementById('allow-bulk-orders').checked;

  saveSettings();
};

/**
 * Handle communication settings form submission
 */
window.saveCommunicationSettings = function(e) {
  e.preventDefault();

  currentSettings.communication.orderConfirmationTemplate = document.getElementById('order-confirmation-template').value.trim();
  currentSettings.communication.deliveryUpdateTemplate = document.getElementById('delivery-update-template').value.trim();

  saveSettings();
};

/**
 * Initialize settings page
 */
export function initSettings() {
  loadSettings();

  // Tab navigation
  const tabButtons = document.querySelectorAll('.admin-settings-tab');
  const tabPanels = document.querySelectorAll('.admin-settings-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      button.classList.add('active');
      const targetPanel = document.getElementById(`settings-${targetTab}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettings);
} else {
  initSettings();
}
