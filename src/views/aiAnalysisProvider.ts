import * as vscode from 'vscode';
import { AIProvider } from '../aiProvider';

export class AIAnalysisProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private analysisHistory: string[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly aiProvider: AIProvider
    ) {}

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
                case 'generateCode':
                    this.generateCode(data.description);
                    break;
                case 'clearHistory':
                    this.clearHistory();
                    break;
            }
        });

        // Register command to update analysis
        vscode.commands.registerCommand('double-vision.updateAnalysis', (analysis: string) => {
            this.addAnalysis(analysis);
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Analysis</title>
            <style>
                body {
                    padding: 10px;
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    font-size: 13px;
                }
                .analysis-container {
                    margin-bottom: 15px;
                }
                .analysis-item {
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 10px;
                    margin-bottom: 10px;
                }
                .analysis-timestamp {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 5px;
                }
                .analysis-content {
                    white-space: pre-wrap;
                    line-height: 1.4;
                }
                .controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button.secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                button.secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                .input-group {
                    margin-bottom: 10px;
                }
                textarea {
                    width: 100%;
                    height: 60px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 8px;
                    font-family: var(--vscode-font-family);
                    font-size: 12px;
                    resize: vertical;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--vscode-descriptionForeground);
                }
                .status {
                    padding: 8px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    font-size: 12px;
                }
                .status.info {
                    background-color: var(--vscode-textPreformat-background);
                    border: 1px solid var(--vscode-panel-border);
                }
                .suggestion {
                    background-color: var(--vscode-merge-currentContentBackground);
                    border-left: 3px solid var(--vscode-merge-currentHeaderBackground);
                    padding: 8px;
                    margin: 8px 0;
                    border-radius: 0 4px 4px 0;
                }
            </style>
        </head>
        <body>
            <div class="controls">
                <button onclick="startAnalysis()">Start Analysis</button>
                <button onclick="clearHistory()" class="secondary">Clear History</button>
            </div>

            <div class="input-group">
                <textarea id="codeDescription" placeholder="Describe the interface you want to create with LVGL..."></textarea>
                <button onclick="generateCode()" style="margin-top: 5px;">Generate LVGL Code</button>
            </div>

            <div id="currentStatus" class="status info">
                Ready for analysis
            </div>

            <div class="analysis-container">
                <div id="analysisHistory"></div>
                <div id="emptyState" class="empty-state">
                    <p>🤖 No analysis yet</p>
                    <p>Connect to a camera and start monitoring to see AI analysis results here.</p>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function startAnalysis() {
                    vscode.postMessage({ type: 'startAnalysis' });
                    document.getElementById('currentStatus').textContent = 'Analysis started...';
                }
                
                function generateCode() {
                    const description = document.getElementById('codeDescription').value;
                    if (description.trim()) {
                        vscode.postMessage({ 
                            type: 'generateCode', 
                            description: description 
                        });
                        document.getElementById('currentStatus').textContent = 'Generating LVGL code...';
                    } else {
                        document.getElementById('currentStatus').textContent = 'Please enter a description first';
                    }
                }
                
                function clearHistory() {
                    vscode.postMessage({ type: 'clearHistory' });
                }
                
                function addAnalysisItem(analysis, timestamp) {
                    const historyContainer = document.getElementById('analysisHistory');
                    const emptyState = document.getElementById('emptyState');
                    
                    emptyState.style.display = 'none';
                    
                    const item = document.createElement('div');
                    item.className = 'analysis-item';
                    
                    const timestampDiv = document.createElement('div');
                    timestampDiv.className = 'analysis-timestamp';
                    timestampDiv.textContent = new Date(timestamp).toLocaleString();
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'analysis-content';
                    contentDiv.textContent = analysis;
                    
                    // Add suggestions if analysis contains them
                    if (analysis.toLowerCase().includes('suggestion')) {
                        const suggestionDiv = document.createElement('div');
                        suggestionDiv.className = 'suggestion';
                        suggestionDiv.innerHTML = '<strong>💡 AI Suggestion:</strong> Check the analysis above for improvement recommendations.';
                        contentDiv.appendChild(suggestionDiv);
                    }
                    
                    item.appendChild(timestampDiv);
                    item.appendChild(contentDiv);
                    
                    historyContainer.insertBefore(item, historyContainer.firstChild);
                    
                    // Keep only last 10 items
                    while (historyContainer.children.length > 10) {
                        historyContainer.removeChild(historyContainer.lastChild);
                    }
                }
                
                function clearAnalysisHistory() {
                    const historyContainer = document.getElementById('analysisHistory');
                    const emptyState = document.getElementById('emptyState');
                    
                    historyContainer.innerHTML = '';
                    emptyState.style.display = 'block';
                    
                    document.getElementById('currentStatus').textContent = 'History cleared';
                }
                
                // Listen for messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'addAnalysis':
                            addAnalysisItem(message.analysis, message.timestamp);
                            document.getElementById('currentStatus').textContent = 'New analysis received';
                            break;
                        case 'clearHistory':
                            clearAnalysisHistory();
                            break;
                        case 'updateStatus':
                            document.getElementById('currentStatus').textContent = message.status;
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }

    public addAnalysis(analysis: string): void {
        if (this._view) {
            this.analysisHistory.push(analysis);
            this._view.webview.postMessage({ 
                type: 'addAnalysis', 
                analysis: analysis,
                timestamp: new Date().toISOString()
            });
        }
    }

    private async generateCode(description: string): Promise<void> {
        try {
            const code = await this.aiProvider.generateLVGLCode(description);
            
            const doc = await vscode.workspace.openTextDocument({
                content: code,
                language: 'c'
            });
            await vscode.window.showTextDocument(doc);
            
            if (this._view) {
                this._view.webview.postMessage({ 
                    type: 'updateStatus', 
                    status: 'LVGL code generated and opened in editor'
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate code: ${error}`);
            if (this._view) {
                this._view.webview.postMessage({ 
                    type: 'updateStatus', 
                    status: `Error: ${error}`
                });
            }
        }
    }

    private clearHistory(): void {
        this.analysisHistory = [];
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearHistory' });
        }
    }
}