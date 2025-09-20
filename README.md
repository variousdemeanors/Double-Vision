# Double-Vision

A Visual Studio Code extension that integrates ESP32-based IP camera feedback for AI-assisted development of graphical interfaces. This tool enables AI assistants (GPT, Claude, Gemini, GitHub Copilot) to visually analyze and debug ESP32 LCD displays, particularly for LVGL development.

## Features

🎥 **ESP32 Camera Integration**
- Real-time IP camera feed from ESP32-CAM modules
- WebSocket streaming for low-latency visual feedback
- RESTful API for camera control and configuration

🤖 **AI Visual Analysis**
- Integration with multiple AI providers (OpenAI, Anthropic, Google, GitHub Copilot)
- Automated analysis of display output and UI elements
- Proactive suggestions for interface improvements

📱 **LVGL Development Support**
- Specialized analysis for LVGL-based graphical interfaces
- Code generation for common UI patterns
- Performance optimization suggestions

🔧 **Developer Tools**
- VS Code panels for camera feed and AI analysis
- Automated snapshot capture during development
- Integration with Arduino IDE workflows

## Quick Start

### 1. Installation

Install the extension from the VS Code marketplace or build from source:

```bash
git clone https://github.com/variousdemeanors/Double-Vision.git
cd Double-Vision
npm install
npm run compile
```

### 2. ESP32 Setup

1. Flash the included firmware to your ESP32-CAM module
2. Configure WiFi credentials in the firmware
3. Connect your ESP32 to the same network as your development machine

### 3. VS Code Configuration

1. Open VS Code settings (`Ctrl+,`)
2. Search for "Double Vision"
3. Configure your ESP32 camera IP address
4. Select your preferred AI provider
5. Add API keys if using OpenAI, Anthropic, or Google

### 4. Connect and Start Monitoring

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run "Double Vision: Connect ESP32 Camera"
3. Run "Double Vision: Start AI Visual Monitoring"
4. The camera feed and AI analysis panels will appear in the Explorer view

## Hardware Requirements

- **ESP32-CAM module** (AI-Thinker or similar)
- **ESP32 with LCD display** (for LVGL development)
- **WiFi network** connecting both devices and development machine
- **Optional**: Touch-enabled display for interactive testing

## Supported AI Providers

- **GitHub Copilot** (default, basic analysis)
- **OpenAI GPT-4 Vision** (requires API key)
- **Anthropic Claude 3** (requires API key)
- **Google Gemini Pro Vision** (requires API key)

## Example Projects

The `examples/` directory contains sample LVGL projects optimized for Double Vision:

- `lvgl-basic/` - Simple interface with buttons, sliders, and progress bars
- `lvgl-advanced/` - Complex layouts with animations and custom widgets
- `esp32-camera/` - Firmware for ESP32-CAM streaming

## Extension Commands

| Command | Description |
|---------|-------------|
| `Double Vision: Connect ESP32 Camera` | Connect to your ESP32 camera |
| `Double Vision: Start AI Visual Monitoring` | Begin automatic AI analysis |
| `Double Vision: Stop AI Visual Monitoring` | Stop monitoring |
| `Double Vision: Take Display Snapshot` | Capture and analyze current display |
| `Double Vision: Open Settings` | Open extension configuration |

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `doubleVision.camera.ipAddress` | `192.168.1.100` | ESP32 camera IP address |
| `doubleVision.camera.port` | `80` | ESP32 camera port |
| `doubleVision.ai.provider` | `github-copilot` | AI provider for analysis |
| `doubleVision.ai.apiKey` | `""` | API key for external providers |
| `doubleVision.monitoring.interval` | `5000` | Monitoring interval (ms) |
| `doubleVision.lvgl.enabled` | `true` | Enable LVGL-specific features |

## Development Workflow

1. **Design Phase**: Describe your interface to the AI assistant
2. **Code Generation**: AI generates LVGL code based on requirements
3. **Implementation**: Upload code to ESP32 and run
4. **Visual Feedback**: Double Vision captures display output
5. **AI Analysis**: Real-time analysis identifies issues and improvements
6. **Iteration**: AI suggests code modifications for optimization

## API Reference

### Camera Manager

```typescript
// Connect to ESP32 camera
await cameraManager.connect('192.168.1.100');

// Take snapshot
const snapshot = await cameraManager.takeSnapshot();

// Send command to camera
await cameraManager.sendCommand('set_quality', { quality: 10 });
```

### AI Provider

```typescript
// Analyze display image
const analysis = await aiProvider.analyzeImage(snapshot);

// Generate LVGL code
const code = await aiProvider.generateLVGLCode('Create a settings menu');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

**Camera Connection Issues**
- Verify ESP32 is on the same network
- Check IP address and port configuration
- Ensure firewall allows connections

**AI Analysis Not Working**
- Verify API keys are correctly configured
- Check internet connection for external providers
- Review VS Code output panel for error messages

**LVGL Code Issues**
- Ensure LVGL version compatibility
- Check ESP32 memory constraints
- Verify display driver configuration

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- GitHub Issues: Report bugs and feature requests
- Documentation: Check the `/docs` directory for detailed guides
- Examples: Explore `/examples` for sample projects
