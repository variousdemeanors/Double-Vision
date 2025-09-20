# Double Vision Setup Guide

## Prerequisites

### Hardware
- ESP32-CAM module (AI-Thinker ESP32-CAM or compatible)
- ESP32 development board with LCD display (for testing)
- Breadboard and jumper wires
- USB-to-Serial adapter (if ESP32-CAM doesn't have USB)

### Software
- Visual Studio Code
- Arduino IDE or PlatformIO
- Node.js (for extension development)

## ESP32-CAM Setup

### 1. Hardware Connections

For ESP32-CAM flashing:
```
ESP32-CAM    USB-Serial Adapter
VCC    ->    3.3V
GND    ->    GND
U0T    ->    RX
U0R    ->    TX
GPIO0  ->    GND (for flashing mode)
```

### 2. Firmware Installation

1. Open Arduino IDE
2. Install ESP32 board support:
   - File → Preferences
   - Add to Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

3. Install required libraries:
   - ESP32 Camera library
   - WebSockets library
   - AsyncWebServer library
   - ArduinoJson library

4. Flash the firmware:
   - Open `firmware/esp32-camera/esp32-camera.ino`
   - Update WiFi credentials
   - Select board: "AI Thinker ESP32-CAM"
   - Connect GPIO0 to GND
   - Press reset button
   - Upload sketch

5. Remove GPIO0 connection and reset

### 3. Network Configuration

The ESP32-CAM will attempt to connect to your WiFi network. Check the Serial Monitor for the assigned IP address.

## VS Code Extension Installation

### Option 1: Install from Marketplace (when available)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Double Vision"
4. Click Install

### Option 2: Install from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/variousdemeanors/Double-Vision.git
   cd Double-Vision
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Package the extension:
   ```bash
   npx vsce package
   ```

5. Install the VSIX file:
   ```bash
   code --install-extension double-vision-0.1.0.vsix
   ```

## Configuration

### 1. Basic Settings

Open VS Code settings (Ctrl+,) and configure:

- **Camera IP Address**: Set to your ESP32-CAM IP
- **AI Provider**: Choose your preferred AI service
- **API Keys**: Configure if using external AI services

### 2. AI Provider Setup

#### GitHub Copilot (Default)
- Ensure GitHub Copilot extension is installed and activated
- No additional configuration required

#### OpenAI GPT-4 Vision
- Obtain API key from OpenAI platform
- Set in `doubleVision.ai.apiKey` setting
- Select "openai" as provider

#### Anthropic Claude 3
- Get API key from Anthropic Console
- Configure in settings
- Select "anthropic" as provider

#### Google Gemini Pro Vision
- Obtain API key from Google AI Studio
- Configure in settings
- Select "google" as provider

## Testing the Setup

### 1. Camera Connection Test

1. Open Command Palette (Ctrl+Shift+P)
2. Run "Double Vision: Connect ESP32 Camera"
3. Enter your ESP32-CAM IP address
4. Check for successful connection message

### 2. Camera Feed Test

1. Open the Explorer panel
2. Look for "ESP32 Camera Feed" section
3. Click "Connect" button
4. Verify live camera feed appears

### 3. AI Analysis Test

1. Start AI monitoring: "Double Vision: Start AI Visual Monitoring"
2. Check "AI Analysis" panel for results
3. Try taking a snapshot: "Double Vision: Take Display Snapshot"

## Example Project Setup

### 1. LVGL Project

1. Open the example project:
   ```bash
   code examples/lvgl-basic/
   ```

2. Configure for your hardware:
   - Update display driver settings
   - Adjust pin configurations
   - Set resolution and color depth

3. Upload to ESP32:
   - Connect ESP32 with display
   - Upload the sketch
   - Monitor serial output

### 2. Testing AI Feedback

1. Run the LVGL example on your ESP32
2. Point ESP32-CAM at the display
3. Start Double Vision monitoring
4. Interact with the display (if touch-enabled)
5. Observe AI analysis in VS Code

## Troubleshooting

### Camera Connection Issues

**Problem**: Cannot connect to ESP32-CAM
- Check IP address is correct
- Verify ESP32-CAM is on same network
- Check WiFi credentials in firmware
- Ensure firewall isn't blocking connections

**Problem**: Camera feed not updating
- Check WebSocket connection in browser dev tools
- Verify ESP32-CAM firmware is running
- Check camera module connections

### AI Analysis Issues

**Problem**: No analysis results
- Verify AI provider configuration
- Check API keys are valid
- Ensure internet connection for external providers
- Check VS Code output panel for errors

**Problem**: Poor analysis quality
- Improve lighting on display
- Adjust camera position and focus
- Use higher resolution camera settings
- Ensure display is clearly visible

### Development Issues

**Problem**: Extension not loading
- Check TypeScript compilation errors
- Verify all dependencies installed
- Check VS Code developer console
- Try reloading window (Ctrl+Shift+P → "Reload Window")

**Problem**: LVGL code not working
- Verify LVGL version compatibility
- Check ESP32 memory allocation
- Review display driver configuration
- Check serial monitor for error messages

## Advanced Configuration

### Custom AI Prompts

You can customize AI analysis prompts by modifying the `aiProvider.ts` file:

```typescript
const customPrompt = `Analyze this ESP32 display for:
1. UI layout and design quality
2. LVGL widget usage
3. Performance optimizations
4. Accessibility considerations`;
```

### Camera Settings

Adjust camera quality and frame rate in ESP32 firmware:

```cpp
config.jpeg_quality = 10;  // 0-63, lower is better quality
config.frame_size = FRAMESIZE_SVGA;  // Adjust resolution
```

### WebSocket Configuration

Modify WebSocket settings for different update rates:

```cpp
const unsigned long capture_interval = 500; // milliseconds
```

## API Reference

See the main README.md for complete API documentation and TypeScript interfaces.