import * as vscode from 'vscode';
import { CameraManager } from './cameraManager';
import { AIProvider } from './aiProvider';
import { MonitoringService } from './monitoringService';
import { CameraViewProvider } from './views/cameraViewProvider';
import { AIAnalysisProvider } from './views/aiAnalysisProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Double Vision extension is now active!');
    
    const cameraManager = new CameraManager();
    const aiProvider = new AIProvider();
    const monitoringService = new MonitoringService(cameraManager, aiProvider);
    
    // Register view providers
    const cameraViewProvider = new CameraViewProvider(context.extensionUri, cameraManager);
    const aiAnalysisProvider = new AIAnalysisProvider(context.extensionUri, aiProvider);
    
    vscode.window.registerWebviewViewProvider('double-vision-camera', cameraViewProvider);
    vscode.window.registerWebviewViewProvider('double-vision-ai', aiAnalysisProvider);
    
    // Register commands
    const connectCameraCommand = vscode.commands.registerCommand('double-vision.connectCamera', async () => {
        const ipAddress = await vscode.window.showInputBox({
            prompt: 'Enter ESP32 camera IP address',
            value: vscode.workspace.getConfiguration('doubleVision').get('camera.ipAddress', '192.168.1.100'),
            validateInput: (value) => {
                const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                return ipRegex.test(value) ? null : 'Please enter a valid IP address';
            }
        });
        
        if (ipAddress) {
            try {
                await cameraManager.connect(ipAddress);
                vscode.window.showInformationMessage(`Connected to ESP32 camera at ${ipAddress}`);
                vscode.commands.executeCommand('setContext', 'double-vision.cameraConnected', true);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to connect to camera: ${error}`);
            }
        }
    });
    
    const startMonitoringCommand = vscode.commands.registerCommand('double-vision.startMonitoring', async () => {
        if (!cameraManager.isConnected()) {
            vscode.window.showWarningMessage('Please connect to a camera first');
            return;
        }
        
        try {
            await monitoringService.start();
            vscode.window.showInformationMessage('AI visual monitoring started');
            vscode.commands.executeCommand('setContext', 'double-vision.aiEnabled', true);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start monitoring: ${error}`);
        }
    });
    
    const stopMonitoringCommand = vscode.commands.registerCommand('double-vision.stopMonitoring', () => {
        monitoringService.stop();
        vscode.window.showInformationMessage('AI visual monitoring stopped');
        vscode.commands.executeCommand('setContext', 'double-vision.aiEnabled', false);
    });
    
    const takeSnapshotCommand = vscode.commands.registerCommand('double-vision.takeSnapshot', async () => {
        if (!cameraManager.isConnected()) {
            vscode.window.showWarningMessage('Please connect to a camera first');
            return;
        }
        
        try {
            const snapshot = await cameraManager.takeSnapshot();
            const analysis = await aiProvider.analyzeImage(snapshot);
            
            vscode.window.showInformationMessage('Snapshot taken and analyzed');
            
            // Show analysis in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: `# Display Analysis\n\n${analysis}\n\nTimestamp: ${new Date().toISOString()}`,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to take snapshot: ${error}`);
        }
    });
    
    const showSettingsCommand = vscode.commands.registerCommand('double-vision.showSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'doubleVision');
    });
    
    // Register all commands
    context.subscriptions.push(
        connectCameraCommand,
        startMonitoringCommand,
        stopMonitoringCommand,
        takeSnapshotCommand,
        showSettingsCommand
    );
    
    // Auto-connect if IP is configured
    const configuredIP = vscode.workspace.getConfiguration('doubleVision').get('camera.ipAddress');
    if (configuredIP && configuredIP !== '192.168.1.100') {
        // Try to auto-connect in the background
        cameraManager.connect(configuredIP as string).catch(() => {
            // Silently fail on auto-connect
        });
    }
}

export function deactivate() {
    console.log('Double Vision extension deactivated');
}