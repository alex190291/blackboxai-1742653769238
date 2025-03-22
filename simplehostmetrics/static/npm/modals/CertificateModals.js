// /static/npm/modals/CertificateModals.js
import { closeModals, makeRequest } from "../NPMUtils.js";
import { showError, showSuccess, showInfo } from "../notificationHelper.js";
import * as Views from "../NPMViews.js";

export function populateCertificateForm(certificate = null) {
  const form = document.getElementById("certificateForm");
  if (!form) {
    console.error("Certificate form not found");
    return;
  }

  // Get the certificate form HTML
  let formHtml = generateCertificateFormHTML(certificate);
  
  // Remove the form-actions div if it exists
  formHtml = formHtml.replace(/<div class="form-actions">[\s\S]*?<\/div>/, '');
  
  // Set the form HTML
  form.innerHTML = formHtml;
  
  // Add buttons to the modal footer
  const modal = document.getElementById("certificateModal");
  if (modal) {
    const modalFooter = modal.querySelector(".modal-footer");
    if (modalFooter) {
      const isEdit = certificate !== null;
      modalFooter.innerHTML = `
        <button type="button" class="btn danger modal-close">${window.t('Cancel')}</button>
        <button type="submit" class="btn primary" form="certificateForm">${isEdit ? window.t('Update Certificate') : window.t('Create Certificate')}</button>
      `;
      
      // Add event listener to the close button
      const closeBtn = modalFooter.querySelector(".modal-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", closeModals);
      }
    }
  }
  
  setupCertificateForm(form, !!certificate);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = document.querySelector('button[form="certificateForm"][type="submit"]');
    if (!submitBtn) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = window.t("Please wait...");

    try {
      const formData = new FormData(form);
      
      // Get initial certificates list to compare later
      let initialCerts = [];
      try {
        initialCerts = await makeRequest("/npm/api", "/nginx/certificates");
      } catch (error) {
        console.warn(window.t("Couldn't get initial certificates list:"), error);
      }
      
      // Prepare the certificate data for API
      const data = {
        provider: formData.get("provider"),
        nice_name: formData.get("nice_name"),
        domain_names: formData.get("domain_names").split(",").map(d => d.trim()),
        meta: {
          letsencrypt_agree: true,
          letsencrypt_email: formData.get("email") || "admin@example.com"
        }
      };
      
      // Handle DNS challenge if enabled
      if (formData.get("dns_challenge") === "on") {
        data.meta.dns_challenge = true;
        const dnsProvider = formData.get("dns_provider");
        data.meta.dns_provider = dnsProvider;
        
        // Add credentials in the format required by the API
        const credentials = formData.get("dns_credentials");
        if (credentials) {
          data.meta.dns_provider_credentials = credentials;
          
          // Set propagation seconds if specified
          const propagationSeconds = formData.get("propagation_seconds");
          if (propagationSeconds) {
            data.meta.propagation_seconds = parseInt(propagationSeconds, 10);
          }
        }
      }
      
      // If it's a custom JSON in meta field, parse and merge it
      try {
        const metaJSON = formData.get("meta");
        if (metaJSON && metaJSON !== "{}") {
          const customMeta = JSON.parse(metaJSON);
          data.meta = {...data.meta, ...customMeta};
        }
      } catch (jsonError) {
        showError(window.t("Invalid JSON in meta field"));
        throw jsonError;
      }

      // Import dynamically to avoid circular dependencies
      const CertificateManager = await import("../managers/CertificateManager.js");

      // Create or update certificate
      let certId;
      if (certificate) {
        // Update existing certificate
        await CertificateManager.updateCertificate(certificate.id, data);
      } else {
        try {
          // Create new certificate
          certId = await CertificateManager.createCertificate(data);
          
          // For DNS challenges, check for success more aggressively
          if (data.meta.dns_challenge) {
            // Close modal right away to prevent UI interference
            closeModals();
            
            // Show a persistent notification indicating DNS validation is in progress
            const dnsNotification = showInfo(window.t("Certificate is being issued. DNS validation may take a few minutes..."), true);
            
            // Auto-hide notification after 30 seconds, but continue monitoring in background
            setTimeout(() => {
              if (dnsNotification) dnsNotification.remove();
            }, 30000);
            
            // Start a separate client-side monitoring for UI feedback
            monitorCertificateCreation(certId, initialCerts);
            return; // Exit early since we're handling this separately
          }
        } catch (error) {
          // Check if it's a 502 error (bad gateway) - this can happen during DNS validation
          // but might still be processing correctly on the server
          if (error.message && error.message.includes("502")) {
            console.warn("Got 502 error during certificate creation, but the request might still be processing");
            closeModals();
            showInfo(window.t("Certificate request submitted, but received a partial response. Check status in a few minutes."), true);
            setTimeout(() => Views.loadCertificates(), 5000); // Reload after 5 seconds
            return;
          } else {
            // Re-throw for other errors
            throw error;
          }
        }
      }
      
      // Close modal after successful creation/update
      closeModals();
      
    } catch (error) {
      console.error(window.t("Form submission error:"), error);
      showError(window.t("An error occurred:") + " " + error.message);
      
      // Reset button state on error
      submitBtn.disabled = false;
      submitBtn.textContent = certificate ? window.t("Update") : window.t("Create");
    }
  };
}

