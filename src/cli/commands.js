/**
 * Command execution for Agris browser
 */

const fs = require('fs');
const path = require('path');
const { 
  makeGetRequest, 
  makePostRequest, 
  makeHeadRequest, 
  makePutRequest,
  makeDeleteRequest,
  makePatchRequest,
  makeOptionsRequest,
  handleProtectedSite,
  enhancedDocumentationAccess
} = require('../core/request');
const { processResponse } = require('../core/response');
const { parseHtml, parseWithJavaScript } = require('../core/parser');
const { renderContent } = require('../core/renderer');
const { getState, setState } = require('../core/state');
const { normalizeUrl } = require('../core/utils');
const { version } = require('../../package.json');

async function executeCommand(parsedInput) {
  const { command, options, url, data } = parsedInput;

  switch (command) {
    case 'get':
      return handleGet(url, options);
    
    case 'post':
      return handlePost(url, data, options);
    
    case 'head':
      return handleHead(url, options);
    
    case 'put':
      return handlePut(url, data, options);
    
    case 'delete':
      return handleDelete(url, options);
    
    case 'patch':
      return handlePatch(url, data, options);
    
    case 'options':
      return handleOptions(url, options);
      
    case 'search':
      return handleSearch(url, options);
    
    case 'follow':
      return handleFollow(url, options);
    
    case 'help':
      return showHelp();
    
    case 'version':
      return showVersion();
    
    case 'jsget':
      return handleJsGet(url, options);
    
    case 'docs':
      return handleDocs(url, options);
    
    default:
      throw new Error(`Command '${command}' not implemented yet`);
  }
}

async function handleGet(url, options) {
  let response = await makeGetRequest(url);
  
  // Check for bot detection and try alternative approach if needed
  if (!response.isBinary && (
      response.body.includes('captcha') || 
      response.body.includes('unusual traffic') ||
      response.body.includes('cloudflare') ||
      response.body.includes('checking your browser') ||
      response.body.includes('enable javascript'))) {
    console.log('Bot detection detected, trying alternative approach...');
    try {
      response = await handleProtectedSite(response, url);
    } catch (error) {
      console.error(`Alternative approach failed: ${error.message}`);
    }
  }
  
  if (options.raw) {
    // Output raw response (but handle binary content differently)
    if (response.isBinary) {
      console.log(`\n[Binary content detected: ${response.contentType}]`);
      console.log(`Cannot display raw binary content in terminal. Size: ${response.body.length} bytes`);
    } else {
      console.log(response.body);
    }
  } else {
    // Handle binary content directly
    if (response.isBinary) {
      // Store basic info in state in case follow needs it
      setState('lastPage', {
        content: {
          text: [`Binary content: ${response.contentType}`],
          links: [],
          forms: []
        },
        baseUrl: url
      });
      
      // Render binary content info
      renderContent(response, options);
    } else {
      // Parse and render the content
      const processedResponse = processResponse(response);
      const parsedContent = parseHtml(processedResponse.body, url);
      
      // Store this page for the follow command to use later
      setState('lastPage', {
        content: parsedContent,
        baseUrl: url
      });
      
      renderContent(parsedContent, options);
    }
  }
}

async function handleJsGet(url, options) {
  console.log(`Fetching ${url} with JavaScript rendering enabled...`);
  
  try {
    // First check if this is a binary URL by file extension
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') ||
        lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif') ||
        lowerUrl.endsWith('.pdf') || lowerUrl.endsWith('.mp3') ||
        lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') ||
        lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx') ||
        lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx') ||
        lowerUrl.endsWith('.zip') || lowerUrl.endsWith('.rar')) {
      
      console.log('URL appears to be a binary file. JavaScript rendering not applicable.');
      return handleGet(url, options);
    }
    
    // Process page with JavaScript rendering
    const parsedContent = await parseWithJavaScript(url);
    
    if (parsedContent) {
      // Store this page for the follow command to use later
      setState('lastPage', {
        content: parsedContent,
        baseUrl: url
      });
      
      renderContent(parsedContent, options);
    } else {
      // Fallback to enhanced GET if JavaScript rendering fails
      console.log('JavaScript rendering failed, falling back to regular GET...');
      return handleGet(url, options);
    }
  } catch (error) {
    console.error(`Error during JavaScript rendering: ${error.message}`);
    console.log('Falling back to regular GET...');
    return handleGet(url, options);
  }
}

