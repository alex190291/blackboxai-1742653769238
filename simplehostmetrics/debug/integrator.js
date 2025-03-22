/**
 * SimpleHostMetrics Debug Tab Integrator
 * 
 * This script makes it easy to add the debug tab to any existing application.
 * It provides multiple ways to integrate the debug functionality:
 * 1. Floating debug button
 * 2. Panel at the bottom of the page
 * 3. New window/tab
 */

(function() {
    // Configuration options (can be overridden)
    const defaultConfig = {
        mode: 'floating', // 'floating', 'panel', 'window'
        position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
        debugHtmlPath: '/debug', // Updated to match Flask route
        debugJsPath: '/debug/js', // Updated to match Flask route
        autoInitialize: true,
        buttonText: 'Debug',
        buttonStyles: {
            background: '#4a6ee0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: '9999'
        },
        panelStyles: {
            height: '50vh',
            border: 'none',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            backgroundColor: '#222',
            color: '#eee',
            zIndex: '2147483647' // Maximum possible z-index value
        },
        showButton: true,
        loadDebugJs: true,
        monitorOnLoad: false,
        // Error handling for when debug is disabled
        onError: function(error) {
            console.warn('Debug panel is not available. Debug mode may be disabled on the server.', error);
        }
    };

    // Store the global config
    let config = { ...defaultConfig };
    
    // Keep track of the UI elements
    let debugButton = null;
    let debugPanel = null;
    let debugIframe = null;
    let isPanelVisible = false;

    /**
     * Initialize the debug integrator
     * @param {Object} userConfig - User configuration options
     */
    function initialize(userConfig = {}) {
        config = { ...config, ...userConfig };
        
        // Create broadcast channel
        window.debugChannel = new BroadcastChannel('simplehostmetrics-debug');
        
        // Handle messages from debug panel
        window.debugChannel.onmessage = (event) => {
            if (event.data.type === 'command') {
                handleDebugCommand(event.data);
            }
        };
        
        // Collect initial data about the main application
        if (config.loadDebugJs) {
            loadDebugJs().then(() => {
                // Once debug.js is loaded and window.debugTools is available
                if (window.debugTools) {
                    collectAndSendMainAppData();
                    
                    // Setup interval to periodically collect data
                    setInterval(collectAndSendMainAppData, 5000);
                }
            });
        }
        
        // Create UI elements based on mode
        if (config.showButton) {
            createDebugButton();
        }
        
        if (config.mode === 'panel') {
            createDebugPanel();
        }
    }

    /**
     * Load the debug.js script
     */
    function loadDebugJs() {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${config.debugJsPath}"]`)) {
                resolve(); // Already loaded
                return;
            }
            
            const script = document.createElement('script');
            script.src = config.debugJsPath;
            script.async = true;
            script.onload = resolve;
            script.onerror = (error) => {
                // Handle case where debug is not enabled
                config.onError(error);
                reject(error);
                
                // Disable button if it exists
                if (debugButton) {
                    debugButton.disabled = true;
                    debugButton.title = 'Debug mode is disabled on the server';
                    debugButton.style.opacity = '0.5';
                    debugButton.style.cursor = 'not-allowed';
                }
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Create the debug button
     */
    function createDebugButton() {
        // Create button element
        debugButton = document.createElement('button');
        debugButton.textContent = config.buttonText;
        debugButton.id = 'debug-toggle-button';
        
        // Apply styles
        Object.assign(debugButton.style, config.buttonStyles, getPositionStyles(config.position));
        debugButton.style.position = 'fixed';
        
        // Add click handler
        debugButton.addEventListener('click', toggleDebugView);
        
        // Add to the page
        document.body.appendChild(debugButton);
    }

    /**
     * Create the debug panel (for panel mode)
     */
    function createDebugPanel() {
        // Create panel container
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel-container';
        
        // Apply styles
        Object.assign(debugPanel.style, {
            position: 'fixed',
            left: '0',
            bottom: '0', 
            width: '100%',
            display: 'none',
            transition: 'transform 0.3s ease-in-out',
            transform: 'translateY(100%)',
            zIndex: '2147483647', // Ensure this is directly set, not just from config
            isolation: 'isolate', // Creates a new stacking context
            contain: 'layout',    // Additional property to create a new stacking context
            ...config.panelStyles
        });
        
        // Create iframe for debug.html
        debugIframe = document.createElement('iframe');
        debugIframe.src = config.debugHtmlPath;
        debugIframe.style.width = '100%';
        debugIframe.style.height = '100%';
        debugIframe.style.border = 'none';
        debugIframe.style.zIndex = '2147483646'; // Very high z-index, just below the container
        debugIframe.style.position = 'relative'; // Create stacking context
        debugIframe.onerror = config.onError;
        
        // Create header with close button
        const panelHeader = document.createElement('div');
        panelHeader.className = 'debug-panel-header';
        
        const panelTitle = document.createElement('h3');
        panelTitle.textContent = 'Debug Panel';
        panelTitle.className = 'debug-panel-title';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.className = 'debug-panel-close';
        closeButton.addEventListener('click', toggleDebugView);
        
        // Assemble panel
        panelHeader.appendChild(panelTitle);
        panelHeader.appendChild(closeButton);
        debugPanel.appendChild(panelHeader);
        debugPanel.appendChild(debugIframe);
        
        // Add to the page
        document.body.appendChild(debugPanel);
        
        // Force a DOM reflow to ensure the panel gets rendered correctly
        void debugPanel.offsetHeight;
    }

    /**
     * Toggle the debug view visibility
     */
    function toggleDebugView() {
        // First, check if the button is disabled
        if (debugButton && debugButton.disabled) {
            alert('Debug mode is disabled on the server. Set debug_tab=True in app.py to enable it.');
            return;
        }
        
        switch (config.mode) {
            case 'floating':
            case 'panel':
                if (!debugPanel) {
                    createDebugPanel();
                }
                
                if (isPanelVisible) {
                    debugPanel.style.transform = 'translateY(100%)';
                    setTimeout(() => {
                        debugPanel.style.display = 'none';
                    }, 300);
                } else {
                    // First remove and re-add to DOM to ensure it's the last element
                    if (debugPanel.parentNode) {
                        debugPanel.parentNode.removeChild(debugPanel);
                    }
                    document.body.appendChild(debugPanel);
                    
                    // Display and transform
                    debugPanel.style.display = 'block';
                    
                    // Force browser to create a new stacking context
                    document.body.style.zIndex = 'auto';
                    void debugPanel.offsetHeight;
                    
                    setTimeout(() => {
                        debugPanel.style.transform = 'translateY(0)';
                    }, 10);
                }
                
                isPanelVisible = !isPanelVisible;
                break;
                
            case 'window':
                window.open(config.debugHtmlPath, 'SimpleHostMetricsDebug', 
                    'width=1000,height=800,resizable=yes,scrollbars=yes,status=no');
                break;
        }
    }

    /**
     * Get position styles based on the position option
     * @param {string} position - Position option (bottom-right, etc.)
     * @returns {Object} CSS styles object
     */
    function getPositionStyles(position) {
        const styles = {};
        
        switch (position) {
            case 'bottom-right':
                styles.bottom = '20px';
                styles.right = '20px';
                break;
            case 'bottom-left':
                styles.bottom = '20px';
                styles.left = '20px';
                break;
            case 'top-right':
                styles.top = '20px';
                styles.right = '20px';
                break;
            case 'top-left':
                styles.top = '20px';
                styles.left = '20px';
                break;
        }
        
        return styles;
    }

    /**
     * Check if debug mode is enabled on the server
     * @returns {Promise<boolean>} Promise that resolves to true if debug is enabled
     */
    function checkDebugEnabled() {
        return new Promise((resolve) => {
            fetch(config.debugHtmlPath, { method: 'HEAD' })
                .then(response => {
                    resolve(response.ok);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    }

    /**
     * Open the debug panel programmatically
     */
    function openDebugPanel() {
        checkDebugEnabled().then(enabled => {
            if (enabled) {
                if (!isPanelVisible) {
                    toggleDebugView();
                }
            } else {
                alert('Debug mode is disabled on the server. Set debug_tab=True in app.py to enable it.');
            }
        });
    }

    /**
     * Close the debug panel programmatically
     */
    function closeDebugPanel() {
        if (isPanelVisible) {
            toggleDebugView();
        }
    }

    /**
     * Update configuration options
     * @param {Object} newConfig - New configuration options
     */
    function updateConfig(newConfig) {
        config = { ...config, ...newConfig };
        
        // Update UI if it exists
        if (debugButton) {
            Object.assign(debugButton.style, config.buttonStyles, getPositionStyles(config.position));
            debugButton.textContent = config.buttonText;
        }
        
        if (debugPanel) {
            Object.assign(debugPanel.style, config.panelStyles);
        }
    }

    // Add this function to collect and send main app data
    function collectAndSendMainAppData() {
        if (!window.debugTools) return;
        
        // Collect CSS data
        const cssData = window.debugTools.analyzeCSSRules();
        window.debugChannel.postMessage({
            type: 'css-analysis',
            data: cssData
        });
        
        // Collect performance metrics
        const metrics = {
            domComplete: performance.timing.domComplete - performance.timing.navigationStart,
            domLoading: performance.timing.domLoading - performance.timing.navigationStart,
            cssParseTime: performance.timing.domContentLoadedEventStart - performance.timing.domLoading,
            jsExecTime: performance.timing.domInteractive - performance.timing.domLoading,
            styleRecalcTime: performance.timing.domComplete - performance.timing.domContentLoadedEventEnd
        };
        
        // Add long task metrics if available
        if (window.debugTools && window.debugTools.performanceData) {
            const longTasks = window.debugTools.performanceData.filter(entry => 
                entry.type === 'longTask' || entry.entryType === 'longtask'
            );
            
            if (longTasks.length > 0) {
                metrics.longTasksCount = longTasks.length;
                metrics.longTasksTotal = longTasks.reduce((sum, task) => sum + task.duration, 0);
            }
        }
        
        window.debugChannel.postMessage({
            type: 'performance-metrics',
            data: metrics
        });
    }

    // Add this function to handle commands from debug panel
    function handleDebugCommand(message) {
        if (!window.debugTools) return;
        
        switch(message.command) {
            case 'connect':
                // Send initial data when debug panel connects
                collectAndSendMainAppData();
                break;
                
            case 'refresh':
                // Force refresh of data
                collectAndSendMainAppData();
                break;
                
            case 'filter-css':
                // Filter CSS elements based on input
                const filteredCSS = window.debugTools.analyzeCSSRules().filter(rule => {
                    const filter = message.data.filter.toLowerCase();
                    return rule.selector.toLowerCase().includes(filter) || 
                           rule.properties.some(prop => 
                               prop.name.toLowerCase().includes(filter) || 
                               prop.value.toLowerCase().includes(filter)
                           );
                });
                window.debugChannel.postMessage({
                    type: 'css-analysis',
                    data: filteredCSS
                });
                break;
                
            case 'sort-css':
                // Sort CSS elements
                let sortedCSS = window.debugTools.analyzeCSSRules();
                if (message.data.sortBy === 'selector') {
                    sortedCSS.sort((a, b) => a.selector.localeCompare(b.selector));
                } else if (message.data.sortBy === 'specificity') {
                    sortedCSS.sort((a, b) => b.specificity - a.specificity);
                } else if (message.data.sortBy === 'count') {
                    sortedCSS.sort((a, b) => b.properties.length - a.properties.length);
                }
                window.debugChannel.postMessage({
                    type: 'css-analysis',
                    data: sortedCSS
                });
                break;
                
            case 'export-data':
                // Export performance data
                window.debugTools.downloadData();
                break;
                
            case 'save-settings':
                // Save debug settings
                if (window.debugTools && window.debugTools.options) {
                    window.debugTools.options.sampleInterval = message.data.refreshInterval * 1000;
                }
                break;
                
            case 'reset-settings':
                // Reset to default settings
                if (window.debugTools && window.debugTools.options) {
                    window.debugTools.options.sampleInterval = 5000;
                    window.debugTools.options.logLevel = 'info';
                    window.debugTools.options.maxSamples = 100;
                }
                break;
        }
    }

    // Initialize on DOMContentLoaded if autoInitialize is true
    if (defaultConfig.autoInitialize) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initialize());
        } else {
            initialize();
        }
    }

    // Expose the API
    window.DebugIntegrator = {
        initialize,
        openDebugPanel,
        closeDebugPanel,
        updateConfig,
        toggleDebugView,
        checkDebugEnabled
    };
})(); 