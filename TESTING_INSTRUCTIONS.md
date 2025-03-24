# Testing Instructions for AGRIS Browser

These instructions will help you test the improved AGRIS browser with its enhanced bot detection avoidance features.

## Running Tests

### Simple Test

To quickly test the basic functionality (search and link following):

```bash
node test/simple-test.js
```

This will:
1. Run a search on DuckDuckGo Lite for "openai o1 pro model"
2. Try to access Wikipedia's OpenAI page
3. Save the results to the `test_results` directory

### Bot Detection Test

To test the bot detection avoidance capabilities more thoroughly:

```bash
node test/bot-detection-test.js
```

This will test:
1. DuckDuckGo Lite search
2. Stack Overflow access
3. Reddit (old interface) access

### Manual Command Testing

To test the browser interactively with the improved bot detection avoidance:

```bash
# Development mode
node src/index.js get https://lite.duckduckgo.com/lite/?q=openai+o1+pro+model
node src/index.js get https://en.wikipedia.org/wiki/OpenAI

# Production mode (if installed)
agris get https://lite.duckduckgo.com/lite/?q=openai+o1+pro+model
agris get https://en.wikipedia.org/wiki/OpenAI
```

## Expected Results

### Search Engine Access

- DuckDuckGo Lite should work reliably
- Search results should show up properly encoded
- Following links from search results should work for many sites

### Content Sites

- Wikipedia content should load properly
- Stack Overflow posts should be accessible with proper formatting

### Bot Protection Bypass

- The browser should detect bot protection mechanisms
- It should attempt appropriate bypass techniques
- For sites with very strict protection, fallback alternatives are used

## Troubleshooting

If you encounter issues:

1. Check the console output for error messages
2. Examine test results saved in the `test_results` directory
3. Look for phrases like "Bot protection detected" in the logs
4. Check if the browser is making too many requests (rate limiting)

## Configuration Options

You can modify some behaviors by setting environment variables:

```bash
# To use proxies (comma-separated list)
export PROXY_LIST=http://proxy1.example.com:8080,http://proxy2.example.com:8080

# Run with debug output
DEBUG=true node test/simple-test.js
```

## Limitations

Some sites may still block access due to:

1. JavaScript requirements
2. CAPTCHA challenges
3. Advanced fingerprinting techniques
4. IP-based blocking

For these sites, using a real browser may be necessary.