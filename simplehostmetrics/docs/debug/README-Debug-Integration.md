# Debug Tab Integration with Flask

This project integrates the debug tab and performance measuring tools with a Flask application, allowing you to enable or disable the debug functionality as needed.

## Setup

The debug tab is integrated with Flask through the following components:

1. **app.py**: Contains the Flask routes and the `debug_tab` flag
2. **debug.html**: The debug interface HTML file
3. **debug.js**: JavaScript library for performance measurement
4. **debug-integrator.js**: Script to add the debug panel to any page

## Enabling the Debug Tab

The debug tab is disabled by default for security reasons. You can enable it in two ways:

### Method 1: Update the Code

In `app.py`, change the `debug_tab` variable to `True`:

```python
# Debug configuration - set to True to enable the debug tab
debug_tab = True
```

### Method 2: Use Environment Variable (Recommended)

Set the `DEBUG_TAB` environment variable when starting the application:

```bash
# Linux/macOS
DEBUG_TAB=true python app.py

# Windows (Command Prompt)
set DEBUG_TAB=true
python app.py

# Windows (PowerShell)
$env:DEBUG_TAB="true"
python app.py
```

## Accessing the Debug Tab

Once enabled, you can access the debug tab in two ways:

1. **Direct URL**: Navigate to `/debug` in your browser
2. **Debug Button**: Click the "Debug" button that appears in the bottom-right corner of any page that includes the debug-integrator.js script

## Security Considerations

The debug tab should only be enabled in development or controlled environments, never in production, as it exposes detailed information about your application's structure and performance characteristics.

## Integrating with Your Templates

To add the debug panel to any page in your application, include the debug-integrator.js script:

```html
<!-- At the end of your HTML, before closing body tag -->
<script src="/debug-integrator.js"></script>
```

## Customizing the Debug Panel

You can customize how the debug panel appears and behaves by using the JavaScript API:

```html
<script>
  // After including debug-integrator.js
  window.DebugIntegrator.updateConfig({
    mode: 'panel',           // 'panel', 'floating', or 'window'
    position: 'bottom-right', // Button position
    buttonText: 'Debug Tools',
    panelStyles: {
      height: '70vh'         // Panel height when opened
    }
  });
  
  // You can also programmatically open/close the panel
  // window.DebugIntegrator.openDebugPanel();
  // window.DebugIntegrator.closeDebugPanel();
</script>
```

## Troubleshooting

If the debug panel doesn't appear:

1. Check that `debug_tab` is set to `True` in app.py or the `DEBUG_TAB` environment variable is set
2. Verify that the debug.html and debug.js files exist in the correct location
3. Check the browser console for any JavaScript errors
4. Try accessing `/debug` directly to confirm the route is working

## Contributing

Please refer to the main README file for contribution guidelines. 