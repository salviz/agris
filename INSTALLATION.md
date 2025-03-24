# Installing AGRIS Browser

AGRIS is a terminal-based web browser designed for AI assistants and CLI usage. This document provides comprehensive installation instructions for different environments.

## Quick Start

AGRIS is available as an npm package and can be installed with a single command:

```bash
npm install -g agris
```

Once installed, you can verify the installation by running:

```bash
agris version
```

## Installation Methods

### Method 1: Using npm (Recommended)

The easiest way to install AGRIS is through npm, which is included with Node.js.

1. If you don't have Node.js installed, download and install it from [nodejs.org](https://nodejs.org/)
2. Open a terminal/command prompt
3. Run the following command:

```bash
npm install -g agris
```

This will install AGRIS globally on your system, making the `agris` command available from any directory.

### Method 2: Installing from Source

For the latest development version or to contribute to AGRIS:

1. Clone the GitHub repository:

```bash
git clone https://github.com/salviz/agris.git
```

2. Navigate to the project directory:

```bash
cd agris
```

3. Install dependencies:

```bash
npm install
```

4. Link the package globally:

```bash
npm link
```

This creates a symbolic link from the globally installed `agris` command to the local project.

### Method 3: Using npx (No Installation)

If you want to try AGRIS without installing it, you can use npx:

```bash
npx agris get https://example.com
```

This will download and run AGRIS on-demand.

## System Requirements

- **Node.js**: Version 14.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **Optional Dependencies**:
  - For JavaScript rendering: Puppeteer will be installed automatically, but it requires Chrome/Chromium to be installed on your system

## Troubleshooting

### Common Issues

1. **Command not found**: If the `agris` command is not recognized after installation, ensure that your npm global bin directory is in your PATH.

2. **Permission errors**: If you encounter permission errors during installation, you might need to:
   - On Linux/macOS: Use `sudo npm install -g agris`
   - On Windows: Run Command Prompt or PowerShell as Administrator

3. **Puppeteer issues**: If you encounter problems with JavaScript rendering:
   ```bash
   npm install -g puppeteer
   ```

### Updating AGRIS

To update to the latest version:

```bash
npm update -g agris
```

### Uninstalling

To remove AGRIS from your system:

```bash
npm uninstall -g agris
```

## Additional Resources

- [Project GitHub Repository](https://github.com/salviz/agris)
- [npm Package Page](https://www.npmjs.com/package/agris)
- [README.md](README.md) - Overview and general usage
- [DOCUMENTATION.md](DOCUMENTATION.md) - Detailed documentation

## Getting Started

After installation, try these commands to get started with AGRIS:

```bash
# Display help
agris help

# Visit a website
agris get https://example.com

# Search the web
agris search "your query here"

# Access documentation
agris docs nodejs/fs
```

For more detailed usage instructions, see the main [README.md](README.md).