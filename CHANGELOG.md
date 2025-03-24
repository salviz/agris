# Changelog

All notable changes to the AGRIS browser will be documented in this file.

## [1.1.0] - 2025-03-24

### Added
- Enhanced documentation access with bot protection bypassing
- Documentation command: `agris docs [provider/topic]`
- Documentation shortcuts for popular providers (OpenAI, GitHub, Node.js, Python, MDN)
- Documentation caching system with cache management commands
- Cache control options (`--use-cache`, `--refresh`, `--cache-expiry`)
- Full HTTP method support (PUT, DELETE, PATCH, OPTIONS)
- Multipart/form-data handling for file uploads
- Enhanced output formatting for AI LLM use

### Improved
- Bot detection avoidance with specialized site handling
- User agent and header management for consistent fingerprinting
- Content-type detection and handling
- Error handling and fallback mechanisms
- Help command with expanded examples

### Fixed
- Charset detection and handling for non-UTF8 content
- Binary content handling and display
- Cookie management across sessions

## [1.0.0] - 2025-02-15

### Added
- Initial release
- Terminal-based web browsing
- GET, POST, and HEAD request methods
- HTML parsing with Cheerio
- JavaScript execution with Puppeteer
- Link following capability
- Search command with engine selection
- Form interaction
- Cookie and session management