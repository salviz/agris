/**
 * Documentation Cache Manager for AGRIS browser
 * 
 * Provides caching functionality for documentation pages to:
 * - Reduce repeated requests to documentation sites
 * - Improve performance
 * - Reduce load on documentation servers
 * - Work offline with previously accessed documentation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default cache directory
const DEFAULT_CACHE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.agris', 'doc_cache');

// Default cache expiration (24 hours)
const DEFAULT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Ensure cache directory exists
function ensureCacheDir(cacheDir = DEFAULT_CACHE_DIR) {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

/**
 * Generate a cache key from a URL
 * @param {string} url - The URL to generate a key for
 * @returns {string} - A hashed cache key
 */
function generateCacheKey(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Get the cache file path for a URL
 * @param {string} url - The URL to get a cache path for
 * @param {string} cacheDir - The cache directory
 * @returns {string} - The full path to the cache file
 */
function getCacheFilePath(url, cacheDir = DEFAULT_CACHE_DIR) {
  const cacheKey = generateCacheKey(url);
  return path.join(cacheDir, `${cacheKey}.json`);
}

/**
 * Check if a cached response exists and is valid
 * @param {string} url - The URL to check cache for
 * @param {Object} options - Options including cache expiry
 * @returns {boolean} - Whether a valid cache entry exists
 */
function hasCachedResponse(url, options = {}) {
  const cacheDir = options.cacheDir || DEFAULT_CACHE_DIR;
  const cacheFilePath = getCacheFilePath(url, cacheDir);
  
  if (!fs.existsSync(cacheFilePath)) {
    return false;
  }
  
  try {
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    const cacheExpiry = options.cacheExpiry || DEFAULT_CACHE_EXPIRY;
    
    // Check if cache has expired
    if (Date.now() - cacheData.timestamp > cacheExpiry) {
      return false;
    }
    
    return true;
  } catch (error) {
    // If there's an error reading or parsing the cache, consider it invalid
    return false;
  }
}

/**
 * Get a cached response for a URL
 * @param {string} url - The URL to get a cached response for
 * @param {Object} options - Options including cache directory
 * @returns {Object|null} - The cached response or null if not found
 */
function getCachedResponse(url, options = {}) {
  const cacheDir = options.cacheDir || DEFAULT_CACHE_DIR;
  ensureCacheDir(cacheDir);
  
  const cacheFilePath = getCacheFilePath(url, cacheDir);
  
  if (!hasCachedResponse(url, options)) {
    return null;
  }
  
  try {
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    return cacheData.response;
  } catch (error) {
    console.error(`Error reading cache for ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Cache a response for a URL
 * @param {string} url - The URL to cache a response for
 * @param {Object} response - The response to cache
 * @param {Object} options - Options including cache directory
 * @returns {boolean} - Whether caching was successful
 */
function cacheResponse(url, response, options = {}) {
  const cacheDir = options.cacheDir || DEFAULT_CACHE_DIR;
  ensureCacheDir(cacheDir);
  
  const cacheFilePath = getCacheFilePath(url, cacheDir);
  
  try {
    // Prepare cache data with timestamp
    const cacheData = {
      url: url,
      timestamp: Date.now(),
      response: response
    };
    
    // If the response body is a Buffer, convert it to a base64 string for storage
    if (response.body instanceof Buffer) {
      cacheData.response.body = response.body.toString('base64');
      cacheData.response.isBase64Encoded = true;
    }
    
    // Write to cache file
    fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error(`Error caching response for ${url}: ${error.message}`);
    return false;
  }
}

/**
 * Clear a cached response for a URL
 * @param {string} url - The URL to clear cache for
 * @param {Object} options - Options including cache directory
 * @returns {boolean} - Whether clearing was successful
 */
function clearCachedResponse(url, options = {}) {
  const cacheDir = options.cacheDir || DEFAULT_CACHE_DIR;
  const cacheFilePath = getCacheFilePath(url, cacheDir);
  
  if (fs.existsSync(cacheFilePath)) {
    try {
      fs.unlinkSync(cacheFilePath);
      return true;
    } catch (error) {
      console.error(`Error clearing cache for ${url}: ${error.message}`);
      return false;
    }
  }
  
  return false;
}

/**
 * Clear all cached responses
 * @param {Object} options - Options including cache directory
 * @returns {boolean} - Whether clearing was successful
 */
function clearAllCachedResponses(options = {}) {
  const cacheDir = options.cacheDir || DEFAULT_CACHE_DIR;
  
  if (!fs.existsSync(cacheDir)) {
    return true;
  }
  
  try {
    const files = fs.readdirSync(cacheDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(cacheDir, file));
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error clearing all cache: ${error.message}`);
    return false;
  }
}

/**
 * Get documentation from cache or fetch it
 * @param {string} url - The URL to get documentation for
 * @param {Function} fetchFunction - The function to use to fetch if not cached
 * @param {Object} options - Options including cache settings
 * @returns {Promise<Object>} - The documentation response
 */
async function getDocumentation(url, fetchFunction, options = {}) {
  // Check cache first if caching is enabled
  if (options.useCache !== false) {
    const cachedResponse = getCachedResponse(url, options);
    
    if (cachedResponse) {
      console.log(`Using cached documentation for ${url}`);
      
      // If the body was a base64 encoded buffer, decode it
      if (cachedResponse.isBase64Encoded) {
        cachedResponse.body = Buffer.from(cachedResponse.body, 'base64');
        delete cachedResponse.isBase64Encoded;
      }
      
      return cachedResponse;
    }
  }
  
  // Not in cache or caching disabled, fetch fresh
  console.log(`Fetching fresh documentation for ${url}`);
  const response = await fetchFunction(url, options);
  
  // Cache the response if caching is enabled
  if (options.useCache !== false && response.statusCode >= 200 && response.statusCode < 300) {
    cacheResponse(url, response, options);
  }
  
  return response;
}

module.exports = {
  ensureCacheDir,
  generateCacheKey,
  getCacheFilePath,
  hasCachedResponse,
  getCachedResponse,
  cacheResponse,
  clearCachedResponse,
  clearAllCachedResponses,
  getDocumentation,
  DEFAULT_CACHE_DIR,
  DEFAULT_CACHE_EXPIRY
};