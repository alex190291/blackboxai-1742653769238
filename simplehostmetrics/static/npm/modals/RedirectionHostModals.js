// simplehostmetrics/static/npm/modals/RedirectionHostModals.js
import { 
  closeModals,
  populateCertificateDropdown, 
  handleCertificateCreation,
} from "../NPMUtils.js";
import { showSuccess, showError } from "../notificationHelper.js";
import { loadTemplate, processTemplate } from "../utils/TemplateLoader.js";

// Cache for loaded templates
let redirectionHostFormTemplate = null;
let redirectionHostModalTemplate = null;

// Load templates if not already loaded
async function ensureTemplatesLoaded() {
  if (!redirectionHostFormTemplate) {
    redirectionHostFormTemplate = await loadTemplate("/static/npm/templates/redirection-host-form.html");
  }
  
  if (!redirectionHostModalTemplate) {
    redirectionHostModalTemplate = await loadTemplate("/static/npm/templates/redirection-host-modal.html");
  }
}

// Generate form HTML for redirection host configuration
async function generateRedirectionHostFormHTML(host = null) {
  await ensureTemplatesLoaded();
  
  const isEdit = host !== null;
  const templateData = {
    idField: isEdit ? `<input type="hidden" name="host_id" value="${host.id}">` : "",
    domainNames: isEdit ? host.domain_names.join(", ") : "",
    
    // HTTP Code selection
    forward301Selected: isEdit && host.forward_http_code === 301 ? "selected" : "",
    forward302Selected: isEdit && host.forward_http_code === 302 ? "selected" : "",
    
    // Scheme selection
    forwardSchemeHttp: isEdit && host.forward_scheme === "http" ? "selected" : "",
    forwardSchemeHttps: isEdit && host.forward_scheme === "https" ? "selected" : "",
    
    // Other fields
    forwardDomainName: isEdit ? host.forward_domain_name : "",
    preservePath: isEdit && host.preserve_path ? "checked" : "",
    blockExploits: isEdit && host.block_exploits ? "checked" : "",
    sslForced: isEdit && host.ssl_forced ? "checked" : "",
    http2Support: isEdit && host.http2_support ? "checked" : "",
    hstsEnabled: isEdit && host.hsts_enabled ? "checked" : "",
    hstsSubdomains: isEdit && host.hsts_subdomains ? "checked" : "",
    submitBtnText: isEdit ? `\${window.t('Update Host')}` : `\${window.t('Add Host')}`
  };
  
  return processTemplate(redirectionHostFormTemplate, templateData);
}

// Process form data from both add and edit forms
function processRedirectionHostFormData(formData) {
  const certificate_id_raw = formData.get("certificate_id");
  let certificate_id;
  if (certificate_id_raw === "") {
    certificate_id = null;
  } else if (certificate_id_raw === "new_nodns") { // Remove "new_dns" || 
    certificate_id = "new";
  } else {
    certificate_id = parseInt(certificate_id_raw);
  }
  const access_list_id_raw = formData.get("access_list_id");
  const access_list_id =
    access_list_id_raw === "" ? null : parseInt(access_list_id_raw);

  // Conform to the expected API format
  return {
    domain_names: formData
      .get("domain_names")
      .split(",")
      .map((d) => d.trim()),
    forward_http_code: parseInt(formData.get("forward_http_code")),
    forward_scheme: formData.get("forward_scheme"),
    forward_domain_name: formData.get("forward_domain_name"),
    preserve_path: formData.get("preserve_path") === "on",
    certificate_id: certificate_id,
    ssl_forced: formData.get("ssl_forced") === "on",
    hsts_enabled: formData.get("hsts_enabled") === "on",
    hsts_subdomains: formData.get("hsts_subdomains") === "on",
    http2_support: formData.get("http2_support") === "on",
    block_exploits: formData.get("block_exploits") === "on",
    meta: {} // Required by API
  };
}

// Setup form for both add and edit
function setupRedirectionHostForm(form, isEdit = false) {
  // Attach modal close event listeners
  form.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", closeModals);
  });

  // Populate dropdown menus
  const certSelect = form.querySelector("#certificate_id");

  if (isEdit) {
    const hostId = form.querySelector("input[name='host_id']").value;
    populateCertificateDropdown(certSelect, hostId);
  } else {
    populateCertificateDropdown(certSelect);
  }
}

// Update the ensureModalExists function to use the template
async function ensureModalExists() {
  let modal = document.getElementById("redirectionHostModal");
  
  if (!modal) {
    await ensureTemplatesLoaded();
    
    modal = document.createElement("div");
    modal.id = "redirectionHostModal";
    modal.className = "modal";
    modal.innerHTML = redirectionHostModalTemplate;
    document.body.appendChild(modal);
    
    // Setup modal close button
    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    
    // Make sure the modal has a footer
    if (!modal.querySelector('.modal-footer')) {
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalContent.appendChild(modalFooter);
      }
    }
    
    // Give the browser a moment to add the element to the DOM
    setTimeout(() => {}, 0);
  }
  
  return modal;
}

