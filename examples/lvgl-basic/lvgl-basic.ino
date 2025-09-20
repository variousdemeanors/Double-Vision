#include "lvgl.h"
#include "demos/lv_demos.h"

// Display and touch driver includes (adjust based on your hardware)
#include <TFT_eSPI.h>

// LVGL display buffer
static lv_disp_draw_buf_t draw_buf;
static lv_color_t buf[LV_HOR_RES_MAX * 10];

// TFT instance
TFT_eSPI tft = TFT_eSPI();

// Double Vision integration
bool double_vision_enabled = true;
unsigned long last_screen_capture = 0;
const unsigned long capture_interval = 1000; // 1 second

void setup() {
    Serial.begin(115200);
    Serial.println("Double Vision LVGL Example Starting...");

    // Initialize display
    tft.init();
    tft.setRotation(1);
    
    // Initialize LVGL
    lv_init();
    
    // Setup display buffer
    lv_disp_draw_buf_init(&draw_buf, buf, NULL, LV_HOR_RES_MAX * 10);
    
    // Initialize display driver
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = 320;
    disp_drv.ver_res = 240;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);
    
    // Create the user interface
    create_double_vision_ui();
    
    Serial.println("LVGL initialized. Double Vision ready!");
}

void loop() {
    lv_timer_handler();
    
    // Handle Double Vision screen capture
    if (double_vision_enabled && (millis() - last_screen_capture > capture_interval)) {
        capture_screen_for_ai();
        last_screen_capture = millis();
    }
    
    delay(5);
}

void my_disp_flush(lv_disp_drv_t * disp, const lv_area_t * area, lv_color_t * color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t*)&color_p->full, w * h, true);
    tft.endWrite();

    lv_disp_flush_ready(disp);
}

void create_double_vision_ui() {
    // Create a simple UI that Double Vision can analyze
    
    // Create a main container
    lv_obj_t * cont = lv_obj_create(lv_scr_act());
    lv_obj_set_size(cont, 300, 200);
    lv_obj_center(cont);
    lv_obj_set_style_bg_color(cont, lv_color_hex(0x2196F3), 0);
    
    // Create a title label
    lv_obj_t * title = lv_label_create(cont);
    lv_label_set_text(title, "Double Vision Demo");
    lv_obj_set_style_text_font(title, &lv_font_montserrat_16, 0);
    lv_obj_set_style_text_color(title, lv_color_white(), 0);
    lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 10);
    
    // Create status indicator
    lv_obj_t * status_led = lv_led_create(cont);
    lv_obj_align(status_led, LV_ALIGN_TOP_RIGHT, -10, 10);
    lv_led_set_color(status_led, lv_color_hex(0x4CAF50));
    lv_led_on(status_led);
    
    // Create interactive button
    lv_obj_t * btn = lv_btn_create(cont);
    lv_obj_set_size(btn, 120, 40);
    lv_obj_align(btn, LV_ALIGN_CENTER, 0, 0);
    lv_obj_add_event_cb(btn, button_event_handler, LV_EVENT_CLICKED, NULL);
    
    lv_obj_t * btn_label = lv_label_create(btn);
    lv_label_set_text(btn_label, "Click Me!");
    lv_obj_center(btn_label);
    
    // Create progress bar
    lv_obj_t * bar = lv_bar_create(cont);
    lv_obj_set_size(bar, 200, 20);
    lv_obj_align(bar, LV_ALIGN_BOTTOM_MID, 0, -20);
    lv_bar_set_value(bar, 70, LV_ANIM_OFF);
    
    // Create a slider for AI to analyze
    lv_obj_t * slider = lv_slider_create(cont);
    lv_obj_set_width(slider, 150);
    lv_obj_align(slider, LV_ALIGN_BOTTOM_MID, 0, -50);
    lv_slider_set_value(slider, 50, LV_ANIM_OFF);
    lv_obj_add_event_cb(slider, slider_event_handler, LV_EVENT_VALUE_CHANGED, NULL);
    
    // Double Vision marker (invisible to user, visible to AI)
    lv_obj_t * marker = lv_obj_create(lv_scr_act());
    lv_obj_set_size(marker, 5, 5);
    lv_obj_align(marker, LV_ALIGN_TOP_LEFT, 0, 0);
    lv_obj_set_style_bg_color(marker, lv_color_hex(0xFF0000), 0);
    lv_obj_add_flag(marker, LV_OBJ_FLAG_HIDDEN); // Hidden from display but detectable by AI
}

static void button_event_handler(lv_event_t * e) {
    lv_event_code_t code = lv_event_get_code(e);
    
    if(code == LV_EVENT_CLICKED) {
        Serial.println("Button clicked - AI should detect interaction");
        
        // Change button appearance to give AI feedback
        lv_obj_t * btn = lv_event_get_target(e);
        static bool pressed = false;
        
        if (pressed) {
            lv_obj_set_style_bg_color(btn, lv_color_hex(0x2196F3), 0);
            pressed = false;
        } else {
            lv_obj_set_style_bg_color(btn, lv_color_hex(0xFF9800), 0);
            pressed = true;
        }
        
        // Trigger immediate screen capture for AI analysis
        capture_screen_for_ai();
    }
}

static void slider_event_handler(lv_event_t * e) {
    lv_obj_t * slider = lv_event_get_target(e);
    int32_t value = lv_slider_get_value(slider);
    
    Serial.printf("Slider value changed to: %d\n", value);
    
    // Update progress bar to match slider (for AI to observe correlation)
    lv_obj_t * cont = lv_obj_get_parent(slider);
    lv_obj_t * bar = NULL;
    
    // Find the progress bar (simple search)
    for(int i = 0; i < lv_obj_get_child_cnt(cont); i++) {
        lv_obj_t * child = lv_obj_get_child(cont, i);
        if(lv_obj_check_type(child, &lv_bar_class)) {
            bar = child;
            break;
        }
    }
    
    if(bar) {
        lv_bar_set_value(bar, value, LV_ANIM_ON);
    }
}

void capture_screen_for_ai() {
    if (!double_vision_enabled) return;
    
    Serial.println("Capturing screen for Double Vision AI analysis...");
    
    // In a real implementation, this would capture the screen buffer
    // and send it to the camera system or directly to VS Code extension
    
    // For now, we'll just log the action
    Serial.println("Screen captured - AI can now analyze the current UI state");
    
    // You could implement actual screen capture here:
    // 1. Read the display buffer
    // 2. Convert to image format
    // 3. Send via WiFi to Double Vision extension
    // 4. Or store in SPIFFS for camera system to serve
}

void enable_double_vision(bool enable) {
    double_vision_enabled = enable;
    Serial.printf("Double Vision %s\n", enable ? "enabled" : "disabled");
}

// Function to be called by AI-generated code for testing
void ai_test_function() {
    Serial.println("AI test function called - Double Vision integration working!");
    
    // Create a temporary visual indicator
    lv_obj_t * indicator = lv_obj_create(lv_scr_act());
    lv_obj_set_size(indicator, 50, 50);
    lv_obj_align(indicator, LV_ALIGN_CENTER, 0, 0);
    lv_obj_set_style_bg_color(indicator, lv_color_hex(0x00FF00), 0);
    lv_obj_set_style_radius(indicator, 25, 0);
    
    // Remove after 2 seconds
    lv_obj_del_delayed(indicator, 2000);
}