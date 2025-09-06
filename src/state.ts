/**
 * Central State Management for ATB2
 * Manages application state and provides reactive updates
 */

export interface AppState {
    // Market selection
    selectedMarket: {
        symbol: string;
        name: string;
        type: 'commodity' | 'stock' | 'crypto';
        price: number;
    } | null;
    
    // Bot management
    selectedBot: string | null;
    activeBots: string[];
    botConfigs: { [botId: string]: BotConfig };
    
    // Trading state
    isSimRunning: boolean;
    isLiveTrading: boolean;
    brokerConnected: boolean;
    
    // Positions and P&L
    positions: { [symbol: string]: Position };
    totalPnl: number;
    dailyPnl: number;
    winRate: number;
    activePositionsCount: number;
    
    // Connection status
    connectionStatus: 'online' | 'offline' | 'connecting';
    
    // Theme
    currentTheme: string;
    customTheme: { [key: string]: string };
    
    // UI state
    chartData: ChartDataPoint[];
    lastUpdate: number;
    alerts: Alert[];
}

export interface BotConfig {
    id: string;
    name: string;
    asset: string;
    strategy: string;
    frequency: string;
    risk: 'low' | 'medium' | 'high';
    floorPrice: number;
    dailyLossLimit: number;
    maxPositions: number;
    active: boolean;
}

export interface Position {
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    unrealizedPnl: number;
    realizedPnl: number;
    marketValue: number;
}

export interface ChartDataPoint {
    time: number;
    price: number;
    volume: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface Alert {
    id: string;
    type: 'success' | 'info' | 'warning' | 'danger';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
}

class StateManager {
    private state: AppState;
    private subscribers: Set<(state: AppState) => void> = new Set();
    private persistenceKey = 'atb2_state';

    constructor() {
        this.state = this.getInitialState();
        this.loadFromStorage();
        this.setupPersistence();
    }

    /**
     * Get initial state
     */
    private getInitialState(): AppState {
        return {
            selectedMarket: null,
            selectedBot: null,
            activeBots: [],
            botConfigs: {},
            isSimRunning: false,
            isLiveTrading: false,
            brokerConnected: false,
            positions: {},
            totalPnl: 0,
            dailyPnl: 0,
            winRate: 0,
            activePositionsCount: 0,
            connectionStatus: 'offline',
            currentTheme: 'forest',
            customTheme: {},
            chartData: [],
            lastUpdate: Date.now(),
            alerts: []
        };
    }

