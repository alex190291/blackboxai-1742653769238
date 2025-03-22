// /static/npm/managers/CertificateManager.js
import {
  makeRequest
} 
from "../NPMUtils.js";
import { showSuccess, showError, showInfo } from "../notificationHelper.js";
import * as Views from "../NPMViews.js";

// Helper to wrap a promise with a timeout.
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout exceeded")), timeoutMs),
    ),
  ]);
}

export async function renewCertificate(certId) {
  try {
    const progressMessage = showInfo(window.t("Renewing certificate..."), true);
    const result = await withTimeout(
      makeRequest("/npm/api", `/nginx/certificates/${certId}/renew`, "POST"),
      60000
    );
    // Remove the persistent notification
    if (progressMessage && progressMessage.classList) {
      progressMessage.classList.remove("show");
      setTimeout(() => progressMessage.remove(), 300);
    }
    showSuccess(window.t("Certificate renewal initiated"));
    await Views.loadCertificates();
  } catch (error) {
    showError(window.t("Failed to renew certificate"));
  }
}

export async function deleteCertificate(certId) {
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = deleteModal.querySelector(".cancel-delete");
  const closeBtn = deleteModal.querySelector(".modal-close-btn");
  const modalMessage = deleteModal.querySelector(".modal-body p");
  
  // Set the correct confirmation message
  if (modalMessage) {
    modalMessage.textContent = window.t("Are you sure you want to delete this certificate?");
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
    await makeRequest("/npm/api", `/nginx/certificates/${certId}`, "DELETE");
    showSuccess(window.t("Certificate deleted successfully"));
    await Views.loadCertificates();
  } catch (error) {
    showError(window.t("Failed to delete certificate"));
  }
}

export async function createCertificate(certData) {
  try {
    const result = await makeRequest(
      "/npm/api",
      "/nginx/certificates",
      "POST",
      certData
    );
    
    const certificateId = result.id;
    
    // For non-DNS challenge, show immediate success but still monitor briefly
    if (!certData.meta.dns_challenge) {
      showSuccess(window.t("Certificate request submitted successfully"));
      // Even for HTTP validation, monitor briefly to ensure completion
      monitorCertificateStatus(certificateId, 60, false);
    } 
    // For DNS challenge, show detailed message and start monitoring
    else if (certificateId) {
      showSuccess(window.t("Certificate request submitted (ID:") + " " + certificateId + "). DNS validation starting...");
      
      // Start monitoring in the background but don't await it
      monitorCertificateStatus(
        certificateId, 
        certData.meta.propagation_seconds || 30,
        true
      );
    }
    
    // Reload the certificates view
    await Views.loadCertificates();
    
    return certificateId;
  } catch (error) {
    console.error("Certificate creation error:", error);
    showError(window.t("Failed to create certificate:") + " " + (error.message || window.t("Unknown error")));
    throw error;
  }
}

/**
 * Monitor certificate status during validation
 * @param {number} certificateId - ID of the certificate to monitor
 * @param {number} maxWaitTime - Maximum time to wait in seconds
 * @param {boolean} showProgress - Whether to show progress indicator
 */
