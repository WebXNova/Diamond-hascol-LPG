/**
 * Global Error Handler
 * Catches and suppresses common browser errors that don't affect functionality
 */

(function() {
  'use strict';

  // Suppress specific browser errors that are harmless
  const suppressedErrors = [
    'play() request was interrupted',
    'The play() request was interrupted',
    'AbortError: The play() request was interrupted',
    'play() request was interrupted by a call to pause()',
    'NotAllowedError: play() failed',
    'NotAllowedError: The play method is not allowed',
  ];

  /**
   * Check if error should be suppressed
   */
  function shouldSuppressError(error) {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorName = error.name || '';
    
    const fullError = `${errorName} ${errorMessage}`.toLowerCase();
    
    return suppressedErrors.some(suppressed => 
      fullError.includes(suppressed.toLowerCase())
    );
  }

  /**
   * Handle unhandled promise rejections
   */
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    
    if (shouldSuppressError(error)) {
      // Suppress the error - it's harmless
      event.preventDefault();
      // Don't log to console to avoid noise
      return;
    }
    
    // Log other errors normally
    console.error('Unhandled promise rejection:', error);
  });

  /**
   * Handle global errors
   */
  window.addEventListener('error', function(event) {
    const error = event.error || event.message;
    
    if (shouldSuppressError(error)) {
      // Suppress the error - it's harmless
      event.preventDefault();
      // Don't log to console to avoid noise
      return;
    }
    
    // Let other errors through normally
  });

  /**
   * Wrap common audio/video operations to prevent errors
   */
  if (typeof HTMLMediaElement !== 'undefined') {
    const originalPlay = HTMLMediaElement.prototype.play;
    
    HTMLMediaElement.prototype.play = function() {
      const promise = originalPlay.call(this);
      
      // Catch and suppress play() interruption errors
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function(error) {
          if (shouldSuppressError(error)) {
            // Suppress harmless play() errors silently
            return Promise.resolve();
          }
          // Re-throw other errors
          throw error;
        });
      }
      
      return promise;
    };
  }

  // Initialize silently - no console log to avoid noise
})();

