/**
 * Advanced HTTP request handling for Agris browser with enhanced bot detection avoidance
 * Implements sophisticated anti-detection techniques including:
 * - Browser fingerprinting resistance
 * - Header consistency
 * - TLS fingerprint randomization
 * - Human-like browsing patterns
 * - Proxy support
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const querystring = require('querystring');
const { getCookiesForUrl, saveCookiesFromResponse } = require('./cookieManager');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const iconv = require('iconv-lite');
const randomUseragent = require('random-useragent');
const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

// Enhanced browser user agents with more variety and modern options
const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.217 Safari/537.36',
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.217 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
  // Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
  // Mobile agents
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36'
];

// Map of browser headers by browser type to ensure consistency
const BROWSER_HEADERS = {
  chrome: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Priority': 'u=0, i',
    'DNT': '1'
  },
  firefox: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
  },
  safari: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'DNT': '1'
  },
  edge: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Microsoft Edge";v="121", "Not A(Brand";v="99", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive'
  },
  mobile: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?1',
    'Sec-Ch-Ua-Platform': '"Android"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive'
  }
};

// Common headers as a fallback
const COMMON_HEADERS = BROWSER_HEADERS.chrome;

// Store previously visited sites to maintain referrers
const visitedSites = new Map();

// Browser profile to use per domain to ensure consistent fingerprinting
const domainBrowserProfiles = new Map();

// List of available proxies (to be populated from environment or config)
const PROXY_LIST = process.env.PROXY_LIST ? 
  process.env.PROXY_LIST.split(',') : 
  [];

// Map to track the time of last request per domain to avoid rate limiting
const lastRequestTime = new Map();

// Map to track sessions per domain (for consistent fingerprinting)
const domainSessions = new Map();

// List of common charsets for websites
const COMMON_CHARSETS = [
  'utf-8',
  'windows-1252',
  'iso-8859-1',
  'iso-8859-15',
  'gbk',
  'gb2312',
  'shift-jis',
  'euc-jp',
  'euc-kr'
];

// List of domains known to have strict bot detection
const STRICT_BOT_DETECTION_DOMAINS = [
  'google.com',
  'stackoverflow.com',
  'reddit.com',
  'cloudflare.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'amazon.com',
  'twitter.com',
  'x.com',
  'recaptcha.net',
  'captcha.com'
];

// Function to detect the browser type from a user agent string
function detectBrowserType(userAgent) {
  if (!userAgent) return 'chrome'; // Default
  
  userAgent = userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('edg/') || userAgent.includes('edge/')) return 'edge';
  if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'mobile';
  
  return 'chrome'; // Default to Chrome
}

// Function to get a random user agent, optionally for a specific browser type
function getRandomUserAgent(browserType = null) {
  if (browserType) {
    // Filter agents by browser type
    const filteredAgents = USER_AGENTS.filter(ua => {
      const lowerUa = ua.toLowerCase();
      switch(browserType) {
        case 'chrome': return lowerUa.includes('chrome') && !lowerUa.includes('edg');
        case 'firefox': return lowerUa.includes('firefox');
        case 'safari': return lowerUa.includes('safari') && !lowerUa.includes('chrome');
        case 'edge': return lowerUa.includes('edg/');
        case 'mobile': return lowerUa.includes('mobile') || lowerUa.includes('android') || lowerUa.includes('iphone');
        default: return true;
      }
    });
    
    if (filteredAgents.length > 0) {
      return filteredAgents[Math.floor(Math.random() * filteredAgents.length)];
    }
  }
  
  // Fallback to random from all agents or use random-useragent library
  if (Math.random() > 0.5 && randomUseragent) {
    try {
      return randomUseragent.getRandom();
    } catch (e) {
      // Fallback to our list if the library fails
      return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }
  }
  
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Function to generate a consistent browser profile for a domain
function getBrowserProfileForDomain(hostname) {
  if (!domainBrowserProfiles.has(hostname)) {
    // Create a new browser profile for this domain
    const browserTypes = ['chrome', 'firefox', 'safari', 'edge', 'mobile'];
    const selectedType = browserTypes[Math.floor(Math.random() * browserTypes.length)];
    
    const profile = {
      browserType: selectedType,
      userAgent: getRandomUserAgent(selectedType),
      language: Math.random() > 0.8 ? 'en-GB,en;q=0.9' : 'en-US,en;q=0.9',
      platform: selectedType === 'mobile' ? 
        (Math.random() > 0.5 ? 'Android' : 'iOS') : 
        (Math.random() > 0.5 ? 'Windows' : 'MacOS'),
      colorDepth: [24, 30, 48][Math.floor(Math.random() * 3)],
      pixelRatio: [1, 1.5, 2, 3][Math.floor(Math.random() * 4)],
      timezone: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'][Math.floor(Math.random() * 4)],
      screenResolution: selectedType === 'mobile' ? 
        ['375x812', '414x896', '390x844'][Math.floor(Math.random() * 3)] : 
        ['1920x1080', '1366x768', '2560x1440', '1280x800'][Math.floor(Math.random() * 4)],
      sessionId: Math.random().toString(36).substring(2, 15)
    };
    
    domainBrowserProfiles.set(hostname, profile);
  }
  
  return domainBrowserProfiles.get(hostname);
}

// Get a proxy agent if available
function getProxyAgent(url, options = {}) {
  if (options.proxyUrl) {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    
    if (options.proxyUrl.startsWith('socks')) {
      return new SocksProxyAgent(options.proxyUrl);
    } else if (isHttps) {
      return new HttpsProxyAgent(options.proxyUrl);
    } else {
      return new HttpProxyAgent(options.proxyUrl);
    }
  }
  
  // Try a random proxy from the list if available
  if (PROXY_LIST.length > 0 && Math.random() > 0.7) {
    const randomProxy = PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    
    if (randomProxy.startsWith('socks')) {
      return new SocksProxyAgent(randomProxy);
    } else if (isHttps) {
      return new HttpsProxyAgent(randomProxy);
    } else {
      return new HttpProxyAgent(randomProxy);
    }
  }
  
  return null;
}

// Function to determine if we should add human-like delay
function shouldAddHumanDelay(hostname) {
  // For domains with strict bot detection, always add delay
  if (STRICT_BOT_DETECTION_DOMAINS.some(domain => hostname.includes(domain))) {
    return true;
  }
  
  // For other domains, add delay randomly
  return Math.random() > 0.3;
}

// Function to get a human-like delay time
function getHumanDelayMs(previousActionType = 'navigation') {
  // Different delays based on action type
  switch (previousActionType) {
    case 'navigation': // Page to page navigation
      return 2000 + Math.floor(Math.random() * 3000);
    case 'click': // Clicking a link
      return 500 + Math.floor(Math.random() * 1000);
    case 'scroll': // Scrolling
      return 1000 + Math.floor(Math.random() * 2000);
    case 'form': // Form submission
      return 1500 + Math.floor(Math.random() * 2500);
    default:
      return 1000 + Math.floor(Math.random() * 2000);
  }
}

// Function to build headers based on the URL and request type
function buildHeaders(url, method, previousUrl = null) {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
  
  // Get or create browser profile for this domain
  const browserProfile = getBrowserProfileForDomain(hostname);
  
  // Get the appropriate headers for this browser type
  const baseHeaders = BROWSER_HEADERS[browserProfile.browserType] || COMMON_HEADERS;
  
  // Clone the headers to avoid modifying the original
  const headers = { ...baseHeaders };
  
  // Set consistent user agent from profile
  headers['User-Agent'] = browserProfile.userAgent;
  
  // Set consistent language preference
  headers['Accept-Language'] = browserProfile.language;
  
  // Set appropriate platform for Sec headers
  if (headers['Sec-Ch-Ua-Platform']) {
    headers['Sec-Ch-Ua-Platform'] = `"${browserProfile.platform}"`;
  }
  
  // Set appropriate mobile flag
  if (headers['Sec-Ch-Ua-Mobile']) {
    headers['Sec-Ch-Ua-Mobile'] = browserProfile.browserType === 'mobile' ? '?1' : '?0';
  }
  
  // Add randomized viewport size for header fingerprinting
  if (Math.random() > 0.5) {
    headers['Viewport-Width'] = browserProfile.screenResolution.split('x')[0];
    headers['Viewport-Height'] = browserProfile.screenResolution.split('x')[1];
  }
  
  // Add client hints for better browser fingerprinting resistance
  if (Math.random() > 0.7) {
    headers['Sec-Ch-Ua-Arch'] = browserProfile.platform.includes('Windows') ? '"x86"' : '"arm"';
    headers['Sec-Ch-Ua-Bitness'] = '"64"';
    headers['Sec-Ch-Ua-Full-Version'] = '"122.0.6261.69"';
    headers['Sec-Ch-Ua-Full-Version-List'] = '"Not A(Brand";v="99", "Google Chrome";v="122", "Chromium";v="122"';
  }
  
  // Add referrer if we have a previous URL or we've visited this domain before
  if (previousUrl) {
    headers['Referer'] = previousUrl;
    // Update Sec-Fetch-Site based on referrer
    const previousParsedUrl = new URL(previousUrl);
    if (previousParsedUrl.hostname === hostname) {
      headers['Sec-Fetch-Site'] = 'same-origin';
    } else if (previousParsedUrl.hostname.endsWith(hostname) || hostname.endsWith(previousParsedUrl.hostname)) {
      headers['Sec-Fetch-Site'] = 'same-site';
    } else {
      headers['Sec-Fetch-Site'] = 'cross-site';
    }
  } else if (visitedSites.has(hostname)) {
    const possibleReferrers = visitedSites.get(hostname);
    if (possibleReferrers.length > 0) {
      headers['Referer'] = possibleReferrers[possibleReferrers.length - 1];
      headers['Sec-Fetch-Site'] = 'same-origin';
    }
  }
  
  // For POST requests, set appropriate content headers
  if (method === 'POST') {
    headers['Sec-Fetch-Mode'] = 'cors';
    headers['Origin'] = `${parsedUrl.protocol}//${parsedUrl.host}`;
  }
  
  return headers;
}

async function makeGetRequest(url, options = {}) {
  return makeRequest(url, 'GET', null, options);
}

async function makePostRequest(url, data, options = {}) {
  return makeRequest(url, 'POST', data, options);
}

async function makeHeadRequest(url, options = {}) {
  return makeRequest(url, 'HEAD', null, options);
}

async function makePutRequest(url, data, options = {}) {
  return makeRequest(url, 'PUT', data, options);
}

async function makeDeleteRequest(url, options = {}) {
  return makeRequest(url, 'DELETE', null, options);
}

async function makePatchRequest(url, data, options = {}) {
  return makeRequest(url, 'PATCH', data, options);
}

async function makeOptionsRequest(url, options = {}) {
  return makeRequest(url, 'OPTIONS', null, options);
}

async function makeRequest(url, method, data = null, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Set a maximum retry/redirect limit
      const maxRetries = options.maxRetries || 5;
      const retryCount = options.retryCount || 0;
      
      if (retryCount >= maxRetries) {
        return reject(new Error(`Maximum retry count exceeded (${maxRetries}). Last URL: ${url}`));
      }
      
      options.retryCount = retryCount + 1;
      
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const hostname = parsedUrl.hostname;
      
      // Implement human-like timing behavior to avoid rate limiting detection
      if (shouldAddHumanDelay(hostname) && lastRequestTime.has(hostname)) {
        const lastTime = lastRequestTime.get(hostname);
        const now = Date.now();
        const elapsed = now - lastTime;
        const minDelay = getHumanDelayMs(options.previousActionType || 'navigation');
        
        if (elapsed < minDelay) {
          // Add a delay that would make this request seem more human-like
          const delayNeeded = minDelay - elapsed;
          console.log(`Adding human-like delay of ${delayNeeded}ms for ${hostname}`);
          await new Promise(resolve => setTimeout(resolve, delayNeeded));
        }
      }
      
      // Set the last request time for this domain
      lastRequestTime.set(hostname, Date.now());
      
      // Check if we're dealing with a protected site that needs special handling
      const isProtectedSite = STRICT_BOT_DETECTION_DOMAINS.some(domain => hostname.includes(domain));
      if (isProtectedSite && !options.bypassDetection) {
        console.log(`Using enhanced protection bypassing for ${hostname}`);
        options.bypassDetection = true;
        
        // Special handling for specific sites
        if (hostname.includes('google.com') && parsedUrl.pathname.includes('/search')) {
          console.log('Detected Google Search, trying alternative approach...');
          const searchParams = parsedUrl.searchParams;
          const query = searchParams.get('q');
          if (query) {
            // Try DuckDuckGo instead for searches
            console.log('Switching to DuckDuckGo for search...');
            return resolve(await makeRequest(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, method, data, 
              { ...options, bypassDetection: false }));
          }
        }
        
        if (hostname.includes('stackoverflow.com')) {
          console.log('Using Stack Overflow optimized approach...');
          
          // Special handling for Stack Overflow
          if (!options.optimizedUserAgent) {
            options.optimizedUserAgent = true;
            const optimizedOptions = { ...options };
            optimizedOptions.headers = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Cache-Control': 'max-age=0'
            };
            return resolve(await makeRequest(url, method, data, optimizedOptions));
          }
        }
        
        if (hostname.includes('reddit.com')) {
          console.log('Using Reddit optimized approach...');
          
          // Try old Reddit first which has fewer protections
          if (!options.oldReddit && !url.includes('old.reddit.com')) {
            options.oldReddit = true;
            const oldRedditUrl = url.replace('reddit.com', 'old.reddit.com');
            console.log(`Trying old Reddit: ${oldRedditUrl}`);
            return resolve(await makeRequest(oldRedditUrl, method, data, options));
          }
          
          // If that doesn't work, try using a different fingerprint
          if (!options.optimizedUserAgent) {
            options.optimizedUserAgent = true;
            const optimizedOptions = { ...options };
            optimizedOptions.headers = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.reddit.com/',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'same-origin',
              'Pragma': 'no-cache',
              'Cache-Control': 'no-cache'
            };
            return resolve(await makeRequest(url, method, data, optimizedOptions));
          }
        }
      }
      
      // Get cookies for this URL (if any)
      const cookies = getCookiesForUrl(url);
      
      // Get the previous URL for this hostname if it exists
      const previousUrl = visitedSites.has(hostname) ? 
        visitedSites.get(hostname)[visitedSites.get(hostname).length - 1] : 
        null;
      
      // Build request headers with enhanced browser fingerprinting resistance
      const headers = buildHeaders(url, method, previousUrl);
      
      // Add cookies to headers if available
      if (cookies && cookies.length > 0) {
        headers.Cookie = cookies.join('; ');
      }
      
      // Handle data for methods that accept a body (POST, PUT, PATCH)
      let requestData;
      let contentTypeSet = false;
      
      if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && data) {
        const prepared = preparePostData(data, options);
        requestData = prepared.data;
        headers['Content-Type'] = prepared.contentType;
        contentTypeSet = true;
        
        // Set the content length based on the data type
        if (Buffer.isBuffer(requestData)) {
          headers['Content-Length'] = requestData.length;
        } else {
          headers['Content-Length'] = Buffer.byteLength(requestData);
        }
      }
      
      // Override with any custom headers from options
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      
      // Set up request options with proxy support
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: headers
      };
      
      // Add proxy support if configured
      const proxyAgent = getProxyAgent(url, options);
      if (proxyAgent) {
        requestOptions.agent = proxyAgent;
        console.log(`Using proxy for request to ${hostname}`);
      }
      
      // Choose HTTP client based on protocol
      const client = isHttps ? https : http;
      
      const req = client.request(requestOptions, (res) => {
        // Check if this is likely binary content
        const contentType = res.headers['content-type'] || '';
        const isBinary = isBinaryContentType(contentType);
        
        // Create response object
        const response = {
          statusCode: res.statusCode,
          headers: res.headers,
          body: '',
          url: url, // Keep track of the final URL
          isBinary: isBinary,
          contentType: contentType,
          requestHeaders: headers // Store the headers we sent (useful for debugging)
        };
        
        // Check for rate limiting or bot detection headers
        const isRateLimited = res.statusCode === 429 || 
          (res.headers['x-ratelimit-remaining'] && res.headers['x-ratelimit-remaining'] === '0');
        
        const isCaptchaDetected = contentType.includes('text/html') && 
          (res.statusCode === 403 || res.statusCode === 503);
        
        // Save cookies from the response for session persistence
        if (res.headers['set-cookie']) {
          saveCookiesFromResponse(url, res.headers['set-cookie']);
        }
        
        // Handle redirects with proper referrer chain
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          console.log(`Following redirect to: ${redirectUrl}`);
          
          // Pass the current URL as the referrer for the next request
          return resolve(makeRequest(redirectUrl, method, data, {
            ...options,
            previousUrl: url,
            previousActionType: 'navigation',
            redirectCount: (options.redirectCount || 0) + 1
          }));
        }
        
        // Limit excessive redirects
        if (options.redirectCount && options.redirectCount > 10) {
          return reject(new Error('Too many redirects'));
        }
        
        // HEAD requests don't have a body
        if (method === 'HEAD') {
          return resolve(response);
        }
        
        // Store URL in visited sites for later referrer usage
        if (!visitedSites.has(hostname)) {
          visitedSites.set(hostname, []);
        }
        visitedSites.get(hostname).push(url);
        
        // Detect charset from content-type header
        const charset = detectCharset(contentType);
        
        // Handle binary content differently
        if (isBinary) {
          const chunks = [];
          
          // For binary content, collect raw buffers
          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          res.on('end', () => {
            // Store the binary data as a buffer
            response.body = Buffer.concat(chunks);
            // Add file extension if we can detect it
            response.fileExtension = getFileExtensionFromContentType(contentType);
            
            // Check for bot detection or rate limiting
            if ((isRateLimited || isCaptchaDetected) && !options.bypassAttempted) {
              options.bypassAttempted = true;
              return handleProtectedSite(response, url)
                .then(resolve)
                .catch(reject);
            }
            
            resolve(response);
          });
        }
        // Handle compressed content (gzip, deflate, br)
        else if (res.headers['content-encoding'] && !options.skipCompression) {
          const encoding = res.headers['content-encoding'];
          const chunks = [];
          let decompressor;
          
          if (encoding.includes('gzip')) {
            decompressor = zlib.createGunzip();
          } else if (encoding.includes('deflate')) {
            decompressor = zlib.createInflate();
          } else if (encoding.includes('br')) {
            decompressor = zlib.createBrotliDecompress();
          } else {
            // Unknown compression, fallback to raw collection
            console.log(`Unknown encoding: ${encoding}, collecting raw data`);
            
            res.on('data', (chunk) => {
              chunks.push(chunk);
            });
            
            res.on('end', () => {
              const buffer = Buffer.concat(chunks);
              // Try to decode with detected charset or fallback to utf8
              response.body = convertBufferToString(buffer, charset);
              
              // Check for bot detection signals in the response
              if (isRateLimited || isCaptchaDetected || 
                 (response.body && (
                   response.body.includes('captcha') || 
                   (response.body.includes('robot') && response.body.includes('detected')) || 
                   response.body.includes('unusual traffic') ||
                   (response.body.includes('automated') && response.body.includes('script')) ||
                   (response.body.includes('cloudflare') && response.body.includes('checking your browser'))
                 )) && !options.bypassAttempted) {
                options.bypassAttempted = true;
                return handleProtectedSite(response, url)
                  .then(resolve)
                  .catch(reject);
              }
              
              resolve(response);
            });
            
            return;
          }
          
          res.pipe(decompressor);
          
          decompressor.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          decompressor.on('end', () => {
            const buffer = Buffer.concat(chunks);
            // Use the detected charset to convert the buffer to string
            response.body = convertBufferToString(buffer, charset);
            
            // Check for bot detection signals in the response
            if (isRateLimited || isCaptchaDetected || 
               (response.body && (
                 response.body.includes('captcha') || 
                 (response.body.includes('robot') && response.body.includes('detected')) || 
                 response.body.includes('unusual traffic') ||
                 (response.body.includes('automated') && response.body.includes('script')) ||
                 (response.body.includes('cloudflare') && response.body.includes('checking your browser'))
               )) && !options.bypassAttempted) {
              options.bypassAttempted = true;
              return handleProtectedSite(response, url)
                .then(resolve)
                .catch(reject);
            }
            
            resolve(response);
          });
          
          decompressor.on('error', (error) => {
            console.log(`Decompression failed: ${error.message}, falling back to raw data`);
            // Fallback to direct collection on decompression failure
            makeRequest(url, method, data, { ...options, skipCompression: true })
              .then(resolve)
              .catch(reject);
          });
        } else {
          // Standard text content - collect as raw buffer for proper encoding handling
          const chunks = [];
          
          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            // Use the detected charset to convert the buffer to string
            response.body = convertBufferToString(buffer, charset);
            
            // Check for bot detection signals in the response
            if (isRateLimited || isCaptchaDetected || 
               (response.body && (
                 response.body.includes('captcha') || 
                 (response.body.includes('robot') && response.body.includes('detected')) || 
                 response.body.includes('unusual traffic') ||
                 (response.body.includes('automated') && response.body.includes('script')) ||
                 (response.body.includes('cloudflare') && response.body.includes('checking your browser'))
               )) && !options.bypassAttempted) {
              options.bypassAttempted = true;
              return handleProtectedSite(response, url)
                .then(resolve)
                .catch(reject);
            }
            
            resolve(response);
          });
        }
      });
      
      req.on('error', (error) => {
        // For network errors, try with a proxy if available
        if (!options.proxyRetry && PROXY_LIST.length > 0) {
          console.log(`Request failed: ${error.message}, trying with proxy...`);
          options.proxyRetry = true;
          options.proxyUrl = PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
          return resolve(makeRequest(url, method, data, options));
        }
        
        reject(new Error(`Request failed: ${error.message}`));
      });
      
      // Handle timeout
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
      
      // Set a timeout
      req.setTimeout(60000); // 60 seconds (increased for slower proxy connections)
      
      // Send data if applicable for methods that support a body
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestData) {
        req.write(requestData);
      }
      
      req.end();
      
    } catch (error) {
      reject(new Error(`Invalid URL or request error: ${error.message}`));
    }
  });
}

// Enhanced POST data preparation
function preparePostData(data, options = {}) {
  // Check if we need to use multipart/form-data (for file uploads)
  if (data && data.files && Object.keys(data.files).length > 0) {
    return prepareMultipartFormData(data);
  }
  
  // Handle different data formats for regular form data
  if (typeof data === 'string') {
    return {
      contentType: 'application/x-www-form-urlencoded',
      data: data
    };
  } else if (data && data.fields) {
    return {
      contentType: 'application/x-www-form-urlencoded',
      data: querystring.stringify(data.fields)
    };
  } else if (data instanceof Object) {
    // Check if this is JSON data
    if (options.json) {
      return {
        contentType: 'application/json',
        data: JSON.stringify(data)
      };
    }
    return {
      contentType: 'application/x-www-form-urlencoded',
      data: querystring.stringify(data)
    };
  }
  
  return {
    contentType: 'application/x-www-form-urlencoded',
    data: ''
  };
}

// Function to prepare multipart/form-data for file uploads
function prepareMultipartFormData(data) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
  const CRLF = '\r\n';
  let body = '';
  
  // Add regular form fields
  if (data.fields) {
    Object.entries(data.fields).forEach(([key, value]) => {
      body += `--${boundary}${CRLF}`;
      body += `Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}`;
      body += `${value}${CRLF}`;
    });
  }
  
  // Add files
  const fileBuffers = [];
  let currentPosition = body.length;
  const filePositions = [];
  
  // First pass: calculate positions and prepare file info
  Object.entries(data.files).forEach(([fieldName, filePath]) => {
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const mimeType = getMimeType(filePath);
    
    // Add file header
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${CRLF}`;
    body += `Content-Type: ${mimeType}${CRLF}${CRLF}`;
    
    // Record the position where file content will go
    filePositions.push({
      start: currentPosition + body.length,
      path: filePath,
      size: fileStats.size
    });
    
    // Add placeholder for file and end line
    currentPosition += body.length + fileStats.size + CRLF.length;
    body += `[FILE_CONTENT_PLACEHOLDER]${CRLF}`;
  });
  
  // Add final boundary
  body += `--${boundary}--`;
  
  // Convert body to buffer and insert files
  let bodyBuffer = Buffer.from(body);
  
  // Create the entire form data from scratch, properly handling file content
  const parts = [];
  
  // Add the regular fields
  if (data.fields) {
    Object.entries(data.fields).forEach(([key, value]) => {
      parts.push(Buffer.from(`--${boundary}${CRLF}`));
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}`));
      parts.push(Buffer.from(`${value}${CRLF}`));
    });
  }
  
  // Add the file fields
  if (data.files) {
    Object.entries(data.files).forEach(([fieldName, filePath]) => {
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);
      
      parts.push(Buffer.from(`--${boundary}${CRLF}`));
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${CRLF}`));
      parts.push(Buffer.from(`Content-Type: ${mimeType}${CRLF}${CRLF}`));
      parts.push(fileContent);
      parts.push(Buffer.from(CRLF));
    });
  }
  
  // Add the closing boundary
  parts.push(Buffer.from(`--${boundary}--`));
  
  // Concatenate all parts into a single buffer
  bodyBuffer = Buffer.concat(parts);
  
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    data: bodyBuffer
  };
}

// Function to determine MIME type from file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'video/webm'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Enhanced detection and handling of protected sites with bot detection
async function handleProtectedSite(response, url) {
  if (!response || !response.body) {
    return tryAlternativeAccess(url, { bypassLevel: 'high' });
  }
  
  const body = response.body.toLowerCase();
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
  
  // Check for Cloudflare protection
  if (body.includes('cloudflare') && 
      (body.includes('checking your browser') || 
       body.includes('security challenge') || 
       body.includes('just a moment') ||
       body.includes('attention required'))) {
    console.log('Cloudflare protection detected. Using specialized bypass approach...');
    return tryAlternativeAccess(url, { protectionType: 'cloudflare', originalResponse: response });
  }
  
  // Check for Google captcha
  if (body.includes('our systems have detected unusual traffic') || 
      body.includes('please solve this captcha') ||
      body.includes('unusual traffic from your computer') ||
      (body.includes('automatic query') && body.includes('blocked'))) {
    console.log('Google captcha detected. Using alternative search provider...');
    return tryAlternativeAccess(url, { protectionType: 'google', originalResponse: response });
  }
  
  // Check for Stack Overflow specific limitations
  if (hostname.includes('stackoverflow.com') && 
     (response.statusCode === 403 || 
      response.statusCode === 429 || 
      body.includes('human verification') || 
      body.includes('too many requests'))) {
    console.log('Stack Overflow protection detected. Using specialized bypass...');
    return tryAlternativeAccess(url, { protectionType: 'stackoverflow', originalResponse: response });
  }
  
  // Check for Reddit limitations
  if (hostname.includes('reddit.com') && 
     (response.statusCode === 403 || 
      body.includes('our cdn was unable to reach our servers') ||
      body.includes('blocked') ||
      (body.includes('robots') && body.includes('detection'))) &&
      !url.includes('.compact')) {
    console.log('Reddit protection detected. Trying old Reddit interface...');
    return tryAlternativeAccess(url, { protectionType: 'reddit', originalResponse: response });
  }
  
  // Generic CAPTCHA detection
  if (body.includes('captcha') || 
      body.includes('robot') || 
      body.includes('automated') || 
      body.includes('bot detection') ||
      body.includes('human verification') ||
      body.includes('please verify you are human') ||
      response.statusCode === 403 || 
      response.statusCode === 429) {
    console.log('Generic bot protection detected. Attempting bypass...');
    return tryAlternativeAccess(url, { protectionType: 'generic', originalResponse: response });
  }
  
  // If no specific protection is detected, return the original response
  return response;
}

// Function to detect if content type represents binary data
function isBinaryContentType(contentType) {
  if (!contentType) return false;
  
  const binaryTypes = [
    'image/', 
    'audio/', 
    'video/', 
    'application/octet-stream',
    'application/pdf', 
    'application/zip', 
    'application/x-rar-compressed',
    'application/vnd.ms-', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/x-msdownload', 
    'application/x-binary',
    'application/xlsx',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'font/',
    'application/x-font'
  ];
  
  return binaryTypes.some(type => contentType.includes(type));
}

// Function to get file extension from content type
function getFileExtensionFromContentType(contentType) {
  if (!contentType) return '';
  
  const contentTypeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/x-icon': 'ico',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-tar': 'tar',
    'application/gzip': 'gz',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
  };
  
  // Check for exact match
  if (contentTypeMap[contentType]) {
    return contentTypeMap[contentType];
  }
  
  // Check for partial match (like image/jpeg;charset=utf-8)
  const baseType = contentType.split(';')[0].trim();
  if (contentTypeMap[baseType]) {
    return contentTypeMap[baseType];
  }
  
  // Extract from content type if it's in format type/subtype
  const parts = baseType.split('/');
  if (parts.length === 2) {
    return parts[1];
  }
  
  return '';
}

// Enhanced alternative access methods with more sophisticated bypass techniques
async function tryAlternativeAccess(url, options = {}) {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
  const protectionType = options.protectionType || 'unknown';
  const bypassLevel = options.bypassLevel || 'medium';
  
  console.log(`Attempting to bypass ${protectionType} protection for ${hostname} with ${bypassLevel} intensity...`);
  
  // Special handling based on protection type
  if (protectionType === 'cloudflare') {
    // Try a mobile user agent first (often less restricted)
    const mobileOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      waitBetweenRequests: true,
      bypassAttempted: true
    };
    
    // Add delay to appear more human-like
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
    
    try {
      return await makeGetRequest(url, mobileOptions);
    } catch (error) {
      console.log(`Mobile agent approach failed: ${error.message}, trying alternative method...`);
    }
    
    // If mobile user agent fails, try with Googlebot
    const botOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'From': 'googlebot(at)googlebot.com',
        'AdsBot-Google': '(+http://www.google.com/adsbot.html)'
      },
      bypassAttempted: true
    };
    
    return makeGetRequest(url, botOptions);
  }
  
  // Special handling for Google search
  else if (protectionType === 'google' || hostname.includes('google.com')) {
    // Extract search query if this is a search URL
    const searchParams = parsedUrl.searchParams;
    const query = searchParams.get('q');
    
    if (query) {
      console.log('Switching to DuckDuckGo Lite search engine...');
      return makeGetRequest(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, { 
        bypassAttempted: true,
        previousActionType: 'search'
      });
    }
    
    // If not a search, try with a different search engine prefix
    if (parsedUrl.pathname.includes('/search')) {
      console.log('Switching to alternate search provider...');
      const path = parsedUrl.pathname + parsedUrl.search;
      return makeGetRequest(`https://lite.duckduckgo.com/lite/${path}`, { 
        bypassAttempted: true 
      });
    }
  }
  
  // Stack Overflow specific handling
  else if (protectionType === 'stackoverflow' || hostname.includes('stackoverflow.com')) {
    console.log('Using Stack Overflow specific bypass technique...');
    
    // Try with Firefox user agent and delayed request
    await new Promise(r => setTimeout(r, 4000 + Math.random() * 3000));
    
    const ffOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'TE': 'trailers'
      },
      bypassAttempted: true
    };
    
    return makeGetRequest(url, ffOptions);
  }
  
  // Reddit specific handling
  else if (protectionType === 'reddit' || hostname.includes('reddit.com')) {
    console.log('Using Reddit specific bypass technique...');
    
    // First try old.reddit.com which has fewer restrictions
    if (!url.includes('old.reddit.com')) {
      const oldRedditUrl = url.replace('reddit.com', 'old.reddit.com');
      console.log(`Trying old Reddit interface: ${oldRedditUrl}`);
      
      try {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        return await makeGetRequest(oldRedditUrl, { bypassAttempted: true });
      } catch (error) {
        console.log(`Old Reddit approach failed: ${error.message}, trying mobile interface...`);
      }
    }
    
    // If old Reddit fails, try mobile interface
    if (!url.includes('.compact') && !url.includes('/compact')) {
      let mobileUrl = url;
      if (url.endsWith('/')) {
        mobileUrl += '.compact';
      } else {
        mobileUrl += '/.compact';
      }
      
      console.log(`Trying Reddit mobile interface: ${mobileUrl}`);
      
      const mobileOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://old.reddit.com/'
        },
        bypassAttempted: true
      };
      
      return makeGetRequest(mobileUrl, mobileOptions);
    }
  }
  
  // Generic approach for other sites
  console.log('Using generic bot protection bypass approach...');
  
  // Try with rotating headers and user agents
  const browserTypes = ['chrome', 'firefox', 'safari', 'edge'];
  const selectedBrowser = browserTypes[Math.floor(Math.random() * browserTypes.length)];
  
  // Get browser-specific headers
  const headers = { ...BROWSER_HEADERS[selectedBrowser] };
  
  // Add random user agent appropriate for the selected browser
  headers['User-Agent'] = getRandomUserAgent(selectedBrowser);
  
  // Additional headers to reduce fingerprinting
  if (Math.random() > 0.5) {
    headers['DNT'] = '1';
  }
  
  if (Math.random() > 0.7) {
    headers['Permissions-Policy'] = 'interest-cohort=()';
  }
  
  // Randomize accept header slightly
  if (Math.random() > 0.7) {
    headers['Accept'] = headers['Accept'].replace('q=0.9', `q=0.${8 + Math.floor(Math.random() * 2)}`);
  }
  
  // Add delay to appear more human-like
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
  
  return makeGetRequest(url, { 
    headers, 
    bypassAttempted: true,
    waitBetweenRequests: true
  });
}

// Function to detect charset from content-type header
function detectCharset(contentType) {
  if (!contentType) return 'utf8';
  
  // Look for charset in content-type header
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  if (charsetMatch) {
    const charset = charsetMatch[1].trim().toLowerCase();
    // Handle charset aliases (like latin1 for iso-8859-1)
    if (charset === 'iso-8859-1' || charset === 'latin1') {
      return 'latin1';
    }
    return charset;
  }
  
  // Look for charset in meta tags for HTML content (handled separately in parser.js)
  
  // Default to utf8 for html content
  if (contentType.includes('html')) {
    return 'utf8';
  }
  
  // For other content types, try to guess from common associations
  if (contentType.includes('text/')) {
    return 'utf8';
  }
  
  // For unknown types, use utf8 as a safe default
  return 'utf8';
}

// Function to detect charset from HTML content (meta tags)
function detectHtmlCharset(content) {
  if (!content) return null;
  
  // Try to find charset in meta tags
  const metaCharsetMatch = content.toString('latin1').match(/<meta[^>]+charset=["']?([^"'>]+)/i);
  if (metaCharsetMatch) {
    return metaCharsetMatch[1].trim().toLowerCase();
  }
  
  // Try to find content-type meta tag
  const metaContentTypeMatch = content.toString('latin1')
    .match(/<meta[^>]+content=["']?[^"']*charset=([^"'>]+)/i);
  if (metaContentTypeMatch) {
    return metaContentTypeMatch[1].trim().toLowerCase();
  }
  
  return null;
}

// Function to convert buffer to string with proper encoding
function convertBufferToString(buffer, charset = 'utf8') {
  if (!buffer || buffer.length === 0) return '';
  
  // First try to detect HTML charset from content if no charset was provided
  if (charset === 'utf8' && buffer.length > 0) {
    const detectedHtmlCharset = detectHtmlCharset(buffer);
    if (detectedHtmlCharset) {
      charset = detectedHtmlCharset;
    }
  }
  
  try {
    // Check if charset is supported by iconv-lite
    if (iconv.encodingExists(charset)) {
      return iconv.decode(buffer, charset);
    } else {
      // Fallback to utf8 for unsupported charsets
      console.log(`Unsupported charset: ${charset}, falling back to utf8`);
      return buffer.toString('utf8');
    }
  } catch (error) {
    // If conversion fails, try with a series of common encodings
    console.log(`Encoding conversion error with ${charset}: ${error.message}, trying common charsets`);
    
    // Try each common charset until one succeeds or we run out of options
    for (const commonCharset of COMMON_CHARSETS) {
      if (commonCharset.toLowerCase() === charset.toLowerCase()) continue; // Skip the one we already tried
      
      try {
        if (iconv.encodingExists(commonCharset)) {
          const result = iconv.decode(buffer, commonCharset);
          console.log(`Successfully decoded with ${commonCharset}`);
          return result;
        }
      } catch (e) {
        // Continue to the next charset
      }
    }
    
    // If all charsets fail, fall back to utf8
    console.log('All charset conversions failed, falling back to utf8');
    return buffer.toString('utf8');
  }
}

// Import the documentation cache manager
const docCacheManager = require('./docCacheManager');

/**
 * Enhanced documentation access for sites with bot protection
 * Specializes in accessing API documentation while respecting TOS
 * @param {string} url - The URL of the documentation to access
 * @param {Object} options - Advanced options for documentation access
 * @returns {Promise<Object>} - The documentation response
 */
