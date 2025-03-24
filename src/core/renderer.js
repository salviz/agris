/**
 * Content renderer for Agris browser
 * Enhanced with structured output formatting for AI LLM use
 */

function renderContent(content, options = {}) {
  const isRawMode = options['raw'] === true;
  const isDocumentation = options['isDocumentation'] === true || content.isDocumentation === true;
  
  // Display URL and basic info (useful for human users)
  if (content.url) {
    // Use different icon for documentation
    if (isDocumentation) {
      console.log(`\n📚 ${content.url}`);
    } else {
      console.log(`\n📄 ${content.url}`);
    }
  }
  
  // Show response status and info in a compact human-readable format
  if (content.statusCode) {
    console.log(`Status: ${getStatusEmoji(content.statusCode)} ${content.statusCode} ${getStatusText(content.statusCode)}`);
    console.log(`Content-Type: ${content.contentType || 'unknown'}`);
    console.log('─'.repeat(60));
  }

  // Check if we have a binary content message
  if (content.isBinary) {
    renderBinaryContent(content);
    return;
  }
  
  const { text, links, forms } = content;
  
  // Check if this looks like JSON content
  if (content.body && (
      content.contentType?.includes('application/json') || 
      (typeof content.body === 'string' && content.body.trim().startsWith('{')))) {
    try {
      // Try to parse and format JSON for better readability
      const jsonData = typeof content.body === 'string' ? 
        JSON.parse(content.body) : content.body;
      
      // Display JSON content with a clear separator
      console.log('\n📊 JSON DATA');
      console.log('─'.repeat(30));
      console.log(JSON.stringify(jsonData, null, 2));
      console.log('─'.repeat(30));
      
      // Provide helpful guidance for AI to work with the JSON
      console.log('\n🔍 JSON STRUCTURE');
      summarizeJsonStructure(jsonData);
      
      // For search responses, try to extract main results
      if (content.url && (
          content.url.includes('search') || 
          content.url.includes('google') || 
          content.url.includes('bing') || 
          content.url.includes('duckduckgo'))) {
        console.log('\n🔎 SEARCH RESULTS');
        extractSearchResults(jsonData);
      }
      
      console.log();
      
      // If it's an API response, still show links and forms if present
    } catch (e) {
      // Not JSON or invalid JSON, proceed with normal rendering
    }
  }
  
  // Render text content
  if (text && text.length > 0) {
    // For humans, format better with page title if possible
    let title = extractTitle(text);
    if (title) {
      console.log(`\n📄 PAGE: ${title}`);
    } else {
      console.log('\n📄 PAGE CONTENT');
    }
    
    console.log('─'.repeat(60));
    
    // For AI without web access, make content more informative
    if (isRawMode) {
      // Raw mode - show all text
      console.log(text.join('\n'));
    } else {
      // Standard mode - filter out empty lines, trim whitespace
      const filteredText = text
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      console.log(filteredText);
    }
    
    console.log('─'.repeat(60));
  }
  
  // Render forms
  if (forms && forms.length > 0) {
    console.log('\n📝 FORMS');
    forms.forEach((form, index) => {
      console.log(`Form #${index + 1}: ${form.name || '[unnamed]'}`);
      console.log(`Method: ${form.method?.toUpperCase() || 'POST'}`);
      console.log(`Action: ${form.action || '[current URL]'}`);
      
      if (form.inputs && form.inputs.length > 0) {
        console.log('\nFields:');
        const formFields = {};
        
        form.inputs.forEach(input => {
          // Collect form fields to show example JSON later
          if (input.name && input.type !== 'submit') {
            formFields[input.name] = input.value || `[${input.type || 'text'}]`;
          }
          
          switch (input.type) {
            case 'hidden':
              console.log(`  • ${input.name}: ${input.value} [hidden]`);
              break;
            
            case 'password':
              console.log(`  • ${input.name} [password]`);
              break;
            
            case 'textarea':
              console.log(`  • ${input.name} [textarea]`);
              break;
            
            case 'select':
              const options = input.options?.map(opt => opt.text).join(', ') || '';
              console.log(`  • ${input.name} [select: ${options}]`);
              break;
            
            case 'file':
              console.log(`  • ${input.name} [file upload]`);
              break;
              
            case 'submit':
              console.log(`  • Submit button: ${input.value || 'Submit'}`);
              break;
            
            default:
              console.log(`  • ${input.name}${input.value ? ': ' + input.value : ''} [${input.type || 'text'}]`);
          }
        });
        
        // Help AI understand how to use the form
        console.log('\nUsage Examples:');
        
        // Example for GET forms
        if (form.method?.toLowerCase() === 'get') {
          console.log(`Command: agris get "${form.action}"`);
          // Show JSON example of form data
          console.log(`Form data: ${JSON.stringify(formFields)}`);
        } 
        // Example for POST forms
        else {
          console.log(`Command: agris post "${form.action || '[URL]'}" form:"${form.name || '[form_name]'}"`);
          // Show formatted fields
          Object.entries(formFields).forEach(([key, value]) => {
            console.log(`  "${key}":"${value}"`);
          });
          
          // If the form has file inputs, show file upload example
          if (form.inputs?.some(input => input.type === 'file')) {
            const fileField = form.inputs.find(input => input.type === 'file').name;
            console.log(`\nFile Upload: agris post "${form.action || '[URL]'}" form:"${form.name || '[form_name]'}" "${fileField}":"/path/to/file.pdf"`);
          }
        }
      }
      console.log('─'.repeat(40));
    });
  }
  
  // Render links if showLinks option is not set to 'no'
  const showLinks = options['show-links'] !== 'no';
  
  if (showLinks && links && links.length > 0) {
    console.log('\n🔗 LINKS');
    
    // Group links by type/category if possible
    const categories = categorizeLinks(links);
    
    // Display links in a compact table format
    console.log('───┬───────────────────────────┬─────────────────────────────');
    console.log('NUM│ TEXT                      │ URL');
    console.log('───┼───────────────────────────┼─────────────────────────────');
    
    links.forEach((link, index) => {
      // Format link text for display (truncate if needed)
      const linkText = link.text?.length > 23 ? link.text.substring(0, 20) + '...' : (link.text || '[no text]').padEnd(23);
      
      // Format URL for display (truncate if needed)
      const displayUrl = link.url?.length > 25 ? link.url.substring(0, 22) + '...' : link.url || '';
      
      // Use emoji to indicate link type if possible
      const linkEmoji = getLinkTypeEmoji(link, categories);
      
      console.log(`${(index + 1).toString().padStart(3)}│ ${linkEmoji} ${linkText} │ ${displayUrl}`);
    });
    console.log('───┴───────────────────────────┴─────────────────────────────');
    
    // Help AI understand how to use links
    console.log('\nTo follow a link, use: agris follow [link number]');
    console.log('Example: agris follow 3');
    
    // Show link categories if any were detected
    if (Object.keys(categories).length > 0) {
      console.log('\nLink Categories:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${getCategoryEmoji(category)} ${category}: ${count} links`);
      });
    }
  }
  
  // Render binary content references if present
  if (content.binaryReferences && content.binaryReferences.length > 0) {
    console.log('\n📁 BINARY CONTENT');
    console.log('───┬──────────┬─────────────────────────────');
    console.log('NUM│ TYPE     │ URL');
    console.log('───┼──────────┼─────────────────────────────');
    content.binaryReferences.forEach((ref, index) => {
      const icon = getBinaryIcon(ref.type);
      const displayUrl = ref.url?.length > 25 ? ref.url.substring(0, 22) + '...' : ref.url;
      console.log(`${(index + 1).toString().padStart(3)}│ ${icon} ${ref.type.padEnd(7)} │ ${displayUrl}`);
    });
    console.log('───┴──────────┴─────────────────────────────');
  }
  
  // For AI assistants, provide suggestions on what to do next
  if (!isRawMode) {
    if (isDocumentation) {
      suggestDocumentationActions(content, options);
    } else {
      suggestNextActions(content, options);
    }
  }
}

