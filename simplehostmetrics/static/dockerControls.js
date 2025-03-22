// static/dockerControls.js

// Get CSRF token from meta tag
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]') ?
         document.querySelector('meta[name="csrf-token"]').getAttribute('content') : '';
}

let checkAllInterval = null;

function updateButtonContent() {
  const btn = document.getElementById("checkAllBtn");
  if (!btn) return;
  
  // Set the button content to show both icon and text
  btn.innerHTML = `↻ ${window.t ? window.t('Check for updates') : 'Check for updates'}`;
}

// Initialize button content
(function() {
  // Run immediately if possible
  if (document.readyState !== 'loading') {
    updateButtonContent();
  }
  
  // Set up event listeners for various page load stages
  document.addEventListener('DOMContentLoaded', updateButtonContent);
  window.addEventListener('load', updateButtonContent);
})();

function checkAllUpdates() {
  const btn = document.getElementById("checkAllBtn");
  btn.disabled = true;
  btn.innerHTML = `↻ ${window.t ? window.t('Checking for updates...') : 'Checking for updates...'} <div class="spinner"></div>`;
  fetch("/container/check_all", { 
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken()
    }
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.status !== "already_in_progress") {
        checkAllInterval = setInterval(pollCheckAllStatus, 500);
      } else {
        updateButtonContent();
        btn.disabled = false;
      }
    })
    .catch((err) => {
      console.error("Error starting check_all:", err);
      btn.disabled = false;
      updateButtonContent();
    });
}

function pollCheckAllStatus() {
  const btn = document.getElementById("checkAllBtn");
  fetch("/container/check_all_status")
    .then((r) => r.json())
    .then((st) => {
      if (st.in_progress) {
        // Show progress with icon and text
        btn.innerHTML = `↻ ${window.t ? window.t('Checking for updates...') : 'Checking for updates...'} <div class="spinner"></div> ${st.checked}/${st.total}`;
      } else {
        updateButtonContent();
        btn.disabled = false;
        clearInterval(checkAllInterval);
        checkAllInterval = null;
        updateStats();
      }
    })
    .catch((err) => console.error("Error polling check_all status:", err));
}

function updateContainer(containerName) {
  const btn = event.target;
  if (btn.innerHTML.toLowerCase().includes(window.t('failed'))) {
    btn.style.backgroundColor = "var(--primary)";
  }
  btn.innerHTML = `${window.t('Initializing')}... <div class="spinner"></div>`;
  btn.disabled = true;
  fetch(`/container/update/${containerName}`, { 
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken()
    }
  })
    .then((r) => r.json())
    .then(() => pollContainerUpdate(containerName, btn))
    .catch((err) => console.error("Error updating container:", err));
}

function pollContainerUpdate(containerName, button) {
  const pollInt = setInterval(() => {
    fetch(`/container/update_status/${containerName}`)
      .then((r) => r.json())
      .then((st) => {
        if (st.in_progress && !st.error) {
          if (!button.dataset.startedUpdate) {
            button.style.backgroundColor = "yellow";
            button.dataset.startedUpdate = "true";
          }
          button.innerHTML = `${st.phase} <div class="spinner"></div>`;
          return;
        }
        clearInterval(pollInt);
        if (st.error) {
          button.style.backgroundColor = "red";
          button.innerHTML = window.t('Update failed');
          button.disabled = false;
        } else if (st.success) {
          button.style.backgroundColor = "#33cc33";
          button.innerHTML = window.t('Updated successfully');
          button.disabled = true;
          setTimeout(() => {
            button.style.backgroundColor = "var(--primary)";
            button.style.display = "none";
            button.disabled = false;
          }, 10000);
        }
        updateStats();
      })
      .catch((err) => {
        console.error("Error polling update status:", err);
        clearInterval(pollInt);
      });
  }, 1000);
}

// Update translations when language changes
window.updateDockerTranslations = function() {
    updateButtonContent();
};
