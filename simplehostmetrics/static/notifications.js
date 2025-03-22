/**
 * Global notification utility functions
 */

console.log("Notifications.js loaded at", new Date().toISOString());

// Ensure translation function is available
if (typeof t !== 'function') {
  console.log("Translation function not found, attempting to load");
  
  // Helper function to get cookie value (copied from settingsTranslations.js)
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  // Create a basic translation function if settingsTranslations.js hasn't loaded yet
  window.t = function(key) {
    console.log("Using fallback translation for:", key);
    return key; // Just return the key if translations aren't loaded
  };
  
  // Try to load the translations script if it's not already loaded
  if (!document.querySelector('script[src*="settingsTranslations.js"]')) {
    const script = document.createElement('script');
    script.src = '/static/translations/js/settingsTranslations.js';
    script.onload = function() {
      console.log("Translation script loaded successfully");
    };
    script.onerror = function() {
      console.error("Failed to load translation script");
    };
    document.head.appendChild(script);
  }
}

// Show a notification of specified type
function showNotification(message, type = 'info', duration = 3000) {
  console.log("Showing notification:", message, "Translation function available:", typeof t === 'function');
  
  // Translate message if translation function is available
  if (typeof t === 'function') {
    if (typeof message === 'string') {
      // Common error prefixes to translate
      const errorPrefixes = [
        'Error', 'Failed', 'Unable to', 'Could not', 'Cannot', 
        'Error:', 'Failed to', 'Error getting', 'Failed getting'
      ];
      
      // Check if this is an error message that needs special handling
      let translatedMessage = '';
      
      if (type === 'error') {
        // Try to find if the message starts with a known error prefix
        const matchedPrefix = errorPrefixes.find(prefix => 
          message.startsWith(prefix) || message.includes(prefix + ':')
        );
        
        if (matchedPrefix) {
          // Translate the prefix separately
          const translatedPrefix = t(matchedPrefix);
          translatedMessage = message.replace(matchedPrefix, translatedPrefix);
        } else {
          // Try to translate the whole message
          translatedMessage = t(message);
        }
      } else {
        // For non-error messages, try to translate the whole thing
        translatedMessage = t(message);
      }
      
      // If the translation is the same as the original (likely not translated)
      // try to translate individual parts that might be concatenated
      if (translatedMessage === message && message.includes(':')) {
        const parts = message.split(':');
        if (parts.length > 1) {
          const translatedPrefix = t(parts[0].trim());
          translatedMessage = translatedPrefix + ': ' + parts[1].trim();
        }
      }
      
      message = translatedMessage;
      console.log(`Translation result: "${message}"`);
    }
  } else {
    console.warn("Translation function not available for notification:", message);
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Trigger animation after a brief delay to ensure proper rendering
  setTimeout(() => notification.classList.add("show"), 10);
  
  // Remove after duration
  if (duration > 0) {
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, duration);
  } else {
    // For persistent notifications, add a close button
    const closeBtn = document.createElement("span");
    closeBtn.className = "notification-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    });
    notification.appendChild(closeBtn);
    return notification; // Return the notification element for potential later removal
  }
}

// Show an error notification
function showError(message) {
  return showNotification(message, "error");
}

// Show a success notification
function showSuccess(message, persistent = false) {
  return showNotification(message, "success", persistent ? 0 : 3000);
}

// Show an info notification
function showInfo(message, persistent = false) {
  return showNotification(message, "info", persistent ? 0 : 3000);
}

// Make these functions globally available
window.showNotification = showNotification;
window.showError = showError;
window.showSuccess = showSuccess;
window.showInfo = showInfo; 