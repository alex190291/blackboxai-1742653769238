// /static/npm/NPMViews.js
import { 
  makeRequest 
} 
from "./NPMUtils.js";
import { showError } from "./notificationHelper.js";


// Import all modal functions
import { populateAddProxyHostForm } from "./modals/ProxyHostModals.js";
import { populateAddRedirectionHostForm } from "./modals/RedirectionHostModals.js";
import { populateAccessListForm } from "./modals/AccessListModals.js";
import { populateCertificateForm } from "./modals/CertificateModals.js";

const API_BASE = "/npm/api";

// Proxy Hosts
export async function loadProxyHosts() {
  try {
    const hosts = await makeRequest(API_BASE, "/nginx/proxy-hosts");
    const grid = document.getElementById("proxyHostsGrid");
    grid.innerHTML = "";
    hosts.forEach((host) => {
      grid.appendChild(createProxyHostCard(host));
    });
  } catch (error) {
    showError(window.t("Failed to load proxy hosts"));
  }
}

export function createProxyHostCard(host) {
  const card = document.createElement("div");
  card.className = "host-card glass-card";
  const disableAction = host.enabled
    ? `npmManager.disableProxyHost(${host.id})`
    : `npmManager.enableProxyHost(${host.id})`;
  const disableLabel = host.enabled ? window.t("Disable") : window.t("Enable");
  card.innerHTML = `
    <div class="card-header">
      <h3>${host.domain_names[0]}</h3>
      <div class="status-indicator ${host.enabled ? "active" : "inactive"}"></div>
    </div>
    <div class="card-content">
      <p>${window.t('Forward')}: ${host.forward_host}:${host.forward_port}</p>
      <p>${window.t('SSL')}: ${host.ssl_forced ? window.t('Forced') : window.t('Optional')}</p>
      <p>${window.t('Cache')}: ${host.caching_enabled ? window.t('Enabled') : window.t('Disabled')}</p>
    </div>
    <div class="card-actions">
      <button class="btn primary" onclick="npmManager.editProxyHostModal(${host.id})">${window.t('Edit')}</button>
      <button class="btn primary" onclick="${disableAction}">
        ${disableLabel}
      </button>
      <button class="btn danger" onclick="npmManager.deleteProxyHost(${host.id})">${window.t('Delete')}</button>
    </div>
  `;
  return card;
}

// Redirection Hosts
export async function loadRedirectionHosts() {
  try {
    const hosts = await makeRequest(API_BASE, "/nginx/redirection-hosts");
    const grid = document.getElementById("redirectionHostsGrid");
    grid.innerHTML = "";
    hosts.forEach((host) => {
      grid.appendChild(createRedirectionHostCard(host));
    });
  } catch (error) {
    showError(window.t("Failed to load redirection hosts"));
  }
}

export function createRedirectionHostCard(host) {
  const card = document.createElement("div");
  card.className = "host-card glass-card";
  const disableAction = host.enabled
    ? `npmManager.disableRedirectionHost(${host.id})`
    : `npmManager.enableRedirectionHost(${host.id})`;
  const disableLabel = host.enabled ? window.t("Disable") : window.t("Enable");
  card.innerHTML = `
    <div class="card-header">
      <h3>${host.domain_names[0]}</h3>
      <div class="status-indicator ${host.enabled ? "active" : "inactive"}"></div>
    </div>
    <div class="card-content">
      <p>${window.t('Redirect HTTP Code')}: ${host.forward_http_code}</p>
      <p>${window.t('Forward Domain')}: ${host.forward_domain_name}</p>
      <p>${window.t('Preserve Path')}: ${host.preserve_path ? window.t('Yes') : window.t('No')}</p>
    </div>
    <div class="card-actions">
      <button class="btn primary" onclick="npmManager.editRedirectionHostModal(${host.id})">${window.t('Edit')}</button>
      <button class="btn primary" onclick="${disableAction}">
        ${disableLabel}
      </button>
      <button class="btn danger" onclick="npmManager.deleteRedirectionHost(${host.id})">${window.t('Delete')}</button>
    </div>
  `;
  return card;
}

// Access Lists
export async function loadAccessLists() {
  try {
    const lists = await makeRequest(API_BASE, "/nginx/access-lists");
    const grid = document.getElementById("accessListsGrid");
    grid.innerHTML = "";
    lists.forEach((list) => {
      grid.appendChild(createAccessListCard(list));
    });
  } catch (error) {
    showError(window.t("Failed to load access lists"));
  }
}