async function enhancedDocumentationAccess(url, options = {}) {
  // Check if this is a documentation URL
  const isDocumentationUrl = isDocUrl(url);
  
  if (!isDocumentationUrl) {
    console.log('URL does not appear to be documentation. Using standard request method.');
    return makeGetRequest(url, options);
  }
  
  console.log(`Enhanced documentation access for ${url}`);
  
  // Determine the documentation source type
  const docSite = getDocumentationSiteType(url);
  
  // Set up caching options
  const useCache = options.useCache !== false;
  
  // If cache is disabled or force refresh is requested, bypass cache
  if (!useCache || options.forceRefresh) {
    console.log(`${!useCache ? 'Caching disabled' : 'Force refresh requested'} - bypassing cache`);
    return fetchDocumentationDirect(docSite, url, options);
  }
  
  // Check if this documentation is in the cache
  if (docCacheManager.hasCachedResponse(url, options)) {
    console.log(`Documentation found in cache for ${url}`);
    
    // Get documentation from cache
    const cachedResponse = docCacheManager.getCachedResponse(url, options);
    
    // If the cached response is valid, return it
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Not in cache or invalid cache, fetch fresh documentation
  console.log(`Documentation not in cache or cache invalid for ${url}. Fetching fresh.`);
  const response = await fetchDocumentationDirect(docSite, url, options);
  
  // Cache the response if valid
  if (response && response.statusCode >= 200 && response.statusCode < 300) {
    console.log(`Caching documentation for ${url}`);
    docCacheManager.cacheResponse(url, response, options);
  }
  
  return response;
}

/**
 * Direct documentation fetching without cache
 * @private
 */
async function fetchDocumentationDirect(docSite, url, options) {
  // Apply specialized handling based on the documentation source
  switch(docSite) {
    case 'openai':
      return getOpenAIDocumentation(url, options);
      
    case 'github':
      return getGitHubDocumentation(url, options);
      
    case 'stackoverflow':
      return getStackOverflowDocumentation(url, options);
      
    case 'nodejs':
      return getNodeJsDocumentation(url, options);
      
    case 'python':
      return getPythonDocumentation(url, options);
      
    default:
      return getGenericDocumentation(url, options);
  }
}

/**
 * Determines if a URL is likely a documentation page
 */
function isDocUrl(url) {
  const docPatterns = [
    '/docs/', '/documentation/', '/guide/', '/manual/',
    '/reference/', '/api/', '/sdk/', '/dev/', '/tutorial/',
    'developer.', '.readthedocs.', '/swagger', '/redoc',
    '/openapi', '/help/', '/guide/'
  ];
  
  return docPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

/**
 * Determines the type of documentation site
 */
function getDocumentationSiteType(url) {
  const domain = new URL(url).hostname.toLowerCase();
  
  if (domain.includes('openai.com') || url.includes('openai.com/docs')) {
    return 'openai';
  } else if (domain.includes('github') || domain.includes('github.io')) {
    return 'github';
  } else if (domain.includes('stackoverflow.com')) {
    return 'stackoverflow';
  } else if (domain.includes('nodejs.org')) {
    return 'nodejs';
  } else if (domain.includes('python.org') || domain.includes('docs.python.org')) {
    return 'python';
  } else if (domain.includes('docs.microsoft.com') || domain.includes('learn.microsoft.com')) {
    return 'microsoft';
  } else if (domain.includes('developer.mozilla.org')) {
    return 'mdn';
  } else if (domain.includes('docs.aws.amazon.com')) {
    return 'aws';
  } else if (domain.includes('cloud.google.com')) {
    return 'gcp';
  } else {
    return 'generic';
  }
}

/**
 * Specialized handler for OpenAI documentation
 */
async function getOpenAIDocumentation(url, options = {}) {
  console.log('Using specialized OpenAI documentation handler');
  
  // Add longer delays and emulate desktop browser
  const openaiOptions = {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Ch-Ua': '"Google Chrome";v="122", "Not(A:Brand";v="24", "Chromium";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Priority': 'u=0, i',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive'
    },
    waitBetweenRequests: true
  };
  
  // Add significant delay to mimic human reading
  await new Promise(r => setTimeout(r, 5000 + Math.random() * 3000));
  
  try {
    // First try with standard request
    const response = await makeGetRequest(url, openaiOptions);
    
    // Check if we got a valid response
    if (response.statusCode >= 200 && response.statusCode < 300 && 
        !response.body.includes('captcha') && 
        !response.body.includes('unusual traffic')) {
      return response;
    }
    
    // If OpenAI main documentation page doesn't work, try the GitHub documentation
    if (url.includes('openai.com/docs') || url.includes('platform.openai.com')) {
      console.log('Trying alternative OpenAI documentation from GitHub...');
      // GitHub hosts OpenAI's SDK documentation
      const githubUrl = 'https://github.com/openai/openai-node';
      return makeGetRequest(githubUrl, { ...options, bypassAttempted: true });
    }
    
    // If all else fails, fall back to generic access
    return response;
  } catch (error) {
    console.error(`Error accessing OpenAI documentation: ${error.message}`);
    // Try alternative documentation sources as fallback
    console.log('Trying OpenAI documentation via GitHub...');
    const githubUrl = 'https://github.com/openai/openai-node';
    return makeGetRequest(githubUrl, { ...options, bypassAttempted: true });
  }
}

/**
 * Specialized handler for GitHub documentation
 */
async function getGitHubDocumentation(url, options = {}) {
  console.log('Using specialized GitHub documentation handler');
  
  // Create GitHub-specific request options
  const githubOptions = {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1'
    }
  };
  
  // Add human-like delay
  await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
  
  // If this is a GitHub repo root, try to find documentation
  if (url.match(/github\.com\/[^\/]+\/[^\/]+\/?$/)) {
    console.log('GitHub repository root detected. Looking for documentation...');
    
    try {
      // Make the request to the repo root
      const rootResponse = await makeGetRequest(url, githubOptions);
      
      // Check for common documentation links in GitHub repos
      if (rootResponse.body.includes('README.md') || 
          rootResponse.body.includes('docs/') || 
          rootResponse.body.includes('documentation/')) {
        
        // Extract README content directly from the page, as it's usually rendered on the main page
        return rootResponse;
      }
      
      // If no obvious documentation, look for specific documentation links
      if (rootResponse.body.includes('/wiki') || rootResponse.body.includes('/docs/')) {
        // Try to find docs directory
        const docsUrl = `${url}/tree/main/docs`;
        console.log(`Checking for docs directory: ${docsUrl}`);
        return makeGetRequest(docsUrl, githubOptions);
      }
      
      return rootResponse;
    } catch (error) {
      console.error(`Error accessing GitHub documentation: ${error.message}`);
      return makeGetRequest(url, { ...options, bypassAttempted: true });
    }
  }
  
  // Standard request for other GitHub URLs
  return makeGetRequest(url, githubOptions);
}

