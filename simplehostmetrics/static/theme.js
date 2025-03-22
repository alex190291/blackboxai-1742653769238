document.addEventListener("DOMContentLoaded", function () {
  // Retrieve the saved mode from localStorage, default to 'light'
  var savedMode = localStorage.getItem("selectedMode") || "light";
  console.log("Saved mode:", savedMode);

  // Apply the correct mode class to the body
  if (savedMode === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.add("light-mode");
  }
  
  // Set the checkbox state based on the current theme
  var modeToggle = document.getElementById("modeToggle");
  if (modeToggle) {
    modeToggle.checked = savedMode === "dark";
  }
  
  // Apply saved primary color if it exists - with better timing and event handling
  const savedColor = localStorage.getItem('primaryColor');
  if (savedColor) {
    // Apply immediately
    applyPrimaryColor(savedColor);
    
    // Also apply after a short delay to catch any elements that might render later
    setTimeout(() => {
      applyPrimaryColor(savedColor);
    }, 100);
    
    // Apply once more after everything is loaded
    window.addEventListener('load', function() {
      applyPrimaryColor(savedColor);
    });
  }

  // Get the mode toggle button element by its ID
  if (modeToggle) {
    console.log("Mode toggle button found");
    modeToggle.addEventListener("click", function () {
      console.log("Mode toggle button clicked");
      // Toggle between light and dark mode
      if (document.body.classList.contains("light-mode")) {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        localStorage.setItem("selectedMode", "dark");
        console.log("New mode set: dark");
        
        // Reset transparent elements to dark mode defaults
        document.documentElement.style.removeProperty('--glass');
        document.documentElement.style.removeProperty('--glass-gradient');
        
        // Reset hexagons in dark mode to default style
        document.querySelectorAll('.hexagons .hexagon').forEach(el => {
          el.style.background = '';
          el.style.opacity = '';
        });
      } else {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        localStorage.setItem("selectedMode", "light");
        console.log("New mode set: light");
        
        // Apply custom primary color to light mode transparent elements
        const savedColor = localStorage.getItem('primaryColor');
        if (savedColor) {
          // Extract RGB values for primary color
          const r = parseInt(savedColor.slice(1, 3), 16);
          const g = parseInt(savedColor.slice(3, 5), 16);
          const b = parseInt(savedColor.slice(5, 7), 16);
          
          // Update light mode transparent elements
          document.documentElement.style.setProperty('--glass', `rgba(${r}, ${g}, ${b}, 0.4)`);
          document.documentElement.style.setProperty('--glass-gradient', 
              `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.05))`);
              
          // Update hexagons
          document.querySelectorAll('.hexagons .hexagon').forEach(el => {
            el.style.background = savedColor;
            el.style.opacity = '0.25';
          });
          
          // Update sidebar items
          document.querySelectorAll('.sidebar-item.active').forEach(el => {
            el.style.background = `rgba(${r}, ${g}, ${b}, 0.9)`;
          });
        }
      }
      
      // Re-apply the primary color after theme change
      const savedColor = localStorage.getItem('primaryColor');
      if (savedColor) {
        applyPrimaryColor(savedColor);
        
        // Use the global colorSync function if available to ensure all elements update
        if (window.syncPrimaryColor) {
          window.syncPrimaryColor();
        }
        
        // Update hexagons in light mode
        if (document.body.classList.contains('light-mode')) {
          document.querySelectorAll('.hexagons .hexagon').forEach(el => {
            el.style.background = savedColor;
            el.style.opacity = '0.25';
          });
        }
      }
    });
  } else {
    console.log("Mode toggle button not found");
  }
  
  // Apply hexagon color on initial page load if in light mode
  if (document.body.classList.contains('light-mode')) {
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      document.querySelectorAll('.hexagons .hexagon').forEach(el => {
        el.style.background = savedColor;
        el.style.opacity = '0.25';
      });
    }
  }
  
  // Function to apply primary color to CSS variables
  function applyPrimaryColor(color) {
    document.documentElement.style.setProperty('--primary', color);
    
    // Calculate and set RGB values
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    
    // Update gradient variables that use the primary color
    const darkerColor = adjustColorBrightness(color, -0.2); // 20% darker
    const lighterColor = adjustColorBrightness(color, 0.2); // 20% lighter
    
    // Create the gradient
    const gradientStyle = `linear-gradient(135deg, rgba(${hexToRgb(lighterColor)}, 0.9) 0%, ${color} 50%, rgba(${hexToRgb(darkerColor)}, 0.95) 100%)`;
    
    // Update all CSS variables that depend on the primary color
    document.documentElement.style.setProperty('--primary-gradient', gradientStyle);
    document.documentElement.style.setProperty('--focus-ring-color', `rgba(${r}, ${g}, ${b}, 0.5)`);
    document.documentElement.style.setProperty('--border-active', color);
    
    // Handle light mode specific variables if in light mode
    if (document.body.classList.contains('light-mode')) {
      document.documentElement.style.setProperty('--glass', `rgba(${r}, ${g}, ${b}, 0.4)`);
      document.documentElement.style.setProperty('--glass-gradient', 
          `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.05))`);
    }
    
    // Let syncPrimaryColor handle all the direct element styling
    if (window.syncPrimaryColor) {
      window.syncPrimaryColor();
    }
  }
  
  // Helper function to adjust color brightness
  function adjustColorBrightness(hex, percent) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const adjustedR = Math.max(0, Math.min(255, Math.round(r + (r * percent))));
    const adjustedG = Math.max(0, Math.min(255, Math.round(g + (g * percent))));
    const adjustedB = Math.max(0, Math.min(255, Math.round(b + (b * percent))));
    
    return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
  }
  
  // Helper function to convert hex to rgb
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
});
