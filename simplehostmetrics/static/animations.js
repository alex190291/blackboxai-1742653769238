// static/animations.js

// -------------------------------
// Background Hex Animation ------
// -------------------------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Use requestAnimationFrame for smooth background animations
let hexagonContainer = null;

function generateHexagons(count) {
  const container = document.getElementById("hexagon-container");
  if (!container) return;
  
  hexagonContainer = container;
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < count; i++) {
    const hex = document.createElement("div");
    hex.classList.add("hexagon");
    const top = randomInt(0, 100);
    const left = randomInt(0, 100);
    const size = randomInt(80, 250);
    const pulseDelay = randomFloat(0, 10).toFixed(1);
    const bounceDelay = randomFloat(0, 15).toFixed(1);
    const bounceDuration = randomFloat(10, 20).toFixed(1);

    hex.style.top = top + "%";
    hex.style.left = left + "%";
    hex.style.width = size + "px";
    hex.style.height = size + "px";
    hex.style.animationDelay = `${pulseDelay}s, ${bounceDelay}s`;
    hex.style.animationDuration = `10s, ${bounceDuration}s`;
    
    fragment.appendChild(hex);
  }
  
  container.appendChild(fragment);
}

// Generate a more reasonable number of hexagons based on screen size
function generateOptimizedHexagons() {
  // Use exactly 25 hexagons as requested
  const count = 25;
  
  generateHexagons(count);
}

// Initialize hexagons when document is ready
document.addEventListener("DOMContentLoaded", function() {
  generateOptimizedHexagons();
  
  // Apply saved color to hexagons if in light mode
  if (document.body.classList.contains('light-mode')) {
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      document.querySelectorAll('.hexagons .hexagon').forEach(el => {
        el.style.background = savedColor;
        el.style.opacity = '0.25';
      });
    }
  }
  
  // -------------------------------
  // Card Expand Button Handlers ---
  // -------------------------------
  // Use event delegation for better performance
  document.addEventListener("click", function(e) {
    const button = e.target.closest(".card-actions .btn-icon");
    if (!button) return;
    
    e.stopPropagation(); // Prevent event bubbling
    
    // Find the parent card and its detail view
    const card = button.closest(".card");
    const detailView = card.querySelector(".detail-view");
    
    if (!detailView) return;
    
    // Toggle the detail view
    if (detailView.style.display === "block") {
      detailView.style.display = "none";
      detailView.classList.remove('active');
    } else {
      detailView.style.display = "block";
      detailView.classList.add('active');
      
      // Use a more efficient way to trigger chart resize
      if (window.charts) {
        setTimeout(() => {
          window.charts.forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
              chart.resize();
            }
          });
        }, 10);
      } else {
        // Fallback to resize event if charts object doesn't exist
        window.dispatchEvent(new Event('resize'));
      }
    }
  });
});
