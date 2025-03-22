# Debug Tab & Performance Measuring Tools

This debug toolkit provides comprehensive tools for monitoring CSS elements and measuring performance in your SimpleHostMetrics application.

## Features

### CSS Elements Analysis
- View all CSS rules used in your application
- Filter CSS elements by selector or property
- Sort by selector name, specificity, or property count
- Identify unused CSS rules and duplicates
- Analyze CSS specificity for debugging styling issues

### Performance Measurement
- Monitor page load time, DOM rendering, style recalculation, and JavaScript execution
- Visualize performance metrics with real-time charts
- Measure specific actions or functions
- Continuous or on-demand measurement modes
- Export performance data as JSON for further analysis

## Getting Started

### Method 1: Using the Debug Tab UI

1. Open the `debug.html` file in your browser to access the full debug interface
2. Navigate through the tabs to analyze CSS or measure performance
3. Use the controls to start/stop measurements or filter CSS elements
4. Export data for further analysis

### Method 2: Using the JavaScript API

Include the `debug.js` file in your application:

```html
<script src="path/to/debug.js"></script>
```

Basic usage:

```javascript
// Initialize with custom options
const debugger = new DebugTools({
  autoStart: true,
  sampleInterval: 2000, // 2 seconds
  maxSamples: 200,
  logLevel: 'debug'
});

// Measure a specific function's performance
function expensiveOperation() {
  const markerId = debugger.startMeasure('expensiveOperation');
  
  // Your expensive operation here
  for (let i = 0; i < 10000; i++) {
    Math.sqrt(i);
  }
  
  const duration = debugger.endMeasure(markerId);
  console.log(`Operation took ${duration}ms`);
}

// Analyze CSS
const cssRules = debugger.analyzeCSSRules();
const unusedRules = debugger.findUnusedCSS();
const duplicateRules = debugger.findDuplicateCSS();

// Export all collected data
debugger.downloadData();
```

## API Reference

### CSS Analysis Methods
- `analyzeCSSRules()` - Analyze all CSS rules in the document
- `findUnusedCSS()` - Find CSS rules that don't match any elements
- `findDuplicateCSS()` - Find duplicate CSS properties
- `calculateSpecificity(selector)` - Calculate specificity of a CSS selector

### Performance Measuring Methods
- `startMonitoring()` - Begin continuous monitoring
- `stopMonitoring()` - Stop continuous monitoring
- `startMeasure(markerId)` - Start measuring a specific operation
- `endMeasure(markerId)` - End measuring and get duration
- `collectMetrics()` - Collect current performance metrics

### Data Management Methods
- `getAllData()` - Get all collected data
- `exportData()` - Export all data as JSON string
- `downloadData()` - Export all data as a downloadable file
- `resetData()` - Reset all collected data

## Events

The debug tools emit events you can listen for:

```javascript
document.addEventListener('debugtools.metricCollected', (event) => {
  console.log('New metric collected:', event.detail);
});

document.addEventListener('debugtools.measureComplete', (event) => {
  console.log('Measurement completed:', event.detail);
});
```

## Integrating with Your Application

### Method 1: Add a Debug Button to Your UI

```javascript
const debugButton = document.createElement('button');
debugButton.textContent = 'Open Debug Panel';
debugButton.onclick = () => window.open('debug.html', '_blank');
document.body.appendChild(debugButton);
```

### Method 2: Add Debug Tab Programmatically

```javascript
function addDebugTab() {
  // Create iframe to load debug panel
  const iframe = document.createElement('iframe');
  iframe.src = 'debug.html';
  iframe.style.width = '100%';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  
  // Create tab container
  const tabContainer = document.createElement('div');
  tabContainer.style.position = 'fixed';
  tabContainer.style.bottom = '0';
  tabContainer.style.left = '0';
  tabContainer.style.width = '100%';
  tabContainer.style.background = '#fff';
  tabContainer.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
  tabContainer.style.zIndex = '9999';
  tabContainer.style.display = 'none';
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close Debug Panel';
  closeButton.onclick = () => { tabContainer.style.display = 'none'; };
  
  // Assemble everything
  tabContainer.appendChild(closeButton);
  tabContainer.appendChild(iframe);
  document.body.appendChild(tabContainer);
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Debug';
  toggleButton.style.position = 'fixed';
  toggleButton.style.bottom = '10px';
  toggleButton.style.right = '10px';
  toggleButton.style.zIndex = '10000';
  toggleButton.onclick = () => {
    tabContainer.style.display = tabContainer.style.display === 'none' ? 'block' : 'none';
  };
  
  document.body.appendChild(toggleButton);
}

// Call this function when your app is initialized
document.addEventListener('DOMContentLoaded', addDebugTab);
```

## Browser Support

These debug tools work best in modern browsers with support for:
- Performance API
- PerformanceObserver
- Custom Events
- ES6 features

For older browsers, some functionality may be limited.

## License

This debug toolkit is provided as part of the SimpleHostMetrics application. 