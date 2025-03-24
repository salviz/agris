/**
 * Session management for Agris browser
 */

// Session management is primarily handled through cookies
// This module provides a simplified API for session-related operations

const { saveCookiesFromHeaders, getCookiesForUrl } = require('./cookieManager');

// Current active session info
let currentSession = {
  isLoggedIn: false,
  domain: null,
  username: null
};

// Handle cookies that may indicate a session
function processSessionCookies(responseHeaders, url) {
  if (!responseHeaders || !responseHeaders['set-cookie']) {
    return;
  }
  
  // Process cookies - session detection is application-specific
  // This is a simplified implementation that looks for common session cookie names
  const setCookies = Array.isArray(responseHeaders['set-cookie']) ? 
    responseHeaders['set-cookie'] : 
    [responseHeaders['set-cookie']];
  
  const sessionCookieNames = ['session', 'sessionid', 'jsessionid', 'phpsessid', 'sid'];
  const hasSessionCookie = setCookies.some(cookie => {
    const lowerCookie = cookie.toLowerCase();
    return sessionCookieNames.some(name => lowerCookie.startsWith(name + '='));
  });
  
  if (hasSessionCookie) {
    const urlObj = new URL(url);
    currentSession.isLoggedIn = true;
    currentSession.domain = urlObj.hostname;
    
    // Log session detection
    console.log(`Session detected for ${urlObj.hostname}`);
  }
  
  // Save cookies through the cookie manager
  saveCookiesFromHeaders(responseHeaders['set-cookie']);
}

// Check if we have an active session for a URL
function hasActiveSession(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (currentSession.isLoggedIn && currentSession.domain === hostname) {
      // We think we have a session, but check if session cookies actually exist
      const cookies = getCookiesForUrl(url);
      return cookies.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking session: ${error.message}`);
    return false;
  }
}

// Clear the current session
function clearSession() {
  currentSession = {
    isLoggedIn: false,
    domain: null,
    username: null
  };
  console.log('Session cleared');
}

module.exports = {
  processSessionCookies,
  hasActiveSession,
  clearSession
};
