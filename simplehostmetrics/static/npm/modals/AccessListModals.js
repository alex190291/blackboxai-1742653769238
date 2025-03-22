import { closeModals } from "../NPMUtils.js";
import { showError } from "../notificationHelper.js";
import * as AccessListManager from "../managers/AccessListManager.js";

export function populateAccessListForm(accessList = null) {
  console.log("Starting populateAccessListForm with data:", accessList ? JSON.stringify(accessList, null, 2) : "null");
  
  const form = document.getElementById("accessListForm");
  if (!form) {
    console.error("Access list form not found");
    showError(window.t("Form not found"));
    return;
  }

  // Update modal title based on whether this is an edit or create operation
  const modal = document.getElementById("accessListModal");
  const modalTitle = modal.querySelector(".modal-header h2");
  if (modalTitle) {
    modalTitle.textContent = accessList ? window.t('Edit Access List') : window.t('Add Access List');
  }

  // Make sure we have a valid access list object for edit mode
  if (accessList) {
    // Ensure all required properties exist
    accessList = {
      id: accessList.id,
      name: accessList.name || "",
      satisfy_any: typeof accessList.satisfy_any === 'boolean' ? accessList.satisfy_any : false,
      pass_auth: typeof accessList.pass_auth === 'boolean' ? accessList.pass_auth : false,
      clients: Array.isArray(accessList.clients) ? accessList.clients : [],
      items: Array.isArray(accessList.items) ? accessList.items : []
    };
    
    console.log("Normalized access list data:", JSON.stringify(accessList, null, 2));
  }

  form.innerHTML = generateAccessListFormHTML(accessList);
  
  // After generating HTML, check if form elements were created
  if (!form.querySelector("#name")) {
    console.error("Form elements not created correctly");
    showError(window.t("Failed to create form elements"));
    return;
  }
  
  setupAccessListForm(form, !!accessList);

  // Debug log of the populated form
  if (accessList) {
    console.log("Form after population:");
    console.log("Name input value:", form.querySelector("#name").value);
    console.log("Auth items rows:", form.querySelectorAll(".auth-item-row").length);
    console.log("Client rows:", form.querySelectorAll(".client-row").length);
  }
  
  // Add buttons to the modal footer
  const modalFooter = modal.querySelector(".modal-footer");
  if (modalFooter) {
    modalFooter.innerHTML = `
      <button type="button" class="btn danger modal-close">${window.t('Cancel')}</button>
      <button type="submit" class="btn primary" form="accessListForm">
        ${accessList ? window.t('Update') : window.t('Create')} ${window.t('Access List')}
      </button>
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
    submitBtn.textContent = window.t('Please wait');

    try {
      const formData = new FormData(form);
      const data = {
        name: formData.get("name"),
        satisfy_any: formData.get("satisfy_any") === "true",
        pass_auth: formData.has("pass_auth"),
        clients: getClientsFromForm(form),
        items: getAuthItemsFromForm(form)
      };

      console.log("Form data to submit:", JSON.stringify(data, null, 2));

      // Create or update the access list
      if (accessList) {
        await AccessListManager.updateAccessList(accessList.id, data);
      } else {
        await AccessListManager.createAccessList(data);
      }

      document.getElementById("accessListModal").style.display = "none";
    } catch (error) {
      console.error("Form submission error:", error);
      showError(window.t("Failed to submit access list form"));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = accessList ? window.t('Update') : window.t('Create');
    }
  };
}

function generateAccessListFormHTML(accessList = null) {
  const isEdit = accessList !== null;
  const name = isEdit ? accessList.name : "";
  const satisfyAny = isEdit ? accessList.satisfy_any : false;
  const passAuth = isEdit ? accessList.pass_auth : false;
  
  // In this simplified version, we don't try to extract clients and items from
  // the access list anymore - we just work with empty arrays
  const clients = [];
  const items = [];
  
  if (isEdit) {
    console.log("Processing access list for form generation:", JSON.stringify(accessList, null, 2));
  }

  return `
    <div class="form-group">
      <label for="name">${window.t('Name')}</label>
      <input type="text" id="name" name="name" value="${name}" required>
    </div>
    <div class="form-group">
      <label for="satisfy_any">${window.t('Authorization')}</label>
      <select id="satisfy_any" name="satisfy_any">
        <option value="true" ${satisfyAny ? "selected" : ""}>${window.t('Satisfy Any')}</option>
        <option value="false" ${!satisfyAny ? "selected" : ""}>${window.t('Satisfy All')}</option>
      </select>
      <small class="form-hint">${window.t('Satisfy Any: match either auth OR IP restrictions. Satisfy All: require both.')}</small>
    </div>
    
    <div class="form-group toggle">
      <label>
        <span class="toggle-switch">
          <input type="checkbox" id="pass_auth" name="pass_auth" ${passAuth ? "checked" : ""}>
          <span class="slider"></span>
        </span>
        <span class="toggle-label">${window.t('Pass Auth to Upstream')}</span>
      </label>
    </div>
    
    <div class="form-group">
      <label>${window.t('Basic Authentication')}</label>
      <div id="authItemsList">
        ${generateAuthItemsHTML(items)}
      </div>
      <button type="button" class="btn primary" onclick="addNewAuthItem()">${window.t('Add Authentication')}</button>
    </div>

    <div class="form-group">
      <label>${window.t('Client IP Restrictions')}</label>
      <div class="form-info-box">
        <i class="fas fa-info-circle"></i>
        ${window.t('Add IP addresses or CIDR ranges to restrict access by client IP. Example: 192.168.1.0/24 or 10.0.0.5')}
      </div>
      <div id="clientsList">
        ${generateClientsHTML(clients)}
      </div>
      <button type="button" class="btn primary" onclick="addNewClient()">${window.t('Add Client IP')}</button>
    </div>
  `;
}

function generateAuthItemsHTML(items = []) {
  if (!items || items.length === 0) {
    return generateAuthItemRow();
  }
  return items.map((item, index) => generateAuthItemRow(item, index)).join("");
}

function generateAuthItemRow(item = null, index = 0) {
  console.log(`Generating auth item row for index ${index}:`, item);
  
  // Make sure item has all expected properties
  const username = item && item.username ? item.username : "";
  // Include password placeholder for existing items
  const passwordRequired = item ? "" : "required";
  
  return `
    <div class="auth-item-row" data-index="${index}">
      <div class="form-group">
        <input type="text" name="auth_username_${index}" value="${username}" 
               placeholder="${window.t('Username')}" required>
      </div>
      <div class="form-group">
        <input type="password" name="auth_password_${index}" 
               placeholder="${window.t('Password')}" ${passwordRequired}>
      </div>
      <button type="button" class="btn danger" onclick="removeAuthItem(${index})">${window.t('Remove')}</button>
    </div>
  `;
}

function generateClientsHTML(clients = []) {
  if (!clients || clients.length === 0) {
    return generateClientRow();
  }
  return clients.map((client, index) => generateClientRow(client, index)).join("");
}

function generateClientRow(client = null, index = 0) {
  console.log(`Generating client row for index ${index}:`, JSON.stringify(client, null, 2));
  
  // Make sure client has all expected properties
  let address = "";
  let directive = "allow";
  
  if (client) {
    // Check various possible property names for the address
    if (typeof client.address === 'string') {
      address = client.address;
    } else if (typeof client.source === 'string') {
      address = client.source;
    } else if (typeof client.ip === 'string') {
      address = client.ip;
    } else if (typeof client.value === 'string') {
      address = client.value;
    }
    
    // Check directive property
    if (typeof client.directive === 'string') {
      directive = client.directive;
    } else if (typeof client.action === 'string') {
      directive = client.action;
    } else if (typeof client.type === 'string') {
      directive = client.type;
    }
  }
  
  console.log(`Client row ${index} address:`, address, "directive:", directive);

  return `
    <div class="client-row" data-index="${index}">
      <div class="form-group">
        <input type="text" name="client_address_${index}" value="${address}" 
               placeholder="${window.t('IP Address or CIDR Range')}" 
               title="${window.t('Examples: 192.168.1.1, 10.0.0.0/8, 2001:db8::/32')}"
               required>
        <small class="form-hint">${window.t('Examples: 192.168.1.1 or 10.0.0.0/24')}</small>
      </div>
      <div class="form-group">
        <select name="client_directive_${index}">
          <option value="allow" ${directive === "allow" ? "selected" : ""}>${window.t('Allow')}</option>
          <option value="deny" ${directive === "deny" ? "selected" : ""}>${window.t('Deny')}</option>
        </select>
      </div>
      <button type="button" class="btn danger" onclick="removeClient(${index})">${window.t('Remove')}</button>
    </div>
  `;
}

function setupAccessListForm(form, isEdit) {
  console.log("Setting up access list form, isEdit:", isEdit);
  
  // Set up addNewAuthItem and removeAuthItem functions globally
  window.addNewAuthItem = function() {
    const authItemsList = document.getElementById("authItemsList");
    if (!authItemsList) return;
    
    // Get the current highest index
    const currentItems = authItemsList.querySelectorAll(".auth-item-row");
    const newIndex = currentItems.length;
    
    // Create a new auth item row
    const newRow = document.createElement("div");
    newRow.className = "auth-item-row";
    newRow.dataset.index = newIndex;
    newRow.innerHTML = generateAuthItemRow(null, newIndex);
    authItemsList.appendChild(newRow);
  };
  
  window.removeAuthItem = function(index) {
    const row = document.querySelector(`.auth-item-row[data-index="${index}"]`);
    if (row) row.remove();
  };
  
  // Set up addNewClient and removeClient functions globally
  window.addNewClient = function() {
    const clientsList = document.getElementById("clientsList");
    if (!clientsList) return;
    
    // Get the current highest index
    const currentClients = clientsList.querySelectorAll(".client-row");
    const newIndex = currentClients.length;
    
    // Create a new client row
    const newRow = document.createElement("div");
    newRow.className = "client-row";
    newRow.dataset.index = newIndex;
    newRow.innerHTML = generateClientRow(null, newIndex);
    clientsList.appendChild(newRow);
  };
  
  window.removeClient = function(index) {
    const row = document.querySelector(`.client-row[data-index="${index}"]`);
    if (row) row.remove();
  };
  
  // Make sure we have at least one auth item and client row
  if (document.querySelectorAll(".auth-item-row").length === 0) {
    window.addNewAuthItem();
  }
  
  if (document.querySelectorAll(".client-row").length === 0) {
    window.addNewClient();
  }
}

function getClientsFromForm(form) {
  const clients = [];
  const rows = form.querySelectorAll(".client-row");
  
  console.log("Getting clients from form, found rows:", rows.length);
  
  rows.forEach((row) => {
    const index = row.dataset.index;
    const addressInput = form.querySelector(`[name="client_address_${index}"]`);
    const directiveInput = form.querySelector(`[name="client_directive_${index}"]`);
    
    if (!addressInput || !directiveInput) {
      console.warn(`Missing inputs for client row ${index}`);
      return;
    }
    
    const address = addressInput.value.trim();
    const directive = directiveInput.value;
    
    // Skip empty addresses
    if (!address) {
      return;
    }
    
    // Validate that the address is either a valid IP, CIDR, or domain
    const ipCidrRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/[0-9]{1,2})?$/;
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    
    if (!ipCidrRegex.test(address) && !domainRegex.test(address)) {
      // Highlight the input field to indicate it's invalid
      addressInput.classList.add("invalid");
      addressInput.title = window.t("Please enter a valid IP address, CIDR range, or domain name");
      
      // Still add to the array - the API will validate, and we don't want to lose user input
    } else {
      // Remove any error highlighting
      addressInput.classList.remove("invalid");
      addressInput.title = "";
    }
    
    clients.push({ address, directive });
    console.log(`Added client: ${address} (${directive})`);
  });

  return clients;
}

function getAuthItemsFromForm(form) {
  const items = [];
  const rows = form.querySelectorAll(".auth-item-row");
  
  console.log("Getting auth items from form, found rows:", rows.length);
  
  rows.forEach((row) => {
    const index = row.dataset.index;
    const usernameInput = form.querySelector(`[name="auth_username_${index}"]`);
    const passwordInput = form.querySelector(`[name="auth_password_${index}"]`);
    
    if (!usernameInput || !passwordInput) {
      console.warn(`Missing inputs for auth item row ${index}`);
      return;
    }
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (username) {
      items.push({ username, password });
      console.log(`Added auth item: ${username}`);
    }
  });

  return items;
}
