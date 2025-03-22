// RTAD Translations - Ensures all RTAD (RealTime Attack Dashboard) elements are properly translated

document.addEventListener('DOMContentLoaded', function() {
    // Function to translate RTAD page elements
    function translateRTADElements() {
        // Translate the main heading
        const mainHeading = document.querySelector('.container h1');
        if (mainHeading) mainHeading.textContent = window.t('RealTime Attack Dashboard');
        
        // Translate card titles
        const cardTitles = document.querySelectorAll('.card-title');
        const titleTexts = ['Attack Map', 'Login Attempts over SSH', 'Proxy Events'];
        
        cardTitles.forEach(title => {
            const titleText = title.textContent.trim();
            if (titleTexts.includes(titleText)) {
                title.textContent = window.t(titleText);
            }
        });
        
        // Translate table headers
        translateTableHeaders();
        
        // Translate table data with placeholder terms
        translateTableData();
    }
    
    // Helper function to translate table headers
    function translateTableHeaders() {
        // Login Attempts table headers
        const loginTableHeaderTexts = ['IP Address', 'Country', 'City', 'Timestamp', 'User', 'Failure Reason'];
        const loginTableHeaders = document.querySelectorAll('#lastbTable th');
        
        loginTableHeaders.forEach((header, index) => {
            if (index < loginTableHeaderTexts.length) {
                // Check if this header has a sort indicator (↑ or ↓)
                const headerText = header.textContent.trim();
                const hasSortIndicator = headerText.endsWith('↑') || headerText.endsWith('↓');
                
                if (hasSortIndicator) {
                    // Preserve sort indicator while translating the text
                    const indicator = headerText.slice(-1); // Get ↑ or ↓
                    const baseText = headerText.slice(0, -1).trim();
                    // Store the translated text in dataset for future reference and display
                    header.dataset.originalText = window.t(loginTableHeaderTexts[index]);
                    header.textContent = `${header.dataset.originalText} ${indicator}`;
                } else {
                    header.textContent = window.t(loginTableHeaderTexts[index]);
                    // Store translated text for future sorting operations
                    header.dataset.originalText = header.textContent;
                }
            }
        });
        
        // Proxy Events table headers
        const proxyTableHeaderTexts = ['Domain', 'IP Address', 'Country', 'City', 'Timestamp', 'Proxy Type', 'Error Code', 'URL'];
        const proxyTableHeaders = document.querySelectorAll('#proxyTable th');
        
        proxyTableHeaders.forEach((header, index) => {
            if (index < proxyTableHeaderTexts.length) {
                // Check if this header has a sort indicator (↑ or ↓)
                const headerText = header.textContent.trim();
                const hasSortIndicator = headerText.endsWith('↑') || headerText.endsWith('↓');
                
                if (hasSortIndicator) {
                    // Preserve sort indicator while translating the text
                    const indicator = headerText.slice(-1); // Get ↑ or ↓
                    const baseText = headerText.slice(0, -1).trim();
                    // Store the translated text in dataset for future reference and display
                    header.dataset.originalText = window.t(proxyTableHeaderTexts[index]);
                    header.textContent = `${header.dataset.originalText} ${indicator}`;
                } else {
                    header.textContent = window.t(proxyTableHeaderTexts[index]);
                    // Store translated text for future sorting operations
                    header.dataset.originalText = header.textContent;
                }
            }
        });
    }
    
    // Helper function to translate table data
    function translateTableData() {
        // Find and replace placeholder terms like 'N/A' in table cells
        const terms = ['N/A'];
        
        document.querySelectorAll('#lastbTable tbody td, #proxyTable tbody td').forEach(cell => {
            terms.forEach(term => {
                if (cell.textContent.trim() === term) {
                    cell.textContent = window.t(term);
                }
            });
        });
    }
    
    // Call translation function on page load and after a short delay 
    // to ensure DOM is fully loaded and translations are available
    setTimeout(translateRTADElements, 100);
    setTimeout(translateRTADElements, 500);
    setTimeout(translateRTADElements, 1000);
    
    // Re-apply translations after data refresh
    const originalFetchRTADData = window.fetchRTADData;
    if (originalFetchRTADData) {
        window.fetchRTADData = function() {
            originalFetchRTADData.apply(this, arguments);
            setTimeout(translateTableData, 1000); // Apply translations after data is loaded
        };
    }
    
    // Also apply translations when the translation module is loaded
    if (window.translationsLoaded) {
        translateRTADElements();
    } else {
        // Set up a listener for when translations get loaded
        window.addEventListener('translationsLoaded', translateRTADElements);
    }
    
    // Expose the function globally for use by the language switcher
    window.updateRTADTranslations = translateRTADElements;
}); 