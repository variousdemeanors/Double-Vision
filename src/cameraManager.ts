import * as vscode from 'vscode';
import axios from 'axios';
import WebSocket from 'ws';

export interface CameraSnapshot {
    imageData: Buffer;
    timestamp: Date;
    width: number;
    height: number;
}

export class CameraManager {
    private connected = false;
    private ipAddress = '';
    private port = 80;
    private ws?: WebSocket;
    private onImageReceived?: (snapshot: CameraSnapshot) => void;

    public isConnected(): boolean {
        return this.connected;
    }

    public async connect(ipAddress: string): Promise<void> {
        this.ipAddress = ipAddress;
        this.port = vscode.workspace.getConfiguration('doubleVision').get('camera.port', 80);

        try {
            // First, try to ping the camera
            const response = await axios.get(`http://${this.ipAddress}:${this.port}/status`, {
                timeout: 5000
            });

            if (response.status === 200) {
                this.connected = true;
                await this.setupWebSocketConnection();
            } else {
                throw new Error('Camera not responding');
            }
        } catch (error) {
            this.connected = false;
            throw new Error(`Cannot connect to camera at ${ipAddress}:${this.port}`);
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
        this.connected = false;
    }

    public async takeSnapshot(): Promise<CameraSnapshot> {
        if (!this.connected) {
            throw new Error('Camera not connected');
        }

        try {
            const response = await axios.get(`http://${this.ipAddress}:${this.port}/capture`, {
                responseType: 'arraybuffer',
                timeout: 10000
            });

            return {
                imageData: Buffer.from(response.data),
                timestamp: new Date(),
                width: 320, // Default ESP32-CAM resolution
                height: 240
            };
        } catch (error) {
            throw new Error(`Failed to capture image: ${error}`);
        }
    }

    public setImageCallback(callback: (snapshot: CameraSnapshot) => void): void {
        this.onImageReceived = callback;
    }

    private async setupWebSocketConnection(): Promise<void> {
        try {
            this.ws = new WebSocket(`ws://${this.ipAddress}:${this.port}/ws`);

            this.ws.on('open', () => {
                console.log('WebSocket connection established');
            });

            this.ws.on('message', (data: Buffer) => {
                if (this.onImageReceived) {
                    const snapshot: CameraSnapshot = {
                        imageData: data,
                        timestamp: new Date(),
                        width: 320,
                        height: 240
                    };
                    this.onImageReceived(snapshot);
                }
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.connected = false;
            });

            this.ws.on('close', () => {
                console.log('WebSocket connection closed');
                this.connected = false;
            });
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
            // Fallback to HTTP polling if WebSocket fails
        }
    }

    public async sendCommand(command: string, params?: any): Promise<any> {
        if (!this.connected) {
            throw new Error('Camera not connected');
        }

        try {
            const response = await axios.post(`http://${this.ipAddress}:${this.port}/command`, {
                command,
                params
            }, {
                timeout: 5000
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to send command: ${error}`);
        }
    }
}