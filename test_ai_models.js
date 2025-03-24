#!/usr/bin/env node

/**
 * Test script to use AGRIS to search for AI model information
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure output directory
const OUTPUT_DIR = path.join(__dirname, 'ai_model_research');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Function to run AGRIS commands and save output
function runAgrisCommand(command, outputFile) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), output);
    console.log(`Output saved to ${outputFile}`);
    return output;
  } catch (error) {
    const errorOutput = `Command failed: ${command}\n${error.message}\n`;
    fs.writeFileSync(path.join(OUTPUT_DIR, `error_${outputFile}`), errorOutput);
    console.error(errorOutput);
    return null;
  }
}

// Research OpenAI o1 pro model
console.log('Researching OpenAI o1 pro model...');
runAgrisCommand('node bin/agris.js search --engine=google "OpenAI o1 pro model" --raw', 'openai_o1_pro_google.txt');
runAgrisCommand('node bin/agris.js search --engine=bing "OpenAI o1 pro model" --raw', 'openai_o1_pro_bing.txt');
runAgrisCommand('node bin/agris.js search --engine=duckduckgo "OpenAI o1 pro model" --raw', 'openai_o1_pro_duckduckgo.txt');

// Research OpenAI responses API endpoint
console.log('Researching OpenAI responses API endpoint...');
runAgrisCommand('node bin/agris.js search --engine=google "OpenAI responses API endpoint documentation" --raw', 'openai_responses_api_google.txt');
runAgrisCommand('node bin/agris.js search --engine=bing "OpenAI responses API endpoint documentation" --raw', 'openai_responses_api_bing.txt');

// Research Google Gemini 2 pro model
console.log('Researching Google Gemini 2 pro model...');
runAgrisCommand('node bin/agris.js search --engine=google "Google Gemini 2 pro model" --raw', 'gemini_2_pro_google.txt');
runAgrisCommand('node bin/agris.js search --engine=bing "Google Gemini 2 pro model" --raw', 'gemini_2_pro_bing.txt');
runAgrisCommand('node bin/agris.js search --engine=duckduckgo "Google Gemini 2 pro model" --raw', 'gemini_2_pro_duckduckgo.txt');

// Research Stack Overflow discussions
console.log('Researching Stack Overflow discussions...');
runAgrisCommand('node bin/agris.js get "https://stackoverflow.com/search?q=openai+o1+pro" --raw', 'stackoverflow_openai_o1.txt');
runAgrisCommand('node bin/agris.js get "https://stackoverflow.com/search?q=google+gemini+2+pro" --raw', 'stackoverflow_gemini_2.txt');

// Research Reddit discussions
console.log('Researching Reddit discussions...');
runAgrisCommand('node bin/agris.js get "https://www.reddit.com/search/?q=openai%20o1%20pro" --raw', 'reddit_openai_o1.txt');
runAgrisCommand('node bin/agris.js get "https://www.reddit.com/search/?q=google%20gemini%202%20pro" --raw', 'reddit_gemini_2.txt');

console.log('Research complete. Check the ai_model_research directory for results.');