async function handlePost(url, data, options) {
  // Check if this is a file upload
  let hasFileUploads = false;
  let fileData = null;
  
  if (data) {
    // Process any file uploads
    if (Object.keys(data).some(key => key.startsWith('file:'))) {
      console.log('File upload detected. Processing...');
      fileData = {
        fields: {},
        files: {}
      };
      
      // Extract file paths and form fields
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('file:')) {
          // Extract field name after file: prefix
          const fieldName = key.substring(5);
          fileData.files[fieldName] = value;
          hasFileUploads = true;
          console.log(`Uploading file for field "${fieldName}": ${value}`);
        } else {
          fileData.fields[key] = value;
        }
      }
    }
  }
  
  // Set content-type based on data
  if (hasFileUploads) {
    console.log('Using multipart/form-data for file upload');
    data = fileData;
  } else if (options.json) {
    console.log('Using application/json');
  } else {
    console.log('Using application/x-www-form-urlencoded');
  }
  
  let response = await makePostRequest(url, data, options);
  
  // Check for bot detection and try alternative approach if needed
  if (!response.isBinary && (
      response.body.includes('captcha') || 
      response.body.includes('unusual traffic') ||
      response.body.includes('cloudflare') ||
      response.body.includes('checking your browser') ||
      response.body.includes('enable javascript'))) {
    console.log('Bot detection detected, trying alternative approach...');
    try {
      response = await handleProtectedSite(response, url);
    } catch (error) {
      console.error(`Alternative approach failed: ${error.message}`);
    }
  }
  
  if (options.raw) {
    // Output raw response
    if (response.isBinary) {
      console.log(`\n[Binary content detected: ${response.contentType}]`);
      console.log(`Cannot display raw binary content in terminal. Size: ${response.body.length} bytes`);
    } else {
      console.log(response.body);
    }
  } else {
    // Use the shared rendering function
    renderResponse(response, url, options);
  }
}

async function handleHead(url, options) {
  const response = await makeHeadRequest(url);
  
  // Head requests typically only return headers
  console.log('Response Headers:');
  for (const [key, value] of Object.entries(response.headers)) {
    console.log(`${key}: ${value}`);
  }
}

async function handlePut(url, data, options) {
  console.log(`Sending PUT request to ${url}...`);
  
  // Handle JSON data
  if (options.json) {
    options.json = true;
    console.log('Content-Type: application/json');
  } else {
    console.log('Content-Type: application/x-www-form-urlencoded');
  }
  
  let response = await makePutRequest(url, data, options);
  
  // Check for bot detection and try alternative approach if needed
  if (!response.isBinary && (
      response.body.includes('captcha') || 
      response.body.includes('unusual traffic') ||
      response.body.includes('cloudflare') ||
      response.body.includes('checking your browser') ||
      response.body.includes('enable javascript'))) {
    console.log('Bot detection detected, trying alternative approach...');
    try {
      response = await handleProtectedSite(response, url);
    } catch (error) {
      console.error(`Alternative approach failed: ${error.message}`);
    }
  }
  
  if (options.raw) {
    // Output raw response
    if (response.isBinary) {
      console.log(`\n[Binary content detected: ${response.contentType}]`);
      console.log(`Cannot display raw binary content in terminal. Size: ${response.body.length} bytes`);
    } else {
      console.log(response.body);
    }
  } else {
    // Process and render response
    renderResponse(response, url, options);
  }
}

async function handleDelete(url, options) {
  console.log(`Sending DELETE request to ${url}...`);
  
  let response = await makeDeleteRequest(url, options);
  
  // Check for bot detection and try alternative approach if needed
  if (!response.isBinary && (
      response.body.includes('captcha') || 
      response.body.includes('unusual traffic') ||
      response.body.includes('cloudflare') ||
      response.body.includes('checking your browser') ||
      response.body.includes('enable javascript'))) {
    console.log('Bot detection detected, trying alternative approach...');
    try {
      response = await handleProtectedSite(response, url);
    } catch (error) {
      console.error(`Alternative approach failed: ${error.message}`);
    }
  }
  
  // DELETE requests often return minimal or no content
  console.log(`Status Code: ${response.statusCode}`);
  
  if (options.raw) {
    // Output raw response
    if (response.isBinary) {
      console.log(`\n[Binary content detected: ${response.contentType}]`);
      console.log(`Cannot display raw binary content in terminal. Size: ${response.body.length} bytes`);
    } else {
      console.log(response.body);
    }
  } else {
    // Process and render response
    renderResponse(response, url, options);
  }
}

