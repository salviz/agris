/**
 * Enhanced cookie management for Agris browser with persistent storage
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

// File to store cookies
const COOKIE_FILE = path.join(os.homedir(), '.agris_cookies.json');

// Initialize cookie store from file if it exists
let cookieStore = {};

// Load cookies from file
function loadCookies() {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const cookieData = fs.readFileSync(COOKIE_FILE, 'utf8');
      cookieStore = JSON.parse(cookieData);
      
      // Clean up expired cookies on load
      cleanExpiredCookies();
      console.log(`Loaded cookies for ${Object.keys(cookieStore).length} domains`);
    }
  } catch (error) {
    console.error(`Error loading cookies: ${error.message}`);
    cookieStore = {};
  }
}

// Save cookies to file
function saveCookies() {
  try {
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookieStore, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error saving cookies: ${error.message}`);
  }
}

// Load cookies on startup
loadCookies();

/**
 * Parse and store cookies from a response
 * @param {string} url - The URL that set the cookies
 * @param {Array<string>} cookieHeaders - Array of Set-Cookie header values
 */
function saveCookiesFromResponse(url, cookieHeaders) {
  if (!url || !cookieHeaders) {
    return;
  }
  
  try {
    const parsedUrl = new URL(url);
    const urlDomain = parsedUrl.hostname;
    
    // Ensure we have an array of cookies
    const cookieArray = Array.isArray(cookieHeaders) ? cookieHeaders : [cookieHeaders];
    
    let cookiesChanged = false;
    
    for (const cookieStr of cookieArray) {
      const cookie = parseCookie(cookieStr, urlDomain);
      
      if (cookie && cookie.domain) {
        // Create domain entry if it doesn't exist
        if (!cookieStore[cookie.domain]) {
          cookieStore[cookie.domain] = {};
        }
        
        // Store the cookie
        cookieStore[cookie.domain][cookie.name] = {
          value: cookie.value,
          expires: cookie.expires,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          createdAt: Date.now()
        };
        
        cookiesChanged = true;
      }
    }
    
    // Save cookies to disk if any were changed
    if (cookiesChanged) {
      saveCookies();
    }
  } catch (error) {
    console.error(`Error saving cookies from response: ${error.message}`);
  }
}

/**
 * Parse a single cookie string with enhanced compatibility
 * @param {string} cookieStr - The Set-Cookie header value
 * @param {string} defaultDomain - The domain of the response
 * @returns {Object|null} - Parsed cookie object or null if invalid
 */
function parseCookie(cookieStr, defaultDomain) {
  if (!cookieStr) return null;
  
  try {
    const parts = cookieStr.split(';').map(part => part.trim());
    const nameValuePair = parts.shift().split('=');
    
    if (nameValuePair.length < 2) return null;
    
    const name = nameValuePair[0];
    // Join the rest with = in case there are = in the value
    const value = nameValuePair.slice(1).join('=');
    
    const cookie = {
      name,
      value,
      domain: defaultDomain,
      path: '/',
      expires: null,
      secure: false,
      httpOnly: false,
      sameSite: null
    };
    
    // Process attributes
    for (const part of parts) {
      if (!part.includes('=')) {
        // Handle flag attributes like "Secure" or "HttpOnly"
        const attrName = part.toLowerCase();
        switch (attrName) {
          case 'secure':
            cookie.secure = true;
            break;
          case 'httponly':
            cookie.httpOnly = true;
            break;
        }
      } else {
        const [attrName, attrValue] = part.split('=', 2).map(s => s.trim());
        const attrNameLower = attrName.toLowerCase();
        
        switch (attrNameLower) {
          case 'domain':
            // Handle domain prefixes for proper matching
            let cookieDomain = attrValue || defaultDomain;
            // Remove leading dot for storage consistency
            if (cookieDomain.startsWith('.')) {
              cookieDomain = cookieDomain.substring(1);
            }
            cookie.domain = cookieDomain;
            break;
            
          case 'path':
            cookie.path = attrValue || '/';
            break;
            
          case 'expires':
            try {
              cookie.expires = new Date(attrValue).toISOString();
            } catch (error) {
              // Ignore invalid dates
            }
            break;
            
          case 'max-age':
            const seconds = parseInt(attrValue, 10);
            if (!isNaN(seconds)) {
              const expiryDate = new Date();
              expiryDate.setSeconds(expiryDate.getSeconds() + seconds);
              cookie.expires = expiryDate.toISOString();
            }
            break;
            
          case 'samesite':
            cookie.sameSite = attrValue.toLowerCase();
            break;
        }
      }
    }
    
    return cookie;
  } catch (error) {
    console.error(`Error parsing cookie: ${error.message}`);
    return null;
  }
}

