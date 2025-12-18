(() => {
  'use strict';

  const STORAGE_KEY = 'dark-mode-enabled';
  const toggleBtn = document.getElementById('dark-mode-toggle');
  const moonIcon = toggleBtn?.querySelector('.dark-mode-toggle__icon--moon');
  const sunIcon = toggleBtn?.querySelector('.dark-mode-toggle__icon--sun');

  if (!toggleBtn) return;

  // Check localStorage for saved preference
  const isDarkMode = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    // Default to light mode if no preference saved
    return false;
  };

  // Apply dark mode class to html element
  const applyDarkMode = (enabled) => {
    if (enabled) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    // Update icon visibility
    if (moonIcon && sunIcon) {
      moonIcon.style.display = enabled ? 'none' : 'block';
      sunIcon.style.display = enabled ? 'block' : 'none';
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const current = document.documentElement.classList.contains('dark-mode');
    const newState = !current;
    
    localStorage.setItem(STORAGE_KEY, String(newState));
    applyDarkMode(newState);
  };

  // Initialize on page load
  const init = () => {
    const shouldBeDark = isDarkMode();
    applyDarkMode(shouldBeDark);
  };

  // Event listener
  toggleBtn.addEventListener('click', toggleDarkMode);

  // Initialize immediately to prevent flash of light mode
  init();
})();

