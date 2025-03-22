import {
  makeRequest 
} 
from "../NPMUtils.js";
import { showSuccess, showError } from "../notificationHelper.js";
import * as Views from "../NPMViews.js";

/**
 * Creates a new redirection host
 * @param {Object} redirectionData - The redirection host data
 */
export async function createRedirectionHost(redirectionData) {
  try {
    await makeRequest(
      "/npm/api", 
      "/nginx/redirection-hosts", 
      "POST", redirectionData
    );

    showSuccess(window.t("Redirection Host created successfully"));
    await Views.loadRedirectionHosts();    
  } catch (error) {
    showError(window.t("Failed to create redirection host"));
    throw error;
  }
}

/**
 * Edits an existing redirection host
 * @param {string|number} hostId - The ID of the host to edit
 * @param {Object} updatedRedirectionData - The updated host data
 */
export async function editRedirectionHost(hostId, updatedRedirectionData) {
  try {
    await makeRequest(
      "/npm/api",
      `/nginx/redirection-hosts/${hostId}`,
      "PUT",
      updatedRedirectionData
    );
    showSuccess(window.t("Redirection host updated successfully"));
    await Views.loadRedirectionHosts();
  } catch (error) {
    showError(window.t("Failed to update redirection host"));
  }
}

/**
 * Deletes a redirection host
 * @param {string|number} hostId - The ID of the host to delete
 */
export async function deleteRedirectionHost(hostId) {
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = deleteModal.querySelector(".cancel-delete");
  const closeBtn = deleteModal.querySelector(".modal-close-btn");
  const modalMessage = deleteModal.querySelector(".modal-body p");
  
  // Set the correct confirmation message
  if (modalMessage) {
    modalMessage.textContent = window.t("Are you sure you want to delete this redirection host?");
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
      `/nginx/redirection-hosts/${hostId}`, 
      "DELETE"
    );
    showSuccess(window.t("Redirection host deleted successfully"));
    await Views.loadRedirectionHosts();
  } catch (error) {
    showError(window.t("Failed to delete redirection host"));
  }
}

/**
 * Enables a redirection host
 * @param {string|number} hostId - The ID of the host to enable
 */
export async function enableRedirectionHost(hostId) {
  try {
    await makeRequest(
      "/npm/api",
      `/nginx/redirection-hosts/${hostId}/enable`,
      "POST"
    );
    showSuccess(window.t("Redirection host enabled successfully"));
    await Views.loadRedirectionHosts();
  } catch (error) {
    showError(window.t("Failed to enable redirection host"));
  }
}

/**
 * Disables a redirection host
 * @param {string|number} hostId - The ID of the host to disable
 */
export async function disableRedirectionHost(hostId) {
  try {
    await makeRequest(
      "/npm/api",
      `/nginx/redirection-hosts/${hostId}/disable`,
      "POST"
    );
    showSuccess(window.t("Redirection host disabled successfully"));
    await Views.loadRedirectionHosts();
  } catch (error) {
    showError(window.t("Failed to disable redirection host"));
  }
}

// Export all functions to be available globally if needed
window.RedirectionHostManager = {
  createRedirectionHost,
  editRedirectionHost,
  deleteRedirectionHost,
  enableRedirectionHost,
  disableRedirectionHost,  
};

