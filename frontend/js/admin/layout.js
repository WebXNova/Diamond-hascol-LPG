/**
 * Admin Layout Module
 * Handles sidebar navigation, header, and layout initialization
 */

import { getCurrentAdmin } from './auth.js';
import { navigateTo, logout } from './router.js';

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
    // Let CSS control visibility; JS only controls open/close state
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-controls', 'admin-sidebar');
    sidebar.setAttribute('id', 'admin-sidebar');

    const setSidebarOpen = (open) => {
      sidebar.classList.toggle('open', open);
      if (backdrop) backdrop.classList.toggle('show', open);

      mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    const toggleSidebar = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setSidebarOpen(!sidebar.classList.contains('open'));
    };

    mobileMenuBtn.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking backdrop
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        setSidebarOpen(false);
      });
    }

    // Close sidebar when clicking nav items on mobile
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          setSidebarOpen(false);
        }
      });
    });

    // Close sidebar on Escape (mobile and desktop)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
          setSidebarOpen(false);
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

  const userBlock = document.querySelector('.admin-user');

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

  // Toggle user dropdown (name/email) on avatar click
  if (userBlock && avatarEl) {
    const dropdown = userBlock.querySelector('.admin-user__dropdown');

    const setOpen = (open) => {
      userBlock.classList.toggle('is-open', open);
      avatarEl.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (dropdown) dropdown.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    // Ensure default state is closed
    setOpen(false);

    avatarEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!userBlock.classList.contains('is-open'));
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!userBlock.contains(e.target)) setOpen(false);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
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

