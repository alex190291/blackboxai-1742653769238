/**
 * utils.js - Utility functions for NPM
 */

/**
 * Format a date string into a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check if an element exists in the DOM
 * @param {string} selector - CSS selector
 * @returns {boolean} - True if element exists
 */
export function elementExists(selector) {
  return document.querySelector(selector) !== null;
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, type = 'info', duration = 3000) {
  if (window.showNotification) {
    window.showNotification(message, type, duration);
  } else {
    console.log(`[${type}] ${message}`);
  }
}

/**
 * Show a modal
 * @param {string} modalId - ID of the modal element
 */
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Hide a modal
 * @param {string} modalId - ID of the modal element
 */
export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Filter a list of elements based on a search term
 * @param {string} containerSelector - CSS selector for the container
 * @param {string} itemSelector - CSS selector for items to filter
 * @param {string} searchTerm - Text to search for
 */
export function filterElementsByText(containerSelector, itemSelector, searchTerm) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const items = container.querySelectorAll(itemSelector);
  const term = searchTerm.toLowerCase().trim();
  
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.includes(term) || term === '') {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Export any utility functions needed by the NPM modules 