// Update the beginning of populateAddRedirectionHostForm to be more robust
export async function populateAddRedirectionHostForm() {
  const modal = await ensureModalExists();
  
  // Look for the form in the modal-body
  let modalBody = modal.querySelector(".modal-body");
  if (!modalBody) {
    console.error("Modal body not found in redirection host modal");
    return;
  }
  
  // Make sure we can find the form
  let form = modalBody.querySelector("#addRedirectionHostForm");
  
  // If not found, try document-wide search
  if (!form) {
    form = document.getElementById("addRedirectionHostForm");
  }
  
  // If still not found, create it
  if (!form) {
    form = document.createElement("form");
    form.id = "addRedirectionHostForm";
    modalBody.appendChild(form);
  }
  
  // Set the modal title for adding a redirection host
  const titleElement = modal.querySelector(".modal-header h2");
  if (titleElement) {
    titleElement.textContent = window.t('Add Redirection Host');
  }
  
  // Get the template HTML without form-actions
  let formHtml = await generateRedirectionHostFormHTML();
  // Remove the form-actions div if it exists
  formHtml = formHtml.replace(/<div class="form-actions">[\s\S]*?<\/div>/, '');
  
  // Add the form HTML content
  form.innerHTML = formHtml;
  
  // Add buttons to the modal footer
  const modalFooter = modal.querySelector(".modal-footer");
  if (modalFooter) {
    modalFooter.innerHTML = `
      <button type="button" class="btn danger modal-close">${window.t('Cancel')}</button>
      <button type="submit" class="btn primary" form="addRedirectionHostForm">${window.t('Add Host')}</button>
    `;
    
    // Add event listener to the close button
    const closeBtn = modalFooter.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModals);
    }
  }
  
  setupRedirectionHostForm(form, false);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = modal.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = window.t('Please wait...');

    try {
      const formData = new FormData(form);
      const baseData = processRedirectionHostFormData(formData);
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

      // Create the redirection host
      const RedirectionHostManager = await import("../managers/RedirectionHostManager.js");
      await RedirectionHostManager.createRedirectionHost(baseData);
      document.getElementById("redirectionHostModal").style.display = "none";
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
export async function editRedirectionHostModal(hostIdOrObject) {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure modal exists
      const modal = await ensureModalExists();
      
      // Check if we received just an ID or a complete host object
      let host = hostIdOrObject;

      // If we just got an ID, fetch the complete host data
      if (
        typeof hostIdOrObject === "number" ||
        typeof hostIdOrObject === "string"
      ) {
        const response = await fetch(
          `/npm/api/nginx/redirection-hosts/${hostIdOrObject}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch host data: ${response.status}`);
        }
        host = await response.json();
      }

      // Look for the form in the modal-body
      let modalBody = modal.querySelector(".modal-body");
      if (!modalBody) {
        console.error("Modal body not found in redirection host modal");
        reject(new Error("Modal body not found"));
        return;
      }
      
      // Set the modal title for editing a redirection host
      const titleElement = modal.querySelector(".modal-header h2");
      if (titleElement) {
        titleElement.textContent = window.t('Edit Redirection Host');
      }
      
      // Get the form
      let form = modalBody.querySelector("#addRedirectionHostForm");
      
      // If not found, try document-wide search
      if (!form) {
        form = document.getElementById("addRedirectionHostForm");
      }
      
      // If still not found, create it
      if (!form) {
        form = document.createElement("form");
        form.id = "addRedirectionHostForm";
        modalBody.appendChild(form);
      }

      // Generate HTML content for the form - now async
      let formHtml = await generateRedirectionHostFormHTML(host);
      // Remove the form-actions div if it exists
      formHtml = formHtml.replace(/<div class="form-actions">[\s\S]*?<\/div>/, '');
      
      // Set the form HTML
      form.innerHTML = formHtml;
      
      // Add buttons to the modal footer
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button type="button" class="btn danger modal-close">${window.t('Cancel')}</button>
          <button type="submit" class="btn primary" form="addRedirectionHostForm">${window.t('Update Host')}</button>
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
      
      // Display the modal
      modal.style.display = "flex";
      
      // Setup form functionality
      setupRedirectionHostForm(form, true);

      // Populate certificate dropdown with existing values
      const certSelect = form.querySelector("#certificate_id");
      populateCertificateDropdown(certSelect, host.certificate_id || "");

      // Set up form submission handler
      form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const updatedData = processRedirectionHostFormData(formData);

        // Close the modal after form submission
        modal.style.display = "none";

        // Resolve the promise with the updated data
        resolve(updatedData);
      };
    } catch (error) {
      console.error("Error editing redirection host:", error);
      showError(window.t(`Failed to edit redirection host: ${error.message}`));
      reject(error);
    }
  });
}