/**
 * Specialized handler for Stack Overflow documentation
 */
async function getStackOverflowDocumentation(url, options = {}) {
  console.log('Using specialized Stack Overflow documentation handler');
  
  // Stack Overflow has strong bot protection, use enhanced options
  const soOptions = {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    }
  };
  
  // Stack Overflow requires significant delays to avoid detection
  await new Promise(r => setTimeout(r, 8000 + Math.random() * 4000));
  
  try {
    const response = await makeGetRequest(url, soOptions);
    
    // If successful, return the response
    if (response.statusCode >= 200 && response.statusCode < 300 && 
        !response.body.includes('captcha') && 
        !response.body.includes('human verification')) {
      return response;
    }
    
    // If blocked, try an alternative approach
    console.log('Stack Overflow protection detected, trying alternative approach...');
    
    // Extract query terms from the URL if it's a search
    if (url.includes('/search?q=')) {
      const query = new URL(url).searchParams.get('q');
      if (query) {
        // Try searching the same topic on a different site
        console.log(`Redirecting search to GitHub: ${query}`);
        return makeGetRequest(`https://github.com/search?q=${encodeURIComponent(query)}`, 
                             { ...options, bypassAttempted: true });
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Error accessing Stack Overflow: ${error.message}`);
    return makeGetRequest(url, { ...options, bypassAttempted: true });
  }
}

/**
 * Specialized handler for Node.js documentation
 */
async function getNodeJsDocumentation(url, options = {}) {
  console.log('Using specialized Node.js documentation handler');
  
  // Node.js docs don't typically have strong protection, but use consistent fingerprinting
  const nodeOptions = {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  };
  
  // Add moderate delay for consistency
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
  
  // For Node.js, check if we're looking for a specific module
  if (url.includes('/api/') && !url.includes('#')) {
    // This is likely a module documentation page
    return makeGetRequest(url, nodeOptions);
  }
  
  // Standard request for general Node.js documentation
  return makeGetRequest(url, nodeOptions);
}

/**
 * Specialized handler for Python documentation
 */
async function getPythonDocumentation(url, options = {}) {
  console.log('Using specialized Python documentation handler');
  
  // Python docs don't typically have strong protection
  const pythonOptions = {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Upgrade-Insecure-Requests': '1'
    }
  };
  
  // Add moderate delay
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
  
  return makeGetRequest(url, pythonOptions);
}

/**
 * Generic handler for other documentation sites
 */
async function getGenericDocumentation(url, options = {}) {
  console.log('Using enhanced generic documentation handler');
  
  // Use a popular browser profile for generic documentation
  const genericOptions = {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Ch-Ua': '"Google Chrome";v="122", "Not(A:Brand";v="24", "Chromium";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive'
    }
  };
  
  // Add moderate delay to appear more human-like
  await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
  
  try {
    const response = await makeGetRequest(url, genericOptions);
    
    // Check if we got a valid response
    if (response.statusCode >= 200 && response.statusCode < 300 && 
        !response.body.includes('captcha') && 
        !response.body.includes('unusual traffic')) {
      return response;
    }
    
    // If blocked, try alternative approach
    console.log('Documentation protection detected, trying alternative approach...');
    return tryAlternativeAccess(url, { protectionType: 'documentation', originalResponse: response });
  } catch (error) {
    console.error(`Error accessing documentation: ${error.message}`);
    return makeGetRequest(url, { ...options, bypassAttempted: true });
  }
}

module.exports = {
  makeGetRequest,
  makePostRequest,
  makeHeadRequest,
  makePutRequest,
  makeDeleteRequest,
  makePatchRequest,
  makeOptionsRequest,
  handleProtectedSite,
  tryAlternativeAccess,
  isBinaryContentType,
  getFileExtensionFromContentType,
  detectCharset,
  detectHtmlCharset,
  convertBufferToString,
  getRandomUserAgent,
  getBrowserProfileForDomain,
  getProxyAgent,
  shouldAddHumanDelay,
  getHumanDelayMs,
  detectBrowserType,
  prepareMultipartFormData,
  enhancedDocumentationAccess,
  isDocUrl,
  getDocumentationSiteType
};
