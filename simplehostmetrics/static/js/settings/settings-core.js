// When translations are loaded, make sure t() is available for notifications
if (typeof t === 'function' && typeof showNotification === 'function') {
    console.log("Both translations and notifications loaded correctly");
} else {
    console.error("Translations or notifications not loaded correctly:", 
                 "t function:", typeof t, 
                 "showNotification:", typeof showNotification);
}

document.addEventListener('DOMContentLoaded', function() {
    // Activate any flash messages
    document.querySelectorAll('.flash-message').forEach(function(element) {
        element.classList.add('show');
        setTimeout(function() {
            element.classList.remove('show');
            setTimeout(function() {
                element.remove();
            }, 300);
        }, 5000);
    });
    
    // Define color management functions
    function savePrimaryColor(color) {
        localStorage.setItem('primaryColor', color);
    }
    
    function applyPrimaryColor(color) {
        document.documentElement.style.setProperty('--primary', color);
        
        // Convert hex to RGB for use in rgba values
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        
        // Calculate lighter and darker versions
        const lighterColor = calculateLighterColor(color, 15);
        const darkerColor = calculateDarkerColor(color, 15);
        
        document.documentElement.style.setProperty('--primary-light', lighterColor);
        document.documentElement.style.setProperty('--primary-hover', lighterColor);
        document.documentElement.style.setProperty('--primary-dark', darkerColor);
    }
    
    // Helper functions for color calculations
    function calculateLighterColor(hex, percent) {
        return calculateShade(hex, percent, true);
    }
    
    function calculateDarkerColor(hex, percent) {
        return calculateShade(hex, percent, false);
    }
    
    function calculateShade(hex, percent, isLighter) {
        const factor = isLighter ? 1 + percent / 100 : 1 - percent / 100;
        
        // Convert hex to RGB
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        
        // Adjust the values
        r = Math.min(255, Math.round(r * factor));
        g = Math.min(255, Math.round(g * factor));
        b = Math.min(255, Math.round(b * factor));
        
        // Convert back to hex
        return `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
    }
    
    // Set up color picker functionality
    const colorPicker = document.getElementById('primary_color');
    const resetColorBtn = document.getElementById('reset_color');
    
    if (colorPicker) {
        // Set initial color from localStorage or use the default
        const savedColor = localStorage.getItem('primaryColor') || '#2d5a4f';
        colorPicker.value = savedColor;
        
        // Rate limiting variables
        let lastUpdate = 0;
        const UPDATE_INTERVAL = 50; // 10Hz update rate
        let updateTimeout = null;
        
        // Apply color when picker changes with rate limiting
        colorPicker.addEventListener('input', function() {
            const now = Date.now();
            const newColor = this.value;
            
            // Clear any pending timeout
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            
            // If enough time has passed since last update, update immediately
            if (now - lastUpdate >= UPDATE_INTERVAL) {
                savePrimaryColor(newColor);
                applyPrimaryColor(newColor);
                lastUpdate = now;
            } else {
                // Schedule an update for when the interval has passed
                updateTimeout = setTimeout(() => {
                    savePrimaryColor(newColor);
                    applyPrimaryColor(newColor);
                    lastUpdate = Date.now();
                }, UPDATE_INTERVAL - (now - lastUpdate));
            }
        });
        
        // Apply color when picker value is finalized
        colorPicker.addEventListener('change', function() {
            const color = this.value;
            savePrimaryColor(color);
            applyPrimaryColor(color);
            
            // Force update with syncPrimaryColor to ensure all elements are updated
            if (window.syncPrimaryColor) {
                window.syncPrimaryColor();
            }
        });
    }
    
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', function() {
            const defaultColor = '#2d5a4f';
            colorPicker.value = defaultColor;
            savePrimaryColor(defaultColor);
            applyPrimaryColor(defaultColor);
            
            // Force update with syncPrimaryColor
            if (window.syncPrimaryColor) {
                window.syncPrimaryColor();
            }
        });
    }
    
    // Modal elements
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalActionBtn = document.getElementById('confirmModalActionBtn');
    const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
    const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
    
    // Close modal functions
    function closeConfirmModal() {
        confirmationModal.style.display = 'none';
    }
    
    // Setup modal close buttons
    closeConfirmModalBtn.addEventListener('click', closeConfirmModal);
    confirmModalCancelBtn.addEventListener('click', closeConfirmModal);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === confirmationModal) {
            closeConfirmModal();
        }
    });
    
    // Add logfile row
    document.getElementById('add-logfile').addEventListener('click', function() {
        const container = document.getElementById('logfiles-container');
        const rowCount = container.querySelectorAll('.logfile-row').length + 1;
        
        const row = document.createElement('div');
        row.className = 'logfile-row';
        row.innerHTML = `
            <div class="form-group inline">
                <label for="log_path_${rowCount}" data-i18n="Path">Path</label>
                <input type="text" id="log_path_${rowCount}" name="log_path[]" required>
            </div>
            <button type="button" class="btn-icon remove-logfile" data-i18n-title="Remove logfile" title="Remove logfile">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        container.appendChild(row);
        
        // Update translations for the new row
        if (typeof updateSettingsTranslations === 'function') {
            updateSettingsTranslations();
        }
    });
    
    // Remove logfile row (using event delegation)
    document.getElementById('logfiles-container').addEventListener('click', function(e) {
        if (e.target.closest('.remove-logfile')) {
            const row = e.target.closest('.logfile-row');
            row.remove();
        }
    });
    
    // Show confirmation modal
    window.showConfirmModal = function(title, message, actionText, confirmCallback) {
        // Set the title and message
        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        
        // Set data-i18n attributes for translation
        // These strings are already passed through the t() function before being passed to this modal
        confirmModalTitle.setAttribute('data-i18n', title);
        confirmModalMessage.setAttribute('data-i18n', message);
        
        // Set action button text and translation
        confirmModalActionBtn.textContent = actionText;
        confirmModalActionBtn.setAttribute('data-i18n', actionText);
        
        // Set up the confirm button
        confirmModalActionBtn.onclick = function() {
            closeConfirmModal();
            confirmCallback();
        };
        
        // Display the modal
        confirmationModal.style.display = 'flex';
        
        // Apply translations for any elements that have data-i18n attributes
        if (typeof updateSettingsTranslations === 'function') {
            updateSettingsTranslations();
        }
    };
    
    // Show error message
    function showError(message) {
        // Just call the global function directly
        window.showError(message);
    }
    
    // Show success message
    function showSuccess(message) {
        // Just call the global function directly
        window.showSuccess(message);
    }
    
    // Update user credentials
    document.getElementById('update-user').addEventListener('click', function() {
        const email = document.getElementById('user_email').value.trim();
        const currentPassword = document.getElementById('current_password').value;
        const password = document.getElementById('user_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (!email) {
            showError(t('Please enter an email address.'));
            return;
        }
        
        if (!currentPassword) {
            showError(t('Please enter your current password.'));
            return;
        }
        
        if (password) {
            if (password !== confirmPassword) {
                showError(t('Passwords do not match.'));
                return;
            }
            
            if (password.length < 8) {
                showError(t('Password must be at least 8 characters long.'));
                return;
            }
        }
        
        fetch('/settings/update-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ?
                                document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: password,
                email: email
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess(t('Credentials updated successfully.'));
                document.getElementById('current_password').value = '';
                document.getElementById('user_password').value = '';
                document.getElementById('confirm_password').value = '';
            } else {
                showError(t('Error:') + ' ' + data.error);
            }
        })
        .catch(error => {
            showError(t('Error:') + ' ' + error);
        });
    });
    
    // Save Services Configuration
    document.getElementById('save-services').addEventListener('click', function() {
        saveServicesConfiguration();
    });

    // Save User Preferences
    document.getElementById('save-preferences').addEventListener('click', function() {
        saveUserPreferences();
    });

    // Function to save services configuration
    function saveServicesConfiguration() {
        const formData = new FormData();
        
        // NPM Settings
        formData.append('npm_identity', document.getElementById('npm_identity').value);
        formData.append('npm_secret', document.getElementById('npm_secret').value);
        formData.append('npm_domain', document.getElementById('npm_domain').value);
        
        // WireGuard Settings
        const wgPublicIpInput = document.getElementById('wg_public_ip');
        if (wgPublicIpInput) {
            formData.append('wg_public_ip', wgPublicIpInput.value);
        }
        
        // Log Files
        const logPaths = document.querySelectorAll('input[name="log_path[]"]');
        
        // Only look for log_type if it exists in the form
        const logTypes = document.querySelectorAll('select[name="log_type[]"]');
        const hasLogTypes = logTypes.length > 0;
        
        for (let i = 0; i < logPaths.length; i++) {
            formData.append('log_path[]', logPaths[i].value);
            if (hasLogTypes && i < logTypes.length) {
                formData.append('log_type[]', logTypes[i].value);
            }
        }
        
        // Add loading indicator
        const saveButton = document.getElementById('save-services');
        const originalButtonContent = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('Saving...');
        saveButton.disabled = true;
        
        // Make the fetch request to save services configuration
        fetch('/settings/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ?
                               document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            },
            body: JSON.stringify(Object.fromEntries(formData))
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Restore button
            saveButton.innerHTML = originalButtonContent;
            saveButton.disabled = false;
            
            if (data.success) {
                showSuccess(t('Services configuration saved successfully'));
            } else {
                showError(data.message || t('Failed to save services configuration'));
            }
        })
        .catch(error => {
            // Restore button
            saveButton.innerHTML = originalButtonContent;
            saveButton.disabled = false;
            
            console.error('Error saving services configuration:', error);
            showError(t('Failed to save services configuration'));
        });
    }
    
    // Function to save user preferences
    function saveUserPreferences() {
        // Create JSON data object
        const data = {
            timezone: document.getElementById('timezone').value,
            primary_color: document.getElementById('primary_color').value
        };
        
        // Add loading indicator
        const saveButton = document.getElementById('save-preferences');
        const originalButtonContent = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('Saving...');
        saveButton.disabled = true;
        
        // Make the fetch request to save user preferences
        fetch('/settings/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ?
                               document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Restore button
            saveButton.innerHTML = originalButtonContent;
            saveButton.disabled = false;
            
            if (data.success) {
                showSuccess(t('User preferences saved successfully'));
                // Save color to localStorage for immediate use across sessions
                localStorage.setItem('primaryColor', document.getElementById('primary_color').value);
            } else {
                showError(data.message || t('Failed to save user preferences'));
            }
        })
        .catch(error => {
            // Restore button
            saveButton.innerHTML = originalButtonContent;
            saveButton.disabled = false;
            
            console.error('Error saving user preferences:', error);
            showError(t('Failed to save user preferences'));
        });
    }
    
    // Color picker functionality
    const primaryColorPicker = document.getElementById('primary_color');
    const resetColorButton = document.getElementById('reset_color');
    const DEFAULT_PRIMARY_COLOR = '#2d5a4f';
    
    // Store the original color when the page loads for cancel/reset functionality
    let originalPrimaryColor = primaryColorPicker.value;
    
    // Rate limiting variables
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 100; // 10Hz update rate
    let updateTimeout = null;
    
    // Initialize with the server-side value (from the HTML) as first priority,
    // then saved localStorage value, and finally default color
    const serverColor = primaryColorPicker.value; // From the HTML value attribute
    const savedColor = localStorage.getItem('primaryColor');
    
    // Use server color if available, otherwise use saved color or default
    const initialColor = serverColor || savedColor || DEFAULT_PRIMARY_COLOR;
    primaryColorPicker.value = initialColor;
    
    // Always store the current color in localStorage for consistent experience
    if (serverColor && (!savedColor || savedColor !== serverColor)) {
        localStorage.setItem('primaryColor', serverColor);
    }
    
    // Apply the color on page load
    applyPrimaryColor(primaryColorPicker.value);
    
    // Handle color change with rate limiting during dragging (input)
    primaryColorPicker.addEventListener('input', function() {
        const now = Date.now();
        const newColor = this.value;
        
        // Clear any pending timeout
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        
        // If enough time has passed since last update, update immediately
        if (now - lastUpdate >= UPDATE_INTERVAL) {
            previewPrimaryColor(newColor);
            lastUpdate = now;
        } else {
            // Schedule an update for when the interval has passed
            updateTimeout = setTimeout(() => {
                previewPrimaryColor(newColor);
                lastUpdate = Date.now();
            }, UPDATE_INTERVAL - (now - lastUpdate));
        }
    });
    
    // Handle color change completion
    primaryColorPicker.addEventListener('change', function() {
        // Just preview the color - don't save to localStorage
        previewPrimaryColor(this.value);
    });
    
    // Reset to default color
    resetColorButton.addEventListener('click', function() {
        // Show loading on the button
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('Resetting...');
        this.disabled = true;
        
        // First try to get the default color from localStorage or use the hardcoded default
        const savedDefaultColor = localStorage.getItem('defaultPrimaryColor') || DEFAULT_PRIMARY_COLOR;
        
        // Apply color immediately for preview
        primaryColorPicker.value = savedDefaultColor;
        previewPrimaryColor(savedDefaultColor);
        
        // If we already have a saved default color, complete the process
        if (localStorage.getItem('defaultPrimaryColor')) {
            resetColorButton.innerHTML = originalText;
            resetColorButton.disabled = false;
            showSuccess(t('Color reset to default'));
            return;
        }
        
        // If no saved default color, fetch from server
        fetch('/api/settings/default-color')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                resetColorButton.innerHTML = originalText;
                resetColorButton.disabled = false;
                
                if (data.success) {
                    const defaultColor = data.default_color || DEFAULT_PRIMARY_COLOR;
                    // Save the default color to localStorage for future use
                    localStorage.setItem('defaultPrimaryColor', defaultColor);
                    primaryColorPicker.value = defaultColor;
                    
                    // Fully preview the color
                    previewPrimaryColor(defaultColor);
                    showSuccess(t('Color reset to default'));
                } else {
                    // Server request failed but we've already applied the default color
                    showSuccess(t('Color reset to default (using local value)'));
                }
            })
            .catch(error => {
                resetColorButton.innerHTML = originalText;
                resetColorButton.disabled = false;
                
                console.error('Error fetching default color:', error);
                showSuccess(t('Color reset to default (using local value)'));
            });
    });
    
    // Preview color changes locally without saving to localStorage
    window.previewPrimaryColor = function(color) {
        // Apply CSS variables only for preview
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        document.documentElement.style.setProperty('--primary', color);
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        
        // Update gradient variables
        const darkerColor = adjustColorBrightness(color, -0.2);
        const lighterColor = adjustColorBrightness(color, 0.2);
        
        // Create the gradient
        const gradientStyle = `linear-gradient(135deg, rgba(${hexToRgb(lighterColor)}, 0.9) 0%, ${color} 50%, rgba(${hexToRgb(darkerColor)}, 0.95) 100%)`;
        
        document.documentElement.style.setProperty('--primary-gradient', gradientStyle);
        document.documentElement.style.setProperty('--focus-ring-color', `rgba(${r}, ${g}, ${b}, 0.5)`);
        document.documentElement.style.setProperty('--border-active', color);
        
        // Also handle light mode specific variables if in light mode
        if (document.body.classList.contains('light-mode')) {
            document.documentElement.style.setProperty('--glass', `rgba(${r}, ${g}, ${b}, 0.4)`);
            document.documentElement.style.setProperty('--glass-gradient', 
                `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.05))`);
            
            // Update hexagons
            document.querySelectorAll('.hexagons .hexagon').forEach(el => {
                el.style.background = color;
                el.style.opacity = '0.25';
            });
        }
    };
    
    // Apply the primary color to CSS variables
    window.applyPrimaryColor = function(color) {
        document.documentElement.style.setProperty('--primary', color);
        
        // Calculate and set RGB values
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        
        // Update gradient variables
        const darkerColor = adjustColorBrightness(color, -0.2);
        const lighterColor = adjustColorBrightness(color, 0.2);
        
        // Create the gradient
        const gradientStyle = `linear-gradient(135deg, rgba(${hexToRgb(lighterColor)}, 0.9) 0%, ${color} 50%, rgba(${hexToRgb(darkerColor)}, 0.95) 100%)`;
        
        // Update all CSS variables that depend on the primary color
        document.documentElement.style.setProperty('--primary-gradient', gradientStyle);
        document.documentElement.style.setProperty('--focus-ring-color', `rgba(${r}, ${g}, ${b}, 0.5)`);
        document.documentElement.style.setProperty('--border-active', color);
        
        // Also handle light mode specific variables if in light mode
        if (document.body.classList.contains('light-mode')) {
            document.documentElement.style.setProperty('--glass', `rgba(${r}, ${g}, ${b}, 0.4)`);
            document.documentElement.style.setProperty('--glass-gradient', 
                `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.05))`);
            
            // Update hexagons
            document.querySelectorAll('.hexagons .hexagon').forEach(el => {
                el.style.background = color;
                el.style.opacity = '0.25';
            });
        }
        
        // Let syncPrimaryColor handle all the direct element styling
        if (window.syncPrimaryColor) {
            window.syncPrimaryColor();
        }
    };
    
    // Save the primary color to localStorage
    window.savePrimaryColor = function(color) {
        localStorage.setItem('primaryColor', color);
    };
    
    // Helper function to adjust color brightness
    function adjustColorBrightness(hex, percent) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const adjustedR = Math.max(0, Math.min(255, Math.round(r + (r * percent))));
        const adjustedG = Math.max(0, Math.min(255, Math.round(g + (g * percent))));
        const adjustedB = Math.max(0, Math.min(255, Math.round(b + (b * percent))));
        
        return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
    }
    
    // Helper function to convert hex to rgb
    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }
    
    // Theme toggle functionality
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        // Initialize toggle state based on current theme
        const savedMode = localStorage.getItem('selectedMode') || 'light';
        modeToggle.checked = savedMode === 'dark';
        
        // Handle toggle change
        modeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.remove('light-mode');
                document.body.classList.add('dark-mode');
                localStorage.setItem('selectedMode', 'dark');
                
                // Reset transparent elements to dark mode defaults
                document.documentElement.style.removeProperty('--glass');
                document.documentElement.style.removeProperty('--glass-gradient');
                
                // Reset hexagons in dark mode to default style
                document.querySelectorAll('.hexagons .hexagon').forEach(el => {
                    el.style.background = '';
                    el.style.opacity = '';
                });
                
                // Reset sidebar items in dark mode
                document.querySelectorAll('.sidebar-item.active').forEach(el => {
                    el.style.background = '';
                });
            } else {
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
                localStorage.setItem('selectedMode', 'light');
                
                // Apply custom colors to light mode elements
                const savedColor = localStorage.getItem('primaryColor');
                if (savedColor) {
                    // Extract RGB values for primary color
                    const r = parseInt(savedColor.slice(1, 3), 16);
                    const g = parseInt(savedColor.slice(3, 5), 16);
                    const b = parseInt(savedColor.slice(5, 7), 16);
                    
                    // Update light mode transparent elements
                    document.documentElement.style.setProperty('--glass', `rgba(${r}, ${g}, ${b}, 0.4)`);
                    document.documentElement.style.setProperty('--glass-gradient', 
                        `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.05))`);
                    
                    // Update hexagons
                    document.querySelectorAll('.hexagons .hexagon').forEach(el => {
                        el.style.background = savedColor;
                        el.style.opacity = '0.25';
                    });
                    
                    // Update sidebar items
                    document.querySelectorAll('.sidebar-item.active').forEach(el => {
                        el.style.background = `rgba(${r}, ${g}, ${b}, 0.9)`;
                    });
                }
            }
            
            // Re-apply the primary color after theme change
            const savedColor = localStorage.getItem('primaryColor');
            if (savedColor) {
                applyPrimaryColor(savedColor);
            }
        });
    }
}); 