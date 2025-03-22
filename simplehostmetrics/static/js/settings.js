// Import the three main settings modules
// Core functionality
document.write('<script src="/static/js/settings/settings-core.js"></script>');
// User management functionality
document.write('<script src="/static/js/settings/settings-users.js"></script>');
// Container management functionality 
document.write('<script src="/static/js/settings/settings-containers.js"></script>');
// Session management functionality
document.write('<script src="/static/js/settings/settings-sessions.js"></script>');

// Ensure showError and showSuccess functions are available globally
// These functions are expected by the module files
if (typeof window.showError !== 'function') {
    window.showError = function(message) {
        console.error('Error:', message);
        if (typeof showNotification === 'function') {
            showNotification('error', message);
        }
    };
}

if (typeof window.showSuccess !== 'function') {
    window.showSuccess = function(message) {
        console.log('Success:', message);
        if (typeof showNotification === 'function') {
            showNotification('success', message);
        }
    };
} 