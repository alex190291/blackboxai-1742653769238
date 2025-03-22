// Dashboard Translations - Ensures all dynamic dashboard elements are properly translated

document.addEventListener('DOMContentLoaded', function() {
    // Function to update all dashboard labels with proper translations
    function translateDashboardElements() {
        // Card titles
        updateElementText('.card-title, h2.card-title', [
            'System',
            'CPU', 
            'RAM', 
            'Disk', 
            'Network Throughput', 
            'Docker Containers'
        ]);
        
        // Section headers
        updateElementText('.section-header', [
            'CPU',
            'RAM',
            'Disk'
        ]);
        
        // Card metrics and labels
        updateElementText('.metric-label', [
            'Usage',
            'Used',
            'Free',
            'Cached'
        ]);
        
        // Graph labels
        updateElementText('.graph-label', [
            '24hr CPU Usage',
            '24hr RAM Usage',
            '7-Day Disk Used'
        ]);
        
        // Color labels - both direct text nodes and span elements
        updateColorLabels([
            'Input',
            'Output',
            'CPU',
            'Free',
            'Used',
            'Cached'
        ]);
        
        // Button texts
        updateButtonText([
            'Add Interface',
            'Save',
            'Update',
            'Cancel',
            'Check for updates'
        ]);
        
        // Table headers
        updateElementText('th', [
            'Status',
            'Name',
            'Uptime',
            'Image',
            'Actions'
        ]);
        
        // Modal texts
        updateElementText('.modal-header h3, label, #modalTitle', [
            'Custom Network Graph Settings',
            'Edit Network Graph',
            'Graph Name',
            'Network Interfaces'
        ]);
    }
    
    // Helper function to update text content of elements if they match any of the keys
    function updateElementText(selector, keys) {
        document.querySelectorAll(selector).forEach(element => {
            const originalText = element.textContent.trim();
            keys.forEach(key => {
                if (originalText === key || originalText.includes(key)) {
                    // If the key is an exact match or is included in the text
                    const newText = window.t(key);
                    if (originalText === key) {
                        element.textContent = newText;
                    } else {
                        element.textContent = element.textContent.replace(key, newText);
                    }
                }
            });
        });
    }
    
    // Special helper function for color labels that handles both direct text and span elements
    function updateColorLabels(keys) {
        // Handle labels with span elements
        document.querySelectorAll('.color-label span:not(.color-box)').forEach(element => {
            const originalText = element.textContent.trim();
            keys.forEach(key => {
                if (originalText === key) {
                    element.textContent = window.t(key);
                }
            });
        });
        
        // Handle labels with direct text (no span children)
        document.querySelectorAll('.color-label').forEach(element => {
            // Skip if it contains span elements
            if (element.querySelector('span')) return;
            
            const originalText = element.textContent.trim();
            keys.forEach(key => {
                if (originalText === key) {
                    element.textContent = window.t(key);
                }
            });
        });
    }
    
    // Helper function specifically for updating button text
    function updateButtonText(keys) {
        document.querySelectorAll('button').forEach(button => {
            // Skip the docker check updates button - we want it to remain text-free
            if (button.id === 'checkAllBtn') return;
            
            const buttonText = button.textContent.trim();
            keys.forEach(key => {
                if (buttonText === key || buttonText.includes(key)) {
                    // For buttons, we need to preserve any icons that might be part of the innerHTML
                    const iconPart = button.innerHTML.match(/<[^>]*>/);
                    const translatedText = window.t(key);
                    
                    if (buttonText === key) {
                        // If exact match, replace the entire text
                        button.textContent = translatedText;
                    } else if (iconPart) {
                        // If there's an icon, preserve it
                        button.innerHTML = iconPart[0] + ' ' + translatedText;
                    } else {
                        // Otherwise just replace the text part
                        button.textContent = button.textContent.replace(key, translatedText);
                    }
                }
            });
        });
    }
    
    // Call translation function on page load
    setTimeout(translateDashboardElements, 100);
    
    // When custom network charts are loaded, update those translations too
    document.addEventListener('customNetworkGraphsLoaded', translateDashboardElements);
    
    // Expose the function globally for use by the language switcher
    window.updateDashboardTranslations = translateDashboardElements;
}); 