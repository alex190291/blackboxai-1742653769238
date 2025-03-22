/**
 * SimpleHostMetrics Debug Tool
 * Performance monitoring and CSS debugging utilities
 */

class DebugTools {
    constructor(options = {}) {
        this.options = {
            autoStart: false,
            logLevel: 'info',
            sampleInterval: 5000, // 5 seconds
            maxSamples: 100,
            ...options
        };

        this.performanceData = [];
        this.cssData = [];
        this.isMonitoring = false;
        this.monitorInterval = null;
        this.markers = {};
        
        // Initialize Performance Observer if supported
        if (typeof PerformanceObserver !== 'undefined') {
            this.setupPerformanceObserver();
        }
        
        if (this.options.autoStart) {
            this.startMonitoring();
        }
    }

    /**
     * Setup Performance Observer to capture browser performance entries
     */
    setupPerformanceObserver() {
        // Observe paint metrics
        this.paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.logPerformanceEntry('paint', entry);
            }
        });
        
        try {
            this.paintObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
            console.warn('Paint timing observation not supported', e);
        }
        
        // Observe resource loading
        this.resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.logPerformanceEntry('resource', entry);
            }
        });
        
        try {
            this.resourceObserver.observe({ entryTypes: ['resource'] });
        } catch (e) {
            console.warn('Resource timing observation not supported', e);
        }
        
        // Observe long tasks
        this.longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.logPerformanceEntry('longTask', entry);
            }
        });
        
        try {
            this.longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.warn('Long task observation not supported', e);
        }
    }

    /**
     * Start collecting performance metrics
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.log('Starting performance monitoring');
        
        // Take initial measurements
        this.collectMetrics();
        
        // Setup interval for continuous monitoring
        this.monitorInterval = setInterval(() => {
            this.collectMetrics();
        }, this.options.sampleInterval);
        
        return this;
    }

    /**
     * Stop collecting performance metrics
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        clearInterval(this.monitorInterval);
        this.monitorInterval = null;
        this.isMonitoring = false;
        this.log('Stopped performance monitoring');
        
        return this;
    }

    /**
     * Collect current performance metrics
     */
    collectMetrics() {
        const perfEntries = performance.getEntriesByType("navigation");
        const navEntry = perfEntries[0] || performance.timing;
        
        const metrics = {
            dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcp: navEntry.connectEnd - navEntry.connectStart,
            request: navEntry.responseStart - navEntry.requestStart,
            response: navEntry.responseEnd - navEntry.responseStart,
            domInteractive: navEntry.domInteractive,
            domComplete: navEntry.domComplete,
            loadEvent: navEntry.loadEventEnd
        };

        // Add resource timing
        performance.getEntriesByType("resource").forEach(resource => {
            this.performanceData.push({
                type: 'resource',
                name: resource.name,
                duration: resource.duration,
                initiatorType: resource.initiatorType
            });
        });

        return metrics;
    }
    
    /**
     * Start measuring a specific operation
     * @param {string} markerId - Unique identifier for this measurement
     */
    startMeasure(markerId) {
        if (!markerId) {
            markerId = 'measure_' + Date.now();
        }
        
        this.markers[markerId] = performance.now();
        this.log(`Started measure: ${markerId}`);
        
        // Also use the Performance API's mark if available
        if (performance.mark) {
            try {
                performance.mark(`${markerId}_start`);
            } catch (e) {
                console.warn('Error creating performance mark', e);
            }
        }
        
        return markerId;
    }
    
    /**
     * End measuring a specific operation and get the duration
     * @param {string} markerId - Identifier used in startMeasure
     * @returns {number} Duration in milliseconds
     */
    endMeasure(markerId) {
        if (!this.markers[markerId]) {
            this.log(`No start mark found for: ${markerId}`, 'warn');
            return null;
        }
        
        const endTime = performance.now();
        const startTime = this.markers[markerId];
        const duration = endTime - startTime;
        
        // Create a measure using the Performance API if available
        if (performance.measure) {
            try {
                performance.mark(`${markerId}_end`);
                performance.measure(markerId, `${markerId}_start`, `${markerId}_end`);
            } catch (e) {
                console.warn('Error creating performance measure', e);
            }
        }
        
        // Record this measurement
        const measurement = {
            id: markerId,
            startTime,
            endTime,
            duration,
            timestamp: new Date().toISOString()
        };
        
        this.performanceData.push(measurement);
        this.log(`Measure complete: ${markerId} took ${duration.toFixed(2)}ms`);
        
        // Cleanup
        delete this.markers[markerId];
        
        // Trigger event
        this.triggerEvent('measureComplete', measurement);
        
        return duration;
    }
    
    /**
     * Analyze all CSS rules in the document
     * @returns {Array} CSS rules information
     */
    analyzeCSSRules() {
        this.cssData = [];
        const styleSheets = Array.from(document.styleSheets);
        
        styleSheets.forEach((sheet, sheetIndex) => {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                
                rules.forEach((rule, ruleIndex) => {
                    if (rule.type === 1) { // CSSStyleRule
                        const properties = Array.from(rule.style).map(prop => ({
                            name: prop,
                            value: rule.style.getPropertyValue(prop),
                            priority: rule.style.getPropertyPriority(prop)
                        }));
                        
                        this.cssData.push({
                            selector: rule.selectorText,
                            specificity: this.calculateSpecificity(rule.selectorText),
                            properties: properties,
                            sheetIndex: sheetIndex,
                            ruleIndex: ruleIndex,
                            href: sheet.href || 'inline'
                        });
                    }
                });
            } catch (e) {
                this.log(`Cannot access rules in stylesheet ${sheetIndex}`, 'warn');
            }
        });
        
        return this.cssData;
    }
    
    /**
     * Calculate specificity of a CSS selector
     * @param {string} selector - CSS selector to analyze
     * @returns {number} Specificity score
     */
    calculateSpecificity(selector) {
        if (!selector) return 0;
        
        let specificity = 0;
        
        // Count IDs
        specificity += (selector.match(/#[a-zA-Z0-9_-]+/g) || []).length * 100;
        
        // Count classes, attributes, and pseudo-classes
        specificity += (selector.match(/\.[a-zA-Z0-9_-]+|\[[^\]]+\]|:[a-zA-Z0-9_-]+/g) || []).length * 10;
        
        // Count elements and pseudo-elements
        specificity += (selector.match(/[a-zA-Z0-9_-]+|::[a-zA-Z0-9_-]+/g) || []).length;
        
        return specificity;
    }
    
    /**
     * Find unused CSS rules
     * @returns {Array} Unused CSS rules
     */
    findUnusedCSS() {
        const unusedRules = [];
        
        this.analyzeCSSRules().forEach(rule => {
            try {
                // Skip universal selectors and pseudo-element/class only selectors
                if (rule.selector === '*' || rule.selector.startsWith(':')) {
                    return;
                }
                
                // Check if any elements match this selector
                const matchingElements = document.querySelectorAll(rule.selector);
                
                if (matchingElements.length === 0) {
                    unusedRules.push(rule);
                }
            } catch (e) {
                // Some complex selectors might cause errors
                this.log(`Error checking selector: ${rule.selector}`, 'warn');
            }
        });
        
        return unusedRules;
    }
    
    /**
     * Find duplicate CSS properties
     * @returns {Array} Duplicate CSS properties
     */
    findDuplicateCSS() {
        const propertyMap = {};
        const duplicates = [];
        
        this.analyzeCSSRules().forEach(rule => {
            rule.properties.forEach(prop => {
                const key = `${rule.selector}|${prop.name}`;
                
                if (propertyMap[key]) {
                    duplicates.push({
                        selector: rule.selector,
                        property: prop.name,
                        value1: propertyMap[key].value,
                        value2: prop.value,
                        rule1: propertyMap[key].ruleIndex,
                        rule2: rule.ruleIndex,
                        sheet1: propertyMap[key].sheetIndex,
                        sheet2: rule.sheetIndex
                    });
                } else {
                    propertyMap[key] = {
                        value: prop.value,
                        ruleIndex: rule.ruleIndex,
                        sheetIndex: rule.sheetIndex
                    };
                }
            });
        });
        
        return duplicates;
    }
    
    /**
     * Count total CSS rules in the document
     * @returns {number} Total number of CSS rules
     */
    countCSSRules() {
        let count = 0;
        
        try {
            const styleSheets = Array.from(document.styleSheets);
            
            styleSheets.forEach(sheet => {
                try {
                    if (sheet.cssRules) {
                        count += sheet.cssRules.length;
                    }
                } catch (e) {
                    // Cannot access cross-origin stylesheets
                }
            });
        } catch (e) {
            this.log('Error counting CSS rules', 'error');
        }
        
        return count;
    }
    
    /**
     * Get first paint timing
     * @returns {number} First paint time or null
     */
    getFirstPaint() {
        let firstPaint = null;
        
        // Try the Paint Timing API first
        const paintMetrics = performance.getEntriesByType('paint');
        const firstPaintEntry = paintMetrics.find(entry => entry.name === 'first-paint');
        
        if (firstPaintEntry) {
            firstPaint = firstPaintEntry.startTime;
        }
        
        return firstPaint;
    }
    
    /**
     * Get memory information if available
     * @returns {Object|null} Memory info or null if not available
     */
    getMemoryInfo() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        
        return null;
    }
    
    /**
     * Log a performance entry
     * @param {string} type - Type of entry
     * @param {PerformanceEntry} entry - Performance entry object
     */
    logPerformanceEntry(type, entry) {
        const logEntry = {
            type,
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            entryType: entry.entryType,
            timestamp: new Date().toISOString()
        };
        
        this.performanceData.push(logEntry);
        
        // Limit the number of samples we keep
        if (this.performanceData.length > this.options.maxSamples) {
            this.performanceData.shift();
        }
        
        // Trigger event
        this.triggerEvent('entryLogged', logEntry);
    }
    
    /**
     * Get all performance data
     * @returns {Array} All collected performance data
     */
    getAllData() {
        return {
            performance: this.performanceData,
            css: this.cssData
        };
    }
    
    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        return JSON.stringify(this.getAllData(), null, 2);
    }
    
    /**
     * Export all data as a downloadable file
     */
    downloadData() {
        const data = this.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-data-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Reset all collected data
     */
    resetData() {
        this.performanceData = [];
        this.cssData = [];
        this.log('All data has been reset');
        
        return this;
    }
    
    /**
     * Internal logging function
     * @param {string} message - Message to log
     * @param {string} level - Log level (debug, info, warn, error)
     */
    log(message, level = 'info') {
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        
        if (logLevels[level] >= logLevels[this.options.logLevel]) {
            console[level](`[DebugTools] ${message}`);
        }
    }
    
    /**
     * Trigger a custom event
     * @param {string} eventName - Name of the event
     * @param {Object} data - Event data
     */
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`debugtools.${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }
}

// Initialize the debug tools if this script is loaded directly
if (typeof window !== 'undefined') {
    window.debugTools = new DebugTools();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugTools;
} 