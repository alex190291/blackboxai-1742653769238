/**
 * UI Component Examples Generator
 * Optimized to show only components used in SimpleHostMetrics application
 */

// Utility function for throttling
function throttle(callback, limit) {
    let waiting = false;
    return function() {
        if (!waiting) {
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
}

// Utility function for debouncing
function debounce(callback, delay) {
    let timer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => {
            callback.apply(context, args);
        }, delay);
    };
}

class UIExamplesGenerator {
    constructor() {
        this.cssRules = [];
    }

    async init() {
        try {
            await this.loadStylesheetEfficient('/static/css/style.css');
            return this;
        } catch (error) {
            console.error('Error initializing UI generator:', error);
            return this;
        }
    }

    async loadStylesheetEfficient(href) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < document.styleSheets.length; i++) {
                const sheet = document.styleSheets[i];
                if (sheet.href && sheet.href.includes(href.substring(1))) {
                    try {
                        this.parseStylesheet(sheet);
                        console.log(`Used existing stylesheet: ${href}`);
                        return resolve(true);
                    } catch (err) {
                        console.warn('Could not access rules in existing stylesheet:', err);
                        break;
                    }
                }
            }

            fetch(href)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load stylesheet: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(cssText => {
                    const style = document.createElement('style');
                    style.textContent = cssText;
                    style.setAttribute('data-debug-temp', 'true');
                    document.head.appendChild(style);
                    const sheet = style.sheet;
                    this.parseStylesheet(sheet);
                    console.log(`Loaded stylesheet dynamically: ${href}`);
                    resolve(true);
                })
                .catch(error => {
                    console.error('Error loading stylesheet:', error);
                    reject(error);
                });
        });
    }

    parseStylesheet(sheet) {
        try {
            const rules = sheet.cssRules || sheet.rules;
            for (let i = 0; i < rules.length; i++) {
                const rule = rules[i];
                if (rule.type === 1) {
                    this.cssRules.push({
                        selector: rule.selectorText,
                        styles: rule.style.cssText
                    });
                }
            }
            console.log(`Parsed ${this.cssRules.length} CSS rules`);
        } catch (error) {
            console.error('Error parsing stylesheet:', error);
            throw error;
        }
    }

    generateAllExamples() {
        const container = document.getElementById('component-examples');
        if (!container) return;
        
        container.innerHTML = '';
        container.innerHTML += this.generateButtonExamples();
        container.innerHTML += this.generateAlertExamples();
        container.innerHTML += this.generateFormExamples();
        container.innerHTML += this.generateNavExamples();

        // Clear duplicate sections from HTML
        this.clearDuplicateSections();
    }

    // Function to clear duplicate sections from the HTML
    clearDuplicateSections() {
        // Find all component sections
        const h3Elements = document.querySelectorAll('.component-section h3');
        h3Elements.forEach(h3 => {
            // Remove duplicate Toggle Switches sections
            if (h3.textContent.includes('Toggle Switches')) {
                const section = h3.closest('.component-section');
                if (section) {
                    section.remove();
                }
            }
            
            // Remove duplicate Form Elements sections
            // Only keep the one we generate in this script
            if (h3.textContent.includes('Form Elements')) {
                const section = h3.closest('.component-section');
                if (section && !section.querySelector('.component-example').innerHTML.includes('Application Pattern')) {
                    section.remove();
                }
            }
        });
    }

    generateButtonExamples() {
        return `
        <div class="component-section">
            <h3>Buttons</h3>
            <p>Buttons used in SimpleHostMetrics application:</p>
            <div class="component-example">
                <h4>Standard Buttons</h4>
                <div class="button-group">
                    <button class="btn primary">Primary Button</button>
                    <button class="btn secondary">Secondary Button</button>
                    <button class="btn danger">Danger Button</button>
                </div>
                
                <h4>Icon Buttons</h4>
                <div class="button-group">
                    <button class="btn-icon"><i class="fas fa-cog"></i></button>
                    <button class="btn-icon"><i class="fas fa-sync"></i></button>
                    <button class="btn-icon outline"><i class="fas fa-trash"></i></button>
                </div>
                
                <h4>Buttons with Icons</h4>
                <div class="button-group">
                    <button class="btn primary"><i class="fas fa-save mr-2"></i>Save</button>
                    <button class="btn secondary"><i class="fas fa-sync mr-2"></i>Refresh</button>
                    <button class="btn danger"><i class="fas fa-trash mr-2"></i>Delete</button>
                </div>
            </div>
        </div>`;
    }
    
    generateAlertExamples() {
        return `
        <div class="component-section">
            <h3>Alerts</h3>
            <p>Alert messages used in SimpleHostMetrics:</p>
            <div class="component-example">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> This is an information alert.
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> This is a warning alert.
                </div>
                <div class="alert alert-error">
                    <i class="fas fa-times-circle"></i> This is an error alert.
                </div>
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> This is a success alert.
                </div>
            </div>
        </div>`;
    }
    
    generateFormExamples() {
        return `
        <div class="component-section">
            <h3>Form Elements</h3>
            <p>Form controls used in SimpleHostMetrics:</p>
            <div class="component-example">
                <div class="form-group">
                    <label for="text-input">Text Input</label>
                    <input type="text" id="text-input" class="form-control" placeholder="Enter text">
                </div>
                
                <div class="form-group">
                    <label for="select-input">Select Input</label>
                    <select id="select-input" class="form-control">
                        <option value="">Select an option</option>
                        <option value="1">Option 1</option>
                        <option value="2">Option 2</option>
                    </select>
                </div>
                
                <div class="form-group toggle">
                    <span>Toggle Switch (Application Pattern)</span>
                    <label class="toggle-switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>`;
    }

    generateNavExamples() {
        return `
        <div class="component-section">
            <h3>Navigation</h3>
            <p>Navigation elements used in SimpleHostMetrics:</p>
            <div class="component-example">
                <div class="nav-tabs">
                    <div class="nav-links">
                        <a href="#" class="active">Dashboard</a>
                        <a href="#">RTAD Overview</a>
                        <a href="#">Reverse Proxy</a>
                        <a href="#">WireGuard VPN</a>
                        <a href="#">Settings</a>
                    </div>
                </div>
            </div>
        </div>`;
    }

    applyExamples() {
        this.generateAllExamples();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('component-examples')) {
        const generator = new UIExamplesGenerator();
        generator.init().then(() => {
            generator.applyExamples();
            
            // Find and remove duplicate sections on page load
            setTimeout(() => {
                // Remove duplicate Toggle Switches sections
                const sections = document.querySelectorAll('.component-section');
                sections.forEach(section => {
                    const heading = section.querySelector('h3');
                    if (heading) {
                        // Remove Toggle Switches sections
                        if (heading.textContent.includes('Toggle Switches')) {
                            section.remove();
                        }
                        
                        // Remove duplicate Form Elements sections (keep the one we generate)
                        if (heading.textContent.includes('Form Elements')) {
                            // If this isn't the section we generated (without Application Pattern)
                            if (!section.innerHTML.includes('Application Pattern')) {
                                section.remove();
                            }
                        }
                    }
                });
                
                // Clean up any additional toggle examples in form elements section
                const formToggles = document.querySelectorAll('.form-group');
                formToggles.forEach(toggle => {
                    const label = toggle.querySelector('label');
                    if (label && label.textContent.includes('Toggle Switch (Pattern')) {
                        toggle.remove();
                    }
                });
            }, 500);
        });
    }
});
