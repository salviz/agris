/**
 * Tests for the AGRIS documentation access functionality
 */

const { enhancedDocumentationAccess, isDocUrl, getDocumentationSiteType } = require('../src/core/request');
const docCacheManager = require('../src/core/docCacheManager');

// Test URLs
const TEST_URLS = [
  'https://docs.github.com',
  'https://nodejs.org/docs/latest/api/fs.html',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'https://example.com/not-a-doc-url'
];

// Test the URL detection function
console.log('Testing documentation URL detection:');
TEST_URLS.forEach(url => {
  const isDoc = isDocUrl(url);
  console.log(`  ${url}: ${isDoc ? 'Is documentation' : 'Not documentation'}`);
});

// Test the documentation site type detection
console.log('\nTesting documentation site type detection:');
TEST_URLS.forEach(url => {
  if (isDocUrl(url)) {
    const siteType = getDocumentationSiteType(url);
    console.log(`  ${url}: ${siteType}`);
  }
});

// Test cache directory creation
console.log('\nTesting cache directory creation:');
const testCacheDir = './test/test_cache';
try {
  const cacheDir = docCacheManager.ensureCacheDir(testCacheDir);
  console.log(`  Cache directory created at: ${cacheDir}`);
} catch (error) {
  console.error(`  Failed to create cache directory: ${error.message}`);
}

// Test cache key generation
console.log('\nTesting cache key generation:');
TEST_URLS.forEach(url => {
  const cacheKey = docCacheManager.generateCacheKey(url);
  console.log(`  ${url}: ${cacheKey}`);
});

console.log('\nAll documentation tests completed!');
console.log('For full testing of documentation functionality, please run:');
console.log('  agris docs nodejs/fs');
console.log('  agris docs cache-list');