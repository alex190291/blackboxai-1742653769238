document.addEventListener('DOMContentLoaded', function() {
    // NPM Container Actions
    // Deploy NPM container
    const deployNpmButton = document.getElementById('deploy-npm');
    if (deployNpmButton) {
        deployNpmButton.addEventListener('click', function() {
            window.showConfirmModal(
                t('Deploy Nginx Proxy Manager'),
                t('Are you sure you want to deploy the Nginx Proxy Manager container?'),
                t('Deploy'),
                function() {
                    deployContainer('npm');
                }
            );
        });
    }
    
    // Start NPM container
    const startNpmButton = document.getElementById('start-npm');
    if (startNpmButton) {
        startNpmButton.addEventListener('click', function() {
            startContainer('npm');
        });
    }
    
    // Stop NPM container
    const stopNpmButton = document.getElementById('stop-npm');
    if (stopNpmButton) {
        stopNpmButton.addEventListener('click', function() {
            window.showConfirmModal(
                t('Stop NPM Container'),
                t('Are you sure you want to stop the NPM container?'),
                t('Stop'),
                function() {
                    stopContainer('npm');
                }
            );
        });
    }
    
    // WireGuard Container Actions
    // Deploy WireGuard container
    const deployWireguardButton = document.getElementById('deploy-wireguard');
    if (deployWireguardButton) {
        deployWireguardButton.addEventListener('click', function() {
            const publicIp = document.getElementById('wg_public_ip').value.trim();
            if (!publicIp) {
                window.showError(t('Please enter a public IP address.'));
                return;
            }
            
            window.showConfirmModal(
                t('Deploy WireGuard VPN Server'),
                t('Are you sure you want to deploy the WireGuard VPN Server container?'),
                t('Deploy'),
                function() {
                    deployWireguard(publicIp);
                }
            );
        });
    }
    
    // Start WireGuard container
    const startWireguardButton = document.getElementById('start-wireguard');
    if (startWireguardButton) {
        startWireguardButton.addEventListener('click', function() {
            startContainer('wireguard');
        });
    }
    
    // Stop WireGuard container
    const stopWireguardButton = document.getElementById('stop-wireguard');
    if (stopWireguardButton) {
        stopWireguardButton.addEventListener('click', function() {
            window.showConfirmModal(
                t('Stop WireGuard Container'),
                t('Are you sure you want to stop the WireGuard container?'),
                t('Stop'),
                function() {
                    stopContainer('wireguard');
                }
            );
        });
    }
    
    // Container Action Helper Functions
    // Helper function to deploy NPM container
function deployContainer(containerName) {
    // Get configuration data based on container type
    let configData = {};
    if (containerName === 'npm') {
        const domain = document.getElementById('npm_domain').value;
        const identity = document.getElementById('npm_identity').value;
        const secret = document.getElementById('npm_secret').value;
        
        if (!identity || !secret) {
            window.showError(t('Please fill in all required fields'));
            return;
        }

        configData = {
            domain: domain || 'npm:81',  // Default to npm:81 if not specified
            identity: identity,
            secret: secret,
            ssl_enabled: true
        };
    }

    fetch(`/container/deploy/${containerName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ?
                               document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
        },
        body: JSON.stringify(configData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Use a translatable message format
                let message = '';
                if (containerName === 'npm') {
                    message = t('NPM container deployment initiated successfully.');
                } else {
                    message = t('Container deployment initiated successfully.');
                }
                window.showSuccess(message);
                refreshContainerCard(containerName);
            } else {
                window.showError(t('Error') + ': ' + data.error);
            }
        })
        .catch(error => {
            window.showError(t('Error') + ': ' + error);
        });
    }
    
    // Helper function to deploy WireGuard container
function deployWireguard(publicIp) {
    if (!publicIp) {
        window.showError(t('Please enter a public IP address'));
        return;
    }

    const configData = {
        server_url: publicIp,
        port: 51820,
        ip_range: '10.8.0.0/24'
    };

    fetch('/container/deploy/wireguard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ?
                               document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
        },
        body: JSON.stringify(configData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.showSuccess(t('WireGuard container deployment initiated successfully.'));
                refreshContainerCard('wireguard');
            } else {
                window.showError(t('Error') + ': ' + data.error);
            }
        })
        .catch(error => {
            window.showError(t('Error') + ': ' + error);
        });
    }
    
    // Function to specifically update the container status text
    function updateContainerStatusText(containerName, isRunning, status) {
        // Find the container card
        let containerCard = null;
        
        // Target the specific service card by finding the nested card with the specific title
        if (containerName === 'npm') {
            // Find the card with "Reverse Proxy Settings" title
            const titleElements = document.querySelectorAll('.card-title span');
            for (const titleEl of titleElements) {
                if (titleEl.textContent.includes('Reverse Proxy')) {
                    containerCard = titleEl.closest('.settings-card');
                    break;
                }
            }
        } else if (containerName === 'wireguard') {
            // Find the card with "WireGuard Settings" title
            const titleElements = document.querySelectorAll('.card-title span');
            for (const titleEl of titleElements) {
                if (titleEl.textContent.includes('WireGuard')) {
                    containerCard = titleEl.closest('.settings-card');
                    break;
                }
            }
        }
        
        if (!containerCard) {
            console.error('Could not find container card for', containerName);
            return;
        }
        
        // Find the status indicator and update it
        const statusIndicator = containerCard.querySelector('.status-indicator');
        if (statusIndicator) {
            // Update the indicator class based on state
            statusIndicator.className = `status-indicator ${
                isRunning ? 'status-running' : 'status-installed'
            }`;
            
            // Update the icon
            const icon = statusIndicator.querySelector('i');
            if (icon) {
                icon.className = `fas ${
                    isRunning ? 'fa-circle-check' : 'fa-circle-pause'
                }`;
            }
            
            // Update the status text - this is the most important part
            const statusText = statusIndicator.querySelector('span');
            if (statusText) {
                if (isRunning) {
                    statusText.textContent = t('Running');
                    statusText.setAttribute('data-i18n', 'Running');
                } else {
                    const containerStatus = t('Installed');
                    const statusDetail = status ? ' (' + t(status) + ')' : '';
                    statusText.textContent = containerStatus + statusDetail;
                    statusText.setAttribute('data-i18n', 'Installed');
                }
            }
        }
    }
    
    // Helper function to start a container
    function startContainer(containerName) {
        console.log(`Starting container: ${containerName}`);
        fetch(`/container/start/${containerName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ?
                               document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(`Start container response for ${containerName}:`, data);
            if (data.success) {
                // Find the container card using container-specific IDs instead of text content
                let containerCard = null;
                if (containerName === 'npm') {
                    // Find the NPM card using the deploy-npm button which has a reliable ID
                    const deployNpmButton = document.getElementById('deploy-npm');
                    if (deployNpmButton) {
                        containerCard = deployNpmButton.closest('.settings-card');
                        console.log('Found NPM container card using deploy-npm button:', containerCard);
                    }
                } else if (containerName === 'wireguard') {
                    // Find the WireGuard card using the deploy-wireguard button which has a reliable ID
                    const deployWireguardButton = document.getElementById('deploy-wireguard');
                    if (deployWireguardButton) {
                        containerCard = deployWireguardButton.closest('.settings-card');
                        console.log('Found WireGuard container card using deploy-wireguard button:', containerCard);
                    }
                }

                if (containerCard) {
                    console.log(`Updating status indicator for ${containerName}`);
                    // Update status indicator
                    const statusIndicator = containerCard.querySelector('.status-indicator');
                    if (statusIndicator) {
                        console.log('Found status indicator, updating...');
                        statusIndicator.className = 'status-indicator status-running';
                        const icon = statusIndicator.querySelector('i');
                        if (icon) {
                            icon.className = 'fas fa-circle-check';
                        }
                        const statusText = statusIndicator.querySelector('span');
                        if (statusText) {
                            statusText.textContent = t('Running');
                            statusText.setAttribute('data-i18n', 'Running');
                            console.log('Updated status text to Running');
                        }
                    } else {
                        console.log('No status indicator found');
                    }

                    console.log(`Updating buttons for ${containerName}`);
                    // Update buttons
                    const actionsContainer = containerCard.querySelector('.form-actions');
                    if (actionsContainer) {
                        console.log('Found actions container');
                        // Remove start button if it exists
                        const startButton = containerCard.querySelector(`#start-${containerName}`);
                        if (startButton) {
                            console.log('Removing start button');
                            startButton.remove();
                        }

                        // Add stop button
                        const stopButton = document.createElement('button');
                        stopButton.type = 'button';
                        stopButton.id = `stop-${containerName}`;
                        stopButton.className = 'btn danger';
                        stopButton.innerHTML = '<i class="fas fa-stop"></i> <span data-i18n="Stop Container"></span>';
                        stopButton.querySelector('span').textContent = t('Stop Container');
                        
                        stopButton.addEventListener('click', function() {
                            window.showConfirmModal(
                                t(`Stop ${containerName.toUpperCase()} Container`),
                                t(`Are you sure you want to stop the ${containerName.toUpperCase()} container?`),
                                t('Stop'),
                                function() {
                                    stopContainer(containerName);
                                }
                            );
                        });
                        
                        actionsContainer.appendChild(stopButton);
                        console.log('Added stop button');
                    } else {
                        console.log('No actions container found');
                    }
                } else {
                    console.log(`No container card found for ${containerName}`);
                }

                // Use a translatable message format
                let message = '';
                if (containerName === 'npm') {
                    message = t('NPM container started successfully.');
                } else if (containerName === 'wireguard') {
                    message = t('WireGuard container started successfully.');
                } else {
                    message = t('Container started successfully.');
                }
                window.showSuccess(message);
            } else {
                window.showError(t('Error') + ': ' + data.error);
            }
        })
        .catch(error => {
            console.error(`Error starting container ${containerName}:`, error);
            window.showError(t('Error') + ': ' + error);
        });
    }
    
    // Helper function to stop a container
    function stopContainer(containerName) {
        console.log(`Stopping container: ${containerName}`);
        fetch(`/container/stop/${containerName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ?
                               document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(`Stop container response for ${containerName}:`, data);
            if (data.success) {
                // Find the container card using container-specific IDs instead of text content
                let containerCard = null;
                if (containerName === 'npm') {
                    // Find the NPM card using the deploy-npm button which has a reliable ID
                    const deployNpmButton = document.getElementById('deploy-npm');
                    if (deployNpmButton) {
                        containerCard = deployNpmButton.closest('.settings-card');
                        console.log('Found NPM container card using deploy-npm button:', containerCard);
                    }
                } else if (containerName === 'wireguard') {
                    // Find the WireGuard card using the deploy-wireguard button which has a reliable ID
                    const deployWireguardButton = document.getElementById('deploy-wireguard');
                    if (deployWireguardButton) {
                        containerCard = deployWireguardButton.closest('.settings-card');
                        console.log('Found WireGuard container card using deploy-wireguard button:', containerCard);
                    }
                }

                if (containerCard) {
                    console.log(`Updating status indicator for ${containerName}`);
                    // Update status indicator
                    const statusIndicator = containerCard.querySelector('.status-indicator');
                    if (statusIndicator) {
                        console.log('Found status indicator, updating...');
                        statusIndicator.className = 'status-indicator status-installed';
                        const icon = statusIndicator.querySelector('i');
                        if (icon) {
                            icon.className = 'fas fa-circle-pause';
                        }
                        const statusText = statusIndicator.querySelector('span');
                        if (statusText) {
                            statusText.textContent = t('Installed') + ' (' + t('exited') + ')';
                            statusText.setAttribute('data-i18n', 'Installed');
                            console.log('Updated status text to Installed (exited)');
                        }
                    } else {
                        console.log('No status indicator found');
                    }

                    console.log(`Updating buttons for ${containerName}`);
                    // Update buttons
                    const actionsContainer = containerCard.querySelector('.form-actions');
                    if (actionsContainer) {
                        console.log('Found actions container');
                        // Remove stop button if it exists
                        const stopButton = containerCard.querySelector(`#stop-${containerName}`);
                        if (stopButton) {
                            console.log('Removing stop button');
                            stopButton.remove();
                        }

                        // Add start button
                        const startButton = document.createElement('button');
                        startButton.type = 'button';
                        startButton.id = `start-${containerName}`;
                        startButton.className = 'btn primary';
                        startButton.innerHTML = '<i class="fas fa-play"></i> <span data-i18n="Start Container"></span>';
                        startButton.querySelector('span').textContent = t('Start Container');
                        
                        startButton.addEventListener('click', function() {
                            startContainer(containerName);
                        });
                        
                        actionsContainer.appendChild(startButton);
                    } else {
                        console.log('No actions container found');
                    }
                } else {
                    console.log(`No container card found for ${containerName}`);
                }

                // Use a translatable message format
                let message = '';
                if (containerName === 'npm') {
                    message = t('NPM container stopped successfully.');
                } else if (containerName === 'wireguard') {
                    message = t('WireGuard container stopped successfully.');
                } else {
                    message = t('Container stopped successfully.');
                }
                window.showSuccess(message);
            } else {
                window.showError(t('Error') + ': ' + data.error);
            }
        })
        .catch(error => {
            console.error(`Error stopping container ${containerName}:`, error);
            window.showError(t('Error') + ': ' + error);
        });
    }
    
    // Function to refresh just the container card without reloading the page
    function refreshContainerCard(containerName) {
        console.log(`Refreshing container card for ${containerName}`);
        
        // Add a slight delay to ensure the container status has updated
        setTimeout(() => {
            console.log(`Making fetch request for ${containerName} status`);
            fetch(`/container/status/${containerName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(t('HTTP error') + `: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Received data for ${containerName}:`, data);
                if (data.success) {
                    // Find the container card using container-specific IDs instead of text content
                    let containerCard = null;
                    if (containerName === 'npm') {
                        // Find the NPM card using the deploy-npm button which has a reliable ID
                        const deployNpmButton = document.getElementById('deploy-npm');
                        if (deployNpmButton) {
                            containerCard = deployNpmButton.closest('.settings-card');
                            console.log('Found NPM container card using deploy-npm button:', containerCard);
                        }
                    } else if (containerName === 'wireguard') {
                        // Find the WireGuard card using the deploy-wireguard button which has a reliable ID
                        const deployWireguardButton = document.getElementById('deploy-wireguard');
                        if (deployWireguardButton) {
                            containerCard = deployWireguardButton.closest('.settings-card');
                            console.log('Found WireGuard container card using deploy-wireguard button:', containerCard);
                        }
                    }
                    
                    if (!containerCard) {
                        console.error('Could not find container card for', containerName);
                        return;
                    }
                    
                    // Update status indicator
                    const statusIndicator = containerCard.querySelector('.status-indicator');
                    console.log(`Status indicator for ${containerName}:`, statusIndicator);
                    
                    if (statusIndicator) {
                        const oldClass = statusIndicator.className;
                        statusIndicator.className = `status-indicator ${
                            data.running ? 'status-running' : 
                            data.installed ? 'status-installed' : 
                            'status-not-installed'
                        }`;
                        console.log(`Updated status indicator class from "${oldClass}" to "${statusIndicator.className}"`);
                        
                        const icon = statusIndicator.querySelector('i');
                        if (icon) {
                            const oldIconClass = icon.className;
                            icon.className = `fas ${
                                data.running ? 'fa-circle-check' : 
                                data.installed ? 'fa-circle-pause' : 
                                'fa-circle-xmark'
                            }`;
                            console.log(`Updated icon class from "${oldIconClass}" to "${icon.className}"`);
                        }
                        
                        const statusText = statusIndicator.querySelector('span');
                        if (statusText) {
                            const oldText = statusText.textContent;
                            const oldAttr = statusText.getAttribute('data-i18n');
                            
                            if (data.running) {
                                statusText.textContent = t('Running');
                                statusText.setAttribute('data-i18n', 'Running');
                            } else if (data.installed) {
                                const containerStatus = t('Installed');
                                const statusDetail = data.status ? ' (' + t(data.status) + ')' : '';
                                statusText.textContent = containerStatus + statusDetail;
                                statusText.setAttribute('data-i18n', 'Installed');
                            } else {
                                statusText.textContent = t('Not Installed');
                                statusText.setAttribute('data-i18n', 'Not Installed');
                            }
                            
                            console.log(`Updated status text from "${oldText}" (attr: ${oldAttr}) to "${statusText.textContent}" (attr: ${statusText.getAttribute('data-i18n')})`);
                        }
                    }
                    
                    // Update deploy button
                    const deployButton = containerName === 'npm' ? 
                        containerCard.querySelector('#deploy-npm') : 
                        containerCard.querySelector('#deploy-wireguard');
                    console.log(`Deploy button for ${containerName}:`, deployButton);
                        
                    if (deployButton) {
                        if (data.installed) {
                            deployButton.disabled = true;
                            const span = deployButton.querySelector('span');
                            if (span) {
                                span.textContent = t('Already Installed');
                                span.setAttribute('data-i18n', 'Already Installed');
                            }
                        } else {
                            deployButton.disabled = false;
                            const span = deployButton.querySelector('span');
                            if (span) {
                                if (containerName === 'npm') {
                                    span.textContent = t('Install Reverse Proxy');
                                    span.setAttribute('data-i18n', 'Install Reverse Proxy');
                                } else {
                                    span.textContent = t('Install WireGuard VPN Server');
                                    span.setAttribute('data-i18n', 'Install WireGuard VPN Server');
                                }
                            }
                        }
                    }
                    
                    // Get the form-actions container that will hold the buttons
                    let actionsContainer = null;
                    
                    // First try to find the form-actions that already has related buttons
                    if (containerName === 'npm') {
                        actionsContainer = containerCard.querySelector('.form-actions');
                    } else if (containerName === 'wireguard') {
                        actionsContainer = containerCard.querySelector('.form-actions');
                    }
                    
                    console.log(`Actions container for ${containerName}:`, actionsContainer);
                    
                    if (!actionsContainer) {
                        console.error('Could not find actions container for', containerName);
                        return;
                    }
                    
                    // Remove existing start/stop buttons to avoid duplicates
                    const existingStartButton = containerCard.querySelector(`#start-${containerName}`);
                    if (existingStartButton) {
                        console.log(`Removing existing start button for ${containerName}`);
                        existingStartButton.remove();
                    }
                    
                    const existingStopButton = containerCard.querySelector(`#stop-${containerName}`);
                    if (existingStopButton) {
                        console.log(`Removing existing stop button for ${containerName}`);
                        existingStopButton.remove();
                    }
                    
                    // Add the appropriate buttons based on container state
                    console.log(`Container ${containerName} state: installed=${data.installed}, running=${data.running}`);
                    
                    if (data.installed && !data.running) {
                        // Add start button
                        console.log(`Adding start button for ${containerName}`);
                        const startButton = document.createElement('button');
                        startButton.type = 'button';
                        startButton.id = `start-${containerName}`;
                        startButton.className = 'btn primary';
                        startButton.innerHTML = '<i class="fas fa-play"></i> <span data-i18n="Start Container"></span>';
                        startButton.querySelector('span').textContent = t('Start Container');
                        
                        // Add event listener to the new button
                        startButton.addEventListener('click', function() {
                            startContainer(containerName);
                        });
                        
                        actionsContainer.appendChild(startButton);
                    }
                    
                    if (data.running) {
                        // Add stop button
                        console.log(`Adding stop button for ${containerName}`);
                        const stopButton = document.createElement('button');
                        stopButton.type = 'button';
                        stopButton.id = `stop-${containerName}`;
                        stopButton.className = 'btn danger';
                        stopButton.innerHTML = '<i class="fas fa-stop"></i> <span data-i18n="Stop Container"></span>';
                        stopButton.querySelector('span').textContent = t('Stop Container');
                        
                        // Add event listener to the new button
                        stopButton.addEventListener('click', function() {
                            if (containerName === 'npm') {
                                window.showConfirmModal(
                                    t('Stop NPM Container'),
                                    t('Are you sure you want to stop the NPM container?'),
                                    t('Stop'),
                                    function() {
                                        stopContainer('npm');
                                    }
                                );
                            } else if (containerName === 'wireguard') {
                                window.showConfirmModal(
                                    t('Stop WireGuard Container'),
                                    t('Are you sure you want to stop the WireGuard container?'),
                                    t('Stop'),
                                    function() {
                                        stopContainer('wireguard');
                                    }
                                );
                            } else {
                                window.showConfirmModal(
                                    t('Stop Container'),
                                    t('Are you sure you want to stop this container?'),
                                    t('Stop'),
                                    function() {
                                        stopContainer(containerName);
                                    }
                                );
                            }
                        });
                        
                        actionsContainer.appendChild(stopButton);
                    }
                    
                    // Apply translations for the new elements
                    if (typeof updateSettingsTranslations === 'function') {
                        updateSettingsTranslations();
                    }
                    
                    console.log(`Finished refreshing container card for ${containerName}`);
                } else {
                    const errorMsg = data.error ? data.error : t('Unknown error');
                    console.error('Error refreshing container status:', errorMsg);
                    window.showError(t('Error getting container status') + ': ' + errorMsg);
                }
            })
            .catch(error => {
                console.error('Error refreshing container status:', error.message);
                
                // Add translations for common error messages
                let errorMessage = error.message;
                if (error.message === 'Failed to fetch') {
                    errorMessage = t('Failed to fetch container status');
                } else if (error.message.includes('NetworkError')) {
                    errorMessage = t('Network error while fetching container status');
                }
                
                window.showError(t('Error refreshing container status') + ': ' + errorMessage);
            });
        }, 1000); // 1 second delay
    }
    
    // Export functions for global access
    window.startContainer = startContainer;
    window.stopContainer = stopContainer;
    window.refreshContainerCard = refreshContainerCard;
    window.deployContainer = deployContainer;
    window.deployWireguard = deployWireguard;
}); 