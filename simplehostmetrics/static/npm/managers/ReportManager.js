// /static/npm/managers/ReportManager.js
import {
  makeRequest
}
from "../NPMUtils.js";
import { showError, t } from "../notificationHelper.js";

export async function loadReports() {
  try {
    const report = await makeRequest("/npm/api", "/reports/hosts");
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
