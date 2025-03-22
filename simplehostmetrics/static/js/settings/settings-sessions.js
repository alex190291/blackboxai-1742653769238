document.addEventListener('DOMContentLoaded', function() {
    // Helper function for translation that falls back to the original string
    function safeTranslate(text) {
        return (typeof t === 'function') ? t(text) : text;
    }
    
    // Load sessions on page load
    console.log("DOM loaded, attempting to load sessions...");
    loadSessions();
    
    // Set up periodic session check
    const SESSION_CHECK_INTERVAL = 30000; // 30 seconds
    setInterval(checkSessionValidity, SESSION_CHECK_INTERVAL);
    
    // Function to check if current session is still valid
    function checkSessionValidity() {
        console.log("Performing periodic session validity check");
        fetch('/api/sessions/check_current', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                // If 401 or 403, session is invalid
                if (response.status === 401 || response.status === 403) {
                    console.warn("Session is no longer valid - redirecting to login");
                    window.location.href = '/login';
                    return null;
                }
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && !data.valid) {
                console.warn("Session marked as invalid - redirecting to login");
                // Show message before redirect
                if (typeof showNotification === 'function') {
                    showNotification('warning', safeTranslate('Your session has been terminated'));
                }
                // Delay redirect briefly to show notification
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
        })
        .catch(error => {
            console.error("Session check error:", error);
            // Don't redirect on network errors to prevent logout during connectivity issues
        });
    }
    
    // Function to load sessions
    function loadSessions() {
        const container = document.getElementById('sessions-container');
        
        // If the container doesn't exist, we're not on the settings page with sessions
        if (!container) {
            console.log("Sessions container not found on page");
            return;
        }
        
        console.log("Found sessions container, showing loading spinner");
        // Show loading spinner
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i> <span data-i18n="Loading Sessions...">Loading Sessions...</span>
            </div>
        `;
        
        // Apply translations
        if (typeof updateSettingsTranslations === 'function') {
            updateSettingsTranslations();
        }
        
        console.log("Fetching sessions from API...");
        // Fetch sessions from API with authentication credentials
        fetch('/api/sessions', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log("API response status:", response.status);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API response data:", data);
            if (data.success) {
                if (data.sessions && data.sessions.length > 0) {
                    console.log(`Found ${data.sessions.length} sessions`);
                    // Create card layout for sessions
                    let html = '<div class="session-cards">';
                    
                    // Add card for each session
                    data.sessions.forEach(session => {
                        const isCurrentClass = session.is_current ? 'current-session' : '';
                        const currentBadge = session.is_current ? 
                            `<div class="current-badge" data-i18n="Current">Current</div>` : '';
                        
                        // Format the login time and last active time
                        const loginTime = new Date(session.login_time);
                        const lastActive = new Date(session.last_active);
                        
                        // Calculate time differences for display
                        const loginTimeStr = formatDate(loginTime);
                        const lastActiveStr = formatDate(lastActive);
                        
                        // Determine browser/device from user agent
                        const deviceInfo = parseUserAgent(session.user_agent);
                        
                        html += `
                            <div class="session-card ${isCurrentClass}">
                                ${currentBadge}
                                <div class="session-card-content">
                                    <div class="session-device">
                                        <div class="device-icon">
                                            <i class="fas ${deviceInfo.icon}"></i>
                                        </div>
                                        <div class="device-info">
                                            <span class="device-name">${deviceInfo.browser}</span>
                                            <span class="device-type">${deviceInfo.os}</span>
                                        </div>
                                    </div>
                                    <div class="session-details">
                                        <div class="session-detail">
                                            <i class="fas fa-user"></i> 
                                            <span>${session.user_email}</span>
                                        </div>
                                        <div class="session-detail">
                                            <i class="fas fa-map-marker-alt"></i> 
                                            <span>${session.ip_address || 'Unknown'}</span>
                                        </div>
                                        <div class="session-detail">
                                            <i class="fas fa-clock"></i> 
                                            <span data-i18n-title="Logged in: ${loginTime.toLocaleString()}" title="Logged in: ${loginTime.toLocaleString()}">
                                                ${loginTimeStr}
                                            </span>
                                        </div>
                                        <div class="session-detail">
                                            <i class="fas fa-history"></i> 
                                            <span data-i18n-title="Last active: ${lastActive.toLocaleString()}" title="Last active: ${lastActive.toLocaleString()}">
                                                ${lastActiveStr}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="session-actions">
                                        <button type="button" class="btn-icon terminate-session" 
                                            data-session-id="${session.id}" 
                                            data-is-current="${session.is_current}" 
                                            data-i18n-title="Terminate Session" 
                                            title="Terminate Session">
                                            <i class="fas fa-power-off"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                    container.innerHTML = html;
                    console.log("Session cards added to container");
                    
                    // Add event listeners for action buttons
                    document.querySelectorAll('.terminate-session').forEach(button => {
                        button.addEventListener('click', function() {
                            const sessionId = this.getAttribute('data-session-id');
                            const isCurrent = this.getAttribute('data-is-current') === 'true';
                            
                            const confirmMessage = isCurrent 
                                ? safeTranslate('This will log you out of your current session. Continue?')
                                : safeTranslate('Are you sure you want to terminate this session?');
                            
                            window.showConfirmModal(
                                safeTranslate('Terminate Session'),
                                confirmMessage,
                                safeTranslate('Terminate'),
                                function() {
                                    terminateSession(sessionId);
                                }
                            );
                        });
                    });
                } else {
                    console.log("No sessions found in API response");
                    container.innerHTML = `<p class="no-data" data-i18n="No active sessions found.">${safeTranslate('No active sessions found.')}</p>`;
                }
            } else {
                console.error("API returned error:", data.error);
                container.innerHTML = `<p class="error" data-i18n="Error loading sessions.">${safeTranslate('Error loading sessions.')}</p>`;
                if (typeof showError === 'function') {
                    showError(safeTranslate('Error:') + ' ' + (data.error || safeTranslate('Unknown error')));
                } else {
                    console.error("Error loading sessions:", data.error || "Unknown error");
                }
            }
            
            // Apply translations
            if (typeof updateSettingsTranslations === 'function') {
                updateSettingsTranslations();
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            container.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p class="error" data-i18n="Failed to load sessions.">${safeTranslate('Failed to load sessions.')}</p>
                    <p class="error-details">${error.message}</p>
                    <button class="btn secondary retry-btn">
                        <i class="fas fa-sync"></i> <span data-i18n="Retry">${safeTranslate('Retry')}</span>
                    </button>
                </div>
            `;
            
            // Add retry button functionality
            const retryBtn = container.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadSessions);
            }
            
            // Apply translations
            if (typeof updateSettingsTranslations === 'function') {
                updateSettingsTranslations();
            }
        });
    }
    
    // Function to terminate a session
    function terminateSession(sessionId) {
        console.log("Attempting to terminate session:", sessionId);
        
        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]') ? 
            document.querySelector('meta[name="csrf-token"]').getAttribute('content') : '';
        
        // Prepare headers
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        // Add CSRF token if available
        if (csrfToken) {
            console.log("Adding CSRF token to request");
            headers['X-CSRFToken'] = csrfToken;
        }
        
        fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: headers
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Termination response:", data);
            if (data.success) {
                if (data.current) {
                    // If current session, redirect to login after a brief delay
                    showSuccess(safeTranslate('Current session terminated. Logging out...'));
                    setTimeout(() => {
                        window.location.href = '/logout';
                    }, 2000);
                } else {
                    // Reload sessions to update the list
                    showSuccess(safeTranslate('Session terminated successfully.'));
                    loadSessions();
                }
            } else {
                console.error("Termination failed:", data.error);
                showError(safeTranslate('Failed to terminate session.') + ' ' + (data.error || ''));
            }
        })
        .catch(error => {
            console.error("Termination fetch error:", error);
            showError(safeTranslate('Error:') + ' ' + error.message);
        });
    }
    
    // Helper function to parse user agent string
    function parseUserAgent(userAgentString) {
        if (!userAgentString) {
            return {
                icon: 'fa-question',
                browser: 'Unknown Browser',
                os: 'Unknown OS'
            };
        }
        
        let browser = 'Unknown Browser';
        let os = 'Unknown OS';
        let icon = 'fa-globe';
        
        // Detect browser
        if (userAgentString.indexOf('Firefox') !== -1) {
            browser = 'Firefox';
            icon = 'fa-firefox';
        } else if (userAgentString.indexOf('Chrome') !== -1 && userAgentString.indexOf('Edg') === -1) {
            browser = 'Chrome';
            icon = 'fa-chrome';
        } else if (userAgentString.indexOf('Safari') !== -1 && userAgentString.indexOf('Chrome') === -1) {
            browser = 'Safari';
            icon = 'fa-safari';
        } else if (userAgentString.indexOf('Edg') !== -1) {
            browser = 'Edge';
            icon = 'fa-edge';
        } else if (userAgentString.indexOf('Opera') !== -1 || userAgentString.indexOf('OPR') !== -1) {
            browser = 'Opera';
            icon = 'fa-opera';
        } else if (userAgentString.indexOf('MSIE') !== -1 || userAgentString.indexOf('Trident') !== -1) {
            browser = 'Internet Explorer';
            icon = 'fa-internet-explorer';
        }
        
        // Detect OS
        if (userAgentString.indexOf('Windows') !== -1) {
            os = 'Windows';
        } else if (userAgentString.indexOf('Mac') !== -1) {
            os = 'MacOS';
        } else if (userAgentString.indexOf('Linux') !== -1) {
            os = 'Linux';
        } else if (userAgentString.indexOf('Android') !== -1) {
            os = 'Android';
            icon = 'fa-android';
        } else if (userAgentString.indexOf('iPhone') !== -1 || userAgentString.indexOf('iPad') !== -1) {
            os = 'iOS';
            icon = 'fa-apple';
        }
        
        return {
            icon: icon,
            browser: browser,
            os: os
        };
    }
    
    // Helper function to format dates for display
    function formatDate(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);  // difference in seconds
        
        if (diff < 60) {
            return safeTranslate('Just now');
        } else if (diff < 3600) {
            const minutes = Math.floor(diff / 60);
            return minutes + (minutes === 1 ? safeTranslate(' minute ago') : safeTranslate(' minutes ago'));
        } else if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            return hours + (hours === 1 ? safeTranslate(' hour ago') : safeTranslate(' hours ago'));
        } else if (diff < 604800) {
            const days = Math.floor(diff / 86400);
            return days + (days === 1 ? safeTranslate(' day ago') : safeTranslate(' days ago'));
        } else {
            return date.toLocaleDateString();
        }
    }
}); 