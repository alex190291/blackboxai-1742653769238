/**
 * templates.js - HTML templates for NPM components
 */

import { t } from "./notificationHelper.js";

// Template for proxy host card
export const proxyHostCard = (host) => `
<div class="card proxy-host-card" data-id="${host.id}">
  <div class="card-header">
    <h3>${host.domain_names[0]}</h3>
    <div class="card-status ${host.enabled ? 'enabled' : 'disabled'}">
      ${host.enabled ? window.t('Enabled') : window.t('Disabled')}
    </div>
  </div>
  <div class="card-content">
    <p><strong>${window.t('Forward Hostname')}:</strong> ${host.forward_host}</p>
    <p><strong>${window.t('Forward Port')}:</strong> ${host.forward_port}</p>
    <p><strong>${window.t('Certificate')}:</strong> ${host.certificate?.nice_name || window.t('None')}</p>
  </div>
  <div class="card-actions">
    <button class="btn primary edit-host" data-id="${host.id}">
      <i class="fas fa-edit"></i> ${window.t('Edit')}
    </button>
    <button class="btn ${host.enabled ? 'warning' : 'success'} toggle-host" data-id="${host.id}" data-enabled="${host.enabled}">
      <i class="fas fa-${host.enabled ? 'pause' : 'play'}"></i> ${host.enabled ? window.t('Disable') : window.t('Enable')}
    </button>
    <button class="btn danger delete-host" data-id="${host.id}">
      <i class="fas fa-trash"></i> ${window.t('Delete')}
    </button>
  </div>
</div>
`;

// Template for redirection host card
export const redirectionHostCard = (host) => `
<div class="card redirection-host-card" data-id="${host.id}">
  <div class="card-header">
    <h3>${host.domain_names[0]}</h3>
    <div class="card-status ${host.enabled ? 'enabled' : 'disabled'}">
      ${host.enabled ? window.t('Enabled') : window.t('Disabled')}
    </div>
  </div>
  <div class="card-content">
    <p><strong>${window.t('Forward URL')}:</strong> ${host.forward_url}</p>
    <p><strong>${window.t('Certificate')}:</strong> ${host.certificate?.nice_name || window.t('None')}</p>
  </div>
  <div class="card-actions">
    <button class="btn primary edit-redirection" data-id="${host.id}">
      <i class="fas fa-edit"></i> ${window.t('Edit')}
    </button>
    <button class="btn ${host.enabled ? 'warning' : 'success'} toggle-redirection" data-id="${host.id}" data-enabled="${host.enabled}">
      <i class="fas fa-${host.enabled ? 'pause' : 'play'}"></i> ${host.enabled ? window.t('Disable') : window.t('Enable')}
    </button>
    <button class="btn danger delete-redirection" data-id="${host.id}">
      <i class="fas fa-trash"></i> ${window.t('Delete')}
    </button>
  </div>
</div>
`;

// Template for access list card
export const accessListCard = (list) => `
<div class="card access-list-card" data-id="${list.id}">
  <div class="card-header">
    <h3>${list.name}</h3>
    <div class="card-label">
      ${list.clients.length} ${window.t('Clients')}
    </div>
  </div>
  <div class="card-content">
    <p>${list.items && list.items.length ? window.t('Items') + ': ' + list.items.length : window.t('No items')}</p>
  </div>
  <div class="card-actions">
    <button class="btn primary edit-access-list" data-id="${list.id}">
      <i class="fas fa-edit"></i> ${window.t('Edit')}
    </button>
    <button class="btn danger delete-access-list" data-id="${list.id}">
      <i class="fas fa-trash"></i> ${window.t('Delete')}
    </button>
  </div>
</div>
`;

// Template for certificate card
export const certificateCard = (cert) => {
  const expired = new Date(cert.expires_at) < new Date();
  const expiringSoon = !expired && (new Date(cert.expires_at) - new Date()) < 604800000; // 7 days
  const statusClass = expired ? 'danger' : (expiringSoon ? 'warning' : 'success');
  
  return `
<div class="card certificate-card" data-id="${cert.id}">
  <div class="card-header">
    <h3>${cert.nice_name}</h3>
    <div class="card-status ${statusClass}">
      ${expired ? window.t('Expired') : (expiringSoon ? window.t('Expiring Soon') : window.t('Valid'))}
    </div>
  </div>
  <div class="card-content">
    <p><strong>${window.t('Provider')}:</strong> ${cert.provider}</p>
    <p><strong>${window.t('Expires')}:</strong> ${new Date(cert.expires_at).toLocaleDateString()}</p>
  </div>
  <div class="card-actions">
    ${!expired && cert.provider === 'letsencrypt' ? `
    <button class="btn primary renew-certificate" data-id="${cert.id}">
      <i class="fas fa-sync"></i> ${window.t('Renew')}
    </button>
    ` : ''}
    <button class="btn success download-certificate" data-id="${cert.id}">
      <i class="fas fa-download"></i> ${window.t('Download')}
    </button>
    <button class="btn danger delete-certificate" data-id="${cert.id}">
      <i class="fas fa-trash"></i> ${window.t('Delete')}
    </button>
  </div>
</div>
`;
};

// Template for audit log entry
export const auditLogEntry = (entry) => `
<tr>
  <td>${new Date(entry.created_at).toLocaleString()}</td>
  <td>${entry.user_email || window.t('System')}</td>
  <td>${entry.action}</td>
  <td>${entry.details || ''}</td>
</tr>
`;

// Export any templates needed by the NPM modules 