// Navigation Translations - Ensures all navigation elements are properly translated

document.addEventListener('DOMContentLoaded', function() {
    // Function to translate top navigation bar and sidebar elements
    function translateNavigationElements() {
        // Top navigation bar links
        translateTopNavLinks();
        
        // NPM sidebar elements
        translateSidebar();
    }
    
    // Translate the top navigation bar links
    function translateTopNavLinks() {
        const navLinks = document.querySelectorAll('.nav-tabs .nav-links a');
        const navTexts = ['Dashboard', 'RTAD Overview', 'Reverse Proxy', 'WireGuard VPN'];
        
        navLinks.forEach(link => {
            const originalText = link.textContent.trim();
            if (navTexts.includes(originalText)) {
                link.textContent = window.t(originalText);
            }
        });
    }
    
    // Translate NPM sidebar elements
    function translateSidebar() {
        // If the NPM sidebar exists
        const sidebar = document.getElementById('npmSidebar');
        if (!sidebar) return;
        
        // Translate section headers
        const sectionHeaders = ['Hosts', 'Security', 'System'];
        sidebar.querySelectorAll('.sidebar-header span:not(.sidebar-icon)').forEach(span => {
            const originalText = span.textContent.trim();
            if (sectionHeaders.includes(originalText)) {
                span.textContent = window.t(originalText);
            }
        });
        
        // Translate sidebar items
        const sidebarItems = [
            'Proxy Hosts', 'Redirection Hosts', 
            'Access Lists', 'Certificates', 
            'Audit Log'
        ];
        
        sidebar.querySelectorAll('.sidebar-item').forEach(item => {
            const originalText = item.textContent.trim();
            if (sidebarItems.includes(originalText)) {
                item.textContent = window.t(originalText);
            }
        });
        
        // Translate current view title
        const currentViewTitle = document.getElementById('currentViewTitle');
        if (currentViewTitle) {
            const originalText = currentViewTitle.textContent.trim();
            currentViewTitle.textContent = window.t(originalText);
        }
    }
    
    // Call translation function on page load
    setTimeout(translateNavigationElements, 100);
    
    // Expose the function globally for use by the language switcher
    window.updateNavigationTranslations = translateNavigationElements;
}); 