/**
 * Suggests the next actions the AI could take based on the content
 */
function suggestNextActions(content, options) {
  const { links, forms, url } = content;
  
  console.log('\n💡 SUGGESTED ACTIONS');
  
  // Default suggestions
  const suggestions = [];
  
  // Search suggestion based on URL and content
  if (url && (url.includes('search') || url.includes('google') || url.includes('duckduckgo') || url.includes('bing'))) {
    suggestions.push('• Refine search: `agris search "more specific query"`');
  }
  
  // Form submission suggestion
  if (forms && forms.length > 0) {
    suggestions.push('• Submit a form: `agris post [URL] form:[form_name] [fields...]`');
  }
  
  // Link following suggestion
  if (links && links.length > 0) {
    suggestions.push('• Follow a link: `agris follow [link number]`');
    
    // Specific link suggestions
    const nextPage = links.findIndex(link => 
      link.text?.toLowerCase().includes('next') || 
      link.text?.includes('»') || 
      link.text?.includes('>'));
      
    if (nextPage !== -1) {
      suggestions.push(`• Go to next page: \`agris follow ${nextPage + 1}\``);
    }
  }
  
  // API suggestions
  if (content.contentType?.includes('json') || (content.body && typeof content.body === 'string' && content.body.trim().startsWith('{'))) {
    suggestions.push('• Make API request: `agris [method] [URL] --json=yes [data...]`');
  }
  
  // If we have no specific suggestions, offer general ones
  if (suggestions.length === 0) {
    suggestions.push('• Go back to search: `agris search "your query"`');
    suggestions.push('• Try another URL: `agris get [URL]`');
  }
  
  // Print suggestions
  if (suggestions.length > 0) {
    console.log(suggestions.join('\n'));
  }
}

