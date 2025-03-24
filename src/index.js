#!/usr/bin/env node

const { parseInput } = require('./cli/inputParser');
const { executeCommand } = require('./cli/commands');

async function main() {
  try {
    const parsedInput = parseInput(process.argv.slice(2));
    await executeCommand(parsedInput);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