/**
 * Monitor for certificate creation by comparing certificate lists
 * @param {number} expectedCertId - ID of the certificate we're expecting
 * @param {Array} initialCerts - Initial list of certificates before creation
 */
async function monitorCertificateCreation(expectedCertId, initialCerts) {
  // Show a persistent notification that we're monitoring
  const notification = showInfo(window.t("Certificate is being issued. DNS validation may take a few minutes..."), true);
  
  // Auto-hide notification after 30 seconds, but continue monitoring in background
  setTimeout(() => {
    if (notification) notification.remove();
  }, 30000);
  
  // Maximum time to wait before giving up
  const maxWaitTime = 3 * 60 * 1000; // 3 minutes
  const startTime = Date.now();
  const checkInterval = 5000; // 5 seconds
  
  // Keep checking for certificate creation
  const checkForCertificate = async () => {
    try {
      // Stop if we've been trying too long
      if (Date.now() - startTime > maxWaitTime) {
        if (notification) notification.remove();
        return;
      }
      
      // Get current certificates list
      const currentCerts = await makeRequest("/npm/api", "/nginx/certificates");
      
      // Check if our certificate exists and is valid
      const ourCert = currentCerts.find(cert => cert.id === expectedCertId);
      if (ourCert) {
        // Check if certificate is valid (has an expiry date or is not marked as expired)
        if (ourCert.expires_on && ourCert.expires_on !== '1970-01-01 00:00:00') {
          // We found our certificate and it has a valid expiry date
          if (notification) notification.remove();
          showSuccess(window.t("Certificate created successfully!"));
          return;
        }
        
        // Also check meta data if available
        if (ourCert.meta && ourCert.meta.letsencrypt_certificate && ourCert.meta.letsencrypt_certificate.cn) {
          // Certificate has valid Let's Encrypt details
          if (notification) notification.remove();
          showSuccess(window.t("Certificate created successfully!"));
          return;
        }
      }
      
      // Check if any new certificates appeared that match our domains
      // This covers the case where the ID might have changed
      if (initialCerts && initialCerts.length > 0) {
        const newCerts = currentCerts.filter(cert => 
          !initialCerts.some(oldCert => oldCert.id === cert.id));
          
        if (newCerts.length > 0) {
          // Find any new certificates that are valid
          const validNewCert = newCerts.find(cert => 
            cert.expires_on && cert.expires_on !== '1970-01-01 00:00:00');
            
          if (validNewCert) {
            // Found a valid new certificate
            if (notification) notification.remove();
            showSuccess(window.t("New certificate detected!"));
            return;
          }
        }
      }
      
      // Schedule next check
      setTimeout(checkForCertificate, checkInterval);
    } catch (error) {
      console.error(window.t("Error monitoring certificate creation:"), error);
      // Always remove the notification on error to avoid persistent notifications
      if (notification) notification.remove();
    }
  };
  
  // Start the monitoring process
  checkForCertificate();
}