async function handlePatch(url, data, options) {
  console.log(`Sending PATCH request to ${url}...`);
  
  // Handle JSON data (PATCH typically uses JSON)
  if (options.json || !options.hasOwnProperty('json')) {
    options.json = true;
    console.log('Content-Type: application/json');
  } else {
    console.log('Content-Type: application/x-www-form-urlencoded');
  }
  
  let response = await makePatchRequest(url, data, options);
  
  // Check for bot detection and try alternative approach if needed
  if (!response.isBinary && (
      response.body.includes('captcha') || 
      response.body.includes('unusual traffic') ||
      response.body.includes('cloudflare') ||
      response.body.includes('checking your browser') ||
      response.body.includes('enable javascript'))) {
    console.log('Bot detection detected, trying alternative approach...');
    try {
      response = await handleProtectedSite(response, url);
    } catch (error) {
      console.error(`Alternative approach failed: ${error.message}`);
    }
  }
  
  if (options.raw) {
    // Output raw response
    if (response.isBinary) {
      console.log(`\n[Binary content detected: ${response.contentType}]`);
      console.log(`Cannot display raw binary content in terminal. Size: ${response.body.length} bytes`);
    } else {
      console.log(response.body);
    }
  } else {
    // Process and render response
    renderResponse(response, url, options);
  }
}

async function handleOptions(url, options) {
  console.log(`Sending OPTIONS request to ${url}...`);
  
  const response = await makeOptionsRequest(url, options);
  
  // OPTIONS requests typically only return headers with allowed methods
  console.log('Response Headers:');
  for (const [key, value] of Object.entries(response.headers)) {
    console.log(`${key}: ${value}`);
  }
  
  // Display CORS information if available
  if (response.headers['access-control-allow-methods']) {
    console.log('\nAllowed Methods:');
    console.log(response.headers['access-control-allow-methods']);
  }
  
  if (response.headers['access-control-allow-headers']) {
    console.log('\nAllowed Headers:');
    console.log(response.headers['access-control-allow-headers']);
  }
  
  if (response.headers['access-control-allow-origin']) {
    console.log('\nAllowed Origins:');
    console.log(response.headers['access-control-allow-origin']);
  }
}

// Helper function to render responses consistently
function renderResponse(response, url, options) {
  // Handle binary content directly
  if (response.isBinary) {
    // Store basic info in state in case follow needs it
    setState('lastPage', {
      content: {
        text: [`Binary content: ${response.contentType}`],
        links: [],
        forms: []
      },
      baseUrl: url
    });
    
    // Render binary content info
    renderContent(response, options);
  } 
  // Check if the response is JSON
  else if (response.headers && 
          (response.headers['content-type']?.includes('application/json') ||
           (typeof response.body === 'string' && 
            response.body.trim().startsWith('{') && 
            response.body.trim().endsWith('}')))) {
            
    // Process as a JSON response (especially for API responses)
    const processedResponse = processResponse(response);
    let jsonContent;
    
    try {
      // Try to parse JSON
      const jsonData = typeof response.body === 'string' ? 
        JSON.parse(response.body) : response.body;
      
      // Create content object for JSON
      jsonContent = {
        text: [`JSON Response from: ${url}`],
        links: [],
        forms: [],
        body: response.body,
        statusCode: response.statusCode,
        contentType: response.headers['content-type'],
        url: url
      };
      
      // Store parsed state for potential follow-up
      setState('lastPage', {
        content: jsonContent,
        baseUrl: url,
        jsonData: jsonData // Store the parsed JSON for potential follow-up commands
      });
      
      // Render JSON content with enhanced formatting
      renderContent(jsonContent, options);
    } catch (e) {
      // JSON parsing failed, handle as HTML
      console.log(`NOTE: Content appears to be JSON but parsing failed. Treating as regular content.`);
      // Fallback to HTML parsing
      const parsedContent = parseHtml(processedResponse.body, url);
      setState('lastPage', {
        content: parsedContent,
        baseUrl: url
      });
      renderContent(parsedContent, options);
    }
  } else {
    // Parse and render the content as HTML
    const processedResponse = processResponse(response);
    const parsedContent = parseHtml(processedResponse.body, url);
    
    // Add status code and content type for better output
    parsedContent.statusCode = response.statusCode;
    parsedContent.contentType = response.headers ? response.headers['content-type'] : 'unknown';
    
    // Store this page for the follow command to use later
    setState('lastPage', {
      content: parsedContent,
      baseUrl: url
    });
    
    renderContent(parsedContent, options);
  }
}

