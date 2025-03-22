const API_BASE_URL = '/wireguard/api';
let currentClientId = null;
let transferUpdateInterval;

// DOM elements
const clientsContainer = document.getElementById('clientsContainer');
const addClientBtn = document.getElementById('addClientBtn');
const newClientNameInput = document.getElementById('newClientName');
const searchInput = document.getElementById('newClientName');
const qrModal = document.getElementById('qrModal');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const downloadConfigBtn = document.getElementById('downloadConfigBtn');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Get CSRF token from meta tag
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]') ?
           document.querySelector('meta[name="csrf-token"]').getAttribute('content') : '';
}

// Check if notification function is available
if (typeof showNotification !== 'function') {
    console.error("Notification function not available, defining fallback functions");
    
    // Define fallback notification functions
    window.showNotification = function(message, type = 'info', duration = 3000) {
        console.log("Using fallback notification:", message, type);
        
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add("show"), 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => notification.remove(), 300);
        }, duration);
    };
    
    window.showError = function(message) {
        window.showNotification(message, "error");
    };
    
    window.showSuccess = function(message) {
        window.showNotification(message, "success");
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("WireGuard page loaded, notifications function available:", typeof showNotification === 'function');
    loadClients();
    
    // Update transfer stats every second
    transferUpdateInterval = setInterval(updateTransferStats, 1000);

    // Add search functionality
    searchInput.addEventListener('input', handleSearch);
});
addClientBtn.addEventListener('click', addNewClient);

// Close modals when clicking on X or outside
document.querySelectorAll('.modal-close-btn, .cancel-delete').forEach(element => {
    element.addEventListener('click', () => {
        qrModal.style.display = 'none';
        deleteModal.style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target === qrModal) qrModal.style.display = 'none';
    if (event.target === deleteModal) deleteModal.style.display = 'none';
});

// Load all clients
async function loadClients() {
    try {
        const response = await fetch(`${API_BASE_URL}/clients`);
        if (!response.ok) throw new Error('Failed to fetch clients');
        
        const clients = await response.json();
        renderClients(clients);
    } catch (error) {
        console.error('Error loading clients:', error);
        clientsContainer.innerHTML = `<p>${t('Error loading clients. Please try again later.')}</p>`;
    }
}

// Render clients in the grid
function renderClients(clients) {
    if (!clients.length) {
        clientsContainer.innerHTML = `<p>${t('No clients found. Add your first client above.')}</p>`;
        return;
    }
    
    // Make sure we're using the div with client-grid class
    clientsContainer.innerHTML = '';
    clientsContainer.className = 'client-grid';
    
    clients.forEach(client => {
        // Use the createClientCard function defined in the HTML template
        const clientHTML = createClientCard({
            id: client.id,
            name: client.name,
            enabled: client.enabled,
            ip: client.address,
            created_at: new Date(client.createdAt).toLocaleString(),
            last_handshake: client.latestHandshakeAt ? new Date(client.latestHandshakeAt).toLocaleString() : t('Never')
        });
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = clientHTML.trim();
        const clientCard = tempDiv.firstChild;
        
        // Add additional data not in the template
        const detailsDiv = clientCard.querySelector('.client-details');
        const transferP = document.createElement('p');
        transferP.innerHTML = `<strong>${t('Transfer')}:</strong> ↑${formatBytes(client.transferTx)} / ↓${formatBytes(client.transferRx)}`;
        detailsDiv.appendChild(transferP);
        
        clientsContainer.appendChild(clientCard);
    });
    
    // Add event listeners to the new elements
    document.querySelectorAll('.show-qr').forEach(button => {
        button.addEventListener('click', showQRCode);
    });
    
    document.querySelectorAll('.delete-client').forEach(button => {
        button.addEventListener('click', showDeleteConfirmation);
    });

    document.querySelectorAll('.download-config').forEach(button => {
        button.addEventListener('click', function() {
            downloadConfig(this.dataset.id);
        });
    });
}

// Add a new client
async function addNewClient() {
    const clientName = newClientNameInput.value.trim();
    if (!clientName) {
        showError(t('Please enter a client name'));
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ name: clientName })
        });
        
        if (!response.ok) throw new Error('Failed to create client');
        
        newClientNameInput.value = '';
        showSuccess(t('Client added successfully'));
        loadClients();
    } catch (error) {
        console.error('Error creating client:', error);
        showError(t('Error:') + ' ' + t('Failed to create client. Please try again.'));
    }
}

