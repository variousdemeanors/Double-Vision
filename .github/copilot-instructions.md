# GitHub Copilot Instructions for Double Vision

This document provides guidelines for GitHub Copilot when working on the Double Vision project - a VS Code extension that integrates ESP32-based IP camera feedback for AI-assisted development of graphical interfaces.

## Project Overview

Double Vision is a VS Code extension that enables AI assistants to visually analyze and debug ESP32 LCD displays, particularly for LVGL (Light and Versatile Graphics Library) development. The project consists of:

- **TypeScript VS Code Extension** (`src/`): Main extension code
- **ESP32 Firmware** (`firmware/`): Arduino/C++ code for ESP32-CAM modules
- **LVGL Examples** (`examples/`): Sample projects for testing

## General Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** with strict mode enabled
- Follow **camelCase** for variables, functions, and methods
- Use **PascalCase** for classes and interfaces
- Enable and respect **ESLint** warnings and errors
- Use **async/await** for asynchronous operations instead of callbacks
- Always handle errors properly with try-catch blocks
- Use descriptive variable and function names

### Code Style

- Use semicolons at the end of statements (enforced by ESLint)
- Use curly braces for all control structures (if, for, while)
- Use strict equality (`===` and `!==`) instead of loose equality
- Maximum line length: 120 characters
- Use 4 spaces for indentation
- Add JSDoc comments for public APIs and complex functions

### VS Code Extension Development

- Follow VS Code extension API best practices
- Use proper activation events to minimize extension load time
- Register all disposables in `context.subscriptions`
- Use VS Code's configuration API for user settings
- Provide clear error messages to users via `vscode.window.showErrorMessage`
- Use webview providers for custom UI panels
- Validate user inputs (e.g., IP addresses, file paths)
- Set context keys appropriately for command/view enablement

### Error Handling

- Always wrap API calls in try-catch blocks
- Provide meaningful error messages to users
- Log errors to console for debugging
- Fail gracefully - don't crash the extension
- Validate inputs before processing

## Component-Specific Guidelines

### Camera Manager (`src/cameraManager.ts`)

- Handle WebSocket connections carefully with proper cleanup
- Implement connection timeout and retry logic
- Validate IP addresses before attempting connections
- Use axios for HTTP requests with proper error handling
- Handle binary image data (Buffer) correctly
- Provide connection status callbacks

### AI Provider (`src/aiProvider.ts`)

- Support multiple AI providers (OpenAI, Anthropic, Google, GitHub Copilot)
- Handle API key validation and missing keys gracefully
- Implement rate limiting and retry logic for external APIs
- Format prompts appropriately for each AI provider
- Handle base64 image encoding for API requests
- Note: When interfacing with external APIs, use their required naming conventions (e.g., snake_case for OpenAI: `image_url`, `max_tokens`) even if it differs from the project's camelCase standard

### Monitoring Service (`src/monitoringService.ts`)

- Use configurable intervals for monitoring
- Properly manage interval timers with cleanup
- Handle camera disconnections during monitoring
- Store analysis history efficiently
- Provide status updates via VS Code UI

### WebView Providers (`src/views/`)

- Use Content Security Policy (CSP) for webviews
- Sanitize all user inputs displayed in webviews
- Use message passing for webview communication
- Handle webview lifecycle (creation, disposal)
- Support both light and dark VS Code themes

## ESP32 Firmware Guidelines

### Arduino/C++ Code (`firmware/`)

- Follow Arduino coding conventions
- Use clear pin definitions and constants
- Include comments for hardware connections
- Handle WiFi disconnections and reconnections
- Implement proper error handling for camera initialization
- Use appropriate image quality and resolution settings
- Implement WebSocket for real-time streaming
- Provide REST API endpoints for configuration

### LVGL Development (`examples/`)

- Follow LVGL coding patterns and style
- Use LVGL objects and widgets appropriately
- Handle touch input events properly
- Manage memory efficiently (ESP32 constraints)
- Use appropriate display drivers for target hardware
- Implement proper cleanup and disposal of LVGL objects

## Security Considerations

- **Never commit API keys or credentials** to the repository
- Use VS Code's secure storage for sensitive data when possible
- Validate and sanitize all user inputs
- Use HTTPS for external API communications
- Implement proper CORS handling for WebSocket connections
- Validate IP addresses and ports before connections
- Avoid exposing internal paths or sensitive information in error messages

## Testing

- Write tests for new functionality when applicable
- Test error handling paths
- Verify camera connection and disconnection scenarios
- Test with different AI providers
- Validate WebSocket streaming functionality
- Test with various ESP32 hardware configurations

## Dependencies

### Preferred Libraries

- **axios**: For HTTP requests
- **ws**: For WebSocket connections
- **sharp**: For image processing (if needed)
- Use existing dependencies when possible; avoid adding new ones unless necessary

### Adding New Dependencies

- Check for security vulnerabilities before adding
- Prefer well-maintained, popular libraries
- Document why new dependencies are needed
- Update package.json with appropriate version constraints

## Documentation

- Update README.md for user-facing changes
- Update SETUP.md for configuration or setup changes
- Add JSDoc comments for public APIs
- Include code examples in documentation where helpful
- Keep examples directory updated with working samples

## Git Practices

- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Don't commit generated files (`out/`, `node_modules/`)
- Follow the existing .gitignore patterns
- Test builds before committing

## VS Code Extension Specific

### Configuration

- All settings should be under `doubleVision` namespace
- Provide sensible defaults
- Document each configuration option
- Validate configuration values

### Commands

- Use clear, descriptive command names
- Register commands with proper categories ("Double Vision")
- Provide appropriate command titles
- Validate preconditions before executing commands

### UI/UX

- Provide clear feedback for all user actions
- Use progress indicators for long-running operations
- Show appropriate notifications (info, warning, error)
- Support both keyboard and mouse interactions
- Follow VS Code UI guidelines and patterns

## Performance

- Minimize extension activation time
- Use lazy loading where appropriate
- Optimize WebSocket data transmission
- Handle large images efficiently
- Clean up resources (timers, connections) properly
- Avoid blocking the VS Code UI thread

## Common Patterns

### Connecting to ESP32 Camera

```typescript
// Validate IP, attempt connection, handle errors, update UI
const ipAddress = await vscode.window.showInputBox({
    validateInput: (value) => {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(value) ? null : 'Please enter a valid IP address';
    }
});
```

### AI Analysis

```typescript
// Take snapshot, analyze with AI, present results
try {
    const snapshot = await cameraManager.takeSnapshot();
    const analysis = await aiProvider.analyzeImage(snapshot);
    // Show results to user
} catch (error) {
    vscode.window.showErrorMessage(`Analysis failed: ${error}`);
}
```

## Tools and Build

- **Build**: `npm run compile` (TypeScript compilation)
- **Watch**: `npm run watch` (continuous compilation)
- **Lint**: `npm run lint` (ESLint checks)
- **Test**: `npm run test` (run tests)
- Always run lint and compile before committing

## API Considerations

When working with external APIs (OpenAI, Anthropic, Google):
- Respect their naming conventions (snake_case property names are required by their APIs)
- Handle rate limits appropriately
- Implement exponential backoff for retries
- Cache responses when appropriate
- Handle API errors gracefully with user-friendly messages

## Additional Notes

- This is an embedded development tool - consider hardware constraints
- Users may have varying network conditions - handle timeouts appropriately
- ESP32 devices have limited resources - optimize firmware carefully
- LVGL has specific memory management requirements - follow LVGL best practices
- Support multiple AI providers - don't hard-code for one provider
- The extension should work offline for basic camera viewing functionality
