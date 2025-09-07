/**
 * ATB2 Test Harness
 * Wires together mock data feeds, broker, and state management for testing
 */

import { mockFeed, MockDataFeed } from './test-utils/mockFeed';
import { mockBroker, MockBroker } from './test-utils/mockBroker';
import { stateManager, StateManager } from './state';

export class ATB2TestHarness {
    private dataFeed: MockDataFeed;
    private broker: MockBroker;
    private state: StateManager;
    private chart: any = null;
    private updateInterval: NodeJS.Timeout | null = null;
    private isInitialized = false;

    constructor() {
        this.dataFeed = mockFeed;
        this.broker = mockBroker;
        this.state = stateManager;
    }

    /**
     * Initialize the test harness
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        console.log('Initializing ATB2 Test Harness...');

        // Initialize Chart.js if available
        if (typeof Chart !== 'undefined') {
            this.initializeChart();
        }

        // Set up state subscriptions
        this.setupStateSubscriptions();

        // Start data updates
        this.startDataUpdates();

        // Initialize UI event handlers
        this.setupUIEventHandlers();

        this.isInitialized = true;
        console.log('ATB2 Test Harness initialized successfully');
    }

    /**
     * Initialize Chart.js
     */
    private initializeChart(): void {
        const ctx = document.getElementById('market-chart')?.getContext('2d');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price',
                    data: [],
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#cccccc'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#cccccc'
                        }
                    }
                }
            }
        });
    }

    /**
     * Set up state subscriptions
     */
    private setupStateSubscriptions(): void {
        this.state.subscribe((state) => {
            this.updateUI(state);
        });
    }

    /**
     * Start data updates
     */
    private startDataUpdates(): void {
        this.updateInterval = setInterval(() => {
            this.updateMarketData();
            this.updateBrokerData();
        }, 1000);
    }

    /**
     * Update market data
     */
    private updateMarketData(): void {
        const currentState = this.state.getState();
        
        if (currentState.selectedMarket) {
            const symbol = currentState.selectedMarket.symbol;
            const currentPrice = this.dataFeed.getCurrentPrice(symbol);
            
            // Update market price
            const priceElement = document.getElementById(`price-${symbol.replace('=F', '').replace('-USD', '')}`);
            if (priceElement) {
                priceElement.textContent = `$${currentPrice.toFixed(2)}`;
            }

            // Update chart data
            const historicalData = this.dataFeed.getHistory(symbol, '1m', Date.now() - 3600000, Date.now());
            this.state.updateChartData(historicalData);
        }
    }

    /**
     * Update broker data
     */
    private updateBrokerData(): void {
        const currentState = this.state.getState();
        
        if (currentState.brokerConnected) {
            // Update prices for all positions
            const prices = new Map();
            Object.keys(currentState.positions).forEach(symbol => {
                prices.set(symbol, this.dataFeed.getCurrentPrice(symbol));
            });
            this.broker.updatePrices(prices);

            // Update P&L
            const pnl = this.broker.getTotalPnl();
            const dailyPnl = this.broker.getDailyPnl();
            const winRate = this.broker.getWinRate();
            const activePositions = this.broker.getActivePositionsCount();

            this.state.updatePnl(pnl.total, dailyPnl, winRate, activePositions);

            // Update positions
            const positions: { [symbol: string]: any } = {};
            this.broker.getPositions().forEach(pos => {
                positions[pos.symbol] = pos;
            });
            this.state.updatePositions(positions);
        }
    }

    /**
     * Update UI based on state
     */
    private updateUI(state: any): void {
        // Update unified market display
        const marketDisplay = document.getElementById('market-display');
        if (marketDisplay) {
            if (state.selectedBot) {
                // Show bot and its market
                const botConfig = state.botConfigs[state.selectedBot];
                if (botConfig) {
                    marketDisplay.textContent = `Bot: ${botConfig.name} - ${botConfig.asset}`;
                }
            } else if (state.selectedMarket) {
                // Show market only
                marketDisplay.textContent = `Market: ${state.selectedMarket.name} (${state.selectedMarket.symbol})`;
            } else {
                // Show default message
                marketDisplay.textContent = 'Select a market or bot to view';
            }
        }

        // Update P&L displays
        const totalPnlElement = document.getElementById('total-pnl');
        if (totalPnlElement) {
            totalPnlElement.textContent = `$${state.totalPnl.toFixed(2)}`;
            totalPnlElement.className = `stat-value ${state.totalPnl >= 0 ? 'positive' : 'negative'}`;
        }

        const dailyPnlElement = document.getElementById('daily-pnl');
        if (dailyPnlElement) {
            dailyPnlElement.textContent = `$${state.dailyPnl.toFixed(2)}`;
            dailyPnlElement.className = `stat-value ${state.dailyPnl >= 0 ? 'positive' : 'negative'}`;
        }

        const activePositionsElement = document.getElementById('active-positions');
        if (activePositionsElement) {
            activePositionsElement.textContent = state.activePositionsCount.toString();
        }

        const winRateElement = document.getElementById('win-rate');
        if (winRateElement) {
            winRateElement.textContent = `${state.winRate.toFixed(1)}%`;
        }

        // Update connection status
        const connectionText = document.getElementById('connection-text');
        if (connectionText) {
            connectionText.textContent = state.brokerConnected ? '💚' : '❌';
        }

        // Update chart
        if (this.chart && state.chartData.length > 0) {
            const labels = state.chartData.map((d: any) => new Date(d.time).toLocaleTimeString());
            const prices = state.chartData.map((d: any) => d.price);
            
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = prices;
            this.chart.update('none');
        }

        // Update last update time
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Last Update: ${new Date(state.lastUpdate).toLocaleTimeString()}`;
        }
    }

    /**
     * Set up UI event handlers
     */
    private setupUIEventHandlers(): void {
        // Market selection
        document.querySelectorAll('.market-item').forEach(item => {
            item.addEventListener('click', () => {
                const symbol = item.getAttribute('data-symbol');
                const name = item.getAttribute('data-name');
                const type = this.getMarketType(symbol || '');
                
                if (symbol && name) {
                    this.state.selectMarket({
                        symbol,
                        name,
                        type,
                        price: this.dataFeed.getCurrentPrice(symbol)
                    });
                    
                    // Update chart
                    this.updateChartForSymbol(symbol);
                }
            });
        });

        // Bot selector
        const botSelector = document.getElementById('bot-selector');
        if (botSelector) {
            botSelector.addEventListener('change', (e: any) => {
                this.state.selectBot(e.target.value || null);
            });
        }

        // Bot controls
        const startBotBtn = document.getElementById('start-bot');
        if (startBotBtn) {
            startBotBtn.addEventListener('click', () => {
                const currentState = this.state.getState();
                if (currentState.selectedBot) {
                    this.state.startBot(currentState.selectedBot);
                    this.state.setSimRunning(true);
                }
            });
        }

        const pauseBotBtn = document.getElementById('pause-bot');
        if (pauseBotBtn) {
            pauseBotBtn.addEventListener('click', () => {
                const currentState = this.state.getState();
                if (currentState.selectedBot) {
                    this.state.stopBot(currentState.selectedBot);
                    this.state.setSimRunning(false);
                }
            });
        }

        const resetBotBtn = document.getElementById('reset-bot');
        if (resetBotBtn) {
            resetBotBtn.addEventListener('click', () => {
                const currentState = this.state.getState();
                if (currentState.selectedBot) {
                    this.state.stopBot(currentState.selectedBot);
                    this.state.setSimRunning(false);
                    // Reset P&L
                    this.state.updatePnl(0, 0, 0, 0);
                }
            });
        }

        // Broker connection
        const connectBrokerBtn = document.getElementById('connect-broker');
        if (connectBrokerBtn) {
            connectBrokerBtn.addEventListener('click', async () => {
                const broker = (document.getElementById('broker-selector') as HTMLSelectElement)?.value;
                const apiKey = (document.getElementById('api-key') as HTMLInputElement)?.value;
                const apiSecret = (document.getElementById('api-secret') as HTMLInputElement)?.value;
                
                if (broker && apiKey && apiSecret) {
                    try {
                        await this.broker.connect(apiKey, apiSecret, broker);
                        this.state.setBrokerConnected(true);
                        this.state.addAlert('success', 'Broker Connected', `Connected to ${broker}`);
                    } catch (error) {
                        this.state.addAlert('danger', 'Connection Failed', 'Failed to connect to broker');
                    }
                }
            });
        }

        // Theme customization
        const applyThemeBtn = document.getElementById('apply-theme');
        if (applyThemeBtn) {
            applyThemeBtn.addEventListener('click', () => {
                this.applyCustomTheme();
            });
        }

        const resetThemeBtn = document.getElementById('reset-theme');
        if (resetThemeBtn) {
            resetThemeBtn.addEventListener('click', () => {
                this.resetTheme();
            });
        }

        // Preset theme buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e: any) => {
                this.applyPresetTheme(e.target.dataset.theme);
            });
        });
    }

    /**
     * Update chart for a specific symbol
     */
    private updateChartForSymbol(symbol: string): void {
        const historicalData = this.dataFeed.getHistory(symbol, '1m', Date.now() - 3600000, Date.now());
        this.state.updateChartData(historicalData);
    }

    /**
     * Get market type from symbol
     */
    private getMarketType(symbol: string): 'commodity' | 'stock' | 'crypto' {
        if (symbol.includes('=F')) return 'commodity';
        if (symbol.includes('-USD')) return 'crypto';
        return 'stock';
    }

    /**
     * Apply custom theme
     */
    private applyCustomTheme(): void {
        const root = document.documentElement;
        const colorInputs = document.querySelectorAll('#theme-modal input[type="color"]');
        
        const customTheme: { [key: string]: string } = {};
        colorInputs.forEach((input: any) => {
            const property = `--${input.id.replace('-', '-')}`;
            root.style.setProperty(property, input.value);
            customTheme[property] = input.value;
        });

        const fontSelector = document.getElementById('font-family-selector') as HTMLSelectElement;
        if (fontSelector) {
            root.style.setProperty('--font-family', fontSelector.value);
            customTheme['--font-family'] = fontSelector.value;
        }

        this.state.setCustomTheme(customTheme);
        this.state.addAlert('success', 'Theme Applied', 'Custom theme applied successfully');
    }

    /**
     * Reset theme
     */
    private resetTheme(): void {
        const root = document.documentElement;
        const defaultTheme = {
            '--bg-primary': '#0a0a0a',
            '--bg-secondary': '#1a1a1a',
            '--accent-color': '#ffd700',
            '--text-primary': '#ffffff',
            '--success-color': '#28a745',
            '--warning-color': '#ffc107',
            '--danger-color': '#dc3545',
            '--info-color': '#17a2b8',
            '--font-family': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        };

        Object.entries(defaultTheme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        this.state.setCustomTheme({});
        this.state.addAlert('info', 'Theme Reset', 'Theme reset to default');
    }

    /**
     * Apply preset theme
     */
    private applyPresetTheme(themeName: string): void {
        const themes: { [key: string]: { [key: string]: string } } = {
            'black-gold': {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#1a1a1a',
                '--accent-color': '#ffd700',
                '--text-primary': '#ffffff'
            },
            'sunrise': {
                '--bg-primary': '#1a0f0a',
                '--bg-secondary': '#2e1a0f',
                '--accent-color': '#ff8c00',
                '--text-primary': '#ffffff'
            },
            'neon': {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#1a0a1a',
                '--accent-color': '#00ffff',
                '--text-primary': '#ffffff'
            }
        };

        const theme = themes[themeName];
        if (theme) {
            const root = document.documentElement;
            Object.entries(theme).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });
            this.state.setTheme(themeName);
            this.state.addAlert('success', 'Theme Applied', `${themeName} theme applied successfully`);
        }
    }

    /**
     * Create a test bot
     */
    createTestBot(symbol: string, name: string): string {
        const botId = `bot_${Date.now()}`;
        const botConfig = {
            id: botId,
            name,
            asset: symbol,
            strategy: 'ma',
            frequency: '1m',
            risk: 'medium' as const,
            floorPrice: 0,
            dailyLossLimit: 1000,
            maxPositions: 10,
            active: false
        };

        this.state.addBot(botConfig);
        this.state.addAlert('info', 'Bot Created', `Created bot: ${name}`);
        return botId;
    }

    /**
     * Simulate trading activity
     */
    simulateTrading(): void {
        const currentState = this.state.getState();
        if (currentState.selectedBot && currentState.brokerConnected) {
            const botConfig = currentState.botConfigs[currentState.selectedBot];
            if (botConfig && botConfig.active) {
                // Simulate random trading decisions
                if (Math.random() < 0.1) { // 10% chance of trade
                    const side = Math.random() < 0.5 ? 'buy' : 'sell';
                    const quantity = Math.floor(Math.random() * 10) + 1;
                    const price = this.dataFeed.getCurrentPrice(botConfig.asset);
                    
                    this.broker.placeOrder(botConfig.asset, side, quantity, price)
                        .then(() => {
                            this.state.addAlert('info', 'Trade Executed', `${side.toUpperCase()} ${quantity} ${botConfig.asset} at $${price.toFixed(2)}`);
                        })
                        .catch((error) => {
                            this.state.addAlert('warning', 'Trade Failed', error.message);
                        });
                }
            }
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.dataFeed.destroy();
        this.broker.reset();
    }
}

// Export singleton instance
export const testHarness = new ATB2TestHarness();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        testHarness.initialize();
    });
} else {
    testHarness.initialize();
}
