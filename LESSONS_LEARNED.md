# Agris Browser - Lessons Learned

## Project Summary
Agris is a terminal-based web browser controlled through a CLI that can:
- Make GET, POST, and HEAD HTTP requests
- Display raw HTML or render basic content
- Extract and display links from web pages
- Parse and interact with forms
- Handle cookies and sessions
- Navigate the web through hyperlinks
- Execute JavaScript via headless browser
- Handle popup dialog boxes

## Key Technical Insights

### URL Parsing Issue
One critical issue we encountered and fixed was in the URL parsing logic:
- The initial version had a condition `!url && !arg.includes(':')` which rejected valid URLs since all URLs contain colons
- The fix was to remove the `!arg.includes(':')` check, allowing proper URL parsing

### HTML Parsing Improvements
- Initially implemented a simple regex-based HTML parser for text, links, and forms
- Enhanced with Cheerio (jQuery-like) library for more robust HTML parsing
- Added support for JavaScript rendering using Puppeteer headless browser
- Dialog handling for alerts, confirms, and prompts

### Form Handling
- Our browser can detect and display forms in HTML content
- POST requests work when manually specifying form fields
- Future improvement: interactive form filling capability

### Search Engine Support
- Successfully tested with DuckDuckGo's lite version
- Light versions of search engines work best with our text-based browser
- Properly handles form submission for search queries

## JavaScript Rendering Implementation
We added JavaScript rendering capabilities using Puppeteer, which allows our browser to:
- Execute client-side JavaScript 
- Handle dynamic content loaded after page load
- Support single-page applications
- Process AJAX requests
- Automatically handle popup dialogs

Key challenges with JavaScript rendering:
1. Increased memory usage with headless browser
2. Longer load times compared to simple HTTP requests
3. Some websites detect headless browsers and block access
4. Need for proper error handling and fallback to non-JS mode
5. Not all platforms support Puppeteer (notably Termux on Android)

## Bot Detection Avoidance Techniques
We implemented several strategies to avoid bot detection:

1. **Realistic Browser Headers**:
   - Added proper Accept, Accept-Language, and other headers 
   - Rotate between common user agents to avoid fingerprinting
   - Include Sec-Ch headers that modern browsers send

2. **Referrer Chain Management**:
   - Track previously visited sites
   - Set proper referrer headers based on browsing history
   - Maintain domain-specific browsing context

3. **Cookie Management**:
   - Persistent cookie storage between sessions
   - Proper domain matching for subdomains
   - Support for all cookie attributes

4. **Protection Bypass**:
   - Detect Cloudflare "checking your browser" pages
   - Identify Google captcha challenges
   - Attempt alternative access methods when blocked
   - Fall back to more friendly alternative sites when possible

5. **Adaptive Techniques**:
   - Switch to Googlebot user agent for some sites 
   - Use different configurations for different domains
   - Implement automatic detection and response to challenges

Testing revealed that with our improvements, we successfully bypass bot detection on several major sites including Google Search and Stack Overflow.

## Dialog Box Handling
The browser now automatically handles various types of dialog boxes:
- Alert dialogs: Automatically dismissed
- Confirm dialogs: Automatically accepted
- Prompt dialogs: Automatically dismissed
- Beforeunload dialogs: Automatically dismissed

## Enhanced Cookie Management
We significantly improved cookie handling capabilities:

1. **Persistent Storage**:
   - Cookies saved between browser sessions
   - Automatic cleanup of expired cookies

2. **Domain Matching**:
   - Support for domain-specific cookies
   - Proper subdomain matching (example.com vs. sub.example.com)
   - Special handling for www variants

3. **Cookie Attributes**:
   - Support for Secure, HttpOnly, SameSite flags
   - Proper handling of Path restrictions
   - Implementation of Max-Age and Expires directives

4. **Performance Improvements**:
   - Intelligent cookie pruning to avoid memory bloat
   - Optimized cookie retrieval for frequently visited sites

## Testing Results

### DuckDuckGo Lite
- Works well with our browser
- Can submit search queries and display results
- Links in search results are parseable and navigable

