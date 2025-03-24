/**
 * HTTP response processing for Agris browser
 * Enhanced with binary content handling
 */

const { saveCookiesFromResponse } = require('./cookieManager');
const { isBinaryContentType, getFileExtensionFromContentType } = require('./request');

function processResponse(response) {
  // Save cookies from response headers
  if (response.headers && response.headers['set-cookie']) {
    saveCookiesFromResponse(response.url, response.headers['set-cookie']);
  }
  
  // Process the response based on content type
  const contentType = getContentType(response.headers);
  
  // Preserve binary content flags
  if (response.isBinary) {
    return {
      statusCode: response.statusCode,
      headers: response.headers,
      contentType: contentType,
      body: response.body,
      isBinary: true,
      fileExtension: response.fileExtension || getFileExtensionFromContentType(contentType),
      url: response.url
    };
  } else {
    return {
      statusCode: response.statusCode,
      headers: response.headers,
      contentType: contentType,
      body: response.body,
      isBinary: isBinaryContentType(contentType) 
    };
  }
}

function getContentType(headers) {
  if (!headers || !headers['content-type']) {
    return 'text/plain'; // Default content type
  }
  
  // Extract content type, ignoring charset
  const contentTypeHeader = headers['content-type'];
  const contentType = contentTypeHeader.split(';')[0].trim().toLowerCase();
  
  return contentType;
}

module.exports = {
  processResponse
};
