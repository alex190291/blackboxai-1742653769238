/**
 * Utility file to re-export global notification functions for ES module imports
 * This bridges the gap between globally defined notification functions
 * and modules that need to import them
 */

// Make sure the notifications and translations are loaded
if (typeof window.showNotification !== 'function') {
  console.warn("Notification functions not available globally, functionality may be limited");
}

// Ensure translation function is available and working
if (typeof window.t !== 'function') {
  console.warn("Translation function not available globally, setting up fallback");
  
  // Initialize translations object if not present
  if (!window.translations) {
    window.translations = {};
  }
  
  // Create a robust fallback translation function
  window.t = function(key) {
    // Just return the key as is - this is a simple fallback
    return key;
  };
  
  // Manually trigger the translations loaded event if it hasn't fired yet
  if (!window.translationsLoaded) {
    console.log("Manually triggering translationsLoaded event");
    setTimeout(() => {
      window.translationsLoaded = true;
      window.dispatchEvent(new Event('translationsLoaded'));
    }, 500);
  }
}

// Re-export the global notification functions
export const showNotification = (...args) => window.showNotification?.(...args);
export const showError = (...args) => window.showError?.(...args);
export const showSuccess = (...args) => window.showSuccess?.(...args);
export const showInfo = (...args) => window.showInfo?.(...args);

// Export the translation function for consistent access
export const t = key => window.t(key); 