// Modified to not require a specific certId for uploading new certificates
export function showUploadCertificateModal(certId = null) {
  const modalHTML = `
    <div id="uploadCertificateModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>${certId ? window.t('Replace Certificate') : window.t('Upload Certificate')}</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <form id="uploadCertificateForm">
          <div class="form-content" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
            ${!certId ? `
            <div class="form-group">
              <label for="certificate_name">${window.t('Certificate Name')}</label>
              <input type="text" id="certificate_name" name="certificate_name" required placeholder="my.domain.com">
            </div>
            <div class="form-group">
              <label for="domain_names">${window.t('Domain Names')} (${window.t('comma-separated')})</label>
              <input type="text" id="domain_names" name="domain_names" required placeholder="domain.com, www.domain.com">
            </div>
            ` : ''}
            <div class="form-group">
              <label for="certificate">${window.t('Certificate File')}</label>
              <input type="file" id="certificate" name="certificate" required accept=".crt,.pem,.cert">
            </div>
            <div class="form-group">
              <label for="certificate_key">${window.t('Certificate Key File')}</label>
              <input type="file" id="certificate_key" name="certificate_key" required accept=".key,.pem">
            </div>
            <input type="hidden" name="certId" value="${certId || ''}">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn danger modal-close">${window.t('Cancel')}</button>
            <button type="submit" class="btn primary">${window.t('Upload')}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Create and add modal if it doesn't exist
  let modal = document.getElementById("uploadCertificateModal");
  if (modal) {
    document.body.removeChild(modal);
  }
  
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = modalHTML;
  modal = tempDiv.firstElementChild;
  document.body.appendChild(modal);
  modal.style.display = "flex";

  // Setup form submit and close button
  const form = document.getElementById("uploadCertificateForm");
  const closeBtn = modal.querySelector(".modal-close");
  const closeXBtn = modal.querySelector(".modal-close-btn");
  
  closeBtn.addEventListener("click", () => {
    closeModals();
  });
  
  closeXBtn.addEventListener("click", () => {
    closeModals();
  });
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = window.t("Uploading...");
    
    try {
      const formData = new FormData(form);
      const CertificateManager = await import("../managers/CertificateManager.js");
      
      const specificCertId = formData.get("certId");
      
      if (specificCertId) {
        // Upload to existing certificate
        await CertificateManager.uploadCertificate(specificCertId, formData);
        showSuccess(window.t("Certificate updated successfully!"));
      } else {
        // Create new certificate with uploaded files
        await CertificateManager.uploadNewCertificate(formData);
        showSuccess(window.t("Certificate uploaded successfully!"));
      }
      
      closeModals();
    } catch (error) {
      console.error(window.t("Error uploading certificate:"), error);
      showError(window.t("Failed to upload certificate"));
      submitBtn.disabled = false;
      submitBtn.textContent = window.t("Upload");
    }
  };
}

function generateCertificateFormHTML(certificate = null) {
  const isEdit = certificate !== null;
  const provider = isEdit ? certificate.provider : "letsencrypt";
  const niceName = isEdit ? certificate.nice_name : "";
  const domainNames = isEdit ? certificate.domain_names.join(", ") : "";
  const email = isEdit && certificate.meta ? certificate.meta.letsencrypt_email || "" : "";
  const dnsChallenge = isEdit && certificate.meta && certificate.meta.dns_challenge ? true : false;
  const dnsProvider = isEdit && certificate.meta ? certificate.meta.dns_provider || "" : "";
  const dnsCredentials = isEdit && certificate.meta ? certificate.meta.dns_provider_credentials || "" : "";
  const propagationSeconds = isEdit && certificate.meta ? certificate.meta.propagation_seconds || "30" : "30";
  const meta = isEdit ? JSON.stringify(certificate.meta || {}, null, 2) : "{}";

  return `
    <div class="form-content" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
      <div class="form-group">
        <label for="provider">${window.t('Provider')}</label>
        <select id="provider" name="provider" required>
          <option value="letsencrypt" ${provider === "letsencrypt" ? "selected" : ""}>Let's Encrypt</option>
          <option value="other" ${provider === "other" ? "selected" : ""}>${window.t('Other')}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="nice_name">${window.t('Certificate Name')}</label>
        <input type="text" id="nice_name" name="nice_name" value="${niceName}" placeholder="my.domain.com">
      </div>
      <div class="form-group">
        <label for="domain_names">${window.t('Domain Names (comma-separated)')}</label>
        <input type="text" id="domain_names" name="domain_names" value="${domainNames}" required placeholder="domain.com, www.domain.com">
      </div>
      <div class="form-group">
        <label for="email">${window.t('Email Address (for Let\'s Encrypt)')}</label>
        <input type="email" id="email" name="email" value="${email}" placeholder="admin@example.com">
      </div>
      
      <div class="form-group toggle">
        <label>
          <span class="toggle-switch">
            <input type="checkbox" id="dns_challenge" name="dns_challenge" ${dnsChallenge ? "checked" : ""}>
            <span class="slider"></span>
          </span>
          <span class="toggle-label">${window.t('Enable DNS Challenge')}</span>
          <span class="help-text">(${window.t('Use DNS validation instead of HTTP validation')})</span>
        </label>
      </div>
      
      <div id="dns_challenge_settings" style="display: ${dnsChallenge ? "block" : "none"}">
        <div class="dns-challenge-info alert alert-info">
          <p><strong>${window.t('DNS Challenge Information')}:</strong></p>
          <p>${window.t('DNS challenge allows you to validate domain ownership via DNS records when HTTP validation is not possible.')}</p>
          <p>${window.t('You\'ll need access to configure DNS records for your domain, either manually or via a supported DNS provider API.')}</p>
        </div>
        
        <div class="form-group">
          <label for="dns_provider">${window.t('DNS Provider')}</label>
          <select id="dns_provider" name="dns_provider">
            <option value="">${window.t('Select Provider')}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="dns_credentials">${window.t('Provider Credentials')}</label>
          <textarea id="dns_credentials" name="dns_credentials" rows="6" placeholder="${window.t('Enter provider-specific credentials')}">${dnsCredentials}</textarea>
          <p class="help-text">${window.t('Format depends on provider. Will be automatically populated based on selection.')}</p>
        </div>
        <div class="form-group">
          <label for="propagation_seconds">${window.t('Propagation Wait Time')} (${window.t('seconds')})</label>
          <input type="number" id="propagation_seconds" name="propagation_seconds" value="${propagationSeconds}" min="30" step="1">
          <p class="help-text">${window.t('DNS propagation can take time. Increase this value if validation fails.')}</p>
        </div>
      </div>
      
      <div class="form-group">
        <label for="meta">${window.t('Advanced Settings (JSON)')}</label>
        <textarea id="meta" name="meta" placeholder='{}'>${meta}</textarea>
        <p class="help-text">${window.t('Only modify if you know what you\'re doing.')}</p>
      </div>
    </div>
  `;
}

function setupCertificateForm(form) {
  // Get DNS providers for dropdown
  loadDnsProviders().then(providers => {
    const select = form.querySelector("#dns_provider");
    if (select) {
      // Clear existing options except the first one
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Add options for each provider
      Object.keys(providers).forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = providers[key].name;
        select.appendChild(option);
      });
      
      // Set selected if value exists
      const currentValue = select.getAttribute('data-selected');
      if (currentValue) {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === currentValue) {
            select.selectedIndex = i;
            break;
          }
        }
      }
      
      // Add change handler to populate credentials template
      select.addEventListener('change', () => {
        const selectedProvider = select.value;
        if (selectedProvider && providers[selectedProvider]) {
          const credentialsTemplate = providers[selectedProvider].credentials;
          form.querySelector("#dns_credentials").value = credentialsTemplate;
        }
      });
      
      // Trigger change to populate template if a provider is already selected
      if (select.value) {
        select.dispatchEvent(new Event('change'));
      }
    }
  }).catch(err => {
    console.error('Failed to load DNS providers:', err);
  });
  
  // Show/Hide DNS challenge settings based on toggle
  const dnsChallengeCheckbox = form.querySelector("#dns_challenge");
  dnsChallengeCheckbox.addEventListener("change", () => {
    const dnsSettings = form.querySelector("#dns_challenge_settings");
    if (dnsChallengeCheckbox.checked) {
      dnsSettings.style.display = "block";
    } else {
      dnsSettings.style.display = "none";
    }
  });
}

// Load DNS providers from the JSON file
async function loadDnsProviders() {
  try {
    const response = await fetch("/static/npm/json/certbot-dns-plugins.json");
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading DNS providers:', error);
    return {};
  }
}

/**
 * Shows a modal for uploading a new certificate
 * @returns {Promise<FormData>} FormData object with certificate details
 */
export function showUploadNewCertificateModal() {
  return new Promise((resolve, reject) => {
    // Use the existing upload certificate modal but without a certId
    showUploadCertificateModal(null);
    
    // Find the form and modify its submission handler
    const form = document.getElementById("uploadCertificateForm");
    if (!form) {
      reject(new Error("Certificate upload form not found"));
      return;
    }
    
    // Override the existing submit handler
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = window.t("Processing...");
      
      try {
        // Validate required fields
        const certificateName = form.querySelector("#certificate_name").value;
        const domainNames = form.querySelector("#domain_names").value;
        const certificateFile = form.querySelector("#certificate").files[0];
        const keyFile = form.querySelector("#certificate_key").files[0];
        
        if (!certificateName || !domainNames || !certificateFile || !keyFile) {
          throw new Error("All fields are required");
        }
        
        // Create FormData to return
        const formData = new FormData(form);
        
        // Close the modal
        closeModals();
        
        // Resolve with the form data
        resolve(formData);
      } catch (error) {
        console.error("Error uploading certificate:", error);
        showError(window.t("Failed to upload certificate: ") + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = window.t("Upload");
        reject(error);
      }
    };
    
    // Also handle the close button to reject the promise
    const closeBtn = document.querySelector("#uploadCertificateModal .modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        reject(new Error("Upload cancelled by user"));
      });
    }
  });
}
