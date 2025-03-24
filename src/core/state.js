/**
 * Simple state management for the Agris browser
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// File to store persistent state
const STATE_FILE = path.join(os.homedir(), '.agris_state.json');

// Initialize state from file or defaults
let state = {
  lastPage: null,
  history: [],
  config: {}
};

// Load state from file if it exists
try {
  if (fs.existsSync(STATE_FILE)) {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    state = JSON.parse(data);
  }
} catch (error) {
  console.error(`Error loading state: ${error.message}`);
}

/**
 * Get a value from state
 * @param {string} key - The state key to retrieve
 * @returns {any} - The state value
 */
function getState(key) {
  return state[key];
}

/**
 * Set a value in state
 * @param {string} key - The state key to set
 * @param {any} value - The value to store
 */
function setState(key, value) {
  state[key] = value;
  
  // Save state to file
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8');
  } catch (error) {
    console.error(`Error saving state: ${error.message}`);
  }
}

module.exports = {
  getState,
  setState
};