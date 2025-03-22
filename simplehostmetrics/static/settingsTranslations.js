// Settings Translations - Ensures all Settings page elements are properly translated

document.addEventListener('DOMContentLoaded', function() {
    // Function to translate Settings page elements
    function updateSettingsTranslations() {
        // Get current locale
        const currentLocale = getCookie('locale') || 'en';
        
        // Get all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && typeof window.t === 'function') {
                element.textContent = window.t(key);
            }
        });
        
        // Handle title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (key && typeof window.t === 'function') {
                element.title = window.t(key);
            }
        });
        
        // Handle placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key && typeof window.t === 'function') {
                element.placeholder = window.t(key);
            }
        });
        
        // Translate flash messages
        document.querySelectorAll('.flash-message').forEach(messageElement => {
            const message = messageElement.getAttribute('data-message');
            if (message && typeof window.t === 'function') {
                messageElement.textContent = window.t(message);
            }
        });
        
        // Ensure the modal elements are properly translated
        translateModalElements();
    }
    
    // Helper function to translate modal elements
    function translateModalElements() {
        const confirmModalTitle = document.getElementById('confirmModalTitle');
        const confirmModalMessage = document.getElementById('confirmModalMessage');
        const confirmModalActionBtn = document.getElementById('confirmModalActionBtn');
        const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
        
        if (confirmModalTitle && confirmModalTitle.hasAttribute('data-i18n')) {
            confirmModalTitle.textContent = window.t(confirmModalTitle.getAttribute('data-i18n'));
        }
        
        if (confirmModalMessage && confirmModalMessage.hasAttribute('data-i18n')) {
            confirmModalMessage.textContent = window.t(confirmModalMessage.getAttribute('data-i18n'));
        }
        
        if (confirmModalActionBtn && confirmModalActionBtn.hasAttribute('data-i18n')) {
            confirmModalActionBtn.textContent = window.t(confirmModalActionBtn.getAttribute('data-i18n'));
        }
        
        if (confirmModalCancelBtn) {
            confirmModalCancelBtn.textContent = window.t('Cancel');
        }
    }
    
    // Helper function to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    // Call translation function on page load
    setTimeout(updateSettingsTranslations, 100);
    setTimeout(updateSettingsTranslations, 500);
    setTimeout(updateSettingsTranslations, 1000);
    
    // Listen for language changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'shouldUpdateTranslations' && e.newValue === 'true') {
            updateSettingsTranslations();
            localStorage.removeItem('shouldUpdateTranslations');
        }
    });

    // Also apply translations when the translation module is loaded
    if (window.translationsLoaded) {
        updateSettingsTranslations();
    } else {
        // Set up a listener for when translations get loaded
        window.addEventListener('translationsLoaded', updateSettingsTranslations);
    }
    
    // Expose the function globally for use by the language switcher
    window.updateSettingsTranslations = updateSettingsTranslations;
}); 