function showHelp() {
  console.log(`
===== AGRIS BROWSER HELP =====

Agris - A terminal-based web browser optimized for AI interactions

Usage: agris <command> [options] <url/query> [data]

COMMANDS:
  get       Perform an HTTP GET request
  jsget     Perform a GET request with JavaScript rendering enabled
  post      Perform an HTTP POST request with form data or file upload
  put       Perform an HTTP PUT request (for updating resources)
  patch     Perform an HTTP PATCH request (for partial updates)
  delete    Perform an HTTP DELETE request (for removing resources)
  options   Perform an HTTP OPTIONS request (for CORS preflight)
  head      Perform an HTTP HEAD request (headers only)
  docs      Access documentation with enhanced bot protection bypassing
  search    Search the web using a search engine
  follow    Follow a link from the previous page by number
  help      Display this help information
  version   Display application version

OPTIONS:
  --raw               Output the raw HTTP response
  --show-links=yes    Display list of links (default: yes)
  --engine=name       Specify search engine for search command (duckduckgo, google, bing)
  --js=yes            Enable JavaScript rendering (default: no)
  --json=yes          Use JSON content type for requests with bodies (default: no for POST, yes for PATCH)
  --use-cache=yes     Use documentation cache (default: yes)
  --refresh=yes       Force refresh cached documentation (default: no)
  --cache-expiry=24   Custom cache expiry time in hours (default: 24)

EXAMPLES:

  # Basic web browsing
  agris get https://example.com
  agris jsget https://example.com
  agris get --raw https://example.com
  
  # Form submission
  agris post https://example.com form:"login" "username":"user" "password":"pass"
  
  # File upload
  agris post https://example.com/upload form:"upload" "title":"My Document" file:"document":"/path/to/file.pdf"
  
  # API interactions with JSON
  agris put https://api.example.com/users/123 --json=yes "name":"John Doe" "email":"john@example.com"
  agris patch https://api.example.com/users/123 "status":"active"
  agris delete https://api.example.com/users/123
  
  # API testing
  agris options https://api.example.com/resource
  agris head https://example.com
  
  # Documentation access (bypasses bot protection)
  agris docs openai/api                  # Access OpenAI API documentation
  agris docs nodejs/fs                   # Access Node.js File System docs
  agris docs python/requests             # Access Python requests library docs
  agris docs https://docs.github.com     # Access any documentation URL directly
  
  # Documentation cache management
  agris docs cache-list                  # List all cached documentation
  agris docs cache-clear                 # Clear documentation cache
  agris docs openai/api --refresh=yes    # Force refresh cached documentation
  agris docs nodejs/fs --use-cache=no    # Disable caching for this request
  agris docs python --cache-expiry=48    # Set custom cache expiry (hours)
  
  # Web searches
  agris search "python programming"
  agris search --engine=google "climate change"
  
  # Navigation
  agris follow 3  # Follow the 3rd link from the previous page

OUTPUT FORMAT:
  The output is structured with clear sections for AI parsing:
  
  - RESPONSE: Shows status code and content type
  - JSON CONTENT: For API responses with formatted JSON and structure summary
  - CONTENT: Main text content from the page
  - FORMS: Interactive forms with field information and submission help
  - LINKS: Numbered links that can be followed with the 'follow' command
  - BINARY CONTENT: Information about non-displayable content types
  - DOCUMENTATION: Specially formatted documentation with enhanced readability

DOCUMENTATION SHORTCUTS:
  provider/topic format:
  - openai/api, openai/guide, openai/models
  - github/api
  - nodejs/fs, nodejs/http, etc.
  - python/library-name
  - mdn/topic (Mozilla Developer Network)

For more details and examples, visit the project website.
============================
`);
}

