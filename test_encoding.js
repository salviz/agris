#!/usr/bin/env node

/**
 * Test script to diagnose encoding issues with AGRIS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configure output directory
const OUTPUT_DIR = path.join(__dirname, 'encoding_test');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Function to fetch a URL directly and save it to a file
function fetchUrlDirectly(url, outputFile) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const fullPath = path.join(OUTPUT_DIR, outputFile);
    
    console.log(`Directly fetching: ${url}`);
    
    client.get(url, (res) => {
      // Check if we need to follow a redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Following redirect to: ${res.headers.location}`);
        return fetchUrlDirectly(res.headers.location, outputFile)
          .then(resolve)
          .catch(reject);
      }
      
      // Get encoding from content-type header if possible
      let encoding = 'utf8';
      const contentType = res.headers['content-type'] || '';
      const charsetMatch = contentType.match(/charset=([^;]+)/i);
      if (charsetMatch) {
        encoding = charsetMatch[1].toLowerCase();
      }
      
      console.log(`Content-Type: ${contentType}`);
      console.log(`Using encoding: ${encoding}`);
      
      const fileStream = fs.createWriteStream(fullPath);
      res.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Output saved to ${outputFile}`);
        resolve(fullPath);
      });
      
      res.on('error', (err) => {
        fs.unlink(fullPath, () => {}); // Delete the file on error
        reject(err);
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to run AGRIS commands and save output
function runAgrisCommand(command, outputFile) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    const fullPath = path.join(OUTPUT_DIR, outputFile);
    fs.writeFileSync(fullPath, output);
    console.log(`Output saved to ${outputFile}`);
    return fullPath;
  } catch (error) {
    const errorOutput = `Command failed: ${command}\n${error.message}\n`;
    const fullPath = path.join(OUTPUT_DIR, `error_${outputFile}`);
    fs.writeFileSync(fullPath, errorOutput);
    console.error(errorOutput);
    return null;
  }
}

// Start encoding tests
async function runTests() {
  // Test 1: Directly fetch OpenAI O1 page
  await fetchUrlDirectly('https://openai.com/o1', 'direct_openai_o1.html');
  
  // Test 2: Use AGRIS to get the same page
  runAgrisCommand('node bin/agris.js get https://openai.com/o1 --raw', 'agris_openai_o1.html');
  
  // Test 3: Use AGRIS with a search engine that has a simpler output
  runAgrisCommand('node bin/agris.js search --engine=duckduckgo "OpenAI o1 pro model" --raw', 'agris_search_duckduckgo.html');
  
  // Test 4: Compare a simple page that we know works correctly
  await fetchUrlDirectly('https://example.com', 'direct_example.html');
  runAgrisCommand('node bin/agris.js get https://example.com --raw', 'agris_example.html');
  
  console.log('Encoding tests complete. Check the encoding_test directory for results.');
}

runTests();