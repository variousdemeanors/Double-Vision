import * as vscode from 'vscode';
import { CameraManager, CameraSnapshot } from './cameraManager';
import { AIProvider } from './aiProvider';

export class MonitoringService {
    private isMonitoring = false;
    private monitoringInterval?: NodeJS.Timeout;
    private lastSnapshot?: CameraSnapshot;
    private analysisHistory: string[] = [];

    constructor(
        private cameraManager: CameraManager,
        private aiProvider: AIProvider
    ) {
        // Set up camera callback for real-time monitoring
        this.cameraManager.setImageCallback((snapshot) => {
            this.handleNewSnapshot(snapshot);
        });
    }

    public async start(): Promise<void> {
        if (this.isMonitoring) {
            return;
        }

        if (!this.cameraManager.isConnected()) {
            throw new Error('Camera not connected');
        }

        this.isMonitoring = true;
        const interval = vscode.workspace.getConfiguration('doubleVision').get('monitoring.interval', 5000);

        // Start periodic monitoring
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.performMonitoringCycle();
            } catch (error) {
                console.error('Monitoring cycle error:', error);
                vscode.window.showErrorMessage(`Monitoring error: ${error}`);
            }
        }, interval);

        vscode.window.showInformationMessage('AI visual monitoring started');
    }

    public stop(): void {
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
    }

    private async performMonitoringCycle(): Promise<void> {
        if (!this.isMonitoring || !this.cameraManager.isConnected()) {
            return;
        }

        try {
            const snapshot = await this.cameraManager.takeSnapshot();
            await this.analyzeSnapshot(snapshot);
        } catch (error) {
            console.error('Monitoring cycle failed:', error);
        }
    }

    private async handleNewSnapshot(snapshot: CameraSnapshot): Promise<void> {
        if (!this.isMonitoring) {
            return;
        }

        // Only analyze if enough time has passed since last analysis
        if (this.lastSnapshot && 
            (snapshot.timestamp.getTime() - this.lastSnapshot.timestamp.getTime()) < 2000) {
            return;
        }

        await this.analyzeSnapshot(snapshot);
    }

    private async analyzeSnapshot(snapshot: CameraSnapshot): Promise<void> {
        try {
            const analysis = await this.aiProvider.analyzeImage(snapshot);
            this.lastSnapshot = snapshot;
            this.analysisHistory.push(analysis);

            // Keep only last 10 analyses
            if (this.analysisHistory.length > 10) {
                this.analysisHistory.shift();
            }

            // Check for potential issues and provide suggestions
            await this.processAnalysis(analysis);

        } catch (error) {
            console.error('Analysis failed:', error);
        }
    }

    private async processAnalysis(analysis: string): Promise<void> {
        // Look for common issues and provide proactive suggestions
        const lowerAnalysis = analysis.toLowerCase();
        
        if (lowerAnalysis.includes('error') || lowerAnalysis.includes('problem')) {
            const action = await vscode.window.showWarningMessage(
                'Display issue detected. Would you like to see the analysis?',
                'Show Analysis',
                'Generate Fix',
                'Dismiss'
            );

            if (action === 'Show Analysis') {
                await this.showAnalysisDocument(analysis);
            } else if (action === 'Generate Fix') {
                await this.generateFixSuggestions(analysis);
            }
        }

        // Check for LVGL-specific issues
        if (lowerAnalysis.includes('lvgl') || lowerAnalysis.includes('widget')) {
            await this.checkLVGLIssues(analysis);
        }

        // Emit analysis update for webview
        this.notifyAnalysisUpdate(analysis);
    }

    private async showAnalysisDocument(analysis: string): Promise<void> {
        const doc = await vscode.workspace.openTextDocument({
            content: `# Display Analysis - ${new Date().toISOString()}\n\n${analysis}\n\n## Analysis History\n\n${this.analysisHistory.slice(-5).join('\n\n---\n\n')}`,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }

    private async generateFixSuggestions(analysis: string): Promise<void> {
        try {
            const code = await this.aiProvider.generateLVGLCode(
                `Fix the issues mentioned in this analysis: ${analysis}`
            );

            const doc = await vscode.workspace.openTextDocument({
                content: code,
                language: 'c'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate fix: ${error}`);
        }
    }

    private async checkLVGLIssues(analysis: string): Promise<void> {
        // Check for common LVGL issues and suggest fixes
        const issues = [];
        
        if (analysis.includes('memory')) {
            issues.push('Consider optimizing memory usage with lv_mem_monitor()');
        }
        
        if (analysis.includes('performance')) {
            issues.push('Consider using lv_task instead of delays for better performance');
        }
        
        if (analysis.includes('style')) {
            issues.push('Use lv_style_t objects for consistent styling');
        }

        if (issues.length > 0) {
            const message = `LVGL optimization suggestions: ${issues.join(', ')}`;
            vscode.window.showInformationMessage(message);
        }
    }

    private notifyAnalysisUpdate(analysis: string): void {
        // This would notify the webview panels about new analysis
        // Implementation depends on webview setup
        vscode.commands.executeCommand('double-vision.updateAnalysis', analysis);
    }

    public getAnalysisHistory(): string[] {
        return [...this.analysisHistory];
    }

    public getLastSnapshot(): CameraSnapshot | undefined {
        return this.lastSnapshot;
    }

    public isActive(): boolean {
        return this.isMonitoring;
    }
}