function showVersion() {
  console.log(`Agris browser version ${version}`);
}

async function handleSearch(query, options) {
  // Default to DuckDuckGo Lite if no engine specified
  const engine = options.engine || 'duckduckgo';
  let searchUrl;
  
  switch (engine.toLowerCase()) {
    case 'google':
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      break;
    case 'bing':
      searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      break;
    case 'duckduckgo':
    default:
      searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
      break;
  }
  
  console.log(`Searching ${engine} for: ${query}`);
  
  // Check if JavaScript rendering is requested
  if (options.js === 'yes') {
    return handleJsGet(searchUrl, options);
  } else {
    return handleGet(searchUrl, options);
  }
}

async function handleFollow(linkNumber, options) {
  // Retrieve the last page content from session state
  const lastPage = getState('lastPage');
  if (!lastPage) {
    throw new Error('No previous page to follow links from. Try browsing a page first.');
  }
  
  const { content, baseUrl } = lastPage;
  
  if (!content || !content.links || content.links.length === 0) {
    throw new Error('No links found on the previous page.');
  }
  
  // Convert linkNumber to a number and validate
  const linkIndex = parseInt(linkNumber, 10) - 1; // Convert to 0-based index
  if (isNaN(linkIndex) || linkIndex < 0 || linkIndex >= content.links.length) {
    throw new Error(`Invalid link number. Please choose between 1 and ${content.links.length}.`);
  }
  
  const link = content.links[linkIndex];
  let targetUrl = link.url;
  
  // Special handling for DuckDuckGo redirect URLs
  if (targetUrl.includes('duckduckgo.com/l/')) {
    try {
      // Extract the actual URL from DuckDuckGo's redirect
      const url = new URL(targetUrl);
      const params = new URLSearchParams(url.search);
      if (params.has('uddg')) {
        targetUrl = decodeURIComponent(params.get('uddg'));
        console.log(`Extracted target URL: ${targetUrl}`);
      }
    } catch (error) {
      console.error(`Error extracting redirect URL: ${error.message}`);
    }
  }
  
  console.log(`Following link: ${link.text} (${targetUrl})`);
  
  // The URL is already normalized in the parser, but let's ensure it's absolute
  if (options.js === 'yes') {
    return handleJsGet(targetUrl, options);
  } else {
    return handleGet(targetUrl, options);
  }
}

/**
 * Handle documentation access command with enhanced bot protection bypass
 * @param {string} query - The documentation query or URL
 * @param {Object} options - Command options
 */
async function handleDocs(query, options = {}) {
  // Special case for cache control commands
  if (query === 'cache-clear') {
    return handleDocCacheControl('clear', options);
  } else if (query === 'cache-list') {
    return handleDocCacheControl('list', options);
  }
  
  console.log(`Accessing documentation: ${query}`);
  
  // Check if this is a direct URL or a query
  let url;
  if (query.startsWith('http://') || query.startsWith('https://')) {
    url = query;
  } else {
    // Parse as a documentation shortcut
    url = parseDocShortcut(query);
  }
  
  console.log(`Resolved documentation URL: ${url}`);
  
  // Set up cache options
  const cacheOptions = {
    useCache: options['use-cache'] !== 'no',
    forceRefresh: options['refresh'] === 'yes',
    cacheExpiry: options['cache-expiry'] ? parseInt(options['cache-expiry']) * 60 * 60 * 1000 : undefined
  };
  
  // Merge cache options with other options
  const docOptions = { ...options, ...cacheOptions };
  
  try {
    // Use the enhanced documentation access function
    const response = await enhancedDocumentationAccess(url, docOptions);
    
    // Process and render the response
    if (options.raw) {
      // Output raw response
      if (response.isBinary) {
        console.log(`\n[Binary content detected: ${response.contentType}]`);
        console.log(`Cannot display raw binary content in terminal. Size: ${response.body.length} bytes`);
      } else {
        console.log(response.body);
      }
    } else {
      // Handle binary content directly
      if (response.isBinary) {
        // Store basic info in state in case follow needs it
        setState('lastPage', {
          content: {
            text: [`Binary content: ${response.contentType}`],
            links: [],
            forms: []
          },
          baseUrl: url
        });
        
        // Render binary content info
        renderContent(response, options);
      } else {
        // Parse and render the content with special formatting for documentation
        const processedResponse = processResponse(response);
        const parsedContent = parseHtml(processedResponse.body, url);
        
        // Add metadata to indicate this is documentation
        parsedContent.isDocumentation = true;
        
        // Store this page for the follow command to use later
        setState('lastPage', {
          content: parsedContent,
          baseUrl: url
        });
        
        // Enhanced rendering for documentation
        renderDocumentation(parsedContent, options);
      }
    }
  } catch (error) {
    console.error(`Error accessing documentation: ${error.message}`);
  }
}