/**
 * Extracts a title from the content text
 */
function extractTitle(text) {
  if (!text || text.length === 0) return null;
  
  // Try to find a title in the first few lines
  for (let i = 0; i < Math.min(5, text.length); i++) {
    const line = text[i].trim();
    if (line && line.length > 3 && line.length < 100) {
      return line;
    }
  }
  
  return null;
}

/**
 * Categorizes links by type
 */
function categorizeLinks(links) {
  const categories = {};
  
  if (!links || links.length === 0) return categories;
  
  links.forEach(link => {
    let category = 'Other';
    
    // Try to determine category from link text and URL
    const text = (link.text || '').toLowerCase();
    const url = (link.url || '').toLowerCase();
    
    if (text.includes('next') || text.includes('more') || text.includes('»') || text.includes('>>')) {
      category = 'Navigation';
    } else if (text.includes('search') || url.includes('search') || url.includes('query')) {
      category = 'Search';
    } else if (url.includes('login') || text.includes('login') || text.includes('sign in')) {
      category = 'Authentication';
    } else if (url.includes('download') || text.includes('download')) {
      category = 'Download';
    } else if (url.includes('api') || url.includes('json')) {
      category = 'API';
    } else if (url.includes('about') || url.includes('contact') || url.includes('help')) {
      category = 'Info';
    } else if (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.gif') || 
               url.includes('image') || url.includes('photo')) {
      category = 'Media';
    }
    
    categories[category] = (categories[category] || 0) + 1;
  });
  
  return categories;
}

/**
 * Gets an emoji for a link based on its category
 */
function getLinkTypeEmoji(link, categories) {
  const text = (link.text || '').toLowerCase();
  const url = (link.url || '').toLowerCase();
  
  if (text.includes('next') || text.includes('more') || text.includes('»')) {
    return '→';
  } else if (text.includes('previous') || text.includes('back') || text.includes('«')) {
    return '←';
  } else if (text.includes('search') || url.includes('search')) {
    return '🔍';
  } else if (url.includes('login') || text.includes('login') || text.includes('sign in')) {
    return '🔑';
  } else if (url.includes('download') || text.includes('download')) {
    return '⬇️';
  } else if (url.includes('api') || url.includes('json')) {
    return '🔌';
  } else if (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.gif') || 
             url.includes('image') || url.includes('photo')) {
    return '🖼️';
  } else {
    return '•';
  }
}

/**
 * Gets an emoji for a link category
 */
