/**
 * Utility functions for Agris browser
 */

const { URL } = require('url');

/**
 * Validates and normalizes a URL
 * @param {string} url - The URL to validate
 * @param {string} [baseUrl] - Optional base URL for resolving relative URLs
 * @returns {string} - The normalized absolute URL
 * @throws {Error} - If the URL is invalid
 */
function normalizeUrl(url, baseUrl = null) {
  try {
    // Handle special cases for URLs
    if (!url) {
      throw new Error('Empty URL');
    }
    
    // Remove any leading/trailing whitespace
    url = url.trim();
    
    // Handle URLs with protocol-relative notation (//example.com)
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }
    
    // Special handling for common relative URL patterns
    if (baseUrl) {
      const baseUrlObj = new URL(baseUrl);
      
      // Handle root-relative URLs (/path/to/something)
      if (url.startsWith('/')) {
        return new URL(url, `${baseUrlObj.protocol}//${baseUrlObj.host}`).toString();
      }
      
      // Handle relative URLs without leading slash (path/to/something)
      if (!url.includes('://') && !url.startsWith('/') && !url.startsWith('#')) {
        // Get the directory part of the base URL
        let basePath = baseUrlObj.pathname;
        if (!basePath.endsWith('/')) {
          // If the base URL doesn't end with a slash, remove the last path component
          basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        }
        return new URL(basePath + url, `${baseUrlObj.protocol}//${baseUrlObj.host}`).toString();
      }
    }
    
    // Standard URL handling
    const normalizedUrl = baseUrl ? new URL(url, baseUrl) : new URL(url);
    
    // Force HTTPS if HTTP was provided (security improvement)
    if (normalizedUrl.protocol === 'http:') {
      normalizedUrl.protocol = 'https:';
    }
    
    return normalizedUrl.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Decodes HTML entities in a string
 * @param {string} html - The HTML string with entities
 * @returns {string} - Decoded string
 */
function decodeHtmlEntities(html) {
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Formats headers for display
 * @param {Object} headers - Headers object
 * @returns {string} - Formatted headers string
 */
function formatHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return '';
  }
  
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

module.exports = {
  normalizeUrl,
  decodeHtmlEntities,
  formatHeaders
};
