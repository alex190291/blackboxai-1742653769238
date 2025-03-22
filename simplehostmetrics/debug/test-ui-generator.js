/**
 * Test script for the UI Examples Generator
 * This verifies that the generator correctly identifies and generates examples
 * for button styles defined in the CSS.
 */

// Mock CSS with button style definitions
const mockCSS = `
.btn {
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.btn.primary {
  background: linear-gradient(135deg, rgba(65, 120, 107, 0.9) 0%, var(--primary) 50%, rgba(35, 70, 62, 0.95) 100%);
}

.btn.secondary {
  background: linear-gradient(135deg, rgba(80, 80, 80, 0.733) 0%, rgba(0, 0, 0, 0.295) 100%);
}

.btn.danger {
  background: linear-gradient(135deg, rgba(180, 20, 20, 0.9) 0%, rgba(140, 15, 15, 0.95) 100%) !important;
}

.card-actions .btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

// Test function that verifies the parser
function testUIGenerator() {
    console.log('Testing UI Examples Generator...');
    
    // Create a generator instance
    const generator = new UIExamplesGenerator();
    
    // Manually parse the mock CSS
    generator.parseCSS(mockCSS);
    
    // Extract button classes
    generator.extractButtonClasses();
    
    // Log results
    console.log('Extracted Button Classes:');
    console.log('Primary:', generator.buttonClasses.primary.length > 0 ? 'Found' : 'Not Found');
    console.log('Secondary:', generator.buttonClasses.secondary.length > 0 ? 'Found' : 'Not Found');
    console.log('Danger:', generator.buttonClasses.danger.length > 0 ? 'Found' : 'Not Found');
    console.log('Icon:', generator.buttonClasses.icon.length > 0 ? 'Found' : 'Not Found');
    
    // Generate examples
    const html = generator.generateButtonExamples();
    console.log('Generated HTML:');
    console.log(html);
    
    return {
        primaryFound: generator.buttonClasses.primary.length > 0,
        secondaryFound: generator.buttonClasses.secondary.length > 0,
        dangerFound: generator.buttonClasses.danger.length > 0,
        iconFound: generator.buttonClasses.icon.length > 0,
        html: html
    };
}

// Only run the test if this script is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test-ui-generator')) {
    document.addEventListener('DOMContentLoaded', () => {
        const results = testUIGenerator();
        
        // Display results on the page
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Test Results</h2>
            <ul>
                <li>Primary Button: ${results.primaryFound ? 'Found ✅' : 'Not Found ❌'}</li>
                <li>Secondary Button: ${results.secondaryFound ? 'Found ✅' : 'Not Found ❌'}</li>
                <li>Danger Button: ${results.dangerFound ? 'Found ✅' : 'Not Found ❌'}</li>
                <li>Button with Icon: ${results.iconFound ? 'Found ✅' : 'Not Found ❌'}</li>
            </ul>
            
            <h3>Generated HTML:</h3>
            <pre>${results.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            
            <h3>Rendered Example:</h3>
            <div>${results.html}</div>
        `;
        document.body.appendChild(container);
    });
} 