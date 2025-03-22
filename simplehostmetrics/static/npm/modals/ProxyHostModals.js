// /static/npm/modals/ProxyHostModals.js
import { switchTab, closeModals } from "/static/npm/NPMUtils.js";
import { loadTemplate, processTemplate } from "../utils/TemplateLoader.js";

import {
  populateCertificateDropdown,
  handleCertificateCreation,
} from "../NPMUtils.js";
import { showSuccess, showError } from "../notificationHelper.js";

// Cache for loaded templates
let proxyHostFormTemplate = null;
let proxyHostModalTemplate = null; // Add this to cache the modal template too

// Helper function to populate the access list dropdown dynamically
async function populateAccessListDropdown(selectElement, selectedValue = "") {
  try {
    console.log("Populating access list dropdown with selected value:", selectedValue);
    const response = await fetch("/npm/api/nginx/access-lists");
    if (!response.ok) {
      console.error("Failed to load access lists", response.statusText);
      return;
    }
    const accessLists = await response.json();
    selectElement.innerHTML = '<option value="">None</option>';
    accessLists.forEach((list) => {
      const option = document.createElement("option");
      option.value = list.id;
      option.textContent = list.name;
      if (list.id == selectedValue) {
        option.selected = true;
        console.log(`Selected access list: ${list.name} (ID: ${list.id})`);
      }
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load access lists", error);
  }
}

// Load templates if not already loaded
async function ensureTemplatesLoaded() {
  if (!proxyHostFormTemplate) {
    proxyHostFormTemplate = await loadTemplate("/static/npm/templates/proxy-host-form.html");
  }
  
  // Also load the modal template if we're going to use it
  if (!proxyHostModalTemplate) {
    proxyHostModalTemplate = await loadTemplate("/static/npm/templates/proxy-host-modal.html");
  }
}

// Generate form HTML for host configuration - using templates now
async function generateProxyHostFormHTML(host = null) {
  await ensureTemplatesLoaded();

  const isEdit = host !== null;
  const templateData = {
    idField: isEdit ? `<input type="hidden" name="host_id" value="${host.id}">` : "",
    domainNames: isEdit ? host.domain_names.join(", ") : "",
    forwardHost: isEdit ? host.forward_host : "",
    forwardPort: isEdit ? host.forward_port : "",
    forwardSchemeHttp: isEdit && host.forward_scheme === "http" ? "selected" : "",
    forwardSchemeHttps: isEdit && host.forward_scheme === "https" ? "selected" : "",
    cacheAssets: isEdit && host.caching_enabled ? "checked" : "",
    websocketsSupport: isEdit && host.allow_websocket_upgrade ? "checked" : "",
    blockExploits: isEdit && host.block_exploits ? "checked" : "",
    sslForced: isEdit && host.ssl_forced ? "checked" : "",
    http2Support: isEdit && host.http2_support ? "checked" : "",
    hstsEnabled: isEdit && host.hsts_enabled ? "checked" : "",
    hstsSubdomains: isEdit && host.hsts_subdomains ? "checked" : "",
    customConfig: isEdit && host.custom_config ? host.custom_config : "",
    submitBtnText: isEdit ? `\${window.t('Update Host')}` : `\${window.t('Add Host')}`
  };

  // Process the main form template
  const formHTML = processTemplate(proxyHostFormTemplate, templateData);
  
  // Return only the form contents without the action buttons
  return formHTML.replace(/<div class="form-actions">[\s\S]*?<\/div>/g, '');
}

// Process form data from both add and edit forms
function processProxyHostFormData(formData) {
  const certificate_id_raw = formData.get("certificate_id");
  let certificate_id;
  if (certificate_id_raw === "") {
    certificate_id = null;
  } else if (certificate_id_raw === "new_nodns") {
    certificate_id = "new";
  } else {
    certificate_id = parseInt(certificate_id_raw);
  }
  const access_list_id_raw = formData.get("access_list_id");
  const access_list_id =
    access_list_id_raw === "" ? null : parseInt(access_list_id_raw);

  return {
    domain_names: formData
      .get("domain_names")
      .split(",")
      .map((d) => d.trim()),
    forward_host: formData.get("forward_host"),
    forward_port: parseInt(formData.get("forward_port")),
    forward_scheme: formData.get("forward_scheme"),
    certificate_id: certificate_id,
    access_list_id: access_list_id,
    caching_enabled: formData.get("cache_assets") === "on",
    allow_websocket_upgrade: formData.get("websockets_support") === "on",
    block_exploits: formData.get("block_exploits") === "on",
    ssl_forced: formData.get("ssl_forced") === "on",
    http2_support: formData.get("http2_support") === "on",
    hsts_enabled: formData.get("hsts_enabled") === "on",
    hsts_subdomains: formData.get("hsts_subdomains") === "on",
    advanced_config: formData.get("custom_config"),
  };
}

// Setup form for both add and edit
function setupProxyHostForm(form, isEdit = false) {
  // Attach tab switching event listeners
  const tabLinks = form.querySelectorAll(".tab-link");
  tabLinks.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.getAttribute("data-tab"), btn);
    });
  });

  // Attach modal close event listeners
  form.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", closeModals);
  });

  // Populate dropdown menus
  const certSelect = form.querySelector("#certificate_id");
  const accessListSelect = form.querySelector("#access_list_id");

  if (isEdit) {
    const hostId = form.querySelector("input[name='host_id']").value;
    populateCertificateDropdown(certSelect, hostId);
  } else {
    populateCertificateDropdown(certSelect);
    populateAccessListDropdown(accessListSelect);
  }
}

