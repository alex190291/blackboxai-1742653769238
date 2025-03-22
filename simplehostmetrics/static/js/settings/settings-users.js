document.addEventListener('DOMContentLoaded', function() {
    // User Modal elements
    const userModal = document.getElementById('userModal');
    const userModalTitle = document.getElementById('userModalTitle');
    const userModalActionBtn = document.getElementById('userModalActionBtn');
    const userModalCancelBtn = document.getElementById('userModalCancelBtn');
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    
    // Password Modal elements
    const passwordModal = document.getElementById('passwordModal');
    const passwordModalTitle = document.getElementById('passwordModalTitle');
    const passwordModalActionBtn = document.getElementById('passwordModalActionBtn');
    const passwordModalCancelBtn = document.getElementById('passwordModalCancelBtn');
    const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
    
    // Close modal functions
    function closeUserModal() {
        userModal.style.display = 'none';
    }
    
    function closePasswordModal() {
        passwordModal.style.display = 'none';
    }
    
    // Setup modal close buttons
    closeUserModalBtn.addEventListener('click', closeUserModal);
    userModalCancelBtn.addEventListener('click', closeUserModal);
    closePasswordModalBtn.addEventListener('click', closePasswordModal);
    passwordModalCancelBtn.addEventListener('click', closePasswordModal);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === userModal) {
            closeUserModal();
        } else if (event.target === passwordModal) {
            closePasswordModal();
        }
    });
    
    // User Management
    // Load and display users
    function loadUsers() {
        const container = document.getElementById('users-container');
        
        // Show loading spinner
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i> <span data-i18n="Loading Users...">Loading Users...</span>
            </div>
        `;
        
        // Fetch users from API
        fetch('/api/users', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.users.length > 0) {
                        // Create card layout for users
                        let html = '<div class="user-cards">';
                        
                        // Add card for each user
                        data.users.forEach(user => {
                            const statusClass = user.active ? 'active' : 'inactive';
                            const statusText = user.active ? t('Active') : t('Inactive');
                            
                            html += `
                                <div class="user-card">
                                    <div class="user-card-content">
                                        <div class="user-info">
                                            <div class="user-icon">
                                                <i class="fas fa-user"></i>
                                            </div>
                                            <div class="user-details">
                                                <span class="user-email">${user.email}</span>
                                                <span class="user-status ${statusClass}" data-i18n="${user.active ? 'Active' : 'Inactive'}">${statusText}</span>
                                            </div>
                                        </div>
                                        <div class="user-actions">
                                            <button type="button" class="btn-icon change-password" 
                                                data-user-id="${user.id}" 
                                                data-i18n-title="Change Password" 
                                                title="${t('Change Password')}">
                                                <i class="fas fa-key"></i>
                                            </button>
                                            <button type="button" class="btn-icon delete-user" 
                                                data-user-id="${user.id}" 
                                                data-user-email="${user.email}" 
                                                data-i18n-title="Delete User" 
                                                title="${t('Delete User')}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += '</div>';
                        container.innerHTML = html;
                        
                        // Add event listeners for action buttons
                        document.querySelectorAll('.change-password').forEach(button => {
                            button.addEventListener('click', function() {
                                const userId = this.getAttribute('data-user-id');
                                showPasswordModal(userId);
                            });
                        });
                        
                        document.querySelectorAll('.delete-user').forEach(button => {
                            button.addEventListener('click', function() {
                                const userId = this.getAttribute('data-user-id');
                                const userEmail = this.getAttribute('data-user-email');
                                
                                window.showConfirmModal(
                                    t('Delete User'),
                                    t('Are you sure you want to delete user') + ' ' + userEmail + '?',
                                    t('Delete'),
                                    function() {
                                        deleteUser(userId);
                                    }
                                );
                            });
                        });
                    } else {
                        container.innerHTML = `<p data-i18n="No users found.">${t('No users found.')}</p>`;
                    }
                } else {
                    container.innerHTML = `<p class="error" data-i18n="Error loading users.">${t('Error loading users.')}</p>`;
                    showError(t('Error:') + ' ' + (data.error || t('Unknown error')));
                }
                
                // Apply translations
                if (typeof updateSettingsTranslations === 'function') {
                    updateSettingsTranslations();
                }
            })
            .catch(error => {
                container.innerHTML = `
                    <div class="error-container">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p class="error" data-i18n="Failed to load users.">${t('Failed to load users.')}</p>
                        <p class="error-details">${error.message}</p>
                        <button class="btn secondary retry-btn">
                            <i class="fas fa-sync"></i> <span data-i18n="Retry">${t('Retry')}</span>
                        </button>
                    </div>
                `;
                
                // Add retry button functionality
                const retryBtn = container.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', loadUsers);
                }
                
                // Apply translations
                if (typeof updateSettingsTranslations === 'function') {
                    updateSettingsTranslations();
                }
            });
    }
    
    // Show user modal for adding new user
    function showUserModal() {
        // Clear form
        document.getElementById('user_modal_email').value = '';
        document.getElementById('user_modal_password').value = '';
        document.getElementById('user_modal_confirm_password').value = '';
        
        // Set title and button text
        userModalTitle.textContent = t('Add New User');
        userModalActionBtn.textContent = t('Add User');
        
        // Set data-i18n attributes for translation
        userModalTitle.setAttribute('data-i18n', 'Add New User');
        userModalActionBtn.setAttribute('data-i18n', 'Add User');
        
        // Set action button handler
        userModalActionBtn.onclick = addUser;
        
        // Show modal
        userModal.style.display = 'flex';
        
        // Apply translations
        if (typeof updateSettingsTranslations === 'function') {
            updateSettingsTranslations();
        }
    }
    
    // Show password change modal
    function showPasswordModal(userId) {
        // Clear form
        document.getElementById('password_modal_password').value = '';
        document.getElementById('password_modal_confirm').value = '';
        document.getElementById('password_modal_user_id').value = userId;
        
        // Set title and button text
        passwordModalTitle.textContent = t('Change Password');
        passwordModalActionBtn.textContent = t('Change Password');
        
        // Set data-i18n attributes for translation
        passwordModalTitle.setAttribute('data-i18n', 'Change Password');
        passwordModalActionBtn.setAttribute('data-i18n', 'Change Password');
        
        // Set action button handler
        passwordModalActionBtn.onclick = changeUserPassword;
        
        // Show modal
        passwordModal.style.display = 'flex';
        
        // Apply translations
        if (typeof updateSettingsTranslations === 'function') {
            updateSettingsTranslations();
        }
    }
    
    // Add new user
    function addUser() {
        const email = document.getElementById('user_modal_email').value.trim();
        const password = document.getElementById('user_modal_password').value;
        const confirmPassword = document.getElementById('user_modal_confirm_password').value;
        
        // Validate inputs
        if (!email) {
            window.showError(t('Please enter an email address.'));
            return;
        }
        
        if (!password) {
            window.showError(t('Please enter a password.'));
            return;
        }
        
        if (password !== confirmPassword) {
            window.showError(t('Passwords do not match.'));
            return;
        }
        
        // Send API request
        fetch('/api/users', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ? 
                    document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.showSuccess(t('User added successfully.'));
                closeUserModal();
                loadUsers();
            } else {
                window.showError(t('Error:') + ' ' + (data.error ? t(data.error) : t('Failed to add user.')));
            }
        })
        .catch(error => {
            console.error('Error adding user:', error);
            window.showError(t('Error:') + ' ' + error.message);
        });
    }
    
    // Delete user
    function deleteUser(userId) {
        fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ? 
                    document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.showSuccess(t('User deleted successfully.'));
                loadUsers();
            } else {
                window.showError(t('Error:') + ' ' + (data.error ? t(data.error) : t('Failed to delete user.')));
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            window.showError(t('Error:') + ' ' + error.message);
        });
    }
    
    // Change user password
    function changeUserPassword() {
        const userId = document.getElementById('password_modal_user_id').value;
        const password = document.getElementById('password_modal_password').value;
        const confirmPassword = document.getElementById('password_modal_confirm').value;
        
        // Validate inputs
        if (!password) {
            window.showError(t('Please enter a new password.'));
            return;
        }
        
        if (password !== confirmPassword) {
            window.showError(t('Passwords do not match.'));
            return;
        }
        
        // Send API request
        fetch(`/api/users/${userId}/password`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]') ? 
                    document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''
            },
            body: JSON.stringify({
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.showSuccess(t('Password changed successfully.'));
                closePasswordModal();
            } else {
                window.showError(t('Error:') + ' ' + (data.error ? t(data.error) : t('Failed to change password.')));
            }
        })
        .catch(error => {
            console.error('Error changing password:', error);
            window.showError(t('Error:') + ' ' + error.message);
        });
    }
    
    // Setup event listeners for user management
    const addUserButton = document.getElementById('add-user');
    if (addUserButton) {
        addUserButton.addEventListener('click', showUserModal);
    }
    
    // Make loadUsers function available globally
    window.loadUsers = loadUsers;
    
    // Load users on page load
    loadUsers();
}); 