/**
 * Parse command line input for the Agris browser
 */

function parseInput(args) {
  if (args.length === 0) {
    throw new Error('No command provided. Use "agris help" for usage information.');
  }

  const command = args[0].toLowerCase();
  const options = {};
  let url = '';
  let data = {};
  
  // Extract options and URL
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Handle options with values (--option=value)
      if (arg.includes('=')) {
        const [optKey, optValue] = arg.slice(2).split('=');
        options[optKey] = optValue;
      } else {
        // Flag options (--option)
        options[arg.slice(2)] = true;
      }
    } else if (!url) {
      // First non-option argument is the URL
      url = arg;
    } else if (url && command === 'post') {
      // Handle post data in format field:value
      if (arg.startsWith('form:')) {
        const formName = arg.split(':')[1].replace(/"/g, '');
        data.formName = formName;
        data.fields = {};
      } else if (arg.includes(':')) {
        // Extract field:value pairs
        const [field, value] = arg.split(':').map(part => part.replace(/"/g, ''));
        if (data.fields) {
          data.fields[field] = value;
        }
      }
    }
  }

  // Validate input based on command
  switch (command) {
    case 'get':
    case 'jsget':
    case 'post':
    case 'head':
    case 'put':
    case 'delete':
      if (!url) {
        throw new Error(`URL is required for '${command}' command`);
      }
      break;
    
    case 'search':
      if (!url) {
        throw new Error('Search query is required');
      }
      break;
    
    case 'follow':
      if (!url) {
        throw new Error('Link number is required for follow command');
      }
      break;
    
    case 'help':
      // No validation needed for help
      break;
    
    case 'version':
      // No validation needed for version
      break;
    
    default:
      throw new Error(`Unknown command: ${command}. Use "agris help" for usage information.`);
  }

  return {
    command,
    options,
    url,
    data
  };
}

module.exports = {
  parseInput
};