async function monitorCertificateStatus(certificateId, maxWaitTime = 30, showProgress = true) {
  // Convert to milliseconds and define interval
  const maxWaitMs = maxWaitTime * 1000;
  const checkIntervalMs = 5000; // Check every 5 seconds
  
  let progressIndicator = null;
  
  // Create progress indicator if requested
  if (showProgress) {
    progressIndicator = document.createElement('div');
    progressIndicator.className = 'dns-challenge-progress';
    progressIndicator.innerHTML = `
      <div class="progress-container">
        <div class="progress-bar"></div>
        <div class="progress-text">Validating certificate... (<span class="time-left">${maxWaitTime}</span>s remaining)</div>
      </div>
    `;
    document.body.appendChild(progressIndicator);
  }
  
  // Function to check if a certificate is actually valid or processing
  const isCertificateValid = (cert) => {
    // Check for certificate expiry date (indicates successful creation)
    if (cert.expires_on && cert.expires_on !== '1970-01-01 00:00:00') {
      return { valid: true, status: 'valid' };
    }
    
    // Check for Let's Encrypt certificate details in meta
    if (cert.meta?.letsencrypt_certificate?.cn) {
      return { valid: true, status: 'valid' };
    }
    
    // Check for processing status
    if (cert.meta?.processing === true || cert.meta?.status === 'processing') {
      return { valid: false, status: 'processing' };
    }
    
    // For custom certificates, check if files exist
    if (cert.provider === 'other' && cert.meta?.cert_files) {
      return { valid: true, status: 'valid' };
    }
    
    // Check if the certificate is marked as expired but may still be processing
    // (NPM sometimes shows expired before it's finished validating)
    if (cert.expires_on === '1970-01-01 00:00:00') {
      return { valid: false, status: 'processing' };
    }
    
    return { valid: false, status: 'unknown' };
  };
  
  // Start monitoring
  const startTime = Date.now();
  let checkCount = 0;
  let lastStatus = null;
  let successDetected = false;
  
  // Function to show a processing notification with auto-hide
  const showProcessingNotification = (message) => {
    const notification = showInfo(message, true);
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (notification) notification.remove();
    }, 30000);
    
    return notification;
  };
  
  // Find and remove any existing DNS challenge notifications
  const removeExistingNotifications = () => {
    // Look for notifications related to certificate creation/validation
    const notificationContainer = document.querySelector('.notifications');
    if (notificationContainer) {
      const notifications = notificationContainer.querySelectorAll('.notification');
      notifications.forEach(notification => {
        const text = notification.textContent || '';
        if (text.includes('Certificate is being issued') || 
            text.includes('DNS validation') || 
            text.includes('Monitoring certificate') ||
            text.includes('Certificate is processing')) {
          notification.remove();
        }
      });
    }
  };
  
  try {
    // Initial processing notification
    const processingNotification = showProcessingNotification(
      window.t("Certificate is being processed. This may take a few minutes...")
    );
    
    while (Date.now() - startTime < maxWaitMs) {
      // Update progress bar
      if (progressIndicator) {
        const elapsedMs = Date.now() - startTime;
        const progressPercent = Math.min(100, (elapsedMs / maxWaitMs) * 100);
        const timeLeft = Math.max(0, Math.ceil((maxWaitMs - elapsedMs) / 1000));
        
        progressIndicator.querySelector('.progress-bar').style.width = `${progressPercent}%`;
        progressIndicator.querySelector('.time-left').textContent = timeLeft;
      }
      
      // Check certificate status
      try {
        const certificate = await makeRequest("/npm/api", `/nginx/certificates/${certificateId}`);
        
        // Check if the certificate is valid or processing
        const certStatus = isCertificateValid(certificate);
        
        if (certStatus.valid) {
          successDetected = true;
          
          // Clean up UI
          if (progressIndicator) {
            progressIndicator.remove();
          }
          
          // Remove any existing notifications about certificate processing
          removeExistingNotifications();
          
          // Show success notification
          showSuccess(window.t("Certificate successfully issued and validated!"));
          
          // Update the view to show the new certificate
          await Views.loadCertificates();
          
          return true;
        } else if (certStatus.status === 'processing') {
          // Update the progress text
          if (progressIndicator) {
            progressIndicator.querySelector('.progress-text').textContent = 
              window.t("Certificate is processing... Please wait.");
          }
        }
        
        // Also check the certificates list to see if the certificate appears there correctly
        if (checkCount % 2 === 0) { // Every other check (to avoid too many requests)
          const allCerts = await makeRequest("/npm/api", "/nginx/certificates");
          const matchingCert = allCerts.find(cert => cert.id === certificateId);
          
          if (matchingCert) {
            const matchingStatus = isCertificateValid(matchingCert);
            if (matchingStatus.valid) {
              successDetected = true;
              
              // Clean up UI
              if (progressIndicator) {
                progressIndicator.remove();
              }
              
              // Remove any existing notifications about certificate processing
              removeExistingNotifications();
              
              // Show success notification
              showSuccess(window.t("Certificate successfully issued and validated!"));
              
              // Update the view to show the new certificate
              await Views.loadCertificates();
              
              return true;
            }
          }
        }
        
        // Check for specific error status
        if (certificate.meta?.error && certificate.meta.error !== lastStatus) {
          lastStatus = certificate.meta.error;
          if (progressIndicator) {
            progressIndicator.querySelector('.progress-text').textContent = 
              `${window.t("Status")}: ${certificate.meta.error}`;
          }
        }
      } catch (checkError) {
        console.warn("Error checking certificate status:", checkError);
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
      checkCount++;
    }
    
    // Timeout reached without success
    if (progressIndicator) {
      progressIndicator.remove();
    }
    
    // Remove any existing notifications about certificate processing
    removeExistingNotifications();
    
    // Show timeout message
    if (!successDetected) {
      showInfo(
        window.t("Certificate validation timeout. This doesn't mean the certificate failed - ") +
        window.t("it may still be processing. Check the certificate status in a few minutes.")
      );
    }
    
    return successDetected;
  } catch (error) {
    console.error("Error monitoring certificate status:", error);
    
    if (progressIndicator) {
      progressIndicator.remove();
    }
    
    // Remove any existing notifications about certificate processing
    removeExistingNotifications();
    
    return false;
  }
}

export async function updateCertificate(certId, certData) {
  try {
    await makeRequest(
      "/npm/api", 
      `/nginx/certificates/${certId}`, 
      "PUT", 
      certData
    );
    
    showSuccess(window.t("Certificate updated successfully"));
    await Views.loadCertificates();
  } catch (error) {
    showError(window.t("Failed to update certificate:") + " " + (error.message || window.t("Unknown error")));
    throw error;
  }
}