export function createAccessListCard(list) {
  const card = document.createElement("div");
  card.className = "access-list-card glass-card";
  
  // Calculate number of auth items and clients
  const authItems = list.items ? list.items.length : 0;
  const clients = list.clients ? list.clients.length : 0;
  
  card.innerHTML = `
    <div class="card-header">
      <h3>${list.name}</h3>
    </div>
    <div class="card-content">
      <p>${window.t('Authorization')}: ${list.satisfy_any ? window.t('Satisfy Any') : window.t('Satisfy All')}</p>
      <p>${window.t('Pass Auth')}: ${list.pass_auth ? window.t('Yes') : window.t('No')}</p>
      <p>${window.t('Auth Items')}: ${authItems}</p>
      <p>${window.t('Clients')}: ${clients}</p>
    </div>
    <div class="card-actions">
      <button class="btn primary" onclick="npmManager.editAccessListModal(${list.id})">${window.t('Edit')}</button>
      <button class="btn danger" onclick="npmManager.deleteAccessList(${list.id})">${window.t('Delete')}</button>
    </div>
  `;
  return card;
}

// Certificates
export async function loadCertificates() {
  try {
    const certs = await makeRequest(API_BASE, "/nginx/certificates");
    updateCertificateStats(certs);
    const grid = document.getElementById("certificatesGrid");
    grid.innerHTML = "";
    certs.forEach((cert) => {
      grid.appendChild(createCertificateCard(cert));
    });
    
    // Force translations to be applied after certificates are loaded
    setTimeout(updateCertificateViewTranslations, 100);
  } catch (error) {
    showError(window.t("Failed to load certificates"));
  }
}

export function updateCertificateStats(certs) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const statsObj = certs.reduce(
    (acc, cert) => {
      const expiryDate = new Date(cert.expires_on);
      if (expiryDate < now) acc.expired++;
      else if (expiryDate < thirtyDaysFromNow) acc.expiringSoon++;
      else acc.valid++;
      return acc;
    },
    { valid: 0, expiringSoon: 0, expired: 0 },
  );

  // Update both counts and labels
  const validCard = document.querySelector('.stat-card:not(.warning):not(.danger)');
  const expiringSoonCard = document.querySelector('.stat-card.warning');
  const expiredCard = document.querySelector('.stat-card.danger');

  if (validCard) {
    validCard.querySelector('h3').textContent = window.t('Valid Certificates');
    validCard.querySelector('span').textContent = statsObj.valid;
  }
  if (expiringSoonCard) {
    expiringSoonCard.querySelector('h3').textContent = window.t('Expiring Soon');
    expiringSoonCard.querySelector('span').textContent = statsObj.expiringSoon;
  }
  if (expiredCard) {
    expiredCard.querySelector('h3').textContent = window.t('Expired');
    expiredCard.querySelector('span').textContent = statsObj.expired;
  }
}

export function createCertificateCard(cert) {
  const card = document.createElement("div");
  card.className = "cert-card glass-card";
  const expiryDate = new Date(cert.expires_on);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  // Only show renew button for Let's Encrypt certificates (not for uploaded ones)
  const renewButton = cert.provider === "letsencrypt" 
    ? `<button class="btn primary" onclick="npmManager.renewCertificate(${cert.id})">${window.t('Renew')}</button>` 
    : '';
    
  card.innerHTML = `
    <div class="card-header">
      <h3>${cert.nice_name}</h3>
      <div class="expiry-indicator ${getExpiryClass(daysUntilExpiry)}">
        ${daysUntilExpiry > 0 ? `${daysUntilExpiry} ${window.t('days left')}` : window.t('Expired')}
      </div>
    </div>
    <div class="card-content">
      <p>${window.t('Domains')}: ${cert.domain_names.join(", ")}</p>
      <p>${window.t('Provider')}: ${cert.provider}</p>
      <p>${window.t('Expires')}: ${expiryDate.toLocaleDateString()}</p>
    </div>
    <div class="card-actions">
      ${renewButton}
      <button class="btn primary" onclick="npmManager.downloadCertificate(${cert.id})">${window.t('Download')}</button>
      <button class="btn danger" onclick="npmManager.deleteCertificate(${cert.id})">${window.t('Delete')}</button>
    </div>
  `;
  return card;
}

