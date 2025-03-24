# Agris Browser

A terminal-based web browser, controlled through command-line interface (CLI), designed for both human and AI agent use. Optimized for accessing API documentation and interacting with web services.

## Features

- Terminal-based interface
- Command-line control
- Enhanced HTML parsing with Cheerio
- JavaScript execution with Puppeteer
- Popup dialog handling
- Binary content detection and reference display
- Full HTTP method support (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- Bot protection detection and avoidance
- Enhanced documentation access with caching
- Cookie and session management
- Form interaction and file upload support
- Search engine integration
- Link following capability
- AI-optimized output formatting

## Installation

### From npm (recommended)

```bash
# Install globally from npm
npm install -g agris
```

This will install AGRIS globally on your system, making the `agris` command available from any directory.

### From Source

```bash
# Clone the repository
git clone https://github.com/salviz/agris.git
cd agris

# Install dependencies
npm install

# Make the command globally available
npm link
```

### Quick npx Usage (No Installation)

```bash
npx agris get https://example.com
```

For detailed installation instructions and troubleshooting, see [INSTALLATION.md](INSTALLATION.md).

## Usage

Agris uses a simple command structure: `agris <command> [options] <url> [data]`

### Basic Commands

```bash
# Perform a GET request
agris get https://example.com

# Perform a GET with JavaScript rendering
agris jsget https://example.com

# Get raw HTML output
agris get --raw https://example.com

# Perform a HEAD request (headers only)
agris head https://example.com

# Submit a form
agris post https://example.com form:"login" "username":"user" "password":"pass"

# Upload a file
agris post https://example.com/upload form:"upload" "title":"My Document" file:"document":"/path/to/file.pdf"

# PUT, PATCH, DELETE, and OPTIONS requests
agris put https://api.example.com/users/123 --json=yes "name":"John Doe" "email":"john@example.com"
agris patch https://api.example.com/users/123 "status":"active"
agris delete https://api.example.com/users/123
agris options https://api.example.com/resource

# Access documentation with enhanced bot protection bypass
agris docs openai/api
agris docs nodejs/fs
agris docs python/requests
agris docs https://platform.openai.com/docs/api-reference

# Documentation cache management
agris docs cache-list
agris docs cache-clear
agris docs openai/api --refresh=yes

# Search the web
agris search "search query"

# Search with a specific engine
agris search --engine=google "search query"

# Search with JavaScript rendering enabled
agris search --js=yes "search query"

# Follow a link from the previous page
agris follow 3

# Display help
agris help

# Show version
agris version
```

### Options

- `--raw`: Display the raw HTTP response instead of rendering
- `--show-links=yes|no`: Enable or disable displaying the list of links (default: yes)
- `--engine=name`: Specify search engine (duckduckgo, google, bing)
- `--js=yes`: Enable JavaScript rendering
- `--json=yes`: Use JSON content type for requests with bodies
- `--use-cache=yes|no`: Enable or disable documentation caching (default: yes)
- `--refresh=yes`: Force refresh cached documentation (default: no)
- `--cache-expiry=hours`: Set custom cache expiry time in hours (default: 24)

## JavaScript Support

Agris now includes JavaScript execution capabilities for better compatibility with modern websites:

- Renders JavaScript-generated content
- Handles dynamic page changes
- Processes AJAX requests
- Automatically handles popup dialogs (alerts, confirms, prompts)
- Falls back to regular mode if JavaScript rendering fails

## Development

## Documentation Access

Agris includes specialized functionality for accessing API documentation and other developer resources:

- **Enhanced Bot Protection Bypass**: Custom approaches tailored to different documentation providers
- **Documentation Shortcuts**: Easy access using `provider/topic` format (e.g., `openai/api`)
- **Documentation Caching**: Automatic caching of documentation with configurable expiry
- **Cache Management**: Commands to list and clear the cache
- **Site-Specific Optimizations**: Special handling for major documentation providers like OpenAI, GitHub, Stack Overflow, Node.js, and Python

For more details, see [DOCUMENTATION_ACCESS_IMPROVEMENTS.md](DOCUMENTATION_ACCESS_IMPROVEMENTS.md).

### Project Structure

```
agris-browser/
├── src/
│   ├── core/                   # Core browser functionality
│   │   ├── request.js          # Handles sending HTTP requests
│   │   ├── response.js         # Handles processing HTTP responses
│   │   ├── parser.js           # Parses HTML and handles JS execution
│   │   ├── renderer.js         # Renders parsed content to the terminal
│   │   ├── cookieManager.js    # Manages cookies
│   │   ├── sessionManager.js   # Manages sessions
│   │   ├── docCacheManager.js  # Manages documentation caching
│   │   ├── state.js            # Manages browser state between commands
│   │   └── utils.js            # Utility functions
│   ├── cli/                    # Command-line interface logic
│   │   ├── commands.js         # Defines and handles CLI commands
│   │   └── inputParser.js      # Parses command-line arguments
│   ├── index.js                # Main entry point for the application
│   └── config.js               # Configuration management
├── bin/                        # Executable files
│   └── agris.js                # Command-line executable
├── test/                       # Unit and integration tests
│   ├── api-methods-test.js     # Tests for HTTP methods
│   ├── bot-detection-test.js   # Tests for bot detection avoidance
│   ├── documentation-test.js   # Tests for documentation access
│   ├── output-format-test.js   # Tests for output formatting
│   └── run-all-tests.js        # Script to run all tests
├── package.json                # Project metadata, dependencies, scripts
├── DOCUMENTATION_ACCESS_IMPROVEMENTS.md # Documentation improvements
├── LESSONS_LEARNED.md          # Technical challenges and solutions
└── README.md                   # Project documentation
```

### Dependencies

- **cheerio**: jQuery-like HTML parsing for Node.js
- **puppeteer**: Headless Chrome for JavaScript execution
- **iconv-lite**: Character encoding conversion
- **fs-extra**: Enhanced file system operations
- **random-useragent**: Random user agent generation
- **http-proxy-agent, https-proxy-agent, socks-proxy-agent**: Proxy support

### Running Tests

```bash
npm test
```

## License

MIT
