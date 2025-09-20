#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

// Camera pin definitions for ESP32-CAM
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// WiFi credentials
const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";

// Web server and WebSocket
AsyncWebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

// Camera configuration
camera_config_t config;

void setup() {
  Serial.begin(115200);
  Serial.println("Double Vision ESP32-CAM Server Starting...");

  // Initialize camera
  if (initCamera()) {
    Serial.println("Camera initialized successfully");
  } else {
    Serial.println("Camera initialization failed");
    return;
  }

  // Connect to WiFi
  if (connectWiFi()) {
    Serial.println("WiFi connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed");
    return;
  }

  // Setup web server routes
  setupWebServer();
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("Double Vision server ready!");
  Serial.println("Camera feed available at: http://" + WiFi.localIP().toString() + "/capture");
  Serial.println("WebSocket available at: ws://" + WiFi.localIP().toString() + ":81/");
}

void loop() {
  webSocket.loop();
  
  // Send periodic camera frames via WebSocket
  static unsigned long lastFrame = 0;
  if (millis() - lastFrame > 500) { // 2 FPS
    sendCameraFrame();
    lastFrame = millis();
  }
  
  delay(10);
}

bool initCamera() {
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Adjust frame size based on available memory
  if(psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return false;
  }

  return true;
}

bool connectWiFi() {
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  return WiFi.status() == WL_CONNECTED;
}

void setupWebServer() {
  // Status endpoint
  server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    DynamicJsonDocument doc(200);
    doc["status"] = "ok";
    doc["camera"] = "ready";
    doc["ip"] = WiFi.localIP().toString();
    
    String response;
    serializeJson(doc, response);
    
    request->send(200, "application/json", response);
  });

  // Camera capture endpoint
  server.on("/capture", HTTP_GET, [](AsyncWebServerRequest *request) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      request->send(500, "text/plain", "Camera capture failed");
      return;
    }

    AsyncWebServerResponse *response = request->beginResponse_P(200, "image/jpeg", fb->buf, fb->len);
    response->addHeader("Access-Control-Allow-Origin", "*");
    request->send(response);

    esp_camera_fb_return(fb);
  });

  // Command endpoint for Double Vision extension
  server.on("/command", HTTP_POST, [](AsyncWebServerRequest *request) {
    // Handle commands from VS Code extension
    if (request->hasParam("command", true)) {
      String command = request->getParam("command", true)->value();
      
      DynamicJsonDocument response(300);
      response["status"] = "ok";
      response["command"] = command;
      
      if (command == "set_quality") {
        // Adjust camera quality
        sensor_t * s = esp_camera_sensor_get();
        if (request->hasParam("quality", true)) {
          int quality = request->getParam("quality", true)->value().toInt();
          s->set_quality(s, quality);
          response["quality"] = quality;
        }
      } else if (command == "set_framesize") {
        // Adjust frame size
        sensor_t * s = esp_camera_sensor_get();
        if (request->hasParam("framesize", true)) {
          int framesize = request->getParam("framesize", true)->value().toInt();
          s->set_framesize(s, (framesize_t)framesize);
          response["framesize"] = framesize;
        }
      }
      
      String responseStr;
      serializeJson(response, responseStr);
      request->send(200, "application/json", responseStr);
    } else {
      request->send(400, "text/plain", "Missing command parameter");
    }
  });

  // Start web server
  server.begin();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
      
      // Send welcome message
      webSocket.sendTXT(num, "Double Vision ESP32-CAM Connected");
      break;
    }
    
    case WStype_TEXT:
      Serial.printf("[%u] Received Text: %s\n", num, payload);
      
      // Handle text commands
      if (strcmp((char*)payload, "capture") == 0) {
        sendCameraFrame();
      }
      break;
      
    case WStype_BIN:
      Serial.printf("[%u] Received binary length: %u\n", num, length);
      break;
      
    default:
      break;
  }
}

void sendCameraFrame() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  // Send frame to all connected WebSocket clients
  webSocket.broadcastBIN(fb->buf, fb->len);
  
  esp_camera_fb_return(fb);
}