/**
 * Agris Browser Output Format Test
 * 
 * This script tests the new output formatting specifically designed
 * for AI LLMs to better parse and understand the responses.
 */

const { executeCommand } = require('../src/cli/commands');

// Mock parsed input for tests
function mockInput(command, url, options = {}, data = null) {
  return {
    command,
    url,
    options,
    data
  };
}

async function runFormatTests() {
  console.log('\n=== TESTING OUTPUT FORMATTING ===\n');

  try {
    // Test 1: JSON API Response
    console.log('Test 1: JSON API GET Response');
    await executeCommand(mockInput('get', 'https://httpbin.org/get'));
    
    // Test 2: JSON API POST Response with data
    console.log('\n\nTest 2: JSON API POST Response');
    await executeCommand(mockInput('post', 'https://httpbin.org/post', { json: 'yes' }, 
      { name: 'AI Bot', purpose: 'Testing' }));
    
    // Test 3: Binary Content Response
    console.log('\n\nTest 3: Binary Content');
    await executeCommand(mockInput('get', 'https://httpbin.org/image/jpeg'));
    
    // Test 4: Options Method (headers-only)
    console.log('\n\nTest 4: OPTIONS Method');
    await executeCommand(mockInput('options', 'https://httpbin.org/get'));
  } catch (error) {
    console.error(`Error during tests: ${error.message}`);
  }
  
  console.log('\n\n=== OUTPUT FORMAT TESTS COMPLETED ===\n');
}

runFormatTests().catch(error => {
  console.error('Test error:', error);
});