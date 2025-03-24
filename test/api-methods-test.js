/**
 * Agris Browser API Methods Test Script
 * 
 * This script tests the new HTTP methods (PUT, DELETE, PATCH, OPTIONS)
 * and file upload capabilities against httpbin.org.
 */

const { 
  makeGetRequest, 
  makePostRequest, 
  makePutRequest,
  makeDeleteRequest,
  makePatchRequest,
  makeOptionsRequest
} = require('../src/core/request');
const fs = require('fs');
const path = require('path');

// Create test file for upload
const TEST_FILE_PATH = path.join(__dirname, 'test-upload.txt');
fs.writeFileSync(TEST_FILE_PATH, 'This is a test file for upload testing.');

async function testHttpbin() {
  console.log('\n=== Testing Httpbin.org API ===\n');
  
  try {
    // Test GET
    console.log('Testing GET:');
    const getResponse = await makeGetRequest('https://httpbin.org/get');
    console.log(`Status Code: ${getResponse.statusCode}`);
    console.log('Response:');
    try {
      const jsonResponse = JSON.parse(getResponse.body);
      console.log(JSON.stringify(jsonResponse, null, 2).substring(0, 200) + '...');
    } catch (e) {
      console.log(getResponse.body.substring(0, 200) + '...');
    }
    
    // Test Form Data
    console.log('\nTesting POST with form data:');
    const formData = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    try {
      const formResponse = await makePostRequest('https://httpbin.org/post', formData);
      console.log(`Status Code: ${formResponse.statusCode}`);
      
      // Continue even if we get a 502 error
      if (formResponse.statusCode === 502) {
        console.log('Received temporary 502 error from httpbin.org, continuing with tests...');
      } else {
        try {
          const formResponseJson = JSON.parse(formResponse.body);
          console.log('Form Data Received:');
          console.log(formResponseJson.form);
        } catch (e) {
          console.log('Error parsing response as JSON');
          console.log(formResponse.body.substring(0, 200) + '...');
        }
      }
    } catch (e) {
      console.log('Error with POST request, continuing with tests...');
      console.log(`Error: ${e.message}`);
    }
    
    // Test File Upload
    console.log('\nTesting File Upload:');
    const fileData = {
      fields: {
        name: 'Test Upload'
      },
      files: {
        file: TEST_FILE_PATH
      }
    };
    
    const uploadResponse = await makePostRequest('https://httpbin.org/post', fileData);
    console.log(`Status Code: ${uploadResponse.statusCode}`);
    
    try {
      const uploadResponseJson = JSON.parse(uploadResponse.body);
      console.log('Upload Response:');
      console.log(JSON.stringify(uploadResponseJson, null, 2).substring(0, 200) + '...');
      
      if (uploadResponseJson.files && Object.keys(uploadResponseJson.files).length > 0) {
        console.log('\nFile Upload Successful!');
        console.log('Files received:');
        console.log(uploadResponseJson.files);
      } else {
        console.log('\nFile upload request completed but no files section detected in response.');
        console.log('Form data detected:');
        console.log(uploadResponseJson.form);
      }
    } catch (e) {
      console.log('Error parsing response JSON:');
      console.log(uploadResponse.body.substring(0, 200) + '...');
    }
    
    // Test PUT
    console.log('\nTesting PUT:');
    const putData = {
      updated: true,
      name: 'Updated Data'
    };
    const putResponse = await makePutRequest('https://httpbin.org/put', putData, { json: true });
    console.log(`Status Code: ${putResponse.statusCode}`);
    try {
      const putResponseJson = JSON.parse(putResponse.body);
      console.log('JSON Data Received:');
      console.log(putResponseJson.json);
    } catch (e) {
      console.log('Error parsing response as JSON');
      console.log(putResponse.body.substring(0, 200) + '...');
    }
    
    // Test DELETE
    console.log('\nTesting DELETE:');
    const deleteResponse = await makeDeleteRequest('https://httpbin.org/delete');
    console.log(`Status Code: ${deleteResponse.statusCode}`);
    try {
      const deleteResponseJson = JSON.parse(deleteResponse.body);
      console.log('Response:');
      console.log(JSON.stringify(deleteResponseJson, null, 2).substring(0, 200) + '...');
    } catch (e) {
      console.log('Error parsing response as JSON');
      console.log(deleteResponse.body.substring(0, 200) + '...');
    }
    
    // Test PATCH
    console.log('\nTesting PATCH:');
    const patchData = {
      patched: true
    };
    const patchResponse = await makePatchRequest('https://httpbin.org/patch', patchData, { json: true });
    console.log(`Status Code: ${patchResponse.statusCode}`);
    try {
      const patchResponseJson = JSON.parse(patchResponse.body);
      console.log('JSON Data Received:');
      console.log(patchResponseJson.json);
    } catch (e) {
      console.log('Error parsing response as JSON');
      console.log(patchResponse.body.substring(0, 200) + '...');
    }
    
    // Test OPTIONS
    console.log('\nTesting OPTIONS:');
    const optionsResponse = await makeOptionsRequest('https://httpbin.org/get');
    console.log(`Status Code: ${optionsResponse.statusCode}`);
    console.log('Headers:');
    for (const [key, value] of Object.entries(optionsResponse.headers)) {
      if (key.toLowerCase().includes('access-control') || 
          key.toLowerCase().includes('allow')) {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    console.log('\nHttpbin.org API Tests Completed Successfully!');
  } catch (error) {
    console.error(`Error testing Httpbin API: ${error.message}`);
  }
}

async function runTests() {
  console.log('Starting Agris browser HTTP methods and file upload tests...');
  
  // Test against Httpbin (form data and file uploads)
  await testHttpbin();
  
  // Clean up test file
  try {
    fs.unlinkSync(TEST_FILE_PATH);
    console.log('\nTest file removed.');
  } catch (error) {
    console.error(`Error removing test file: ${error.message}`);
  }
  
  console.log('\nAll tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite error:', error);
});