/**
 * Agris Browser Enhanced Bot Detection Test Script
 * 
 * This script tests Agris's improved ability to handle websites with bot detection
 * and other challenges like Cloudflare protection.
 */

const { 
  makeGetRequest, 
  handleProtectedSite, 
  tryAlternativeAccess,
  getBrowserProfileForDomain
} = require('../src/core/request');
const { getCookieCount } = require('../src/core/cookieManager');
const fs = require('fs');
const path = require('path');

// Directory to store test results
const TEST_RESULTS_DIR = path.join(__dirname, '..', 'test_results');

// Create the test results directory if it doesn't exist
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Function to save test results to file
function saveTestResult(siteName, result) {
  const filePath = path.join(TEST_RESULTS_DIR, `${siteName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_test.html`);
  
  // Convert objects to string for saving
  if (typeof result === 'object') {
    result = JSON.stringify(result, null, 2);
  }
  
  fs.writeFileSync(filePath, result);
  console.log(`Test result saved to ${filePath}`);
}

async function testSite(url, description, options = {}) {
  console.log(`\n==== Testing ${description}: ${url} ====\n`);
  
  try {
    console.log('Initial request with standard headers...');
    const startTime = Date.now();
    const response = await makeGetRequest(url, options);
    const endTime = Date.now();
    
    console.log(`Request completed in ${endTime - startTime}ms`);
    console.log(`Response status code: ${response.statusCode}`);
    console.log(`Content type: ${response.contentType}`);
    
    // Save browser profile used for this domain
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const browserProfile = getBrowserProfileForDomain(hostname);
    console.log(`Browser profile used: ${browserProfile.browserType} (${browserProfile.platform})`);
    
    // Check for bot detection signs
    const botDetectionFound = checkForBotDetection(response);
    
    if (botDetectionFound) {
      console.log('⚠️ Bot detection detected, trying alternative approach...');
      
      try {
        const bypassStartTime = Date.now();
        const improvedResponse = await handleProtectedSite(response, url);
        const bypassEndTime = Date.now();
        
        console.log(`Bypass request completed in ${bypassEndTime - bypassStartTime}ms`);
        console.log(`Bypass response status code: ${improvedResponse.statusCode}`);
        
        // Check if the improved approach worked
        const stillBlocked = checkForBotDetection(improvedResponse);
        
        if (stillBlocked) {
          console.log('⚠️ FAILED: Alternative approach did not bypass protection');
          console.log('Protection type detected:', stillBlocked);
          console.log('Headers used:', JSON.stringify(improvedResponse.requestHeaders || {}, null, 2));
          console.log('Response excerpt:', improvedResponse.body.substring(0, 300) + '...');
          
          // Save the failed bypass response for analysis
          saveTestResult(`${hostname}_failed_bypass`, improvedResponse.body);
        } else {
          console.log('✅ SUCCESS: Alternative approach bypassed protection');
          console.log('Response size:', improvedResponse.body.length);
          console.log('Response excerpt:', improvedResponse.body.substring(0, 300) + '...');
          
          // Save the successful bypass response
          saveTestResult(hostname, improvedResponse.body);
        }
        
        return improvedResponse;
      } catch (error) {
        console.error('⚠️ ERROR with alternative approach:', error.message);
        return null;
      }
    } else {
      console.log('✅ SUCCESS: No bot detection encountered');
      console.log('Response size:', response.body.length);
      console.log('Response excerpt:', response.body.substring(0, 300) + '...');
      
      // Save the successful response
      saveTestResult(hostname, response.body);
      
      return response;
    }
  } catch (error) {
    console.error('⚠️ ERROR:', error.message);
    return null;
  }
}

// Function to check for different types of bot detection
function checkForBotDetection(response) {
  if (!response || !response.body) return 'no-response';
  
  const body = response.body.toLowerCase();
  
  // Check for Cloudflare protection
  if (body.includes('cloudflare') && 
      (body.includes('checking your browser') || 
       body.includes('security challenge') || 
       body.includes('just a moment') ||
       body.includes('attention required'))) {
    return 'cloudflare';
  }
  
  // Check for Google captcha
  if (body.includes('our systems have detected unusual traffic') || 
      body.includes('please solve this captcha') ||
      body.includes('unusual traffic from your computer') ||
      (body.includes('automatic query') && body.includes('blocked'))) {
    return 'google-captcha';
  }
  
  // Check for Stack Overflow protection
  if ((response.url && response.url.includes('stackoverflow.com')) && 
     (response.statusCode === 403 || 
      response.statusCode === 429 || 
      body.includes('human verification') || 
      body.includes('too many requests'))) {
    return 'stackoverflow';
  }
  
  // Check for Reddit limitations
  if ((response.url && response.url.includes('reddit.com')) && 
     (response.statusCode === 403 || 
      body.includes('our cdn was unable to reach our servers') ||
      body.includes('blocked') ||
      (body.includes('robots') && body.includes('detection'))) &&
      !response.url.includes('.compact')) {
    return 'reddit';
  }
  
  // Generic CAPTCHA detection
  if (body.includes('captcha') || 
      body.includes('robot detection') || 
      body.includes('automated script') || 
      body.includes('bot detection') ||
      body.includes('human verification') ||
      body.includes('please verify you are human') ||
      (response.statusCode === 403 && body.includes('blocked')) || 
      (response.statusCode === 429 && body.includes('too many'))) {
    return 'generic-bot-protection';
  }
  
  return false;
}

async function runTests() {
  console.log('Starting enhanced bot detection bypass tests for Agris browser...');
  console.log('Initial cookie count:', getCookieCount());
  
  // Test search engines (with delay between tests to avoid rate limiting)
  const ddgResponse = await testSite('https://lite.duckduckgo.com/lite/?q=openai+o1+pro+model', 'DuckDuckGo Lite');
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
  
  // Test one specific Stack Overflow post (often easier to access)
  await testSite('https://stackoverflow.com/questions/77482892/how-to-use-claude-3-opus-to-summarize-a-pdf-and-answer-questions-about-it', 'Stack Overflow Post');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test Reddit with old interface (more accessible)
  await testSite('https://old.reddit.com/r/LocalLLaMA/', 'Reddit (old interface)');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\nFinal cookie count:', getCookieCount());
  console.log('\nTests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite error:', error);
});