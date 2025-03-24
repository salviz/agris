/**
 * Agris Browser Binary Content Test Script
 * 
 * This script tests Agris's handling of binary content like images, PDFs, etc.
 */

const { makeGetRequest } = require('../src/core/request');
const { renderContent } = require('../src/core/renderer');
const { parseHtml } = require('../src/core/parser');

async function testBinaryContent(url, description) {
  console.log(`\n==== Testing ${description}: ${url} ====\n`);
  
  try {
    console.log('Requesting content...');
    const response = await makeGetRequest(url);
    
    console.log(`Response status: ${response.statusCode}`);
    console.log(`Content type: ${response.headers['content-type']}`);
    
    if (response.isBinary) {
      console.log(`\n✅ BINARY CONTENT DETECTED`);
      console.log(`Content size: ${response.body.length} bytes`);
      console.log(`File extension: ${response.fileExtension || 'unknown'}`);
      
      // Test rendering binary content
      console.log('\nTesting binary content rendering:');
      renderContent(response);
    } else {
      console.log(`\n⚠️ NOT DETECTED AS BINARY`);
      console.log(`First 300 characters of response: ${response.body.substring(0, 300)}...`);
    }
  } catch (error) {
    console.error(`⚠️ ERROR: ${error.message}`);
  }
}

async function testBinaryReferences(url, description) {
  console.log(`\n==== Testing binary references in ${description}: ${url} ====\n`);
  
  try {
    console.log('Requesting content...');
    const response = await makeGetRequest(url);
    
    if (response.isBinary) {
      console.log(`\n⚠️ Page itself is binary content, can't extract references.`);
      return;
    }
    
    // Parse the HTML content
    const parsedContent = parseHtml(response.body, url);
    
    // Check for binary references
    if (parsedContent.binaryReferences && parsedContent.binaryReferences.length > 0) {
      console.log(`\n✅ FOUND ${parsedContent.binaryReferences.length} BINARY REFERENCES`);
      
      // Show the first 5 references
      const showCount = Math.min(5, parsedContent.binaryReferences.length);
      for (let i = 0; i < showCount; i++) {
        const ref = parsedContent.binaryReferences[i];
        console.log(`\n[${i+1}] Type: ${ref.type}, URL: ${ref.url}`);
        console.log(`    Description: ${ref.description}`);
      }
      
      // Test rendering
      console.log('\nTesting rendering with binary references:');
      renderContent(parsedContent);
    } else {
      console.log(`\n⚠️ NO BINARY REFERENCES FOUND`);
    }
  } catch (error) {
    console.error(`⚠️ ERROR: ${error.message}`);
  }
}

async function runTests() {
  console.log('Starting binary content tests for Agris browser...');
  
  // Test direct binary content
  await testBinaryContent('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'PDF Document');
  await testBinaryContent('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', 'PNG Image');
  
  // Test pages with binary references
  await testBinaryReferences('https://en.wikipedia.org/wiki/Main_Page', 'Wikipedia Main Page');
  await testBinaryReferences('https://www.bbc.com/', 'BBC Website');
  
  console.log('\nTests completed!');
}

runTests().catch(error => {
  console.error('Test suite error:', error);
});