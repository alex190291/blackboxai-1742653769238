// WireGuard Translations - Ensures all WireGuard VPN elements are properly translated

document.addEventListener('DOMContentLoaded', function() {
    // Function to translate WireGuard page elements
    function translateWireGuardElements() {
        // Translate view header elements
        const headerTitle = document.querySelector('.view-header h1');
        if (headerTitle) headerTitle.textContent = window.t('WireGuard VPN Clients');
        
        // Translate Add Client button
        const addClientBtn = document.getElementById('addClientBtn');
        if (addClientBtn) addClientBtn.innerHTML = `<i class="fas fa-plus"></i> ${window.t('Add Client')}`;
        
        // Translate input placeholder
        const newClientNameInput = document.getElementById('newClientName');
        if (newClientNameInput) newClientNameInput.placeholder = window.t('Enter new client name');
        
        // Translate modal headers and content
        const modalHeaders = document.querySelectorAll('.modal-header h2');
        modalHeaders.forEach(header => {
            const originalText = header.textContent.trim();
            header.textContent = window.t(originalText);
        });
        
        // Translate modal paragraphs
        const modalTexts = document.querySelectorAll('.modal-body p');
        modalTexts.forEach(text => {
            const originalText = text.textContent.trim();
            text.textContent = window.t(originalText);
        });
        
        // Translate buttons in modals
        document.querySelectorAll('.modal-body button, .form-actions button').forEach(button => {
            const originalText = button.textContent.trim();
            button.textContent = window.t(originalText);
        });
        
        // Translate modal footer buttons, including Cancel and Delete buttons
        document.querySelectorAll('.modal-footer button').forEach(button => {
            const originalText = button.textContent.trim();
            button.textContent = window.t(originalText);
        });
        
        // Translate client card buttons
        document.querySelectorAll('.client-card .card-actions button').forEach(button => {
            const originalText = button.textContent.trim();
            button.textContent = window.t(originalText);
        });
        
        // Client card labels
        translateClientCardLabels();
    }
    
    // Helper function to translate client card labels
    function translateClientCardLabels() {
        // Create a list of terms to translate
        const labels = ['IP', 'Created', 'Last connection', 'Never', 'Show QR', 'Download Config', 'Delete'];
        
        // Find and translate these terms in the client cards
        document.querySelectorAll('.client-card').forEach(card => {
            const detailsDiv = card.querySelector('.client-details');
            if (!detailsDiv) return;
            
            const paragraphs = detailsDiv.querySelectorAll('p');
            paragraphs.forEach(p => {
                let html = p.innerHTML;
                labels.forEach(label => {
                    // Only replace the label part, not the value
                    const regex = new RegExp(`${label}\\:`, 'g');
                    html = html.replace(regex, `${window.t(label)}:`);
                    
                    // Also replace standalone labels like 'Never'
                    if (html.includes(label) && label === 'Never') {
                        html = html.replace(label, window.t(label));
                    }
                });
                p.innerHTML = html;
            });
        });
    }
    
    // Call translation function on page load
    setTimeout(translateWireGuardElements, 100);
    
    // Expose the function globally for use by the language switcher
    window.updateWireGuardTranslations = translateWireGuardElements;
}); 