// -------------------------
// Add Host Flow
// -------------------------
export async function populateAddProxyHostForm() {
  const form = document.getElementById("addHostForm");
  form.innerHTML = await generateProxyHostFormHTML(); // Now async
  setupProxyHostForm(form, false);
  
  // Set the modal title for adding a proxy host
  const modal = document.getElementById("addHostModal");
  const titleElement = modal.querySelector(".modal-header h2");
  if (titleElement) {
    titleElement.textContent = window.t('Add Proxy Host');
  }
  
  // Add buttons to the modal footer
  const modalFooter = modal.querySelector(".modal-footer");
  if (modalFooter) {
    modalFooter.innerHTML = `
      <button type="button" class="btn danger modal-close">${window.t('Cancel')}</button>
      <button type="submit" class="btn primary" form="addHostForm">${window.t('Add Host')}</button>
    `;
    
    // Add event listener to the close button
    const closeBtn = modalFooter.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModals);
    }
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = modal.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = window.t('Please wait...');

    try {
      const formData = new FormData(form);
      const baseData = processProxyHostFormData(formData);
      const certificate_id_raw = formData.get("certificate_id");

      // Handle certificate creation if needed
      if (certificate_id_raw === "new_nodns") { // Remove the "new_dns" || 
        try {
          baseData.certificate_id = await handleCertificateCreation(
            baseData.domain_names,
            certificate_id_raw,
          );
        } catch (err) {
          showError(window.t('Failed to create certificate'));
          console.error("Failed to create certificate", err);
          throw err;
        }
      }

      // Create the proxy host
      const ProxyHostManager = await import("../managers/ProxyHostManager.js");
      await ProxyHostManager.createProxyHost(baseData);
      document.getElementById("addHostModal").style.display = "none";
    } catch (err) {
      console.error("Failed to create host", err);
      showError(window.t('Failed to create host'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = window.t('Add Host');
    }
  };
}

// -------------------------
// Edit Host Flow
// -------------------------
export async function editProxyHostModal(hostIdOrObject) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if we received just an ID or a complete host object
      let host = hostIdOrObject;

      // If we just got an ID, fetch the complete host data
      if (
        typeof hostIdOrObject === "number" ||
        typeof hostIdOrObject === "string"
      ) {
        const response = await fetch(
          `/npm/api/nginx/proxy-hosts/${hostIdOrObject}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch host data: ${response.status}`);
        }
        host = await response.json();
      }

      // Log the host data for debugging
      console.log("Host data for editing:", host);
      console.log("Access list ID:", host.access_list_id);

      // Now we have the complete host object, proceed with the modal
      const modal = document.getElementById("addHostModal");
      if (!modal) {
        throw new Error("Host modal element not found");
      }

      const form = document.getElementById("addHostForm");
      if (!form) {
        throw new Error("Host form element not found");
      }
      
      // Set the modal title for editing a proxy host
      const titleElement = modal.querySelector(".modal-header h2");
      if (titleElement) {
        titleElement.textContent = window.t('Edit Proxy Host');
      }

      form.innerHTML = await generateProxyHostFormHTML(host); // Now async
      modal.style.display = "flex";
      setupProxyHostForm(form, true);

      // Populate certificate and access list dropdowns with existing values
      const certSelect = form.querySelector("#certificate_id");
      const accessListSelect = form.querySelector("#access_list_id");
      populateCertificateDropdown(certSelect, host.certificate_id || "");
      populateAccessListDropdown(accessListSelect, host.access_list_id || "");
      
      // Add buttons to the modal footer
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button type="button" class="btn danger modal-close">${window.t('Cancel')}</button>
          <button type="submit" class="btn primary" form="addHostForm">${window.t('Update Host')}</button>
        `;
        
        // Add event listener to the close button
        const closeBtn = modalFooter.querySelector(".modal-close");
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            closeModals();
            reject(new Error("Edit cancelled by user"));
          });
        }
      }

      form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const updatedData = processProxyHostFormData(formData);

        // Close the modal after form submission
        modal.style.display = "none";

        // Resolve the promise with the updated data
        resolve(updatedData);
      };
    } catch (error) {
      console.error("Error showing edit host modal:", error);
      showError(window.t(`Failed to edit proxy host: ${error.message}`));
      reject(error);
    }
  });
}