### JavaScript-Heavy Sites
- Now able to render modern websites that rely on JavaScript
- Successfully processes dynamic content that was previously invisible
- Handles single-page applications (SPAs) with proper link extraction

### Error Handling
- The browser provides clear error messages
- Handles common issues like missing URLs in commands
- Graceful fallback to non-JavaScript mode when rendering fails

## Search Engine Experience

Based on testing with multiple search engines:

1. **DuckDuckGo Lite**
   - Works very well with our browser
   - Loads quickly and displays results in a format our parser can handle
   - Search functionality works properly using POST requests
   - Links in search results work (with some link formatting issues)

2. **Google**
   - Basic rendering works
   - With JavaScript rendering enabled, can now handle complex Google Search results
   - Search requires using GET with query parameters
   - JavaScript redirection now handled properly

3. **Bing**
   - Renders search results
   - Complex HTML with extensive JavaScript now handled properly
   - Search works and the page is now navigable with JS rendering
   - Link formatting improved with better parser

## Binary Content Handling

One significant challenge we solved was properly handling binary content (images, PDFs, audio, video, etc.) in the terminal browser:

1. **Content Type Detection**
   - Implemented proper detection of binary MIME types
   - Created a comprehensive mapping of content types to file extensions
   - Added checks for common binary file extensions in URLs

2. **Buffer Integrity**
   - Modified request handlers to maintain Buffer objects for binary data instead of forcing UTF-8 encoding
   - This prevents corruption of binary data that occurred when treating everything as text
   - Added proper response differentiation between text and binary content

3. **Human-Readable References**
   - Instead of displaying garbled binary content, we now show descriptive references:
     - `[Image: URL]` for images
     - `[Video: URL]` for videos
     - `[Audio: URL]` for audio files
     - `[PDF: URL]` for PDF documents, etc.
   - Added appropriate icons to make the content type more visually identifiable
   - Display metadata like file size, content type, and extension

4. **HTML Extraction**
   - Enhanced HTML parser to find and extract references to binary content in web pages
   - Detects images, video, audio, and document links in the HTML
   - Displays these references separately from regular links

5. **Implementation Challenges**
   - Needed to carefully handle the entire request-response pipeline to preserve binary data integrity
   - Added proper content negotiation and detection at multiple levels
   - Modified renderer to handle both HTML content and binary content responses

## Improvements for Future Versions

1. **Interactive Features**
   - Add interactive form filling
   - Implement history tracking
   - Add bookmarking capabilities
   - Add a direct search command that uses DuckDuckGo Lite by default

2. **Enhanced Rendering**
   - Support basic text formatting
   - Add color highlighting for links and UI elements
   - Improve handling of tables and complex layouts
   - Better URL handling for relative links and redirects

3. **Navigation**
   - Add a back/forward navigation system
   - Implement numbered shortcuts for links (e.g., "go 3" to follow link #3)
   - Add tab completion for commands

4. **Security**
   - Improve cookie and session management
   - Add HTTPS certificate validation warnings
   - Implement content security policies

5. **Performance**
   - Optimize HTML parsing for larger pages
   - Add support for streaming content
   - Implement caching

6. **Binary Content Enhancement**
   - Add support for downloading binary content to local files
   - Implement simple text-based renderers for PDF and document content
   - Add ability to display simple ASCII art representations of images

## Tested Websites
- example.com - Works well, simple site with basic HTML
- lite.duckduckgo.com - Excellent compatibility, works with searches and results
- google.com - Now works well with JS rendering enabled
- bing.com - Now works well with JS rendering enabled
- fao.org/agris - Complex site that renders well in our browser
- github.com - Now renders properly with JavaScript support

## Commands Reference

```bash
# Basic navigation
agris get <url>

# Navigation with JavaScript rendering
agris jsget <url>

# View headers only
agris head <url>

# View raw HTML
agris get --raw <url>

# Submit a form (like a search)
agris post <url> form:"formname" "field1":"value1" "field2":"value2"

# Search with JavaScript rendering
agris search --js=yes "search query"
agris search --engine=google --js=yes "search query"

# Help and version
agris help
agris version
```