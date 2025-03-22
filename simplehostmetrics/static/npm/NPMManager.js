// /static/npm/managers/NPMManager.js
import * as ProxyHostModals from "./modals/ProxyHostModals.js";
import * as ProxyHostManager from "./managers/ProxyHostManager.js";
import * as RedirectionHostManager from "./managers/RedirectionHostManager.js";
import * as RedirectionHostModals from "./modals/RedirectionHostModals.js";
import * as ReportManager from "./managers/ReportManager.js";
import * as CertificateManager from "./managers/CertificateManager.js";
import * as AccessListManager from "./managers/AccessListManager.js";
import { makeRequest } from "./NPMUtils.js";
import * as Views from "./NPMViews.js";

// Use the globally available showError instead of trying to import it
// The function is globally defined in notifications.js

export class NPMManager {
  constructor() {
    this.apiBase = "/npm/api";
    this.currentView = "proxy";
    this.refreshInterval = 30000;
    this.retryAttempts = 3;
    this.initialize();

    // exposing delete and disable/enable functions for proxy and redirection hosts
    
    this.deleteProxyHost = ProxyHostManager.deleteProxyHost;
    this.enableProxyHost = ProxyHostManager.enableProxyHost;
    this.disableProxyHost = ProxyHostManager.disableProxyHost;
    this.deleteRedirectionHost = RedirectionHostManager.deleteRedirectionHost;
    this.enableRedirectionHost = RedirectionHostManager.enableRedirectionHost;
    this.disableRedirectionHost = RedirectionHostManager.disableRedirectionHost;

    // Update the proxy host modal function to handle errors properly
    this.editProxyHostModal = async (hostId) => {
      try {
        const modal = await ProxyHostModals.editProxyHostModal(hostId);
        const updatedData = await modal;
        await ProxyHostManager.editProxyHost(hostId, updatedData);
      } catch (error) {
        // Only show error if it wasn't a user cancellation
        if (error.message !== "Edit cancelled by user") {
          console.error("Failed to edit proxy host", error);
          showError(window.t("Failed to edit proxy host"));
        }
      }
    };

    this.editRedirectionHostModal = async (hostId) => {
      try {
        const updatedData = await RedirectionHostModals.editRedirectionHostModal(hostId);
        await RedirectionHostManager.editRedirectionHost(hostId, updatedData);
      } catch (error) {
        // Only show error if it wasn't a user cancellation
        if (error.message !== "Edit cancelled by user") {
          console.error("Failed to edit redirection host", error);
          showError(window.t("Failed to edit redirection host"));
        }
      }
    };

    // Update access list modal function
    this.editAccessListModal = async (listId) => {
      try {
        console.log(`Starting edit of access list with ID: ${listId}`);
        
        if (!listId) {
          console.error("No access list ID provided");
          throw new Error("Access list ID is required");
        }
        
        // Make the API request for access list data
        const accessList = await AccessListManager.getAccessList(listId);
        
        if (!accessList) {
          console.error("No access list returned from API");
          throw new Error("Failed to retrieve access list data");
        }
        
        console.log("Access list retrieved successfully:", JSON.stringify(accessList, null, 2));
        
        // Dynamically import the modals module
        const modals = await import("./modals/AccessListModals.js");
        
        if (!modals || typeof modals.populateAccessListForm !== 'function') {
          console.error("Failed to load access list modals module", modals);
          throw new Error("Failed to load access list modal");
        }
        
        // Populate the form with the retrieved data
        modals.populateAccessListForm(accessList);
        
        // Show the modal
        const accessListModal = document.getElementById("accessListModal");
        if (!accessListModal) {
          console.error("Access list modal not found in DOM");
          throw new Error("Access list modal not found");
        }
        
        accessListModal.style.display = "flex";
      } catch (error) {
        console.error("Failed to edit access list", error);
        showError(window.t("Failed to open access list edit form"));
      }
    };

    // Add delete access list function
    this.deleteAccessList = AccessListManager.deleteAccessList;

    // Expose Certificate functions:
    this.renewCertificate = CertificateManager.renewCertificate;
    this.deleteCertificate = CertificateManager.deleteCertificate;
    this.downloadCertificate = CertificateManager.downloadCertificate;

    // New function for uploading a new custom certificate.
    this.uploadNewCertificate = async function () {
      try {
        const modals = await import("./modals/CertificateModals.js");
        const certDetails = await modals.showUploadNewCertificateModal();
        await CertificateManager.uploadNewCertificate(certDetails);
      } catch (error) {
        console.error("Failed to upload new certificate", error);
      }
    };
  }

  async initialize() {
    try {
      const healthCheck = await makeRequest(this.apiBase, "/");
      if (healthCheck.status !== "OK") {
        showError(window.t("NPM API is not available"));
        return;
      }
      this.setupEventListeners();
      await this.loadCurrentView();
      this.startAutoRefresh();
    } catch (error) {
      console.error("API check error:", error);
      
      // Handle specific error cases
      if (error.message && error.message.includes("404")) {
        showError(window.t("NPM API endpoint not found"));
      } else if (error.message && error.message.includes("503")) {
        showError(window.t("NPM is not properly configured"));
      } else {
        showError(window.t("Failed to connect to NPM API"));
      }
    }
  }

