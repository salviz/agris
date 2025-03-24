/**
 * Enhanced HTML parsing for Agris browser
 */

const cheerio = require('cheerio');
const { normalizeUrl } = require('./utils');

/**
 * Parse HTML content using cheerio (jQuery-like) selectors
 * @param {string} html - HTML content to parse
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {Object} - Parsed content with text, links, forms, and binary references
 */
function parseHtml(html, baseUrl) {
  // Basic content structure
  const content = {
    text: [],
    links: [],
    forms: [],
    binaryReferences: [] // New array for binary content references
  };
  
  // Handle empty or non-string content
  if (!html || typeof html !== 'string') {
    return content;
  }
  
  // Store seen URLs to deduplicate links and binary references
  const seenUrls = new Set();
  const seenBinaryUrls = new Set();
  
  // Load HTML into cheerio
  const $ = cheerio.load(html);
  
  // Remove script and style tags for text extraction
  $('script, style').remove();
  
  // Extract text from the page
  $('body').find('*').each(function() {
    const element = $(this);
    
    // Only get text from elements that directly contain text
    if (element.children().length === 0 && element.text().trim()) {
      content.text.push(element.text().trim());
    }
  });
  
  // Remove duplicate and empty text lines
  content.text = [...new Set(content.text)].filter(line => line.trim().length > 0);
  
  // Extract links
  $('a[href]').each(function() {
    const element = $(this);
    let url = element.attr('href');
    
    // Skip javascript: and other non-HTTP(S) links
    if (!url || url.startsWith('javascript:') || url.startsWith('mailto:') || url === '#') {
      return;
    }
    
    // Handle relative URLs
    try {
      url = normalizeUrl(url, baseUrl);
    } catch (error) {
      // If normalization fails, use the original URL
      console.error(`Error normalizing URL ${url}: ${error.message}`);
    }
    
    // Extract link text and remove any nested tags
    let linkText = element.text().trim();
    
    // If link text is empty, use the URL as text
    if (!linkText) {
      linkText = url;
    }
    
    // Deduplicate links by URL
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      content.links.push({
        url,
        text: linkText
      });
    }
  });
  
  // Extract binary references like images, audio, video, etc.
  
  // Extract images
  $('img[src]').each(function() {
    const element = $(this);
    let url = element.attr('src');
    
    // Skip data URLs
    if (!url || url.startsWith('data:')) {
      return;
    }
    
    // Handle relative URLs
    try {
      url = normalizeUrl(url, baseUrl);
    } catch (error) {
      console.error(`Error normalizing image URL ${url}: ${error.message}`);
    }
    
    // Get alt text or use fallback
    const altText = element.attr('alt') || 'Image';
    
    // Deduplicate binary references
    if (!seenBinaryUrls.has(url)) {
      seenBinaryUrls.add(url);
      content.binaryReferences.push({
        type: 'image',
        url,
        description: altText
      });
    }
  });
  
  // Extract video sources
  $('video').each(function() {
    const element = $(this);
    
    // Check for src attribute
    let url = element.attr('src');
    if (url) {
      try {
        url = normalizeUrl(url, baseUrl);
        if (!seenBinaryUrls.has(url)) {
          seenBinaryUrls.add(url);
          content.binaryReferences.push({
            type: 'video',
            url,
            description: 'Video'
          });
        }
      } catch (error) {
        console.error(`Error normalizing video URL ${url}: ${error.message}`);
      }
    }
    
    // Check for source elements
    element.find('source[src]').each(function() {
      const source = $(this);
      let sourceUrl = source.attr('src');
      
      try {
        sourceUrl = normalizeUrl(sourceUrl, baseUrl);
        if (!seenBinaryUrls.has(sourceUrl)) {
          seenBinaryUrls.add(sourceUrl);
          content.binaryReferences.push({
            type: 'video',
            url: sourceUrl,
            description: 'Video source'
          });
        }
      } catch (error) {
        console.error(`Error normalizing video source URL ${sourceUrl}: ${error.message}`);
      }
    });
  });
  
  // Extract audio sources
  $('audio').each(function() {
    const element = $(this);
    
    // Check for src attribute
    let url = element.attr('src');
    if (url) {
      try {
        url = normalizeUrl(url, baseUrl);
        if (!seenBinaryUrls.has(url)) {
          seenBinaryUrls.add(url);
          content.binaryReferences.push({
            type: 'audio',
            url,
            description: 'Audio'
          });
        }
      } catch (error) {
        console.error(`Error normalizing audio URL ${url}: ${error.message}`);
      }
    }
    
    // Check for source elements
    element.find('source[src]').each(function() {
      const source = $(this);
      let sourceUrl = source.attr('src');
      
      try {
        sourceUrl = normalizeUrl(sourceUrl, baseUrl);
        if (!seenBinaryUrls.has(sourceUrl)) {
          seenBinaryUrls.add(sourceUrl);
          content.binaryReferences.push({
            type: 'audio',
            url: sourceUrl,
            description: 'Audio source'
          });
        }
      } catch (error) {
        console.error(`Error normalizing audio source URL ${sourceUrl}: ${error.message}`);
      }
    });
  });
  
  // Check for PDF and document links
  $('a[href]').each(function() {
    const element = $(this);
    let url = element.attr('href');
    
    if (!url) return;
    
    // Check for file extensions that indicate binary content
    const lowerUrl = url.toLowerCase();
    let type = null;
    
    if (lowerUrl.endsWith('.pdf')) {
      type = 'pdf';
    } else if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx')) {
      type = 'doc';
    } else if (lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx')) {
      type = 'xls';
    } else if (lowerUrl.endsWith('.ppt') || lowerUrl.endsWith('.pptx')) {
      type = 'ppt';
    } else if (lowerUrl.endsWith('.zip') || lowerUrl.endsWith('.rar') || lowerUrl.endsWith('.tar.gz')) {
      type = 'zip';
    }
    
    if (type) {
      try {
        url = normalizeUrl(url, baseUrl);
        if (!seenBinaryUrls.has(url)) {
          seenBinaryUrls.add(url);
          content.binaryReferences.push({
            type,
            url,
            description: element.text().trim() || type.toUpperCase() + ' file'
          });
        }
      } catch (error) {
        console.error(`Error normalizing document URL ${url}: ${error.message}`);
      }
    }
  });
  
  // Extract forms
  $('form').each(function() {
    const form = $(this);
    let action = form.attr('action') || '';
    const method = (form.attr('method') || 'GET').toUpperCase();
    const formName = form.attr('id') || form.attr('name') || `form_${content.forms.length + 1}`;
    
    // Normalize form action URL
    let normalizedAction = action;
    if (action) {
      try {
        normalizedAction = normalizeUrl(action, baseUrl);
      } catch (error) {
        // If normalization fails, use the original action
        console.error(`Error normalizing form action URL ${action}: ${error.message}`);
      }
    }
    
    const formData = {
      name: formName,
      action: normalizedAction,
      method: method,
      inputs: []
    };
    
    // Find all inputs within the form
    form.find('input, textarea, select').each(function() {
      const input = $(this);
      const type = input.attr('type') || 'text';
      const name = input.attr('name');
      
      // Skip inputs without a name
      if (!name) {
        return;
      }
      
      if (input.is('select')) {
        // Handle select elements
        const options = [];
        input.find('option').each(function() {
          const option = $(this);
          options.push({
            value: option.attr('value') || '',
            text: option.text().trim()
          });
        });
        
        formData.inputs.push({
          type: 'select',
          name: name,
          options: options
        });
      } else if (input.is('textarea')) {
        // Handle textarea elements
        formData.inputs.push({
          type: 'textarea',
          name: name,
          value: input.text().trim()
        });
      } else {
        // Handle regular input elements
        formData.inputs.push({
          type: type,
          name: name,
          value: input.attr('value') || ''
        });
      }
    });
    
    content.forms.push(formData);
  });
  
  return content;
}