    /**
     * Get current state
     */
    getState(): AppState {
        return { ...this.state };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback: (state: AppState) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Notify all subscribers of state changes
     */
    private notify(): void {
        this.subscribers.forEach(callback => callback(this.state));
    }

    /**
     * Update state and notify subscribers
     */
    private updateState(updates: Partial<AppState>): void {
        this.state = { ...this.state, ...updates };
        this.state.lastUpdate = Date.now();
        this.notify();
    }

    // Market selection methods
    selectMarket(market: AppState['selectedMarket']): void {
        this.updateState({ selectedMarket: market });
    }

    // Bot management methods
    selectBot(botId: string | null): void {
        this.updateState({ selectedBot: botId });
    }

    addBot(botConfig: BotConfig): void {
        const newConfigs = { ...this.state.botConfigs, [botConfig.id]: botConfig };
        this.updateState({ botConfigs: newConfigs });
    }

    updateBotConfig(botId: string, updates: Partial<BotConfig>): void {
        const config = this.state.botConfigs[botId];
        if (config) {
            const updatedConfig = { ...config, ...updates };
            const newConfigs = { ...this.state.botConfigs, [botId]: updatedConfig };
            this.updateState({ botConfigs: newConfigs });
        }
    }

    removeBot(botId: string): void {
        const newConfigs = { ...this.state.botConfigs };
        delete newConfigs[botId];
        const newActiveBots = this.state.activeBots.filter(id => id !== botId);
        this.updateState({ 
            botConfigs: newConfigs, 
            activeBots: newActiveBots,
            selectedBot: this.state.selectedBot === botId ? null : this.state.selectedBot
        });
    }

    startBot(botId: string): void {
        const config = this.state.botConfigs[botId];
        if (config) {
            this.updateBotConfig(botId, { active: true });
            if (!this.state.activeBots.includes(botId)) {
                this.updateState({ 
                    activeBots: [...this.state.activeBots, botId] 
                });
            }
        }
    }

    stopBot(botId: string): void {
        const config = this.state.botConfigs[botId];
        if (config) {
            this.updateBotConfig(botId, { active: false });
            this.updateState({ 
                activeBots: this.state.activeBots.filter(id => id !== botId) 
            });
        }
    }

    // Trading state methods
    setSimRunning(running: boolean): void {
        this.updateState({ isSimRunning: running });
    }

    setLiveTrading(live: boolean): void {
        this.updateState({ isLiveTrading: live });
    }

    setBrokerConnected(connected: boolean): void {
        this.updateState({ 
            brokerConnected: connected,
            connectionStatus: connected ? 'online' : 'offline'
        });
    }

    // Position and P&L methods
    updatePositions(positions: { [symbol: string]: Position }): void {
        this.updateState({ positions });
    }

    updatePnl(totalPnl: number, dailyPnl: number, winRate: number, activePositionsCount: number): void {
        this.updateState({ 
            totalPnl, 
            dailyPnl, 
            winRate, 
            activePositionsCount 
        });
    }

    // Chart data methods
    updateChartData(data: ChartDataPoint[]): void {
        this.updateState({ chartData: data });
    }

    // Theme methods
    setTheme(theme: string): void {
        this.updateState({ currentTheme: theme });
    }

    setCustomTheme(theme: { [key: string]: string }): void {
        this.updateState({ customTheme: theme });
    }

    // Alert methods
    addAlert(type: Alert['type'], title: string, message: string): void {
        const alert: Alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            title,
            message,
            timestamp: Date.now(),
            read: false
        };
        this.updateState({ 
            alerts: [...this.state.alerts, alert] 
        });
    }

    markAlertRead(alertId: string): void {
        const alerts = this.state.alerts.map(alert => 
            alert.id === alertId ? { ...alert, read: true } : alert
        );
        this.updateState({ alerts });
    }

    clearAlerts(): void {
        this.updateState({ alerts: [] });
    }

    // Connection status methods
    setConnectionStatus(status: AppState['connectionStatus']): void {
        this.updateState({ connectionStatus: status });
    }

    // Persistence methods
    private setupPersistence(): void {
        // Save state to localStorage on changes
        this.subscribe(() => {
            this.saveToStorage();
        });
    }

    private saveToStorage(): void {
        try {
            const stateToSave = {
                selectedMarket: this.state.selectedMarket,
                selectedBot: this.state.selectedBot,
                botConfigs: this.state.botConfigs,
                currentTheme: this.state.currentTheme,
                customTheme: this.state.customTheme
            };
            localStorage.setItem(this.persistenceKey, JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem(this.persistenceKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.updateState(parsed);
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
    }

    // Utility methods
    getBotConfig(botId: string): BotConfig | null {
        return this.state.botConfigs[botId] || null;
    }

    getActiveBots(): BotConfig[] {
        return this.state.activeBots
            .map(id => this.state.botConfigs[id])
            .filter(config => config && config.active);
    }

    getPosition(symbol: string): Position | null {
        return this.state.positions[symbol] || null;
    }

    getUnreadAlertsCount(): number {
        return this.state.alerts.filter(alert => !alert.read).length;
    }

    // Reset state
    reset(): void {
        this.state = this.getInitialState();
        this.notify();
        localStorage.removeItem(this.persistenceKey);
    }
}

// Export singleton instance
export const stateManager = new StateManager();
