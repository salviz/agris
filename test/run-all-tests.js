/**
 * Run all tests for the AGRIS browser
 */

const { spawn } = require('child_process');
const path = require('path');

// List of test scripts to run
const tests = [
  'api-methods-test.js',
  'output-format-test.js',
  'bot-detection-test.js',
  'documentation-test.js'
];

// Function to run a test
function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n===== Running ${testFile} =====`);
    
    const testPath = path.join(__dirname, testFile);
    const testProcess = spawn('node', [testPath], { stdio: 'inherit' });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${testFile} completed successfully`);
        resolve();
      } else {
        console.error(`\n❌ ${testFile} failed with code ${code}`);
        reject(new Error(`Test failed: ${testFile}`));
      }
    });
    
    testProcess.on('error', (err) => {
      console.error(`\n❌ Error running ${testFile}: ${err.message}`);
      reject(err);
    });
  });
}

// Run all tests sequentially
async function runAllTests() {
  console.log('\n===== AGRIS Browser Test Suite =====\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    try {
      await runTest(test);
      passCount++;
    } catch (error) {
      failCount++;
      console.error(`Test error: ${error.message}`);
    }
  }
  
  console.log('\n===== Test Results =====');
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  
  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});