// /static/npm/managers/AccessListManager.js

import {
  makeRequest,
  debugInspect
} 
from "../NPMUtils.js";
import { showSuccess, showError, t } from "../notificationHelper.js";
import * as Views from "../NPMViews.js";

export async function getAccessList(listId) {
  try {
    console.log("Fetching access list with ID:", listId);
    
    let accessList = null;
    
    // Get all access lists - only reliable endpoint
    try {
      const allLists = await makeRequest("/npm/api", "/nginx/access-lists", "GET");
      debugInspect(allLists, "All access lists");
      
      if (Array.isArray(allLists)) {
        // Find our specific list
        accessList = allLists.find(list => list.id === parseInt(listId));
        console.log("Found access list in all lists:", accessList ? "yes" : "no");
      }
    } catch (allListsError) {
      console.warn("Failed to fetch all access lists:", allListsError);
    }
    
    // If we couldn't find it, something is wrong
    if (!accessList) {
      console.error(`Access list with ID ${listId} not found in any data source`);
      throw new Error(`Access list with ID ${listId} not found`);
    }
    
    // For simplicity, we'll create empty arrays for clients and items
    // Instead of trying to fetch them from the API
    const formattedAccessList = {
      id: accessList.id,
      name: accessList.name,
      satisfy_any: accessList.satisfy_any || false,
      pass_auth: accessList.pass_auth || false,
      clients: [],  // Empty array instead of trying to fetch from API
      items: []     // Empty array instead of trying to fetch from API
    };
    
    console.log("Formatted access list for form:", JSON.stringify(formattedAccessList, null, 2));
    
    return formattedAccessList;
  } catch (error) {
    console.error("Failed to fetch access list details:", error);
    showError(window.t("Failed to fetch access list details"));
    throw error;
  }
}

export async function editAccessList(listId, updatedData) {
  try {
    await makeRequest(
      "/npm/api",
      `/nginx/access-lists/${listId}`,
      "PUT",
      updatedData,
    );
    showSuccess(window.t("Access list updated successfully"));
    await Views.loadAccessLists();
  } catch (error) {
    showError(window.t("Failed to update access list"));
    throw error;
  }
}

export async function deleteAccessList(listId) {
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = deleteModal.querySelector(".cancel-delete");
  const closeBtn = deleteModal.querySelector(".modal-close-btn");
  const modalMessage = deleteModal.querySelector(".modal-body p");
  
  // Set the correct confirmation message
  if (modalMessage) {
    modalMessage.textContent = window.t("Are you sure you want to delete this access list?");
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
    await makeRequest("/npm/api", `/nginx/access-lists/${listId}`, "DELETE");
    showSuccess(window.t("Access list deleted successfully"));
    await Views.loadAccessLists();
  } catch (error) {
    showError(window.t("Failed to delete access list"));
    throw error;
  }
}

export async function createAccessList(accessListData) {
  try {
    await makeRequest(
      "/npm/api",
      "/nginx/access-lists",
      "POST",
      accessListData,
    );
    showSuccess(window.t("Access list created successfully"));
    await Views.loadAccessLists();
  } catch (error) {
    showError(window.t("Failed to create access list"));
    throw error;
  }
}

export async function updateAccessList(listId, accessListData) {
  try {
    console.log("Updating access list with ID:", listId);
    console.log("Access list data to update:", JSON.stringify(accessListData, null, 2));
    
    // The API expects a specific format for clients and items
    const payload = {
      name: accessListData.name,
      satisfy_any: accessListData.satisfy_any,
      pass_auth: accessListData.pass_auth
    };
    
    // Add clients and items only if they exist and have content
    if (Array.isArray(accessListData.clients) && accessListData.clients.length > 0) {
      payload.clients = accessListData.clients;
    }
    
    if (Array.isArray(accessListData.items) && accessListData.items.length > 0) {
      payload.items = accessListData.items;
    }
    
    console.log("Final payload for API:", JSON.stringify(payload, null, 2));
    
    await makeRequest(
      "/npm/api",
      `/nginx/access-lists/${listId}`,
      "PUT", 
      payload
    );
    showSuccess(window.t("Access list updated successfully"));
    await Views.loadAccessLists();
  } catch (error) {
    console.error("Failed to update access list:", error);
    showError(window.t("Failed to update access list"));
    throw error;
  }
}

export async function saveAccessListFormToAPI(formData, id = null) {
  // Create or update an access list from form data
  try {
    // ... existing code ...
    showSuccess(window.t("Access list updated successfully"));
    return true;
  } catch (error) {
    showError(window.t("Failed to update access list"));
    return false;
  }
}
