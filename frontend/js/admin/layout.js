/**
 * Admin Layout Module
 * Handles sidebar navigation, header, and layout initialization
 */

import { getCurrentAdmin, logout } from './auth.js';
import { navigateTo } from './router.js';

/**
 * Initialize admin layout
 */
export function initLayout() {
  initSidebar();
  initHeader();
  highlightActiveRoute();
}

/**
 * Initialize sidebar navigation
 */
function initSidebar() {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.admin-nav__item');

  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && currentPath.includes(href)) {
      item.classList.add('active');
    }

    // Handle navigation clicks
    item.addEventListener('click', (e) => {
      if (href && !href.startsWith('#')) {
        e.preventDefault();
        const page = href.split('/').pop();
        navigateTo(page);
      }
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('admin-mobile-menu-btn');
  const sidebar = document.querySelector('.admin-sidebar');
  const backdrop = document.querySelector('.admin-sidebar-backdrop');
  
  if (mobileMenuBtn && sidebar) {
    // Show mobile menu button on mobile
    if (window.innerWidth <= 768) {
      mobileMenuBtn.style.display = 'block';
    }

    // Toggle sidebar
    const toggleSidebar = () => {
      sidebar.classList.toggle('open');
      if (backdrop) {
        backdrop.classList.toggle('show');
      }
      // Prevent body scroll when sidebar is open
      if (sidebar.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    mobileMenuBtn.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking backdrop
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
      });
    }

    // Close sidebar when clicking nav items on mobile
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          if (backdrop) {
            backdrop.classList.remove('show');
          }
          document.body.style.overflow = '';
        }
      });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
          sidebar.classList.remove('open');
          if (backdrop) {
            backdrop.classList.remove('show');
          }
          document.body.style.overflow = '';
          mobileMenuBtn.style.display = 'none';
        } else {
          mobileMenuBtn.style.display = 'block';
        }
      }, 250);
    });
  }
}

/**
 * Initialize header with user info
 */
function initHeader() {
  const admin = getCurrentAdmin();
  
  if (!admin) {
    return;
  }

  // Set user name
  const userNameEl = document.getElementById('admin-user-name');
  if (userNameEl) {
    userNameEl.textContent = admin.name || admin.email;
  }

  // Set user email
  const userEmailEl = document.getElementById('admin-user-email');
  if (userEmailEl) {
    userEmailEl.textContent = admin.email;
  }

  // Set avatar initial
  const avatarEl = document.getElementById('admin-user-avatar');
  if (avatarEl) {
    const initial = (admin.name || admin.email).charAt(0).toUpperCase();
    avatarEl.textContent = initial;
  }

  // Logout button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        logout();
      }
    });
  }
}

/**
 * Highlight active route in sidebar
 */
function highlightActiveRoute() {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.admin-nav__item');

  navItems.forEach(item => {
    item.classList.remove('active');
    const href = item.getAttribute('href');
    if (href && currentPath.includes(href)) {
      item.classList.add('active');
    }
  });
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLayout);
} else {
  initLayout();
}

// Export for manual initialization if needed
window.AdminLayout = {
  initLayout,
  initSidebar,
  initHeader
};

