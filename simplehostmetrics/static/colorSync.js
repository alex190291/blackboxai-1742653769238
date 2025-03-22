/**
 * colorSync.js - Ensures consistent primary color application across pages
 * This script only sets CSS variables and lets style.css handle the actual styling
 */

// Wait for DOM content to be loaded
document.addEventListener("DOMContentLoaded", function() {
    // Function to apply the primary color by setting CSS variables
    function applyPrimaryColor() {
        const savedColor = localStorage.getItem('primaryColor') || '#2d5a4f';
        
        // Apply the color by setting CSS variables
        updateCssVariables(savedColor);
        
        // Apply again after a short delay for dynamically loaded elements
        setTimeout(() => updateCssVariables(savedColor), 200);
        
        // Apply once more after everything is loaded
        window.addEventListener('load', function() {
            updateCssVariables(savedColor);
            setTimeout(() => updateCssVariables(savedColor), 500);
        });
    }
    
    // Function to update CSS variables only
    function updateCssVariables(color) {
        // Calculate darker and lighter variants for gradient
        const darkerColor = adjustColorBrightness(color, -0.2); // 20% darker
        const lighterColor = adjustColorBrightness(color, 0.2); // 20% lighter
        
        // Create the gradient style
        const gradientStyle = `linear-gradient(135deg, rgba(${hexToRgb(lighterColor)}, 0.9) 0%, ${color} 50%, rgba(${hexToRgb(darkerColor)}, 0.95) 100%)`;
        
        // Set CSS variables only - let CSS handle the styling
        document.documentElement.style.setProperty('--primary', color);
        document.documentElement.style.setProperty('--primary-gradient', gradientStyle);
        
        // Calculate and set RGB values for the primary color
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        
        // Update light mode variables if needed
        if (document.body && document.body.classList.contains('light-mode')) {
            document.documentElement.style.setProperty('--glass', `rgba(${r}, ${g}, ${b}, 0.4)`);
            document.documentElement.style.setProperty('--glass-gradient', 
                `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.05))`);
            document.documentElement.style.setProperty('--primary-gradient',
                `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.8), rgba(${r}, ${g}, ${b}, 0.9))`);
        }
    }
    
    // Apply color immediately
    applyPrimaryColor();
    
    // Make function available globally so it can be called from other scripts
    window.syncPrimaryColor = applyPrimaryColor;
});

// Create a MutationObserver to watch for dynamically added elements
(function setupMutationObserver() {
    if (!window.MutationObserver) return; // Exit if not supported
    
    // Options for the observer
    const config = { childList: true, subtree: true };
    
    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // If new elements are added, refresh color variables
                if (window.syncPrimaryColor) {
                    window.syncPrimaryColor();
                }
            }
        }
    };
    
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    
    // Wait for DOMContentLoaded to ensure body exists before observing
    document.addEventListener("DOMContentLoaded", function() {
        // Start observing the body for configured mutations
        if (document.body) {
            observer.observe(document.body, config);
        }
    });
})();

// Helper function to adjust color brightness
function adjustColorBrightness(hex, percent) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    const adjustedR = Math.max(0, Math.min(255, Math.round(r + (r * percent))));
    const adjustedG = Math.max(0, Math.min(255, Math.round(g + (g * percent))));
    const adjustedB = Math.max(0, Math.min(255, Math.round(b + (b * percent))));
    
    return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Global sync function that only updates CSS variables
window.syncPrimaryColor = function() {
    const savedColor = localStorage.getItem('primaryColor') || '#2d5a4f';
    if (!savedColor) return;
    
    // Calculate variants for gradients
    const darkerColor = adjustColorBrightness(savedColor, -0.2);
    const lighterColor = adjustColorBrightness(savedColor, 0.2);
    
    // Create the gradient
    const gradientStyle = `linear-gradient(135deg, rgba(${hexToRgb(lighterColor)}, 0.9) 0%, ${savedColor} 50%, rgba(${hexToRgb(darkerColor)}, 0.95) 100%)`;
    
    // Set CSS variables - this is the most important part
    document.documentElement.style.setProperty('--primary', savedColor);
    document.documentElement.style.setProperty('--primary-gradient', gradientStyle);
    
    // Calculate and set RGB values
    const r = parseInt(savedColor.slice(1, 3), 16);
    const g = parseInt(savedColor.slice(3, 5), 16);
    const b = parseInt(savedColor.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    document.documentElement.style.setProperty('--focus-ring-color', `rgba(${r}, ${g}, ${b}, 0.5)`);
    document.documentElement.style.setProperty('--border-active', savedColor);
    
    // Update light mode variables if needed
    if (document.body && document.body.classList.contains('light-mode')) {
        document.documentElement.style.setProperty('--glass', `rgba(${r}, ${g}, ${b}, 0.4)`);
        document.documentElement.style.setProperty('--glass-gradient', 
            `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.05))`);
        
        // Apply color to hexagons in light mode
        document.querySelectorAll('.hexagons .hexagon').forEach(el => {
            el.style.background = savedColor;
            el.style.opacity = '0.25';
        });
    }
    
    // Apply color to elements that might still need direct styling
    const colorElements = [
        '.language-button i', 
        '.card-title i', 
        '.sidebar-header i', 
        '.user-status.active', 
        '.dark-mode .dark-mode-label', 
        '.light-mode .light-mode-label',
        '.sidebar-link.active i',
        '.nav-tabs .nav-links a.active'
    ];
    
    document.querySelectorAll(colorElements.join(', ')).forEach(el => {
        if (!el.style.color || el.style.color === '') {
            el.style.color = savedColor;
        }
    });
    
    // Apply background color to elements that need it
    document.querySelectorAll('.language-option.active').forEach(el => {
        el.style.background = savedColor;
    });
    
    // Apply gradients to elements that need it
    const gradientElements = [
        '.btn.primary',
        '.mode-toggle',
        '.marker-menu button',
        '.device-icon',
        '.user-icon',
        '.add-new-btn.btn.primary',
        '#addClientBtn',
        '#addProxyHostBtn',
        '#addRedirectionHostBtn',
        '#addCertificateBtn',
        '#addAccessListBtn',
        '.settings-btn',
        'button[id^="deploy-"]', 
        'button[id^="start-"]',
        '.sidebar-item.active',
        '.form-group.toggle .toggle-switch input[type="checkbox"]:checked + .slider'
    ];
    
    document.querySelectorAll(gradientElements.join(', ')).forEach(el => {
        el.style.background = gradientStyle;
    });
    
    // Apply border colors
    document.querySelectorAll('.nav-tabs .nav-links a.active, .cert-tab.active').forEach(el => {
        el.style.borderBottomColor = savedColor;
    });
    
    // Apply box-shadow to focused elements
    const focusRingColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    document.querySelectorAll('input:focus, select:focus, textarea:focus').forEach(el => {
        el.style.boxShadow = `0 0 0 2px ${focusRingColor}`;
        el.style.borderColor = savedColor;
    });
}; 