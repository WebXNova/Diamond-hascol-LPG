/**
 * Keyboard Event Safety Wrapper
 * Prevents errors when event.key is undefined/null
 * This fixes issues in page-events.js and other scripts that access e.key.length
 */
(function() {
  'use strict';

  // Ensure KeyboardEvent.prototype.key always returns a string
  const originalKeyDescriptor = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key');
  
  if (!originalKeyDescriptor || originalKeyDescriptor.configurable !== false) {
    // Try to define a safe getter for the key property
    try {
      Object.defineProperty(KeyboardEvent.prototype, 'key', {
        get: function() {
          // Get the original key value
          const key = this.which ? String.fromCharCode(this.which) : 
                     this.keyCode ? String.fromCharCode(this.keyCode) : 
                     this.keyIdentifier ? this.keyIdentifier.replace('U+', '') : '';
          
          // Return a safe string value
          return key || '';
        },
        enumerable: true,
        configurable: true
      });
    } catch (e) {
      // If we can't override, use addEventListener wrapper instead
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'keydown' || type === 'keyup' || type === 'keypress') {
          const wrappedListener = function(event) {
            // Ensure event.key is always a string
            if (event && (event.key === undefined || event.key === null)) {
              try {
                Object.defineProperty(event, 'key', {
                  value: '',
                  writable: true,
                  enumerable: true,
                  configurable: true
                });
              } catch (err) {
                // If we can't modify, create a proxy
                const safeEvent = new Proxy(event, {
                  get: function(target, prop) {
                    if (prop === 'key') {
                      return target.key || '';
                    }
                    return target[prop];
                  }
                });
                return listener.call(this, safeEvent);
              }
            }
            return listener.call(this, event);
          };
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    }
  }
})();

