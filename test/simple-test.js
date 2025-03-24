/**
 * Agris Browser Simple Test Script
 * 
 * This script performs simple tests of the browser's capabilities
 * avoiding the complexity of the full bot detection test.
 */

const { makeGetRequest } = require('../src/core/request');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting simple test of AGRIS browser...');
  
  try {
    // Test DuckDuckGo Lite - Most reliable search engine for terminal browsers
    console.log('\nTesting DuckDuckGo Lite search...');
    const searchResponse = await makeGetRequest('https://lite.duckduckgo.com/lite/?q=openai+o1+pro+model');
    console.log(`Status Code: ${searchResponse.statusCode}`);
    console.log(`Content Type: ${searchResponse.contentType}`);
    console.log(`Response Size: ${searchResponse.body.length} bytes`);
    console.log(`First 100 chars: ${searchResponse.body.substring(0, 100)}...`);
    
    // Success if we got a 200 response 
    if (searchResponse.statusCode === 200 && searchResponse.body.length > 1000) {
      console.log('✅ DuckDuckGo Lite search success!');
    } else {
      console.log('⚠️ DuckDuckGo Lite search failed');
    }
    
    // Save results to a file for inspection
    fs.writeFileSync(path.join(__dirname, 'duckduckgo-results.html'), searchResponse.body);
    console.log('Search results saved to test/duckduckgo-results.html');
    
    // Test following a link with a hardcoded URL
    console.log('\nTesting link following with known URL...');
    const link = "https://en.wikipedia.org/wiki/OpenAI";
    console.log(`Using test link: ${link}`);
    
    try {
      const linkResponse = await makeGetRequest(link, { maxRetries: 2 });
      console.log(`Status Code: ${linkResponse.statusCode}`);
      console.log(`Content Type: ${linkResponse.contentType}`);
      console.log(`Response Size: ${linkResponse.body.length} bytes`);
      
      if (linkResponse.statusCode >= 200 && linkResponse.statusCode < 300 && linkResponse.body.length > 500) {
        console.log('✅ Link following success!');
      } else {
        console.log('⚠️ Link following partial success (received content but it may be restricted)');
      }
      
      fs.writeFileSync(path.join(__dirname, 'link-results.html'), linkResponse.body);
      console.log('Link results saved to test/link-results.html');
    } catch (error) {
      console.error(`❌ Link following failed: ${error.message}`);
    }
  } catch (error) {
    console.error(`Test error: ${error.message}`);
  }
  
  console.log('\nTests completed!');
}

main().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});