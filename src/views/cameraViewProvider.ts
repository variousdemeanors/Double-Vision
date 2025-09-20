import * as vscode from 'vscode';
import { CameraManager, CameraSnapshot } from '../cameraManager';

export class CameraViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly cameraManager: CameraManager
    ) {
        // Set up camera callback to update webview
        this.cameraManager.setImageCallback((snapshot) => {
            this.updateCameraFeed(snapshot);
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'takePicture':
                    this.takePicture();
                    break;
                case 'connect':
                    vscode.commands.executeCommand('double-vision.connectCamera');
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ESP32 Camera Feed</title>
            <style>
                body {
                    padding: 10px;
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .camera-container {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .camera-feed {
                    max-width: 100%;
                    height: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }
                .controls {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 10px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .status {
                    margin-top: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .status.connected {
                    background-color: var(--vscode-testing-iconPassed);
                    color: white;
                }
                .status.disconnected {
                    background-color: var(--vscode-testing-iconFailed);
                    color: white;
                }
                .placeholder {
                    background-color: var(--vscode-input-background);
                    border: 2px dashed var(--vscode-panel-border);
                    padding: 40px;
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="camera-container">
                <div id="cameraPlaceholder" class="placeholder">
                    <p>📷 No camera connected</p>
                    <p>Click "Connect" to connect to your ESP32 camera</p>
                </div>
                <img id="cameraFeed" class="camera-feed" style="display: none;" alt="ESP32 Camera Feed" />
            </div>
            
            <div class="controls">
                <button onclick="connectCamera()">Connect</button>
                <button onclick="takePicture()">Snapshot</button>
            </div>
            
            <div id="status" class="status disconnected">Disconnected</div>
            
            <div style="margin-top: 20px; font-size: 12px; color: var(--vscode-descriptionForeground);">
                <strong>Last Update:</strong> <span id="lastUpdate">Never</span>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function connectCamera() {
                    vscode.postMessage({ type: 'connect' });
                }
                
                function takePicture() {
                    vscode.postMessage({ type: 'takePicture' });
                }
                
                function updateCameraFeed(imageData) {
                    const img = document.getElementById('cameraFeed');
                    const placeholder = document.getElementById('cameraPlaceholder');
                    const status = document.getElementById('status');
                    const lastUpdate = document.getElementById('lastUpdate');
                    
                    if (imageData) {
                        img.src = 'data:image/jpeg;base64,' + imageData;
                        img.style.display = 'block';
                        placeholder.style.display = 'none';
                        status.textContent = 'Connected';
                        status.className = 'status connected';
                        lastUpdate.textContent = new Date().toLocaleTimeString();
                    } else {
                        img.style.display = 'none';
                        placeholder.style.display = 'block';
                        status.textContent = 'Disconnected';
                        status.className = 'status disconnected';
                    }
                }
                
                // Listen for messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'updateFeed') {
                        updateCameraFeed(message.imageData);
                    }
                });
            </script>
        </body>
        </html>`;
    }

    private updateCameraFeed(snapshot: CameraSnapshot): void {
        if (this._view) {
            const base64Image = snapshot.imageData.toString('base64');
            this._view.webview.postMessage({ 
                type: 'updateFeed', 
                imageData: base64Image 
            });
        }
    }

    private async takePicture(): Promise<void> {
        try {
            if (this.cameraManager.isConnected()) {
                const snapshot = await this.cameraManager.takeSnapshot();
                this.updateCameraFeed(snapshot);
            } else {
                vscode.window.showWarningMessage('Camera not connected');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to take picture: ${error}`);
        }
    }
}