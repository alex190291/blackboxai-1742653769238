// simplehostmetrics.refac/static/networkGraph.js

document.addEventListener("DOMContentLoaded", function () {
  // Get elements
  const gearBtn = document.getElementById("graphSettingsBtn");
  const modal = document.getElementById("graphSettingsModal");
  const closeBtn = document.getElementById("closeGraphModalBtn");
  const graphListContainer = document.getElementById("graphListContainer");
  const graphForm = document.getElementById("graphForm");
  const addInterfaceRowBtn = document.getElementById("addInterfaceRowBtn");
  const interfacesContainer = document.getElementById("interfacesContainer");

  // Debug: Check if all elements were found
  console.log("gearBtn:", gearBtn);
  console.log("modal:", modal);
  console.log("closeBtn:", closeBtn);
  console.log("graphListContainer:", graphListContainer);
  console.log("graphForm:", graphForm);
  console.log("addInterfaceRowBtn:", addInterfaceRowBtn);
  console.log("interfacesContainer:", interfacesContainer);

  if (!gearBtn || !modal) {
    console.error(window.t('Important elements missing. Please check HTML IDs.'));
    return;
  }

  // Open modal when clicking the gear button
  gearBtn.addEventListener("click", function () {
    console.log("Gear button clicked");
    modal.style.display = "flex";
    loadGraphList();
  });

  // Close modal when clicking the close button
  closeBtn.addEventListener("click", function () {
    console.log("Close button clicked");
    modal.style.display = "none";
  });

  // Load list of existing graphs
  function loadGraphList() {
    console.log("Loading graph list...");
    graphListContainer.innerHTML = "";
    fetch("/network_graph/config")
      .then((res) => res.json())
      .then((graphs) => {
        console.log("Received graph list:", graphs);
        if (graphs.length === 0) {
          graphListContainer.innerHTML = `<p>${window.t('No custom graphs available.')}</p>`;
        } else {
          graphs.forEach((graph) => {
            const div = document.createElement("div");
            div.className = "graph-item";
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.style.marginBottom = "0.5rem";
            div.innerHTML = `<strong>${graph.graph_name}</strong>`;
            // Delete Button
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = window.t('Delete');
            deleteBtn.className = "btn secondary";
            deleteBtn.addEventListener("click", function () {
              console.log("Delete clicked for graph ID:", graph.id);
              if (confirm(window.t('Delete this graph?'))) {
                fetch(`/network_graph/${graph.id}`, { method: "DELETE" })
                  .then(() => {
                    console.log(window.t('Graph deleted successfully'));
                    loadGraphList();
                  })
                  .catch((err) => console.error(window.t('Error deleting graph:'), err));
              }
            });
            div.appendChild(deleteBtn);
            graphListContainer.appendChild(div);
          });
        }
      })
      .catch((err) => console.error(window.t('Error loading graph list:'), err));
  }

  // Add new interface row
  addInterfaceRowBtn.addEventListener("click", function () {
    console.log("Add interface row button clicked");
    const row = document.createElement("div");
    row.className = "interface-row";
    row.innerHTML = `
      <input type="text" class="iface-name" placeholder="${window.t('Interface name')}" required />
      <input type="text" class="iface-label" placeholder="${window.t('Label')}" required />
      <input type="color" class="iface-color" value="#ffffff" />
      <button type="button" class="remove-interface-btn">${window.t('Remove')}</button>
    `;
    row.querySelector(".remove-interface-btn").addEventListener("click", function () {
      console.log("Removing interface row");
      row.remove();
    });
    interfacesContainer.appendChild(row);
  });

  // Submit form to add/edit a graph
  graphForm.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("Graph form submitted");
    const graphName = document.getElementById("graphName").value;
    const interfaceRows = interfacesContainer.querySelectorAll(".interface-row");
    const interfaces = [];
    interfaceRows.forEach((row) => {
      const ifaceName = row.querySelector(".iface-name").value;
      const ifaceLabel = row.querySelector(".iface-label").value;
      const ifaceColor = row.querySelector(".iface-color").value;
      if (ifaceName) {
        interfaces.push({ iface_name: ifaceName, label: ifaceLabel, color: ifaceColor });
      }
    });
    const graphData = { graph_name: graphName, interfaces: interfaces };
    console.log("Saving graph data:", graphData);
    fetch("/network_graph/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_network_graphs: [graphData] }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(window.t('Graph saved successfully:'), data);
        loadGraphList();
        graphForm.reset();
        interfacesContainer.innerHTML = "";
      })
      .catch((err) => console.error(window.t('Error saving graph:'), err));
  });
});