  setupEventListeners() {
    document.querySelectorAll(".sidebar-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const view = e.target.getAttribute("href").substring(1);
        this.switchView(view);
      });
    });
    
    // Add event listeners to all search input fields
    document.querySelectorAll('[id$="Input"]').forEach(searchInput => {
      if (searchInput && searchInput.id.includes('search')) {
        searchInput.addEventListener("input", (e) => this.handleSearch(e.target.value));
      }
    });
    
    // Rest of the existing code...
    const addNewBtn = document.getElementById("addNewBtn");
    if (addNewBtn) {
      addNewBtn.addEventListener("click", () => {
        import("./modals/ProxyHostModals.js").then((modals) => {
          modals.populateAddHostForm();
          document.getElementById("addHostModal").style.display = "flex";
        });
      });
    }
    const addNewRedirBtn = document.getElementById("addNewBtn");
    if (addNewBtn) {
      addNewBtn.addEventListener("click", () => {
        import("./modals/RedirectionHostModals.js").then((modals) => {
          modals.populateAddRedirectionHostForm();
          document.getElementById("redirectionHostModal").style.display = "flex";
        });
      });
    }

    // New upload button for custom certificates.
    const uploadBtn = document.getElementById("uploadCertificateBtn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        this.uploadNewCertificate();
      });
    }
  }

  switchView(view) {
    document.querySelectorAll(".content-view").forEach((v) => {
      v.style.display = "none";
      v.classList.remove("active");
    });
    document
      .querySelectorAll(".sidebar-item")
      .forEach((item) => item.classList.remove("active"));
    const viewElement = document.getElementById(`${view}View`);
    if (viewElement) {
      viewElement.style.display = "block";
      viewElement.classList.add("active");
    }
    const sidebarItem = document.querySelector(`[href="#${view}"]`);
    if (sidebarItem) {
      sidebarItem.classList.add("active");
    }
    this.currentView = view;
    this.loadCurrentView();
    
    // Apply translations for certificate view
    if (view === 'certificates') {
      // Directly translate certificates view elements
      const validCertHeader = document.querySelector('#certificatesView .stat-card:first-child h3');
      if (validCertHeader) validCertHeader.textContent = window.t('Valid Certificates');
      
      const expiringSoonHeader = document.querySelector('#certificatesView .stat-card.warning h3');
      if (expiringSoonHeader) expiringSoonHeader.textContent = window.t('Expiring Soon');
      
      const expiredHeader = document.querySelector('#certificatesView .stat-card.danger h3');
      if (expiredHeader) expiredHeader.textContent = window.t('Expired');
      
      const addCertBtn = document.getElementById('addCertificateBtn');
      if (addCertBtn) addCertBtn.innerHTML = `<i class="fas fa-plus"></i> ${window.t('Add Certificate')}`;
      
      // Also call the global update function if available
      if (window.updateNPMTranslations) {
        setTimeout(window.updateNPMTranslations, 100);
      }
    }
    
    // Reapply search if there's a search term
    const searchInput = document.getElementById("searchInput");
    if (searchInput && searchInput.value.trim()) {
      this.handleSearch(searchInput.value);
    }

    // After view is switched, get the appropriate search input in the new view
    // and apply any existing search term
    if (viewElement) {
      const searchInput = viewElement.querySelector('input[type="text"][id*="search"]');
      if (searchInput && searchInput.value.trim()) {
        this.handleSearch(searchInput.value);
      }
    }
  }

  handleSearch(query) {
    // Only search within the currently active view
    const activeView = document.querySelector(".content-view.active");
    if (!activeView) return;
    
    query = query.toLowerCase();
    
    // Handle card-based views (proxy hosts, redirection, certificates, etc.)
    const cards = activeView.querySelectorAll(".glass-card");
    if (cards.length > 0) {
      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
      });
    }
    
    // Handle table-based views (audit log)
    const tableRows = activeView.querySelectorAll("table tbody tr");
    if (tableRows.length > 0) {
      tableRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    }
  }

  startAutoRefresh() {
    setInterval(() => {
      if (document.visibilityState === "visible") {
        this.loadCurrentView();
      }
    }, this.refreshInterval);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.loadCurrentView();
      }
    });
  }

  async loadCurrentView() {
    const viewMap = {
      proxy: Views.loadProxyHosts,
      redirection: Views.loadRedirectionHosts,
      access: Views.loadAccessLists,
      certificates: Views.loadCertificates,
      audit: Views.loadAuditLog,
      settings: Views.loadSettings,
      dead: Views.loadDeadHosts,
      reports: ReportManager.loadReports,
      users: Views.loadUsers,
    };
    if (viewMap[this.currentView]) {
      await viewMap[this.currentView]();
    } else {
      console.error(
        `View "${this.currentView}" not found. Falling back to proxy.`,
      );
      this.currentView = "proxy";
      await viewMap.proxy();
    }
  }
}
