// simplehostmetrics.refac/static/stats.js

function updateStats() {
  // Use relative URL to avoid protocol issues with HTTPS - without trailing slash
  fetch("/stats")
    .then((r) => r.json())
    .then((data) => {
      window.cachedStats = data;
      const system = data.system || {};
      
      // Check if system detail view is visible
      const systemDetailViewVisible = document.getElementById("system-detail-view").style.display === "block";

      // CPU
      cpuOverlay.textContent = Math.round(system.cpu || 0) + "%";
      if (system.cpu_history && system.cpu_history.usage) {
        cpuChart.data.labels = system.cpu_history.time;
        cpuChart.data.datasets[0].data = system.cpu_history.usage;
        cpuChart.update();
      }
      if (system.cpu_details && system.cpu_details.history24h && systemDetailViewVisible) {
        cpuDetailChart.data.labels = system.cpu_details.history24h.map(
          (e) => e.time,
        );
        cpuDetailChart.data.datasets[0].data =
          system.cpu_details.history24h.map((e) => e.usage);
        cpuDetailChart.update();
      }

      // Memory
      if (system.memory_history) {
        memoryBasicChart.data.labels = system.memory_history.time;
        memoryBasicChart.data.datasets[0].data = system.memory_history.free;
        memoryBasicChart.data.datasets[1].data = system.memory_history.used.map(val => Math.abs(val));
        memoryBasicChart.data.datasets[2].data = system.memory_history.cached;
        if (system.memory && system.memory.total) {
          memoryBasicChart.options.scales.y.max = system.memory.total;
        }
        memoryBasicChart.update();
      }
      if (system.memory) {
        memoryOverlay.textContent = Math.abs(system.memory.used || 0).toFixed(2) + " GB";
      }
      if (system.memory_details && system.memory_details.history24h && systemDetailViewVisible) {
        memoryDetailChart.data.labels = system.memory_details.history24h.map(
          (e) => e.time,
        );
        memoryDetailChart.data.datasets[0].data =
          system.memory_details.history24h.map((e) => Math.abs(e.usage));
        memoryDetailChart.update();
      }

      // Disk
      if (system.disk_history_basic) {
        diskBasicChart.data.labels = system.disk_history_basic.time;
        diskBasicChart.data.datasets[0].data = system.disk_history_basic.used;
        diskBasicChart.data.datasets[1].data = system.disk_history_basic.free;
        if (system.disk && system.disk.total) {
          diskBasicChart.options.scales.y.max = system.disk.total;
        }
        diskBasicChart.update();
      }
      if (system.disk) {
        diskOverlay.textContent = (system.disk.used || 0).toFixed(2) + " GB";
      }
      if (system.disk_details && system.disk_details.history && systemDetailViewVisible) {
        diskHistoryChart.data.labels = system.disk_details.history.map(
          (e) => e.time,
        );
        diskHistoryChart.data.datasets[0].data =
          system.disk_details.history.map((e) => e.used);
        diskHistoryChart.update();
      }

      // Network
      if (data.network && data.network.interfaces) {
        const interfaces = data.network.interfaces;
        let mainIface = null;
        Object.keys(interfaces).forEach((k) => {
          if (/^e/.test(k) && !mainIface) mainIface = k;
        });
        if (!mainIface) {
          mainIface = Object.keys(interfaces)[0] || null;
        }
        if (
          mainIface &&
          interfaces[mainIface] &&
          interfaces[mainIface].length
        ) {
          const arr = interfaces[mainIface];
          networkChart.data.labels = arr.map((e) => e.time);
          networkChart.data.datasets[0].data = arr.map((e) => e.input);
          networkChart.data.datasets[1].data = arr.map((e) => e.output);
          networkChart.update();
        }
      }

      // Update Docker data
      updateDockerData();
    })
    .catch((err) => console.error("Error fetching stats:", err));
}

// Function to fetch Docker container data from the new endpoint
function updateDockerData() {
  fetch("/docker_stats/")
    .then((r) => r.json())
    .then((dockerData) => {
      const dockerDataEl = document.getElementById("docker-data");
      if (!dockerDataEl) {
        console.error("Docker data element not found in DOM");
        return;
      }
      
      // No data case
      if (!dockerData || dockerData.length === 0) {
        dockerDataEl.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">
              <div class="empty-state">
                <div class="icon"><i class="fas fa-info-circle"></i></div>
                <p>${window.t("No Docker containers found")}</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }
      
      // Format and display data
      dockerDataEl.innerHTML = dockerData
        .map((cont) => {
          let statusClass;
          const lowerStatus = (cont.status || "").toLowerCase();
          
          // Determine status color
          if (lowerStatus === "running") {
            statusClass = "status-green";
          } else if (lowerStatus === "created" || lowerStatus === "restarting") {
            statusClass = "status-yellow";
          } else {
            statusClass = "status-red";
          }
          
          // Format uptime
          const hrs = Math.floor(cont.uptime / 3600);
          const mins = Math.floor((cont.uptime % 3600) / 60);
          
          // Generate update button if needed
          let updateBtn = "";
          if (!cont.up_to_date && !/updating/i.test(cont.status)) {
            updateBtn = `<button class="btn primary small" onclick="updateContainer('${cont.name}')">↑ ${window.t('Update')}</button>`;
          }
          
          return `
            <tr>
              <td><div class="status-indicator ${statusClass}"></div></td>
              <td>${cont.name}</td>
              <td>${lowerStatus === "running" ? `${hrs}h ${mins}m` : "-"}</td>
              <td>${cont.image}</td>
              <td>${updateBtn}</td>
            </tr>
          `;
        })
        .join("");
    })
    .catch((err) => {
      console.error("Error fetching Docker stats:", err);
      
      // Show error message in table
      const dockerDataEl = document.getElementById("docker-data");
      if (dockerDataEl) {
        dockerDataEl.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">
              <div class="empty-state error">
                <div class="icon"><i class="fas fa-exclamation-triangle"></i></div>
                <p>${window.t("Error loading Docker containers")}</p>
              </div>
            </td>
          </tr>
        `;
      }
    });
}

// Updated polling interval from 500ms to 1000ms
setInterval(updateStats, 1000);
updateStats();