/**
 * Get cookies for a specific URL with better handling of domain matching
 * @param {string} urlString - The URL to get cookies for
 * @returns {Array<string>} - Array of cookie strings in name=value format
 */
function getCookiesForUrl(urlString) {
  if (!urlString) {
    return [];
  }
  
  try {
    const now = new Date();
    const url = new URL(urlString);
    const hostname = url.hostname;
    const path = url.pathname || '/';
    const isSecure = url.protocol === 'https:';
    
    // Clean expired cookies periodically
    if (Math.random() < 0.1) { // 10% chance to clean on each request
      cleanExpiredCookies();
    }
    
    // Find all domains that match this hostname
    const matchingDomains = Object.keys(cookieStore).filter(domain => {
      // Exact domain match
      if (hostname === domain) {
        return true;
      }
      
      // Subdomain match
      if (hostname.endsWith('.' + domain)) {
        return true;
      }
      
      // Handle www variant
      if (hostname === 'www.' + domain || domain === 'www.' + hostname) {
        return true;
      }
      
      return false;
    });
    
    // Collect valid cookies from matching domains
    const cookies = [];
    const addedCookies = new Set(); // Track added cookies to avoid duplicates
    
    for (const domain of matchingDomains) {
      const domainCookies = cookieStore[domain];
      if (!domainCookies) continue;
      
      for (const [name, cookie] of Object.entries(domainCookies)) {
        // Skip if we already added this cookie
        if (addedCookies.has(name)) {
          continue;
        }
        
        // Check expiration
        if (cookie.expires && new Date(cookie.expires) < now) {
          delete domainCookies[name]; // Clean up expired cookie
          continue;
        }
        
        // Check path
        if (!path.startsWith(cookie.path)) {
          continue;
        }
        
        // Check secure flag
        if (cookie.secure && !isSecure) {
          continue;
        }
        
        // Add cookie
        cookies.push(`${name}=${cookie.value}`);
        addedCookies.add(name);
      }
    }
    
    return cookies;
  } catch (error) {
    console.error(`Error getting cookies for URL ${urlString}: ${error.message}`);
    return [];
  }
}

/**
 * Clean expired cookies from the store
 */
function cleanExpiredCookies() {
  const now = new Date();
  let removedCount = 0;
  
  for (const domain in cookieStore) {
    for (const name in cookieStore[domain]) {
      const cookie = cookieStore[domain][name];
      if (cookie.expires && new Date(cookie.expires) < now) {
        delete cookieStore[domain][name];
        removedCount++;
      }
    }
    
    // Remove empty domains
    if (Object.keys(cookieStore[domain]).length === 0) {
      delete cookieStore[domain];
    }
  }
  
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} expired cookies`);
    saveCookies();
  }
}

/**
 * Set a cookie manually with enhanced options
 * @param {string} domain - The domain for the cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Additional cookie options
 */
function setCookie(domain, name, value, options = {}) {
  if (!domain || !name) return;
  
  if (!cookieStore[domain]) {
    cookieStore[domain] = {};
  }
  
  cookieStore[domain][name] = {
    value: value || '',
    path: options.path || '/',
    expires: options.expires || null,
    secure: options.secure || false,
    httpOnly: options.httpOnly || false,
    sameSite: options.sameSite || null,
    createdAt: Date.now()
  };
  
  saveCookies();
}

/**
 * Clear all cookies
 */
function clearAllCookies() {
  cookieStore = {};
  saveCookies();
}

/**
 * Clear cookies for a specific domain
 * @param {string} domain - The domain to clear cookies for
 */
function clearDomainCookies(domain) {
  if (cookieStore[domain]) {
    delete cookieStore[domain];
    saveCookies();
  }
}

/**
 * Get all cookie domains for debugging
 * @returns {Array<string>} - List of domains with cookies
 */
function getAllCookieDomains() {
  return Object.keys(cookieStore);
}

/**
 * Get cookie count for debugging
 * @returns {Object} - Count of cookies per domain
 */
function getCookieCount() {
  const counts = {};
  for (const domain in cookieStore) {
    counts[domain] = Object.keys(cookieStore[domain]).length;
  }
  return counts;
}

module.exports = {
  saveCookiesFromResponse,
  getCookiesForUrl,
  setCookie,
  clearAllCookies,
  clearDomainCookies,
  getAllCookieDomains,
  getCookieCount
};