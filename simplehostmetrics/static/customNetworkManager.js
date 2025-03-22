// static/customNetworkManager.js

/**
 * Custom Network Graph Manager
 * 
 * This module handles the creation, display, and management of custom network graphs
 * that show network traffic for specific interfaces.
 */

// Get CSRF token from meta tag
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]') ?
         document.querySelector('meta[name="csrf-token"]').getAttribute('content') : '';
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const modalOverlay = document.getElementById('customGraphModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const addInterfaceBtn = document.getElementById('addInterfaceBtn');
  const saveGraphConfigBtn = document.getElementById('saveGraphConfigBtn');
  const cancelGraphConfigBtn = document.getElementById('cancelGraphConfigBtn');
  const customGraphSettingsBtn = document.getElementById('customGraphSettingsBtn');
  const interfacesWrapper = document.getElementById('interfacesWrapper');
  const graphNameInput = document.getElementById('graphName');
  const customGraphDisplay = document.getElementById('customGraphDisplay');
  const networkDetailView = document.getElementById('network-detail-view');
  const modalTitle = document.getElementById('modalTitle');
  
  // Set initial button text translations
  if (addInterfaceBtn) addInterfaceBtn.textContent = window.t('Add Interface');
  if (cancelGraphConfigBtn) cancelGraphConfigBtn.textContent = window.t('Cancel');
  
  // Track current edit mode
  let isEditMode = false;
  let currentGraphId = null;
  
  // Chart registry to keep track of all created charts
  const chartRegistry = {};

  // Available network interfaces
  let availableInterfaces = [];

  // Refresh interval in milliseconds
  const REFRESH_INTERVAL = 5000;

  // Track if custom graphs have been loaded
  let customGraphsLoaded = false;

  // Add a mutation observer to detect when the network detail view becomes visible
  const networkDetailObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.style.display === 'block' && !customGraphsLoaded) {
        loadCustomGraphs();
        customGraphsLoaded = true;
      }
    });
  });

  /**
   * Initialize the module
   */
  function init() {
    // Set up event listeners
    customGraphSettingsBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelGraphConfigBtn.addEventListener('click', closeModal);
    addInterfaceBtn.addEventListener('click', addInterfaceRow);
    saveGraphConfigBtn.addEventListener('click', saveGraphConfig);
    
    // Start observing the network detail view for style changes
    if (networkDetailView) {
      networkDetailObserver.observe(networkDetailView, { 
        attributes: true, 
        attributeFilter: ['style'] 
      });
    }
    
    // Initial load of custom graphs
    loadCustomGraphs();
    
    // Set up refresh interval
    setInterval(updateGraphData, REFRESH_INTERVAL);
  }

  /**
   * Open the custom graph modal in create mode
   */
  function openModal() {
    isEditMode = false;
    currentGraphId = null;
    
    // Update modal title
    modalTitle.textContent = window.t('Custom Network Graph Settings');
    
    // Clear previous form data
    interfacesWrapper.innerHTML = '';
    graphNameInput.value = '';

    // Fetch available interfaces
    fetchAvailableInterfaces();
    
    // Update button text
    saveGraphConfigBtn.textContent = window.t('Save');
    
    // Show the modal
    modalOverlay.style.display = 'flex';
  }

  /**
   * Open the edit modal for an existing graph
   */
  function openEditModal(graph) {
    isEditMode = true;
    currentGraphId = graph.id;
    
    // Update modal title
    modalTitle.textContent = window.t('Edit Network Graph');
    
    // Clear previous form data
    interfacesWrapper.innerHTML = '';
    
    // Set graph name
    graphNameInput.value = graph.graph_name;
    
    // Fetch available interfaces then populate form
    fetchAvailableInterfaces().then(() => {
      // Add interface rows for each existing interface
      graph.interfaces.forEach(iface => {
        addInterfaceRow(iface.iface_name, iface.label, iface.color);
      });
    });
    
    // Update button text
    saveGraphConfigBtn.textContent = window.t('Update');
    
    // Show the modal
    modalOverlay.style.display = 'flex';
  }

  /**
   * Close the custom graph modal
   */
  function closeModal() {
    modalOverlay.style.display = 'none';
  }

  /**
   * Fetch available network interfaces from the server
   * Returns a promise for chaining
   */
  function fetchAvailableInterfaces() {
    return fetch('/custom_network/available_interfaces')
      .then(response => response.json())
      .then(data => {
        availableInterfaces = data;
        // Add a default interface row if we have interfaces (only in create mode)
        if (availableInterfaces.length > 0 && !isEditMode) {
          addInterfaceRow();
        }
        return data;
      })
      .catch(error => {
        console.error('Error fetching available interfaces:', error);
        return [];
      });
  }

  /**
   * Add a new interface row to the form
   * @param {string} selectedIface - The pre-selected interface name
   * @param {string} label - The pre-filled label
   * @param {string} color - The pre-selected color
   */
  function addInterfaceRow(selectedIface = '', label = '', color = '') {
    const row = document.createElement('div');
    row.className = 'interface-row';
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';
    row.style.alignItems = 'center';

    // Interface select
    const ifaceSelect = document.createElement('select');
    ifaceSelect.className = 'iface-select';
    ifaceSelect.style.flex = '1';
    
    // Add options for each available interface
    availableInterfaces.forEach(iface => {
      const option = document.createElement('option');
      option.value = iface;
      option.textContent = iface;
      if (iface === selectedIface) {
        option.selected = true;
      }
      ifaceSelect.appendChild(option);
    });

    // Label input
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.placeholder = 'Label';
    labelInput.className = 'label-input';
    labelInput.style.flex = '1';
    if (label) {
      labelInput.value = label;
    }

    // Color input
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = color || getRandomColor();
    colorInput.className = 'color-input';
    colorInput.style.width = '50px';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', () => row.remove());

    // Add elements to row
    row.appendChild(ifaceSelect);
    row.appendChild(labelInput);
    row.appendChild(colorInput);
    row.appendChild(removeBtn);

    // Add row to container
    interfacesWrapper.appendChild(row);
  }

  /**
   * Save the graph configuration
   */
  function saveGraphConfig() {
    const graphName = graphNameInput.value.trim() || 'Untitled Graph';
    const interfaces = [];

    // Collect interface data from form
    const rows = interfacesWrapper.querySelectorAll('.interface-row');
    rows.forEach(row => {
      const ifaceSelect = row.querySelector('.iface-select');
      const labelInput = row.querySelector('.label-input');
      const colorInput = row.querySelector('.color-input');
      
      if (ifaceSelect && ifaceSelect.value) {
        interfaces.push({
          iface_name: ifaceSelect.value,
          label: labelInput.value || ifaceSelect.value,
          color: colorInput.value
        });
      }
    });

    // Don't save if no interfaces are selected
    if (interfaces.length === 0) {
      alert('Please add at least one interface');
      return;
    }
    
    // Create graph object, preserving ID if in edit mode
    const newGraph = {
      id: isEditMode ? currentGraphId : Date.now(),
      graph_name: graphName,
      interfaces: interfaces
    };
    
    // In edit mode, we need to update just this graph
    // In create mode, we add a new graph
    
    if (isEditMode) {
      // First get all existing graphs
      fetch('/custom_network/config')
        .then(response => response.json())
        .then(graphs => {
          // Replace the edited graph
          const updatedGraphs = graphs.map(g => 
            g.id === currentGraphId ? newGraph : g
          );
          
          // Save back to server
          return fetch('/custom_network/config', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ custom_network_graphs: updatedGraphs })
          });
        })
        .then(response => response.json())
        .then(() => {
          closeModal();
          loadCustomGraphs();
        })
        .catch(error => {
          console.error('Error updating graph configuration:', error);
        });
    } else {
      // Create mode - just add a new graph
      fetch('/custom_network/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ custom_network_graphs: [newGraph] })
      })
      .then(response => response.json())
      .then(() => {
        closeModal();
        loadCustomGraphs();
      })
      .catch(error => {
        console.error('Error saving graph configuration:', error);
      });
    }
  }

  /**
   * Load custom graphs from the server
   */
  function loadCustomGraphs() {
    fetch('/custom_network/config')
      .then(response => response.json())
      .then(graphs => {
        // Clear existing graph display
        customGraphDisplay.innerHTML = '';
        
        // Set container styles to prevent overflow
        customGraphDisplay.style.width = '100%';
        customGraphDisplay.style.boxSizing = 'border-box';
        customGraphDisplay.style.overflow = 'hidden';
        
        // Create graph cards
        graphs.forEach(graph => createGraphCard(graph));

        // Update graph data
        updateGraphData();
        
        // Dispatch event to notify that graphs have been loaded
        document.dispatchEvent(new CustomEvent('customNetworkGraphsLoaded'));
      })
      .catch(error => {
        console.error('Error loading custom graphs:', error);
      });
  }

  /**
   * Create a graph card for a custom network graph
   */
  function createGraphCard(graph) {
    // Reference to the custom charts display container
    const customGraphDisplay = document.getElementById('customGraphDisplay');
    
    // Create row container for this custom network graph
    const row = document.createElement('div');
    row.className = 'custom-graph-row';
    row.dataset.graphId = graph.id;
    row.style.marginBottom = '1rem';
    row.style.border = '1px solid var(--border-color)';
    row.style.borderRadius = '0.5rem';
    row.style.padding = '0.5rem';
    row.style.background = 'var(--glass)';
    row.style.backgroundImage = 'var(--glass-gradient)';
    row.style.width = '100%';
    row.style.boxSizing = 'border-box';
    row.style.overflow = 'hidden';
    
    // Create header for the custom chart row
    const header = document.createElement('div');
    header.className = 'custom-graph-row-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '0.5rem';
    
    const title = document.createElement('h3');
    title.textContent = graph.graph_name;
    title.style.margin = '0';
    title.style.fontSize = '1rem';
    title.style.color = 'var(--text)';
    
    // Actions container with edit and delete buttons
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'graph-row-actions';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = '✎';
    editBtn.className = 'graph-edit-btn';
    editBtn.title = 'Edit Graph';
    editBtn.style.marginRight = '0.25rem';
    editBtn.addEventListener('click', () => openEditModal(graph));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.className = 'graph-delete-btn';
    deleteBtn.title = 'Delete Graph';
    deleteBtn.addEventListener('click', () => deleteGraph(graph.id));
    
    actionsContainer.appendChild(editBtn);
    actionsContainer.appendChild(deleteBtn);
    
    header.appendChild(title);
    header.appendChild(actionsContainer);
    
    // Add color legend for interfaces
    const legendContainer = document.createElement('div');
    legendContainer.className = 'graph-card-legend';
    legendContainer.style.display = 'flex';
    legendContainer.style.flexWrap = 'wrap';
    legendContainer.style.gap = '10px';
    legendContainer.style.padding = '5px 10px';
    legendContainer.style.marginBottom = '10px';
    legendContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    legendContainer.style.borderRadius = '4px';
    
    graph.interfaces.forEach(iface => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.gap = '5px';
        
        const colorBox = document.createElement('span');
        colorBox.className = 'color-box';
        colorBox.style.display = 'inline-block';
        colorBox.style.width = '12px';
        colorBox.style.height = '12px';
        colorBox.style.borderRadius = '2px';
        colorBox.style.backgroundColor = iface.color;
        
        const labelText = document.createElement('span');
        labelText.textContent = iface.label;
        labelText.style.fontSize = '12px';
        labelText.style.color = 'var(--text)';
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(labelText);
        legendContainer.appendChild(legendItem);
    });
    
    // Create a container for the charts laid out in a row
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'custom-graph-row-charts';
    chartsContainer.style.display = 'flex';
    chartsContainer.style.justifyContent = 'space-between';
    chartsContainer.style.alignItems = 'flex-start';
    chartsContainer.style.width = '100%';
    chartsContainer.style.flexWrap = 'wrap';
    chartsContainer.style.overflow = 'hidden';
    
    // Input chart container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chart-container input-chart';
    inputContainer.style.flex = '1 1 48%';
    inputContainer.style.position = 'relative';
    inputContainer.style.marginRight = '0.5rem';
    inputContainer.style.display = 'flex';
    inputContainer.style.flexDirection = 'column';
    inputContainer.style.minWidth = '0'; // Important for flex child to prevent overflow
    
    const inputCanvas = document.createElement('canvas');
    inputCanvas.id = `input-chart-${graph.id}`;
    inputCanvas.style.width = '100%';
    inputCanvas.style.height = '300px';
    inputCanvas.style.maxWidth = '100%';
    
    inputContainer.appendChild(inputCanvas);
    
    const inputLabel = document.createElement('div');
    inputLabel.className = 'chart-label';
    inputLabel.textContent = window.t('Input');
    inputLabel.style.textAlign = 'center';
    inputLabel.style.fontSize = '0.8rem';
    inputLabel.style.marginTop = '0.5rem';
    inputLabel.style.color = 'var(--text)';
    inputLabel.style.display = 'block';
    inputLabel.style.width = '100%';
    
    inputContainer.appendChild(inputLabel);
    
    // Output chart container
    const outputContainer = document.createElement('div');
    outputContainer.className = 'chart-container output-chart';
    outputContainer.style.flex = '1 1 48%';
    outputContainer.style.position = 'relative';
    outputContainer.style.marginLeft = '0.5rem';
    outputContainer.style.display = 'flex';
    outputContainer.style.flexDirection = 'column';
    outputContainer.style.minWidth = '0'; // Important for flex child to prevent overflow
    
    const outputCanvas = document.createElement('canvas');
    outputCanvas.id = `output-chart-${graph.id}`;
    outputCanvas.style.width = '100%';
    outputCanvas.style.height = '300px';
    outputCanvas.style.maxWidth = '100%';
    
    outputContainer.appendChild(outputCanvas);
    
    // Append input and output containers to the charts container
    chartsContainer.appendChild(inputContainer);
    chartsContainer.appendChild(outputContainer);
    
    // Append header and charts container to the row
    row.appendChild(header);
    row.appendChild(legendContainer);
    row.appendChild(chartsContainer);
    
    // Use border-bottom instead of a horizontal divider to avoid causing overflow
    row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    
    // Append the row to the main custom graph display container
    customGraphDisplay.appendChild(row);
    
    // Create the charts using the existing function
    createCharts(graph);
  }

  /**
   * Create charts for a custom network graph
   */
  function createCharts(graph) {
    // Both chart configurations
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false,
          labels: {
            font: {
              size: 10
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          padding: 7,
          boxPadding: 3,
          usePointStyle: true,
          titleFont: {
            size: 13
          },
          bodyFont: {
            size: 10
          },
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              const value = context.parsed.y;
              return label + formatBytesRate(value);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            drawBorder: false,
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: {
              size: 10
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
            padding: 5
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: {
              size: 10
            },
            padding: 10,
            callback: function(value) {
              return formatBytesRate(value);
            }
          },
          afterFit: function(scaleInstance) {
            scaleInstance.paddingBottom = 30;
            scaleInstance.paddingTop = 10;
          }
        }
      },
      layout: {
        padding: {
          bottom: 15,
          top: 5
        }
      }
    };

    // Input chart
    const inputCtx = document.getElementById(`input-chart-${graph.id}`).getContext('2d');
    const inputChart = new Chart(inputCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: graph.interfaces.map(iface => ({
          label: iface.label,
          data: [],
          borderColor: iface.color,
          backgroundColor: hexToRgba(iface.color, 0.2),
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 5,
          spanGaps: true
        }))
      },
      options: chartOptions
    });
    
    // Output chart
    const outputCtx = document.getElementById(`output-chart-${graph.id}`).getContext('2d');
    const outputChart = new Chart(outputCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: graph.interfaces.map(iface => ({
          label: iface.label,
          data: [],
          borderColor: iface.color,
          backgroundColor: hexToRgba(iface.color, 0.2),
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 5,
          spanGaps: true
        }))
      },
      options: chartOptions
    });
    
    // Store charts in the registry for later reference
    chartRegistry[graph.id] = {
      input: inputChart,
      output: outputChart
    };
  }

  /**
   * Update graph data
   */
  function updateGraphData() {
    const networkData = window.cachedStats?.network?.interfaces || {};
    
    // Get graph configurations
    fetch('/custom_network/config')
      .then(response => response.json())
      .then(graphs => {
        if (!Array.isArray(graphs) || graphs.length === 0) return;
        
        graphs.forEach(graph => {
          const chartSet = chartRegistry[graph.id];
          if (!chartSet) return;
          
          const inputChart = chartSet.input;
          const outputChart = chartSet.output;
          
          // Prepare datasets
          const inputDatasets = [];
          const outputDatasets = [];
          let labels = [];
          
          // Process each interface
          graph.interfaces.forEach(iface => {
            const ifaceName = iface.iface_name;
            const ifaceData = networkData[ifaceName] || [];
            
            if (ifaceData.length > 0) {
              // Use the time labels from the first interface with data
              if (labels.length === 0) {
                labels = ifaceData.map(point => point.time);
              }
              
              // Process data points with careful validation
              const inputData = ifaceData.map(point => {
                const val = Number(point.input);
                return isNaN(val) ? 0 : val;
              });
              
              const outputData = ifaceData.map(point => {
                const val = Number(point.output);
                return isNaN(val) ? 0 : val;
              });
              
              // Create input dataset
              inputDatasets.push({
                label: iface.label,
                data: inputData,
                borderColor: iface.color,
                backgroundColor: hexToRgba(iface.color, 0.2),
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 1,
                pointHoverRadius: 5,
                fill: true
              });
              
              // Create output dataset
              outputDatasets.push({
                label: iface.label,
                data: outputData,
                borderColor: iface.color,
                backgroundColor: hexToRgba(iface.color, 0.2),
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 1,
                pointHoverRadius: 5,
                fill: true
              });
            }
          });
          
          // Only update if we have valid data
          if (labels.length > 0 && inputDatasets.length > 0) {
            try {
              // Update charts with animations
              inputChart.data.labels = labels;
              inputChart.data.datasets = inputDatasets;
              inputChart.update();
              
              outputChart.data.labels = labels;
              outputChart.data.datasets = outputDatasets;
              outputChart.update();
            } catch (error) {
              console.error('Error updating charts:', error);
            }
          }
        });
      })
      .catch(error => {
        console.error('Error updating graph data:', error);
      });
  }

  /**
   * Delete a graph
   */
  function deleteGraph(graphId) {
    if (confirm('Are you sure you want to delete this graph?')) {
      fetch(`/custom_network/delete/${graphId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          // Destroy charts
          const chartSet = chartRegistry[graphId];
          if (chartSet) {
            chartSet.input.destroy();
            chartSet.output.destroy();
            delete chartRegistry[graphId];
          }
          
          // Remove card from display
          const card = customGraphDisplay.querySelector(`.custom-graph-row[data-graph-id="${graphId}"]`);
          if (card) {
            card.remove();
          }
        }
      })
      .catch(error => {
        console.error('Error deleting graph:', error);
      });
    }
  }

  /**
   * Simple direct formatter for byte values with rate
   */
  function formatBytesRate(bytes) {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) {
      return '0 MB/s';
    }
    
    // API already returns values in MB/s, so just format with 2 decimal places
    return bytes.toFixed(2) + ' MB/s';
  }

  /**
   * Helper function to generate a random color
   */
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * Helper function to convert hex color to rgba
   */
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Initialize the module
  init();
});