export async function validateCertificate(formData) {
  try {
    await makeRequest(
      "/npm/api",
      "/nginx/certificates/validate",
      "POST",
      formData,
    );
    showSuccess(window.t("Certificate validated successfully"));
  } catch (error) {
    showError(window.t("Certificate validation failed:") + " " + (error.message || window.t("Unknown error")));
  }
}

export async function downloadCertificate(certId) {
  try {
    const url = `/npm/api/nginx/certificates/${certId}/download`;
    window.location.href = url;
  } catch (error) {
    showError(window.t("Failed to download certificate"));
  }
}

export async function uploadCertificate(certId, formData) {
  try {
    // Create a new FormData object for the actual API call
    const apiFormData = new FormData();
    
    // Get the files from the form
    const certFile = formData.get("certificate");
    const keyFile = formData.get("certificate_key");
    
    if (!certFile || !keyFile) {
      throw new Error("Both certificate and key file are required");
    }
    
    // Add files to the API formData
    apiFormData.append("certificate", certFile);
    apiFormData.append("certificate_key", keyFile);
    
    // Use fetch directly since we're dealing with multipart/form-data
    const response = await fetch(`/npm/api/nginx/certificates/${certId}/upload`, {
      method: "POST",
      body: apiFormData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }
    
    showSuccess(window.t("Certificate uploaded successfully"));
    await Views.loadCertificates();
  } catch (error) {
    showError(window.t("Failed to upload certificate:") + " " + (error.message || window.t("Unknown error")));
    throw error;
  }
}

// New method to handle uploading a completely new certificate
export async function uploadNewCertificate(formData) {
  try {
    // First create the certificate metadata
    const niceName = formData.get("certificate_name");
    const domainNames = formData.get("domain_names")
      .split(",")
      .map(domain => domain.trim())
      .filter(domain => domain);
    
    if (!niceName || domainNames.length === 0) {
      throw new Error("Certificate name and at least one domain are required");
    }
    
    // Create the certificate first
    const certData = {
      provider: "other", 
      nice_name: niceName,
      domain_names: domainNames,
      meta: {}
    };
    
    console.log("Creating certificate with data:", certData);
    
    // Create the certificate
    const createResponse = await makeRequest(
      "/npm/api",
      "/nginx/certificates",
      "POST",
      certData
    );
    
    // Log the response to help debug
    console.log("Certificate creation response:", createResponse);
    
    // The response structure might vary, try to find the ID
    let newCertId;
    if (typeof createResponse === 'object') {
      if (createResponse.id) {
        newCertId = createResponse.id;
      } else if (createResponse.data && createResponse.data.id) {
        newCertId = createResponse.data.id;
      } else if (createResponse._id) {
        newCertId = createResponse._id;
      } else if (createResponse.certificate_id) {
        newCertId = createResponse.certificate_id;
      } else {
        // Try to find any property that looks like an ID
        for (const key in createResponse) {
          if (typeof createResponse[key] === 'number' && 
              (key === 'id' || key.endsWith('_id') || key.endsWith('Id'))) {
            newCertId = createResponse[key];
            break;
          }
        }
      }
      
      // If the response contains an error message, log it for debugging
      if (createResponse.error) {
        console.error("Server error:", createResponse.error);
      }
    }
    
    if (!newCertId) {
      // If there's an error but we still got a 201 response, we'll try to recover
      // by listing all certificates and creating a new one
      console.warn("No ID found in response, trying to recover by listing certificates");
      
      // Get current certificates to compare with after creating
      const beforeCerts = await makeRequest("/npm/api", "/nginx/certificates");
      
      // Try again with a slightly different name to avoid conflicts
      certData.nice_name = `${niceName}_${Math.floor(Math.random() * 1000)}`;
      await makeRequest("/npm/api", "/nginx/certificates", "POST", certData);
      
      // Get updated list of certificates
      const afterCerts = await makeRequest("/npm/api", "/nginx/certificates");
      
      // Find the new certificate by comparing before and after
      if (afterCerts.length > beforeCerts.length) {
        // Find certificates that exist in after but not before
        const newCerts = afterCerts.filter(after => 
          !beforeCerts.some(before => before.id === after.id)
        );
        
        if (newCerts.length > 0) {
          // Use the first new certificate we find
          newCertId = newCerts[0].id;
          console.log("Recovered certificate ID:", newCertId);
        }
      }
      
      if (!newCertId) {
        throw new Error("Failed to get ID from new certificate");
      }
    }
    
    // Now upload the certificate files to the newly created certificate
    await uploadCertificate(newCertId, formData);
    
    showSuccess(window.t("Certificate created and uploaded successfully"));
    await Views.loadCertificates();
    
    return newCertId;
  } catch (error) {
    console.error("Error in uploadNewCertificate:", error);
    showError(window.t("Failed to upload new certificate:") + " " + (error.message || window.t("Unknown error")));
    throw error;
  }
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
}