function getCategoryEmoji(category) {
  const emojiMap = {
    'Navigation': '🧭',
    'Search': '🔍',
    'Authentication': '🔑',
    'Download': '⬇️',
    'API': '🔌',
    'Info': 'ℹ️',
    'Media': '🖼️',
    'Other': '•'
  };
  
  return emojiMap[category] || '•';
}

/**
 * Gets an emoji representing the HTTP status code
 */
function getStatusEmoji(statusCode) {
  if (!statusCode) return '❓';
  
  if (statusCode >= 200 && statusCode < 300) {
    return '✅'; // Success
  } else if (statusCode >= 300 && statusCode < 400) {
    return '🔄'; // Redirect
  } else if (statusCode >= 400 && statusCode < 500) {
    return '⚠️'; // Client Error
  } else if (statusCode >= 500) {
    return '❌'; // Server Error
  } else {
    return '❓'; // Unknown
  }
}

/**
 * Gets a text description of an HTTP status code
 */
function getStatusText(statusCode) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  
  return statusTexts[statusCode] || '';
}

/**
 * Tries to extract search results from JSON data
 */
function extractSearchResults(json) {
  if (!json) return;
  
  // Look for common search result patterns
  if (json.results) {
    console.log('Found search results:');
    
    if (Array.isArray(json.results)) {
      json.results.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.title || result.name || 'Result'}`);
        if (result.description || result.snippet) {
          console.log(`   ${result.description || result.snippet}`);
        }
        if (result.url || result.link) {
          console.log(`   Link: ${result.url || result.link}`);
        }
        console.log();
      });
      
      if (json.results.length > 5) {
        console.log(`...and ${json.results.length - 5} more results.`);
      }
    }
  } else if (json.items) {
    // Similar extraction for items array
  }
}

/**
 * Summarizes JSON structure to help AI navigate the data
 */
function summarizeJsonStructure(json, prefix = '', level = 0) {
  // Limit recursion depth
  if (level > 3) {
    console.log(`${prefix}... (nested content)`);
    return;
  }
  
  if (Array.isArray(json)) {
    console.log(`${prefix}Array with ${json.length} item${json.length !== 1 ? 's' : ''}`);
    if (json.length > 0) {
      // Just show the structure of the first item as example
      summarizeJsonStructure(json[0], `${prefix}  [0]: `, level + 1);
      if (json.length > 1) {
        console.log(`${prefix}  ... and ${json.length - 1} more item${json.length !== 2 ? 's' : ''}`);
      }
    }
  } else if (typeof json === 'object' && json !== null) {
    const keys = Object.keys(json);
    if (keys.length === 0) {
      console.log(`${prefix}Empty object {}`);
      return;
    }
    
    // For top level, show all keys
    if (level === 0) {
      console.log(`${prefix}Object with keys: ${keys.join(', ')}`);
      
      // For key objects that look important, expand them
      keys.forEach(key => {
        const value = json[key];
        if (typeof value === 'object' && value !== null) {
          summarizeJsonStructure(value, `${prefix}  ${key}: `, level + 1);
        }
      });
    } 
    // For nested objects, be more concise
    else {
      console.log(`${prefix}Object with ${keys.length} propert${keys.length !== 1 ? 'ies' : 'y'}`);
      // Maybe show a few key names as examples
      if (keys.length <= 3 || level === 1) {
        keys.forEach(key => {
          const value = json[key];
          if (typeof value !== 'object' || value === null) {
            console.log(`${prefix}  ${key}: ${typeof value}`);
          } else {
            summarizeJsonStructure(value, `${prefix}  ${key}: `, level + 1);
          }
        });
      } else {
        console.log(`${prefix}  Keys include: ${keys.slice(0, 3).join(', ')}...`);
      }
    }
  } else {
    // For primitive values
    console.log(`${prefix}${typeof json}${json ? ': ' + (level === 0 ? json : typeof json === 'string' ? `"${json.substring(0, 20)}${json.length > 20 ? '...' : ''}"` : json) : ''}`);
  }
}

/**
 * Renders a message about binary content
 * @param {Object} content - Binary content information
 */
function renderBinaryContent(content) {
  const { contentType, url, fileExtension, body, statusCode } = content;
  
  // Determine the type of binary content
  let contentDescription = 'Binary file';
  let icon = '📄';
  let fileType = 'unknown';
  
  if (contentType.includes('image/')) {
    contentDescription = 'Image file';
    icon = '🖼️';
    fileType = contentType.split('/')[1] || 'image';
  } else if (contentType.includes('audio/')) {
    contentDescription = 'Audio file';
    icon = '🔊';
    fileType = contentType.split('/')[1] || 'audio';
  } else if (contentType.includes('video/')) {
    contentDescription = 'Video file';
    icon = '🎬';
    fileType = contentType.split('/')[1] || 'video';
  } else if (contentType.includes('pdf')) {
    contentDescription = 'PDF document';
    icon = '📑';
    fileType = 'pdf';
  } else if (contentType.includes('msword') || contentType.includes('wordprocessingml')) {
    contentDescription = 'Word document';
    icon = '📝';
    fileType = contentType.includes('wordprocessingml') ? 'docx' : 'doc';
  } else if (contentType.includes('excel') || contentType.includes('spreadsheetml')) {
    contentDescription = 'Excel spreadsheet';
    icon = '📊';
    fileType = contentType.includes('spreadsheetml') ? 'xlsx' : 'xls';
  } else if (contentType.includes('powerpoint') || contentType.includes('presentationml')) {
    contentDescription = 'PowerPoint presentation';
    icon = '📽️';
    fileType = contentType.includes('presentationml') ? 'pptx' : 'ppt';
  } else if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) {
    contentDescription = 'Archive file';
    icon = '📦';
    fileType = contentType.includes('zip') ? 'zip' : 
              contentType.includes('rar') ? 'rar' : 
              contentType.includes('tar') ? 'tar' : 'archive';
  } else if (contentType.includes('application/octet-stream')) {
    contentDescription = 'Binary file (generic)';
    icon = '📄';
    fileType = fileExtension || 'bin';
  }
  
  console.log(`\n${icon} BINARY CONTENT: ${contentDescription.toUpperCase()}`);
  console.log('─'.repeat(60));
  
  // Format in a concise table-like format for both human and AI readability
  console.log(`Status:    ${getStatusEmoji(statusCode)} ${statusCode || 'Unknown'}`);
  console.log(`Type:      ${contentDescription}`);
  console.log(`Format:    ${contentType}`);
  console.log(`Extension: .${fileExtension || fileType}`);
  console.log(`Size:      ${body instanceof Buffer ? formatSize(body.length) : 'Unknown'}`);
  console.log(`URL:       ${url}`);
  
  // Add a helpful section for AI/human understanding
  console.log('\n📋 DESCRIPTION');
  console.log(`This is a ${contentDescription.toLowerCase()} that cannot be directly displayed in the terminal.`);
  
  // Add context-specific information based on file type
  if (contentType.includes('image/')) {
    console.log('\nThis image could be used for:');
    console.log('• Visual content in a webpage');
    console.log('• Reference material for analysis');
    console.log('• Documentation or illustration');
  } else if (contentType.includes('audio/')) {
    console.log('\nThis audio file could contain:');
    console.log('• Music or sound effects');
    console.log('• Recorded speech or interview');
    console.log('• Audio instructions or narration');
  } else if (contentType.includes('video/')) {
    console.log('\nThis video file could contain:');
    console.log('• Visual documentation or tutorial');
    console.log('• Recorded presentation or demonstration');
    console.log('• Entertainment or educational content');
  } else if (contentType.includes('pdf') || contentType.includes('word') || 
             contentType.includes('excel') || contentType.includes('powerpoint')) {
    console.log('\nThis document could contain:');
    console.log('• Text information or report');
    console.log('• Data, charts, or tables');
    console.log('• Formatted content for reading or printing');
  } else if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) {
    console.log('\nThis archive could contain:');
    console.log('• Multiple files packaged together');
    console.log('• Software installation files');
    console.log('• Compressed data for efficient storage');
  }
  
  // Add commands for common operations
  console.log('\n🔧 USAGE OPTIONS');
  console.log(`• Download:  curl -o file.${fileType} "${url}"`);
  
  // For data extraction use cases (images, PDFs)
  if (contentType.includes('image/') || contentType.includes('pdf')) {
    console.log('• Extract:   Use specialized tools to extract text/data from this file');
  }
  
  // For API files
  if (url.includes('api') || url.includes('data')) {
    console.log('• API Data:  This binary data might be part of an API response');
  }
  
  console.log('─'.repeat(60));
}

/**
 * Get an icon for a binary content type
 * @param {string} type - The content type
 * @returns {string} - An appropriate icon
 */
function getBinaryIcon(type) {
  const typeMap = {
    'image': '🖼️',
    'audio': '🔊',
    'video': '🎬',
    'pdf': '📑',
    'doc': '📝',
    'xls': '📊',
    'ppt': '📽️',
    'zip': '📦',
    'binary': '📄'
  };
  
  return typeMap[type.toLowerCase()] || '📄';
}

/**
 * Format a file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

/**
 * Suggests documentation-specific actions
 */
function suggestDocumentationActions(content, options) {
  const { links, url } = content;
  
  console.log('\n📖 DOCUMENTATION ACTIONS');
  
  // Default documentation suggestions
  const suggestions = [];
  
  // Determine the documentation provider
  let provider = 'unknown';
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('openai.com')) {
    provider = 'openai';
  } else if (hostname.includes('github')) {
    provider = 'github';
  } else if (hostname.includes('nodejs.org')) {
    provider = 'nodejs';
  } else if (hostname.includes('python.org')) {
    provider = 'python';
  } else if (hostname.includes('developer.mozilla.org')) {
    provider = 'mdn';
  }
  
  // Provider-specific suggestions
  if (provider === 'openai') {
    suggestions.push('• OpenAI API Reference: `agris docs openai/api`');
    suggestions.push('• OpenAI Guides: `agris docs openai/guide`');
    suggestions.push('• OpenAI Models: `agris docs openai/models`');
  } else if (provider === 'github') {
    suggestions.push('• GitHub API Reference: `agris docs github/api`');
  } else if (provider === 'nodejs') {
    suggestions.push('• Node.js Core Modules: `agris docs nodejs/fs`, `agris docs nodejs/http`, etc.');
  } else if (provider === 'python') {
    suggestions.push('• Python Standard Library: `agris docs python/library`');
  }
  
  // Link following suggestion (with special handling for documentation links)
  if (links && links.length > 0) {
    suggestions.push('• Follow a documentation link: `agris follow [link number]`');
    
    // Look for important documentation links
    let apiLinkIndex = -1;
    let exampleLinkIndex = -1;
    let guideLinkIndex = -1;
    
    links.forEach((link, index) => {
      const text = (link.text || '').toLowerCase();
      if (text.includes('api') || text.includes('reference')) {
        apiLinkIndex = index;
      } else if (text.includes('example') || text.includes('sample')) {
        exampleLinkIndex = index;
      } else if (text.includes('guide') || text.includes('tutorial')) {
        guideLinkIndex = index;
      }
    });
    
    if (apiLinkIndex !== -1) {
      suggestions.push(`• Go to API reference: \`agris follow ${apiLinkIndex + 1}\``);
    }
    
    if (exampleLinkIndex !== -1) {
      suggestions.push(`• See examples: \`agris follow ${exampleLinkIndex + 1}\``);
    }
    
    if (guideLinkIndex !== -1) {
      suggestions.push(`• Read guide: \`agris follow ${guideLinkIndex + 1}\``);
    }
  }
  
  // Generic documentation suggestions
  suggestions.push('• Access different documentation: `agris docs [provider/topic]`');
  suggestions.push('• Search for specific topic: `agris search "[topic] documentation"`');
  
  // Cache management suggestions
  suggestions.push('• View cached documentation: `agris docs cache-list`');
  suggestions.push('• Force refresh this page: `agris docs ' + url + ' --refresh=yes`');
  
  // Print suggestions
  if (suggestions.length > 0) {
    console.log(suggestions.join('\n'));
  }
}

module.exports = {
  renderContent
};
