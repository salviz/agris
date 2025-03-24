# Agris Browser Documentation

## Overview
Agris is a terminal-based web browser that provides a simple CLI interface for navigating the web. It supports basic browsing capabilities, HTML parsing, and now includes advanced features like JavaScript execution (where supported), handling of dialog boxes, binary content handling, and bot detection avoidance.

## Features

### Basic Browsing
- **GET Requests**: Fetch and display web content
- **POST Requests**: Submit forms and post data
- **HEAD Requests**: View HTTP headers

### Enhanced HTML Parsing
- Uses Cheerio (jQuery-like) library for robust HTML parsing
- Extracts text, links, and forms
- Handles complex HTML structures better than regex

### JavaScript Rendering (Where Supported)
- Uses Puppeteer for JavaScript execution
- Handles dynamic content loaded after page load
- Processes AJAX requests
- Falls back to standard mode if JavaScript rendering is not available

### Binary Content Handling
- Detects binary content types (images, videos, PDFs, documents, etc.)
- Maintains buffer integrity for binary data instead of corrupting it
- Shows informative references like `[Image: URL]` or `[Video: URL]`
- Extracts binary content references from HTML pages
- Displays metadata (content type, size, file extension) for binary responses

### Bot Detection Avoidance
- Rotates user agents to appear more like regular browsers
- Adds authentic browser headers
- Handles referrer chains for natural browsing patterns
- Automatically detects and bypasses Cloudflare protection
- Provides alternative handling for Google captcha challenges
- Falls back to alternative access methods when needed

### Enhanced Cookie Management
- Persistent cookie storage between sessions
- Proper domain matching for cookie handling
- Support for all cookie attributes (Secure, HttpOnly, SameSite, etc.)
- Automatic cookie expiration management
- Session tracking across multiple requests

### Dialog Box Handling
- Auto-dismisses alerts
- Auto-confirms confirmation dialogs
- Auto-dismisses prompts
- Handles "beforeunload" dialogs

### Navigation Features
- Follow links by number
- Search multiple engines (DuckDuckGo, Google, Bing)
- Track state between commands

## Commands

### Basic Navigation
```bash
# Regular browsing
agris get <url>

# JavaScript-enabled browsing
agris jsget <url>

# View raw HTML
agris get --raw <url>

# View HTTP headers
agris head <url>
```

### Search
```bash
# Search with default engine (DuckDuckGo)
agris search "query"

# Search with specific engine
agris search --engine=google "query"

# Search with JavaScript enabled
agris search --js=yes "query"
```

### Form Submission
```bash
# Post form data
agris post <url> form:"formname" "field1":"value1" "field2":"value2"
```

### Navigation
```bash
# Follow a link from the previous page
agris follow <link_number>

# Follow a link with JavaScript enabled
agris follow <link_number> --js=yes
```

### Help and Info
```bash
# Show help
agris help

# Show version
agris version
```

## Options
- `--raw`: Display the raw HTML content
- `--show-links=yes|no`: Show or hide extracted links
- `--engine=name`: Specify search engine (duckduckgo, google, bing)
- `--js=yes`: Enable JavaScript rendering

## Platform Support
- The browser works on all platforms where Node.js is available
- Basic HTML parsing works on all platforms
- JavaScript rendering requires Puppeteer, which is not supported on all platforms:
  - Supported: Windows, macOS, most Linux distributions
  - Not supported: Termux/Android, some restricted environments
- The browser automatically detects if JavaScript rendering is available and falls back to standard mode if it's not

## Technical Details

### HTML Parsing
- Uses Cheerio for DOM manipulation similar to jQuery
- Extracts text by filtering out script and style tags
- Deduplicates links based on URL
- Normalizes URLs for proper display

### JavaScript Rendering
- Launches a headless Chromium browser via Puppeteer
- Waits for network activity to settle (networkidle2)
- Extracts HTML after JavaScript execution
- Handles dialogs automatically

### State Management
- Maintains state between commands using a local file
- Stores the last viewed page for navigation
- Supports future history and bookmark features

## Development

### Adding New Features
1. Update relevant module in `src/core/`
2. Add command handler in `src/cli/commands.js`
3. Update input parser in `src/cli/inputParser.js`
4. Update documentation and help text

### Testing
- Run the browser with `npm start` or `agris`
- Test HTML parsing with various websites
- Test JavaScript rendering with dynamic sites where supported
- Check dialog handling with the included test page

## Installation
AGRIS is now available as an npm package, making installation easier than ever.

### Install from npm (Recommended)
```bash
npm install -g agris
```

### Install without JavaScript Rendering
```bash
npm install -g agris --no-optional
```

### Install from Source
```bash
git clone https://github.com/salviz/agris.git
cd agris
npm install
npm link
```

### Use without Installation
```bash
npx agris get https://example.com
```

For detailed installation instructions, troubleshooting, and platform-specific guidance, see [INSTALLATION.md](INSTALLATION.md).

## Lessons Learned
See the [LESSONS_LEARNED.md](LESSONS_LEARNED.md) file for insights gained during development.