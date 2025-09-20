# LVGL Integration Examples

This directory contains example projects demonstrating how to use Double Vision with LVGL for ESP32 development.

## Basic Example (lvgl-basic.ino)

### Features Demonstrated
- Basic LVGL widget creation (buttons, sliders, progress bars)
- Event handling for user interactions
- Real-time screen capture for AI analysis
- Visual feedback for AI debugging

### Key Components

#### UI Elements
```cpp
// Button with click event
lv_obj_t * btn = lv_btn_create(cont);
lv_obj_add_event_cb(btn, button_event_handler, LV_EVENT_CLICKED, NULL);

// Slider with value change event
lv_obj_t * slider = lv_slider_create(cont);
lv_obj_add_event_cb(slider, slider_event_handler, LV_EVENT_VALUE_CHANGED, NULL);

// Progress bar that updates with slider
lv_obj_t * bar = lv_bar_create(cont);
lv_bar_set_value(bar, slider_value, LV_ANIM_ON);
```

#### Double Vision Integration
```cpp
void capture_screen_for_ai() {
    Serial.println("Capturing screen for Double Vision AI analysis...");
    // Implementation would capture display buffer and send to camera system
}
```

### Hardware Requirements
- ESP32 development board
- TFT LCD display (320x240 recommended)
- Touch panel (optional but recommended)
- ESP32-CAM module for visual feedback

### Setup Instructions

1. **Library Installation**
   ```
   Install these libraries in Arduino IDE:
   - LVGL (version 8.x)
   - TFT_eSPI
   - TouchLib (if using touch)
   ```

2. **Hardware Connections**
   ```
   ESP32    Display
   GPIO23   MOSI
   GPIO18   CLK
   GPIO2    CS
   GPIO4    DC
   GPIO15   RST
   3.3V     VCC
   GND      GND
   ```

3. **Configuration**
   - Update `User_Setup.h` in TFT_eSPI library for your display
   - Adjust LVGL memory settings in `lv_conf.h`
   - Configure camera position to view the display

### AI Analysis Features

The example is designed to work with Double Vision's AI analysis:

#### Visual Markers
- Hidden red marker in top-left corner for AI reference
- Status LED that changes color based on interactions
- Progress indicators that provide visual feedback

#### Interaction Events
- Button clicks trigger immediate screen capture
- Slider changes update multiple UI elements
- Events are logged to serial for debugging

#### AI-Testable Functions
```cpp
void ai_test_function() {
    // Function that AI can call to test integration
    // Creates temporary visual indicator
    lv_obj_t * indicator = lv_obj_create(lv_scr_act());
    // ... styling and positioning
    lv_obj_del_delayed(indicator, 2000);
}
```

## Advanced Features

### Memory Management
```cpp
// Monitor LVGL memory usage
lv_mem_monitor_t mon;
lv_mem_monitor(&mon);
Serial.printf("Memory used: %d KB\n", mon.total_size / 1024);
```

### Performance Optimization
```cpp
// Use timers instead of delays
static lv_timer_t * timer = lv_timer_create(timer_callback, 100, NULL);

// Optimize drawing
lv_obj_invalidate(obj); // Only redraw specific objects
```

### Custom Widgets
```cpp
// Create custom widget for AI testing
lv_obj_t * create_ai_test_widget(lv_obj_t * parent) {
    lv_obj_t * widget = lv_obj_create(parent);
    // Custom drawing and event handling
    return widget;
}
```

## Integration with VS Code Extension

### Automatic Code Generation

The Double Vision extension can generate LVGL code based on AI analysis:

1. Describe desired interface in the AI panel
2. AI generates appropriate LVGL code
3. Code appears in new VS Code document
4. Copy and integrate into your project

### Real-time Feedback Loop

1. Upload code to ESP32
2. ESP32-CAM captures display output
3. AI analyzes visual result
4. Suggestions appear in VS Code
5. Iterate based on AI feedback

### Common AI Suggestions

The AI typically provides feedback on:
- **Layout improvements**: Better spacing, alignment
- **Color schemes**: Accessibility and readability
- **Performance**: Memory usage, rendering speed
- **User experience**: Touch targets, navigation flow

## Best Practices

### For AI Analysis
1. Use consistent color schemes for easier AI recognition
2. Include visual indicators for state changes
3. Provide clear contrast between UI elements
4. Use animations sparingly to avoid confusing AI

### For Development
1. Test on actual hardware, not just simulators
2. Monitor memory usage regularly
3. Use version control for UI iterations
4. Document AI suggestions and implementations

### For Performance
1. Minimize redraws by invalidating only changed objects
2. Use LVGL's built-in animations instead of custom loops
3. Optimize image assets for memory constraints
4. Consider using LVGL's tile and tabview for complex layouts

## Troubleshooting

### Common Issues

**Display not updating**
- Check LVGL task handler is called in main loop
- Verify display driver flush callback
- Check memory allocation for display buffer

**Touch not working**
- Verify touch driver integration
- Check calibration values
- Ensure touch input is read in main loop

**AI analysis poor quality**
- Improve display lighting
- Check camera focus and positioning
- Use higher contrast colors
- Avoid rapid animations during analysis

### Debug Tools

```cpp
// Enable LVGL logging
#define LV_USE_LOG 1
#define LV_LOG_LEVEL LV_LOG_LEVEL_TRACE

// Memory debugging
void print_memory_info() {
    lv_mem_monitor_t mon;
    lv_mem_monitor(&mon);
    Serial.printf("Free: %d KB, Used: %d KB\n", 
                  mon.free_size / 1024, 
                  (mon.total_size - mon.free_size) / 1024);
}
```

## Next Steps

1. Try the basic example
2. Modify UI elements and observe AI feedback
3. Implement AI suggestions
4. Create your own custom interfaces
5. Share your results with the Double Vision community