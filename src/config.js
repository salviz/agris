/**
 * Configuration for Agris browser
 */

// Default configuration
const defaultConfig = {
  // Display options
  display: {
    showLinks: true,       // Show list of links after rendering page
    showForms: true,      // Show forms after rendering page
    colorOutput: true,    // Use colors in terminal output
    maxWidth: 80,         // Maximum width for rendered content
  },
  
  // Network options
  network: {
    followRedirects: true,        // Follow HTTP redirects automatically
    maxRedirects: 5,              // Maximum number of redirects to follow
    timeout: 30000,               // Request timeout in milliseconds
    persistCookies: true,         // Save cookies between sessions
    userAgent: 'Agris/1.0 Terminal Browser',  // User agent string
  },
  
  // Security options
  security: {
    forceHttps: true,             // Upgrade HTTP URLs to HTTPS
    disableScripts: true,         // Always disable JavaScript evaluation
    warnInsecure: true,           // Warn when submitting forms over HTTP
  }
};

// Active configuration (modified by user settings)
let activeConfig = { ...defaultConfig };

/**
 * Get the current configuration value
 * @param {string} key - The configuration key (e.g., 'display.showLinks')
 * @returns {any} - The configuration value
 */
function getConfig(key) {
  if (!key) return activeConfig;
  
  const parts = key.split('.');
  let value = activeConfig;
  
  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Set a configuration value
 * @param {string} key - The configuration key
 * @param {any} value - The value to set
 */
function setConfig(key, value) {
  if (!key) return;
  
  const parts = key.split('.');
  let current = activeConfig;
  
  // Navigate to the containing object
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  
  // Set the final property
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

/**
 * Reset configuration to defaults
 */
function resetConfig() {
  activeConfig = { ...defaultConfig };
}

module.exports = {
  getConfig,
  setConfig,
  resetConfig
};