// Show QR code modal
async function showQRCode(event) {
    const clientId = event.target.dataset.id;
    currentClientId = clientId;
    
    try {
        // Show loading indicator
        qrCodeContainer.innerHTML = `<div class="loading">${t('Loading')}...</div>`;
        qrModal.style.display = 'flex'; // Use flex instead of block for better centering
        
        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            throw new Error(t('QR Code library not loaded. Please refresh the page.'));
        }
        
        // Fetch the client config directly
        const response = await fetch(`${API_BASE_URL}/client/${clientId}/config`);
        if (!response.ok) throw new Error(`${t('Failed to fetch client config')}: ${response.status} ${response.statusText}`);
        
        const configText = await response.text();
        if (!configText) throw new Error(t('Received empty config'));
        
        qrCodeContainer.innerHTML = ''; // Clear existing content
        
        // Create a div to contain the QR code
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-code';
        qrCodeContainer.appendChild(qrDiv);
        
        // Create a canvas element for the QR code
        const canvas = document.createElement('canvas');
        qrDiv.appendChild(canvas);
        
        try {
            // Generate QR code using the library
            QRCode.toCanvas(
                canvas, // Use canvas instead of div
                configText, 
                {
                    width: 250,
                    margin: 4,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                },
                function(error) {
                    if (error) {
                        console.error('Error generating QR code:', error);
                        // Fallback to image if canvas fails
                        try {
                            QRCode.toDataURL(configText, { width: 250, margin: 4 }, (err, url) => {
                                if (err) {
                                    console.error('Failed to generate QR data URL:', err);
                                    qrDiv.innerHTML = `<p class="error">${t('Failed to generate QR code. Please try downloading the config file instead.')}</p>`;
                                    return;
                                }
                                
                                const img = document.createElement('img');
                                img.src = url;
                                img.alt = t('WireGuard Client QR Code');
                                img.className = 'qr-image';
                                qrDiv.innerHTML = '';
                                qrDiv.appendChild(img);
                            });
                        } catch (dataUrlError) {
                            console.error('QR dataURL generation failed:', dataUrlError);
                            qrDiv.innerHTML = `<p class="error">${t('Failed to generate QR code. Please try downloading the config file instead.')}</p>`;
                        }
                    } else {
                        // Apply class to the canvas
                        canvas.className = 'qr-canvas';
                    }
                }
            );
        } catch (qrError) {
            console.error('QR code generation failed:', qrError);
            qrDiv.innerHTML = `<p class="error">${t('Failed to generate QR code. Please try downloading the config file instead.')}</p>`;
        }
    } catch (error) {
        console.error('Error fetching client config:', error);
        qrCodeContainer.innerHTML = `<p class="error">${t('Error:') + ' ' + error.message}</p>`;
    }

    // Set up download button
    downloadConfigBtn.onclick = () => downloadConfig(currentClientId);
}

// Download config file
function downloadConfig(clientId) {
    window.location.href = `${API_BASE_URL}/client/${clientId}/config`;
}

// Show delete confirmation modal
function showDeleteConfirmation(event) {
    const clientId = event.target.dataset.id;
    currentClientId = clientId;
    deleteModal.style.display = 'flex'; // Change to flex instead of block
    
    confirmDeleteBtn.onclick = () => deleteClient(clientId);
}

// Delete a client
async function deleteClient(clientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/client/${clientId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete client');
        
        deleteModal.style.display = 'none';
        showSuccess(t('Client deleted successfully'));
        loadClients();
    } catch (error) {
        console.error('Error deleting client:', error);
        showError(t('Error:') + ' ' + t('Failed to delete client. Please try again.'));
    }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Add this new function to only fetch transfer data
async function updateTransferStats() {
    try {
        // Use the same endpoint as loadClients() instead of clients/stats
        const response = await fetch(`${API_BASE_URL}/clients`);
        if (!response.ok) return;
        
        const clients = await response.json();
        
        clients.forEach(client => {
            const transferElement = document.querySelector(`.client-card[data-id="${client.id}"] .client-details p:last-child`);
            if (transferElement) {
                transferElement.innerHTML = `<strong>${t('Transfer')}:</strong> ↑${formatBytes(client.transferTx)} / ↓${formatBytes(client.transferRx)}`;
            }
        });
    } catch (error) {
        console.error('Error updating transfer stats:', error);
    }
}

// Search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const clientCards = document.querySelectorAll('.client-card');
    
    clientCards.forEach(card => {
        const clientName = card.querySelector('.client-name').textContent.toLowerCase();
        const clientIP = card.querySelector('.client-details p').textContent.toLowerCase();
        
        if (clientName.includes(searchTerm) || clientIP.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}