/**
 * Handle documentation cache control operations
 */
async function handleDocCacheControl(operation, options = {}) {
  // Import the cache manager
  const docCacheManager = require('../core/docCacheManager');
  
  switch (operation) {
    case 'clear':
      console.log('Clearing documentation cache...');
      const result = docCacheManager.clearAllCachedResponses(options);
      if (result) {
        console.log('Documentation cache cleared successfully.');
      } else {
        console.error('Failed to clear documentation cache.');
      }
      break;
      
    case 'list':
      const cacheDir = options.cacheDir || docCacheManager.DEFAULT_CACHE_DIR;
      console.log(`Documentation cache directory: ${cacheDir}`);
      
      try {
        if (!fs.existsSync(cacheDir)) {
          console.log('Cache directory does not exist or is empty.');
          return;
        }
        
        const files = fs.readdirSync(cacheDir);
        const cacheFiles = files.filter(file => file.endsWith('.json'));
        
        if (cacheFiles.length === 0) {
          console.log('No cached documentation found.');
          return;
        }
        
        console.log(`Found ${cacheFiles.length} cached documentation items:`);
        
        // Display information about each cache entry
        for (const file of cacheFiles) {
          try {
            const filePath = path.join(cacheDir, file);
            const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const age = Math.round((Date.now() - cacheData.timestamp) / (60 * 60 * 1000));
            
            console.log(`- ${cacheData.url} (cached ${age} hours ago)`);
          } catch (error) {
            console.log(`- ${file} (invalid cache entry)`);
          }
        }
      } catch (error) {
        console.error(`Error listing cache: ${error.message}`);
      }
      break;
      
    default:
      console.error(`Unknown cache operation: ${operation}`);
      break;
  }
}

/**
 * Enhanced rendering specifically for documentation content
 */
function renderDocumentation(content, options) {
  // Add special header to indicate this is using the documentation mode
  console.log('\n📚 DOCUMENTATION MODE');
  console.log('─'.repeat(60));
  
  // Use the standard renderer with documentation context
  renderContent(content, { ...options, isDocumentation: true });
  
  // Add special footer with documentation-specific suggestions
  console.log('\n📝 DOCUMENTATION TIPS');
  console.log('• Use `agris docs [topic/URL]` to access more documentation');
  console.log('• Common shortcuts: `agris docs openai/api` for OpenAI API docs');
  console.log('• Follow links with `agris follow [link number]`');
}

/**
 * Parse documentation shortcuts into actual URLs
 */
function parseDocShortcut(query) {
  // Format: provider/topic
  // Examples: openai/api, nodejs/fs, python/requests
  
  const parts = query.split('/');
  
  if (parts.length >= 2) {
    const provider = parts[0].toLowerCase();
    const topic = parts.slice(1).join('/');
    
    const providerMap = {
      'openai': {
        'api': 'https://platform.openai.com/docs/api-reference',
        'guide': 'https://platform.openai.com/docs/guides',
        'models': 'https://platform.openai.com/docs/models',
        'default': 'https://platform.openai.com/docs'
      },
      'github': {
        'api': 'https://docs.github.com/en/rest',
        'default': 'https://docs.github.com'
      },
      'nodejs': {
        'default': `https://nodejs.org/docs/latest/api/${topic || 'index'}.html`
      },
      'python': {
        'default': `https://docs.python.org/3/library/${topic || 'index'}.html`
      },
      'mdn': {
        'default': `https://developer.mozilla.org/en-US/docs/Web/${topic || ''}`
      }
    };
    
    // Look up the provider
    if (providerMap[provider]) {
      // Look up the specific topic or use default
      return providerMap[provider][topic] || providerMap[provider]['default'];
    }
  }
  
  // If not a recognized shortcut, try a search
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}+documentation`;
}

module.exports = {
  executeCommand
};
