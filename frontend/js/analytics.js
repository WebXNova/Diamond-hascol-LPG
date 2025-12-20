(() => {
  'use strict';

  // Simple analytics helper
  window.analytics = {
    track: (eventName, properties = {}) => {
      // Log to console in development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[Analytics]', eventName, properties);
      }

      // Example: Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
      }

      // Add your analytics service here (e.g., Mixpanel, Amplitude, etc.)
    }
  };
})();

