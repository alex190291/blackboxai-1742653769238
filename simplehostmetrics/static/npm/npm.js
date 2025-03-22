// /static/npm/npm.js
import { NPMManager } from "./NPMManager.js";

// Initialize the NPM Manager when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  window.npmManager = new NPMManager();
  
  // Set up modal close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Fix button order in all modals - move cancel/danger buttons to right side
  const fixButtonOrder = () => {
    document.querySelectorAll('.form-actions').forEach(actionBar => {
      // Get all buttons in this action bar
      const buttons = Array.from(actionBar.querySelectorAll('button'));
      
      // Find the cancel/danger button (usually has 'danger' class or contains 'Cancel' text)
      const dangerButton = buttons.find(btn => 
        btn.classList.contains('danger') || 
        btn.textContent.trim().includes('Cancel')
      );
      
      // If we found it and it's not already the last child, move it to the end
      if (dangerButton && dangerButton !== actionBar.lastElementChild) {
        actionBar.appendChild(dangerButton);
      }
    });
  };
  
  // Run once on load
  fixButtonOrder();
  
  // Also run when modals are opened - they might be dynamically created
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        fixButtonOrder();
      }
    });
  });
  
  // Observe the entire document for added nodes
  observer.observe(document.body, { childList: true, subtree: true });
});

// Close modals when clicking outside
window.onclick = (event) => {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};
