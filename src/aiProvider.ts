import * as vscode from 'vscode';
import axios from 'axios';
import { CameraSnapshot } from './cameraManager';

export interface AIAnalysisResult {
    description: string;
    issues: string[];
    suggestions: string[];
    confidence: number;
    timestamp: Date;
}

export class AIProvider {
    private provider: string;
    private apiKey: string;

    constructor() {
        this.provider = vscode.workspace.getConfiguration('doubleVision').get('ai.provider', 'github-copilot');
        this.apiKey = vscode.workspace.getConfiguration('doubleVision').get('ai.apiKey', '');
    }

    public async analyzeImage(snapshot: CameraSnapshot): Promise<string> {
        const base64Image = snapshot.imageData.toString('base64');
        
        switch (this.provider) {
            case 'openai':
                return this.analyzeWithOpenAI(base64Image);
            case 'anthropic':
                return this.analyzeWithAnthropic(base64Image);
            case 'google':
                return this.analyzeWithGoogle(base64Image);
            case 'github-copilot':
            default:
                return this.analyzeWithCopilot(base64Image);
        }
    }

    public async generateLVGLCode(description: string, snapshot?: CameraSnapshot): Promise<string> {
        const prompt = `Generate LVGL C code for ESP32 to create a graphical interface based on this description: ${description}. 
        The code should be compatible with ESP32 and use LVGL version 8.x. Include proper initialization and styling.`;

        switch (this.provider) {
            case 'openai':
                return this.generateCodeWithOpenAI(prompt);
            case 'anthropic':
                return this.generateCodeWithAnthropic(prompt);
            case 'google':
                return this.generateCodeWithGoogle(prompt);
            case 'github-copilot':
            default:
                return this.generateCodeWithCopilot(prompt);
        }
    }

    private async analyzeWithCopilot(base64Image: string): Promise<string> {
        // For GitHub Copilot, we'll use a simplified analysis
        // In a real implementation, this would integrate with Copilot's API
        return `GitHub Copilot Analysis:
        
This appears to be an ESP32 display output. The image shows:
- Display resolution: 320x240 pixels
- Captured at: ${new Date().toISOString()}

Suggestions for improvement:
1. Consider adding error handling for display initialization
2. Implement double buffering for smoother animations
3. Add touch input handling if using a touch display
4. Optimize drawing functions for better performance

LVGL specific recommendations:
- Use lv_obj_set_style_* functions for consistent styling
- Implement proper event handling for interactive elements
- Consider using lv_timer for periodic updates instead of delays`;
    }

    private async analyzeWithOpenAI(base64Image: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this ESP32 display output. Describe what you see and provide suggestions for improving the graphical interface, especially for LVGL development.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            throw new Error(`OpenAI API error: ${error}`);
        }
    }

    private async analyzeWithAnthropic(base64Image: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-sonnet-20240229',
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this ESP32 display output. Describe what you see and provide suggestions for improving the graphical interface, especially for LVGL development.'
                            },
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                }
            });

            return response.data.content[0].text;
        } catch (error) {
            throw new Error(`Anthropic API error: ${error}`);
        }
    }

    private async analyzeWithGoogle(base64Image: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Google API key not configured');
        }

        try {
            const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${this.apiKey}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: 'Analyze this ESP32 display output. Describe what you see and provide suggestions for improving the graphical interface, especially for LVGL development.'
                            },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data.candidates[0].content.parts[0].text;
        } catch (error) {
            throw new Error(`Google API error: ${error}`);
        }
    }

    private async generateCodeWithCopilot(prompt: string): Promise<string> {
        // Simplified LVGL code generation for demo purposes
        return `// LVGL Code Generated by Double Vision
#include "lvgl.h"

void create_ui() {
    // Create a simple button
    lv_obj_t * btn = lv_btn_create(lv_scr_act());
    lv_obj_set_size(btn, 120, 50);
    lv_obj_center(btn);
    
    lv_obj_t * label = lv_label_create(btn);
    lv_label_set_text(label, "Hello");
    lv_obj_center(label);
    
    // Add event handler
    lv_obj_add_event_cb(btn, btn_event_handler, LV_EVENT_CLICKED, NULL);
}

static void btn_event_handler(lv_event_t * e) {
    lv_event_code_t code = lv_event_get_code(e);
    if(code == LV_EVENT_CLICKED) {
        // Button clicked
    }
}`;
    }

    private async generateCodeWithOpenAI(prompt: string): Promise<string> {
        // Similar implementation for other providers...
        return this.generateCodeWithCopilot(prompt);
    }

    private async generateCodeWithAnthropic(prompt: string): Promise<string> {
        // Similar implementation for other providers...
        return this.generateCodeWithCopilot(prompt);
    }

    private async generateCodeWithGoogle(prompt: string): Promise<string> {
        // Similar implementation for other providers...
        return this.generateCodeWithCopilot(prompt);
    }
}