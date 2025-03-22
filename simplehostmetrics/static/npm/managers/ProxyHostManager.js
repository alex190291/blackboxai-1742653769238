// /static/npm/managers/ProxyHostManager.js
import { 
  makeRequest 
} 
from "../NPMUtils.js";
import { showSuccess, showError } from "../notificationHelper.js";
import * as Views from "../NPMViews.js";

/**
 * Creates a new proxy host
 * @param {Object} proxyData - The proxy host data
 */
export async function createProxyHost(proxyData) {
  try {
    await makeRequest(
      "/npm/api", 
      "/nginx/proxy-hosts", 
      "POST", proxyData
    );

    showSuccess(window.t("Proxy Host created successfully"));
    await Views.loadProxyHosts();    
  } catch (error) {
    showError(window.t("Failed to create host"));
    throw error;
  }
}

/**
 * Edits an existing proxy host
 * @param {string|number} hostId - The ID of the host to edit
 * @param {Object} updatedProxyData - The updated host data
 */
export async function editProxyHost(hostId, updatedProxyData) {
  try {
    await makeRequest(
      "/npm/api",
      `/nginx/proxy-hosts/${hostId}`,
      "PUT",
      updatedProxyData
    );
    showSuccess(window.t("Host updated successfully"));
    await Views.loadProxyHosts();
  } catch (error) {
    showError(window.t("Failed to update host"));
  }
}

/**
 * Deletes a proxy host
 * @param {string|number} hostId - The ID of the host to delete
 */
export async function deleteProxyHost(hostId) {
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = deleteModal.querySelector(".cancel-delete");
  const closeBtn = deleteModal.querySelector(".modal-close-btn");
  const modalMessage = deleteModal.querySelector(".modal-body p");
  
  // Set the correct confirmation message
  if (modalMessage) {
    modalMessage.textContent = window.t("Are you sure you want to delete this proxy host?");
  }
  
  // Set button texts
  if (confirmDeleteBtn) {
    confirmDeleteBtn.textContent = window.t("Delete");
  }
  if (cancelDeleteBtn) {
    cancelDeleteBtn.textContent = window.t("Cancel");
  }

  // Show the modal
  deleteModal.style.display = "flex";

  // Create a promise that resolves when the user makes a choice
  const userChoice = new Promise((resolve) => {
    const handleConfirm = (event) => {
      event.preventDefault();
      event.stopPropagation();
      cleanup();
      deleteModal.style.display = "none";
      resolve(true);
    };

    const handleCancel = (event) => {
      event.preventDefault();
      event.stopPropagation();
      cleanup();
      deleteModal.style.display = "none";
      resolve(false);
    };

    const cleanup = () => {
      confirmDeleteBtn.removeEventListener("click", handleConfirm);
      cancelDeleteBtn.removeEventListener("click", handleCancel);
      closeBtn.removeEventListener("click", handleCancel);
      deleteModal.removeEventListener("click", handleOutsideClick);
    };

    const handleOutsideClick = (event) => {
      if (event.target === deleteModal) {
        handleCancel(event);
      }
    };

    // Remove any existing event listeners first
    confirmDeleteBtn.removeEventListener("click", handleConfirm);
    cancelDeleteBtn.removeEventListener("click", handleCancel);
    closeBtn.removeEventListener("click", handleCancel);
    deleteModal.removeEventListener("click", handleOutsideClick);

    // Add new event listeners
    confirmDeleteBtn.addEventListener("click", handleConfirm);
    cancelDeleteBtn.addEventListener("click", handleCancel);
    closeBtn.addEventListener("click", handleCancel);
    deleteModal.addEventListener("click", handleOutsideClick);
  });

  // Wait for user choice
  const shouldDelete = await userChoice;
  if (!shouldDelete) return;

  try {
    await makeRequest(
      "/npm/api", 
      `/nginx/proxy-hosts/${hostId}`, 
      "DELETE"
    );
    showSuccess(window.t("Host deleted successfully"));
    await Views.loadProxyHosts();
  } catch (error) {
    showError(window.t("Failed to delete host"));
  }
}

/**
 * Enables a proxy host
 * @param {string|number} hostId - The ID of the host to enable
 */
export async function enableProxyHost(hostId) {
  try {
    await makeRequest(
      "/npm/api",
      `/nginx/proxy-hosts/${hostId}/enable`,
      "POST"
    );
    showSuccess(window.t("Proxy host enabled successfully"));
    await Views.loadProxyHosts();
  } catch (error) {
    showError(window.t("Failed to enable proxy host"));
  }
}

/**
 * Disables a proxy host
 * @param {string|number} hostId - The ID of the host to disable
 */
export async function disableProxyHost(hostId) {
  try {
    await makeRequest(
      "/npm/api",
      `/nginx/proxy-hosts/${hostId}/disable`,
      "POST"
    );
    showSuccess(window.t("Proxy host disabled successfully"));
    await Views.loadProxyHosts();
  } catch (error) {
    showError(window.t("Failed to disable proxy host"));
  }
}

// Export all functions to be available globally if needed
window.ProxyHostManager = {
  createProxyHost,
  editProxyHost,
  deleteProxyHost,
  enableProxyHost,
  disableProxyHost,  
};