/**
 * Enhanced parsing with JavaScript execution using puppeteer
 * @param {string} url - URL to render with JavaScript
 * @returns {Promise<Object>} - Parsed content after JavaScript execution
 */
async function parseWithJavaScript(url) {
  console.log('Checking for puppeteer support...');
  
  try {
    // Check if puppeteer is available
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (error) {
      console.error(`Puppeteer not available: ${error.message}`);
      console.log('Falling back to regular HTML parsing...');
      return null;
    }
    
    console.log('Launching headless browser for JavaScript rendering...');
    
    try {
      // Launch a headless browser
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Create a new page
      const page = await browser.newPage();
      
      // Set up dialog handling
      page.on('dialog', async dialog => {
        const message = dialog.message();
        const type = dialog.type(); // alert, confirm, prompt, beforeunload
        
        console.log(`\n[${type.toUpperCase()}] ${message}`);
        
        // Auto-dismiss alerts
        if (type === 'alert') {
          await dialog.dismiss();
        } 
        // Auto-confirm confirmations
        else if (type === 'confirm') {
          console.log('Automatically confirmed dialog');
          await dialog.accept();
        } 
        // Auto-fill prompts with empty string
        else if (type === 'prompt') {
          console.log('Automatically dismissed prompt');
          await dialog.dismiss();
        }
        // Handle beforeunload
        else if (type === 'beforeunload') {
          await dialog.dismiss();
        }
      });
      
      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      // Get the final URL (after any redirects)
      const finalUrl = page.url();
      
      // Extract HTML content after JavaScript execution
      const html = await page.content();
      
      // Close the browser
      await browser.close();
      
      // Parse the rendered HTML
      return parseHtml(html, finalUrl);
    } catch (error) {
      console.error(`Error rendering with JavaScript: ${error.message}`);
      console.log('Falling back to regular HTML parsing...');
      
      // If puppeteer fails, return null to indicate failure
      return null;
    }
  } catch (error) {
    console.error(`JavaScript rendering not supported on this platform: ${error.message}`);
    console.log('Falling back to regular HTML parsing...');
    return null;
  }
}

module.exports = {
  parseHtml,
  parseWithJavaScript
};