function getExpiryClass(daysUntilExpiry) {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 30) return "warning";
  return "valid";
}

// Audit Log
export async function loadAuditLog() {
  try {
    const logs = await makeRequest(API_BASE, "/audit-log");
    const tbody = document.querySelector("#auditLogTable tbody");
    tbody.innerHTML = "";
    
    if (!logs || logs.length === 0) {
      // Show a message when no logs are available
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="4" class="text-center">
          <div class="empty-state">
            <div class="icon"><i class="fas fa-info-circle"></i></div>
            <p>${window.t("No audit log data available")}</p>
          </div>
        </td>
      `;
      tbody.appendChild(row);
      return;
    }
    
    logs.forEach((log) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(log.created_on).toLocaleString()}</td>
        <td>${log.user_id || '-'}</td>
        <td>${log.action || '-'}</td>
        <td>${log.meta ? JSON.stringify(log.meta) : '-'}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load audit log:", error);
    showError(window.t("Failed to load audit log"));
  }
}

// Dead Hosts
export async function loadDeadHosts() {
  try {
    const hosts = await makeRequest(API_BASE, "/nginx/dead-hosts");
    const grid = document.getElementById("deadHostsGrid");
    grid.innerHTML = "";
    hosts.forEach((host) => {
      grid.appendChild(createDeadHostCard(host));
    });
  } catch (error) {
    showError(window.t("Failed to load dead hosts"));
  }
}

export function createDeadHostCard(host) {
  const card = document.createElement("div");
  card.className = "host-card glass-card";
  const disableAction = host.enabled
    ? `npmManager.disableDeadHost(${host.id})`
    : `npmManager.enableDeadHost(${host.id})`;
  const disableLabel = host.enabled ? "Disable" : "Enable";
  card.innerHTML = `
    <div class="card-header">
      <h3>${host.domain_names[0]}</h3>
      <div class="status-indicator ${host.enabled ? "active" : "inactive"}"></div>
    </div>
    <div class="card-content">
      <p>Certificate ID: ${host.certificate_id || "N/A"}</p>
    </div>
    <div class="card-actions">
      <button class="btn primary" onclick="npmManager.updateDeadHost(${host.id})">Edit</button>
      <button class="btn primary" onclick="${disableAction}">
        ${disableLabel}
      </button>
      <button class="btn danger" onclick="npmManager.deleteDeadHost(${host.id})">Delete</button>
    </div>
  `;
  return card;
}

// Reports
export async function loadReports() {
  try {
    const report = await makeRequest(API_BASE, "/reports/hosts");
    const container = document.getElementById("reportsContainer");
    container.innerHTML = `
      <div class="report-card glass-card">
        <h3>Host Statistics</h3>
        <p>Proxy Hosts: ${report.proxy}</p>
        <p>Redirection Hosts: ${report.redirection}</p>
        <p>Streams: ${report.stream}</p>
        <p>Dead Hosts: ${report.dead}</p>
      </div>
    `;
  } catch (error) {
    showError(window.t("Failed to load reports"));
  }
}

/* --- View-Specific Button Bindings --- */
function bindViewButtons() {
  // Proxy Host Button
  const addProxyHostBtn = document.getElementById("addProxyHostBtn");
  if (addProxyHostBtn) {
    addProxyHostBtn.addEventListener("click", () => {
      try {
        populateAddProxyHostForm();
        document.getElementById("addHostModal").style.display = "flex";
      } catch (error) {
        console.error("Error showing proxy host modal:", error);
      }
    });
  }

  // Redirection Host Button
  const addRedirectionHostBtn = document.getElementById("addRedirectionHostBtn");
  if (addRedirectionHostBtn) {
    addRedirectionHostBtn.addEventListener("click", () => {
      try {
        populateAddRedirectionHostForm();
        document.getElementById("redirectionHostModal").style.display = "flex";
      } catch (error) {
        console.error("Error showing redirection host modal:", error);
      }
    });
  }

  // Stream Host Button
  const addStreamHostBtn = document.getElementById("addStreamHostBtn");
  if (addStreamHostBtn) {
    addStreamHostBtn.addEventListener("click", () => {
      try {
        populateStreamHostForm();
        document.getElementById("streamHostModal").style.display = "flex";
      } catch (error) {
        console.error("Error showing stream host modal:", error);
      }
    });
  }

  // Access List Button
  const addAccessListBtn = document.getElementById("addAccessListBtn");
  if (addAccessListBtn) {
    addAccessListBtn.addEventListener("click", () => {
      try {
        populateAccessListForm();
        document.getElementById("accessListModal").style.display = "flex";
      } catch (error) {
        console.error("Error showing access list modal:", error);
      }
    });
  }

  // Certificate Buttons
  const addCertificateBtn = document.getElementById("addCertificateBtn");
  if (addCertificateBtn) {
    // Add a container for certificate action buttons if it doesn't exist already
    let certActionContainer = document.querySelector('.certificate-actions');
    if (!certActionContainer) {
      certActionContainer = document.createElement('div');
      certActionContainer.className = 'certificate-actions action-buttons';
      certActionContainer.style.display = 'flex';
      certActionContainer.style.gap = '15px';
      addCertificateBtn.parentNode.appendChild(certActionContainer);
      
      // Move the Add Certificate button to the container (it will be translated by updateCertificateViewTranslations)
      certActionContainer.appendChild(addCertificateBtn);
      
      // Create Upload Certificate button
      const uploadCertBtn = document.createElement('button');
      uploadCertBtn.id = "uploadCertificateBtn";
      uploadCertBtn.className = "btn primary";
      uploadCertBtn.innerHTML = `<i class='fas fa-upload'></i> ${window.t('Upload Certificate')}`;
      certActionContainer.appendChild(uploadCertBtn);
      
      // Add event listener to Upload Certificate button
      uploadCertBtn.addEventListener("click", () => {
        try {
          import('./modals/CertificateModals.js').then(module => {
            module.showUploadCertificateModal();
          });
        } catch (error) {
          console.error("Error showing certificate upload modal:", error);
        }
      });
    }

    // Add Certificate button event listener
    addCertificateBtn.addEventListener("click", () => {
      try {
        populateCertificateForm();
        document.getElementById("certificateModal").style.display = "flex";
        
        // Make sure the X close button works
        const closeXBtn = document.querySelector("#certificateModal .modal-close-btn");
        if (closeXBtn) {
          closeXBtn.addEventListener("click", () => {
            document.getElementById("certificateModal").style.display = "none";
          });
        }
      } catch (error) {
        console.error("Error showing certificate modal:", error);
      }
    });
  }
}

// Add this new function at the top level
function updateCertificateViewTranslations() {
  // Direct targeting of specific elements by ID where possible
  
  // Stats cards - target by ID first, then try class selectors as fallback
  const validCertHeader = document.querySelector('#certificatesView .stat-card:first-child h3');
  if (validCertHeader) {
    validCertHeader.textContent = window.t('Valid Certificates');
  }
  
  const expiringSoonHeader = document.querySelector('#certificatesView .stat-card.warning h3');
  if (expiringSoonHeader) {
    expiringSoonHeader.textContent = window.t('Expiring Soon');
  }
  
  const expiredHeader = document.querySelector('#certificatesView .stat-card.danger h3');
  if (expiredHeader) {
    expiredHeader.textContent = window.t('Expired');
  }
  
  // Add Certificate button - directly target by ID
  const addCertBtn = document.getElementById('addCertificateBtn');
  if (addCertBtn) {
    addCertBtn.innerHTML = `<i class="fas fa-plus"></i> ${window.t('Add Certificate')}`;
  }
}

// Ensure translations are applied when switching to the certificates view
export function activateCertificatesView() {
  // Hide all views
  document.querySelectorAll('.content-view').forEach(view => {
    view.style.display = 'none';
  });
  
  // Show certificates view
  const certificatesView = document.getElementById('certificatesView');
  if (certificatesView) {
    certificatesView.style.display = 'block';
    updateCertificateViewTranslations();
  }
}

// Ensure translations are applied when the DOM is loaded and when the language changes
document.addEventListener("DOMContentLoaded", () => {
  bindViewButtons();
  updateCertificateViewTranslations();
  
  // Add click handler for sidebar navigation to certificates view
  const certificatesNavLink = document.querySelector('a[href="#certificates"]');
  if (certificatesNavLink) {
    certificatesNavLink.addEventListener('click', () => {
      setTimeout(updateCertificateViewTranslations, 100);
    });
  }
});

// Expose the translation update function globally so it can be called when language changes
window.updateNPMTranslations = function() {
  updateCertificateViewTranslations();
};
