/**
 * ATB Trading Bot Dashboard - Main JavaScript Application
 * Handles all frontend functionality including charts, real-time updates, and bot management
 */

class ATBDashboard {
    constructor() {
        this.currentBot = null;
        this.isSimulationMode = true;
        this.isDarkTheme = true;
        this.chart = null;
        this.websocket = null;
        this.updateInterval = null;
        this.tickerInterval = null;
        this.zoomLevel = 1;
        this.isLiveTrading = false;
        this.brokerConnected = false;
        this.accountBalance = 100000;
        this.availableFunds = 95000;
        this.accountMain = 100000;
        this.botAllocations = {};
        this.bankAssets = [
            { id: 'bank_1', name: 'Lamborghini', ref: 'LAM-001', qty: 1, value: 250000 },
            { id: 'bank_2', name: 'A Seat in the Kop', ref: 'KOP-1892', qty: 1, value: 50000 },
            { id: 'bank_3', name: 'Crypto-currency', ref: 'CRY-001', qty: 3, value: 15000 }
        ];
        this.currentTimeframe = '1h';
        this.userSelectedTimeframe = false; // Flag to track user selection
        this.graphColor = '#ffd700';
        this.investments = [];
        this.marketData = {};
        this.timeframeCache = {}; // { symbol: { timeframe: [data] } }
        this.backtestConfigs = {}; // { botId: { type, p1, p2, p3 } }
        this.botIntervals = {}; // { botId: intervalId } for tracking bot simulation intervals
        this.availableMarkets = [];
        this.selectedMarket = null;
        this.currentMarketDisplay = null;
        
        // Bot configurations
        this.bots = {
            bot1: { name: 'Stock Bot 1', asset: 'AAPL', type: 'stock', active: false },
            bot2: { name: 'Stock Bot 2', asset: 'GOOGL', type: 'stock', active: false },
            bot3: { name: 'Stock Bot 3', asset: 'MSFT', type: 'stock', active: false },
            bot4: { name: 'Stock Bot 4', asset: 'TSLA', type: 'stock', active: false },
            bot5: { name: 'Stock Bot 5', asset: 'AMZN', type: 'stock', active: false },
            bot6: { name: 'Crypto Bot 1', asset: 'BTC', type: 'crypto', active: false },
            bot7: { name: 'Crypto Bot 2', asset: 'ETH', type: 'crypto', active: false }
        };
        
        // Market data cache
        this.marketData = {};
        this.tickerData = [];
        
        // Statistics
        this.stats = {
            totalPnl: 0,
            dailyPnl: 0,
            activePositions: 0,
            winRate: 0,
            totalTrades: 0,
            winningTrades: 0
        };
        this.botTrades = {}; // { botId: [{type:'BUY'|'SELL', index, price, timestamp}] }
        this.botMetrics = {}; // { botId: { qty, avgCost, realizedPnl, dailyRealized, lastReset } }
        this.restoreBotState();
        this.restoreBacktestConfigs();
        this.syncBotStateFromServer();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeChart();
        this.loadInitialData();
        this.startDataUpdates();
        this.setupWebSocket();
        this.updateUI();
        this.prefetchPopularTimeframes();
        
        // Apply Forest theme as default after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.applyPresetTheme('forest');
        }, 100);
        
        // Persist bot state periodically and on unload
        setInterval(() => this.persistBotState(), 30000);
        window.addEventListener('beforeunload', () => {
            try { this.persistBotState(); } catch (e) {}
        });
    }
    
    setupEventListeners() {
        // Theme toggle
        const themeToggleEl = document.getElementById('theme-toggle');
        if (themeToggleEl) themeToggleEl.addEventListener('click', () => this.toggleTheme());
        
        // Market review panel
        const mktReviewEl = document.getElementById('market-review');
        if (mktReviewEl) mktReviewEl.addEventListener('click', () => this.showMarketReviewModal());
        
        // Strategy editor panel
        const strategyEditorEl = document.getElementById('strategy-editor');
        if (strategyEditorEl) strategyEditorEl.addEventListener('click', () => this.showStrategyEditorModal());
        
        // Investment panel
        const investEl = document.getElementById('investment-panel');
        if (investEl) investEl.addEventListener('click', () => this.showInvestmentModal());
        
        // Theme customizer
        const themeCustEl = document.getElementById('theme-customizer');
        if (themeCustEl) themeCustEl.addEventListener('click', () => this.showThemeModal());
        
        // Legal modal (right-click on logo)
        const logoEl = document.querySelector('.logo-png');
        if (logoEl) {
            logoEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showLegalModal();
            });
        }
        
        // Bot selector
        document.getElementById('bot-selector').addEventListener('change', (e) => {
            this.selectBot(e.target.value);
            this.showBotManagement(e.target.value);
        });
        
        // Bot controls
        const startBotBtn = document.getElementById('start-bot');
        if (startBotBtn) startBotBtn.addEventListener('click', () => this.startBot());
        const pauseBotBtn = document.getElementById('pause-bot');
        if (pauseBotBtn) pauseBotBtn.addEventListener('click', () => this.pauseBot());
        const resetBotBtn = document.getElementById('reset-bot');
        if (resetBotBtn) resetBotBtn.addEventListener('click', () => this.resetBot());
        
        // Configuration changes
        const assetSelectorEl = document.getElementById('asset-selector');
        if (assetSelectorEl) assetSelectorEl.addEventListener('change', (e) => this.updateBotConfig('asset', e.target.value));
        const frequencySelectorEl = document.getElementById('frequency-selector');
        if (frequencySelectorEl) frequencySelectorEl.addEventListener('change', (e) => this.updateBotConfig('frequency', e.target.value));
        const riskSelectorEl = document.getElementById('risk-selector');
        if (riskSelectorEl) riskSelectorEl.addEventListener('change', (e) => this.updateBotConfig('risk', e.target.value));
        
        // Risk controls
        const floorPriceInput = document.getElementById('floor-price');
        if (floorPriceInput) floorPriceInput.addEventListener('change', (e) => this.updateRiskConfig('floorPrice', parseFloat(e.target.value)));
        const dailyLossLimitInput = document.getElementById('daily-loss-limit');
        if (dailyLossLimitInput) dailyLossLimitInput.addEventListener('change', (e) => this.updateRiskConfig('dailyLossLimit', parseFloat(e.target.value)));
        const maxPositionsInput = document.getElementById('max-positions');
        if (maxPositionsInput) maxPositionsInput.addEventListener('change', (e) => this.updateRiskConfig('maxPositions', parseInt(e.target.value)));
        
        // Graph controls
        
        const timeframeSelectorEl = document.getElementById('timeframe-selector');
        if (timeframeSelectorEl) timeframeSelectorEl.addEventListener('change', (e) => this.updateTimeframe(e.target.value));
        
        // Zoom controls
        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomSlider) zoomSlider.addEventListener('input', (e) => this.updateTimeZoom(parseFloat(e.target.value)));
        
        // Graph color controls
        const graphColorPicker = document.getElementById('graph-color');
        if (graphColorPicker) graphColorPicker.addEventListener('change', (e) => this.updateGraphColor(e.target.value));
        
        // Market selection - immediate graph display
        document.querySelectorAll('.market-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectMarketItem(item);
                this.viewMarketGraph(); // Show graph immediately
            });
        });
        
        // Market category toggles
        const showCommodities = document.getElementById('show-commodities');
        if (showCommodities) showCommodities.addEventListener('change', () => this.toggleMarketCategory('commodities'));
        const showStocks = document.getElementById('show-stocks');
        if (showStocks) showStocks.addEventListener('change', () => this.toggleMarketCategory('stocks'));
        const showCrypto = document.getElementById('show-crypto');
        if (showCrypto) showCrypto.addEventListener('change', () => this.toggleMarketCategory('crypto'));
        
        // Create bot for selected market
        const createBotBtn = document.getElementById('create-bot');
        if (createBotBtn) createBotBtn.addEventListener('click', () => this.createBotForMarket());
        
        // Bot management
        const saveBotBtn = document.getElementById('save-bot-settings');
        if (saveBotBtn) saveBotBtn.addEventListener('click', () => this.saveBotSettings());
        const deleteBotBtn = document.getElementById('delete-bot');
        if (deleteBotBtn) deleteBotBtn.addEventListener('click', () => this.deleteBot());
        
        // Footer actions
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) exportDataBtn.addEventListener('click', () => this.exportData());
        
        const simModeBtn = document.getElementById('sim-mode');
        if (simModeBtn) simModeBtn.addEventListener('click', () => this.toggleSimulationMode());
        
        const accBtn = document.getElementById('digital-account');
        if (accBtn) accBtn.addEventListener('click', () => this.showAccountModal());
        const bankBtn = document.getElementById('digital-bank');
        if (bankBtn) bankBtn.addEventListener('click', () => this.showBankModal());
        const currencyBtn = document.getElementById('digital-currency');
        if (currencyBtn) currencyBtn.addEventListener('click', () => this.showCurrencyModal());
        
        // Modal controls
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        });
        
        // Legal modal close button
        const legalCloseBtn = document.getElementById('legal-close');
        if (legalCloseBtn) {
            legalCloseBtn.addEventListener('click', () => {
                this.hideLegalModal();
            });
        }
        
        const alertOkBtn = document.getElementById('alert-ok');
        if (alertOkBtn) alertOkBtn.addEventListener('click', () => this.hideModal());
        
        // Close modal on outside click
        const alertModal = document.getElementById('alert-modal');
        if (alertModal) alertModal.addEventListener('click', (e) => { if (e.target.id === 'alert-modal') this.hideModal(); });
        
        const themeModal = document.getElementById('theme-modal');
        if (themeModal) themeModal.addEventListener('click', (e) => { if (e.target.id === 'theme-modal') this.hideModal(); });
        
        const investmentModal = document.getElementById('investment-modal');
        if (investmentModal) investmentModal.addEventListener('click', (e) => { if (e.target.id === 'investment-modal') this.hideModal(); });
        
        const botMgmtModal = document.getElementById('bot-management-modal');
        if (botMgmtModal) {
            botMgmtModal.addEventListener('click', (e) => {
                if (e.target.id === 'bot-management-modal') {
                    botMgmtModal.classList.remove('show');
                }
            });
        }
        
        // Theme customization
        const applyThemeBtn = document.getElementById('apply-theme');
        if (applyThemeBtn) applyThemeBtn.addEventListener('click', () => this.applyCustomTheme());
        
        const resetThemeBtn = document.getElementById('reset-theme');
        if (resetThemeBtn) resetThemeBtn.addEventListener('click', () => this.resetTheme());
        
        const createNewBotBtn = document.getElementById('create-new-bot');
        if (createNewBotBtn) {
            createNewBotBtn.addEventListener('click', () => this.createOrUpdateBotFromModal(true));
        }
        const modalStart = document.getElementById('modal-start-bot');
        if (modalStart) modalStart.addEventListener('click', () => this.startBot());
        const modalPause = document.getElementById('modal-pause-bot');
        if (modalPause) modalPause.addEventListener('click', () => this.pauseBot());
        const modalReset = document.getElementById('modal-reset-bot');
        if (modalReset) modalReset.addEventListener('click', () => this.resetBot());
        
        // Preset theme buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyPresetTheme(e.target.dataset.theme);
            });
        });
        
        // Font family selector
        const fontSelector = document.getElementById('font-family-selector');
        if (fontSelector) {
            fontSelector.addEventListener('change', (e) => {
                this.applyFontFamily(e.target.value);
            });
        }
        const runBacktestBtn = document.getElementById('run-backtest');
        if (runBacktestBtn) runBacktestBtn.addEventListener('click', () => this.runBacktest());
        const botSelectorEl = document.getElementById('bot-selector');
        if (botSelectorEl) botSelectorEl.addEventListener('change', (e) => this.restoreBacktestConfigToUi(e.target.value));
        
        // Live trading mode
        document.querySelectorAll('input[name="trading-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleTradingMode(e.target.value);
            });
        });
        
        // Broker connection
        document.getElementById('connect-broker').addEventListener('click', () => {
            this.connectBroker();
        });
        
        // Broker disconnection
        document.getElementById('disconnect-broker').addEventListener('click', () => {
            this.disconnectBroker();
        });
        
        // Investment buttons
        document.querySelectorAll('.invest-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.makeInvestment(e.target.dataset.type, e.target.dataset.category);
            });
        });
        
        // Investment modal actions
        document.getElementById('view-portfolio').addEventListener('click', () => {
            this.viewPortfolio();
        });
        
        document.getElementById('export-investments').addEventListener('click', () => {
            this.exportInvestments();
        });
        
        // Market review modal actions
        document.getElementById('generate-pdf').addEventListener('click', () => {
            this.generatePDFReport();
        });
        
        document.getElementById('export-review-data').addEventListener('click', () => {
            this.exportReviewData();
        });

        // Account modal handlers
        const accountModal = document.getElementById('account-modal');
        if (accountModal) {
            accountModal.addEventListener('click', (e) => {
                if (e.target.id === 'account-modal') accountModal.classList.remove('show');
            });
            const depositBtn = document.getElementById('deposit-funds');
            if (depositBtn) depositBtn.addEventListener('click', () => this.depositFunds());
            const transferBtn = document.getElementById('transfer-to-bot');
            if (transferBtn) transferBtn.addEventListener('click', () => this.transferToBot());
            const withdrawBtn = document.getElementById('withdraw-from-bot');
            if (withdrawBtn) withdrawBtn.addEventListener('click', () => this.withdrawFromBot());
        }
        const bankModal = document.getElementById('bank-modal');
        if (bankModal) {
            bankModal.addEventListener('click', (e) => {
                if (e.target.id === 'bank-modal') bankModal.classList.remove('show');
            });
            const addBtn = document.getElementById('bank-add-asset');
            const updBtn = document.getElementById('bank-update-asset');
            const delBtn = document.getElementById('bank-delete-asset');
            const csvBtn = document.getElementById('bank-export-csv');
            if (addBtn) addBtn.addEventListener('click', () => this.addBankAsset());
            if (updBtn) updBtn.addEventListener('click', () => this.updateBankAsset());
            if (delBtn) delBtn.addEventListener('click', () => this.deleteBankAsset());
            if (csvBtn) csvBtn.addEventListener('click', () => this.exportBankCSV());
        }

        // Global ESC to close any open modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
            }
        });
        
        // Market review controls
        document.getElementById('review-time-scale').addEventListener('change', (e) => {
            this.updateMarketReviewTimeScale(e.target.value);
        });
        
        document.getElementById('review-market-filter').addEventListener('change', (e) => {
            this.updateMarketReviewFilter(e.target.value);
        });
    }
    
    initializeChart() {
        const ctx = document.getElementById('market-chart').getContext('2d');
        
        // Destroy any existing chart on this canvas
        if (window.chart) {
            window.chart.destroy();
        }
        
        // Also check for any Chart instances that might be using this canvas
        Chart.helpers.each(Chart.instances, (chart) => {
            if (chart.canvas.id === 'market-chart') {
                chart.destroy();
            }
        });
        
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
                }, {
                    label: 'Buy Signals',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: '#28a745',
                    borderWidth: 0,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }, {
                    label: 'Sell Signals',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: '#dc3545',
                    borderWidth: 0,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable all animations
                },
                transitions: {
                    active: {
                        animation: {
                            duration: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffd700',
                        bodyColor: '#ffffff',
                        borderColor: '#ffd700',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#cccccc',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        // Expose chart to window for testing
        window.chart = this.chart;
    }
    
    loadInitialData() {
        // Load initial market data
        this.loadMarketData();
        this.loadTickerData();
        this.updateStats();
    }
    
    async loadMarketData() {
        try {
            // Simulate API call - replace with actual API
            const response = await fetch('/api/market-data');
            if (response.ok) {
                const data = await response.json();
                this.marketData = data;
            } else {
                // Fallback to simulated data
                this.generateSimulatedData();
            }
        } catch (error) {
            console.log('Using simulated data:', error);
            this.generateSimulatedData();
        }
    }
    
    generateSimulatedData() {
        const assets = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'BTC', 'ETH'];
        const now = new Date();
        
        assets.forEach(asset => {
            const basePrice = this.getBasePrice(asset);
            const data = [];
            
            for (let i = 0; i < 100; i++) {
                const time = new Date(now.getTime() - (100 - i) * 60000); // 1 minute intervals
                const price = basePrice + (Math.random() - 0.5) * basePrice * 0.1;
                data.push({
                    time: time.toISOString(),
                    price: price,
                    volume: Math.random() * 1000000
                });
            }
            
            this.marketData[asset] = data;
        });
    }
    
    getBasePrice(asset) {
        const prices = {
            'AAPL': 150,
            'GOOGL': 2800,
            'MSFT': 300,
            'TSLA': 200,
            'AMZN': 3200,
            'BTC': 45000,
            'ETH': 3000
        };
        return prices[asset] || 100;
    }
    
    loadTickerData() {
        const assets = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'BTC', 'ETH'];
        
        assets.forEach(asset => {
            const basePrice = this.getBasePrice(asset);
            const currentPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.05;
            const change = (Math.random() - 0.5) * basePrice * 0.1;
            const changePercent = (change / currentPrice) * 100;
            
            this.tickerData.push({
                symbol: asset,
                price: currentPrice,
                change: change,
                changePercent: changePercent
            });
        });
        
        this.updateTicker();
    }
    
    updateTicker() {
        const tickerContainer = document.getElementById('ticker-scroll');
        
        // Create seamless ticker by duplicating items
        const allItems = [...this.tickerData, ...this.tickerData]; // Duplicate for seamless loop
        tickerContainer.innerHTML = '';
        
        allItems.forEach(item => {
            const tickerItem = document.createElement('div');
            tickerItem.className = 'ticker-item';
            
            const changeClass = item.change >= 0 ? 'positive' : 'negative';
            const arrow = item.change >= 0 ? '▲' : '▼';
            
            tickerItem.innerHTML = `
                <span class="ticker-symbol">${item.symbol}</span>
                <span class="ticker-price">$${item.price.toFixed(2)}</span>
                <span class="ticker-change ${changeClass}">${arrow} ${Math.abs(item.changePercent).toFixed(2)}%</span>
            `;
            
            tickerContainer.appendChild(tickerItem);
        });
    }
    
    startDataUpdates() {
        // Update market data every 5 seconds
        this.updateInterval = setInterval(() => {
            // Only update if no specific timeframe is selected
            if (!this.userSelectedTimeframe || this.currentTimeframe === '1d') {
                this.updateMarketData();
            }
            this.updateTicker();
            this.updateStats();
        }, 5000);
        
        // Update ticker animation
        this.tickerInterval = setInterval(() => {
            this.updateTicker();
        }, 30000);
        
        // Update market prices every 2 seconds - but only if no specific timeframe is selected
        this.marketPriceInterval = setInterval(() => {
            if (!this.userSelectedTimeframe || this.currentTimeframe === '1d') {
                this.updateMarketPrices();
            }
        }, 2000);
    }
    
    updateMarketData() {
        Object.keys(this.marketData).forEach(asset => {
            const data = this.marketData[asset];
            const lastPrice = data[data.length - 1].price;
            const newPrice = lastPrice + (Math.random() - 0.5) * lastPrice * 0.02;
            
            data.push({
                time: new Date().toISOString(),
                price: newPrice,
                volume: Math.random() * 1000000
            });
            
            // Keep only last 100 data points
            if (data.length > 100) {
                data.shift();
            }
        });
        
        // Only update chart if no specific timeframe is selected (to avoid conflicts)
        if (this.currentBot && (!this.userSelectedTimeframe || this.currentTimeframe === '1d')) {
            this.updateChart();
        }
    }
    
    updateChart() {
        if (!this.currentBot || !this.chart) return;
        
        const asset = this.bots[this.currentBot].asset;
        
        // If a specific timeframe is selected, use that instead of default market data
        if (this.currentTimeframe && this.currentTimeframe !== '1d') {
            this.updateChartForTimeframe(this.currentTimeframe);
            return;
        }
        
        const data = this.marketData[asset];
        
        if (!data) return;
        
        // Check if chart data is already up to date
        const currentDataLength = this.chart.data.datasets[0]?.data?.length || 0;
        if (currentDataLength === data.length && this.chart.data.labels.length > 0) {
            // Data is already up to date, only update if there are new trades
            const stored = this.botTrades[this.currentBot] || [];
            if (stored.length === 0) {
                return; // No new trades, no need to update
            }
        }
        
        const labels = data.map(d => new Date(d.time).toLocaleTimeString());
        const prices = data.map(d => d.price);
        
        // Simulate buy/sell signals
        const buySignals = [];
        const sellSignals = [];
        
        for (let i = 1; i < prices.length; i++) {
            if (Math.random() < 0.05) { // 5% chance of signal
                if (prices[i] > prices[i-1]) {
                    buySignals.push({ x: i, y: prices[i] });
                } else {
                    sellSignals.push({ x: i, y: prices[i] });
                }
            }
        }
        
        // Merge stored bot trades as markers
        const stored = this.botTrades[this.currentBot] || [];
        const storedBuys = stored.filter(t => t.type === 'BUY').map(t => ({ x: t.index ?? prices.length - 1, y: t.price }));
        const storedSells = stored.filter(t => t.type === 'SELL').map(t => ({ x: t.index ?? prices.length - 1, y: t.price }));
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        this.chart.data.datasets[1].data = [...buySignals, ...storedBuys];
        this.chart.data.datasets[2].data = [...sellSignals, ...storedSells];
        
        this.chart.update('none');
    }

    annotateChartEvent(eventType, asset) {
        if (!this.chart) return;
        const lastIdx = this.chart.data.labels.length - 1;
        if (lastIdx < 0) return;
        const price = this.chart.data.datasets[0].data[lastIdx];
        if (price == null) return;
        const point = { x: lastIdx, y: price };
        if (eventType === 'START') {
            this.chart.data.datasets[1].data.push(point);
        } else if (eventType === 'PAUSE') {
            this.chart.data.datasets[2].data.push(point);
        }
        this.chart.update('none');
    }
    
    updateStats() {
        // Simulate trading activity
        if (Math.random() < 0.1) { // 10% chance of trade
            const tradeAmount = (Math.random() - 0.5) * 1000;
            this.stats.totalPnl += tradeAmount;
            this.stats.dailyPnl += tradeAmount;
            
            if (tradeAmount > 0) {
                this.stats.winningTrades++;
            }
            this.stats.totalTrades++;
            
            this.stats.winRate = this.stats.totalTrades > 0 ? 
                (this.stats.winningTrades / this.stats.totalTrades) * 100 : 0;
        }
        
        // Update UI
        document.getElementById('total-pnl').textContent = 
            `$${this.stats.totalPnl.toFixed(2)}`;
        document.getElementById('daily-pnl').textContent = 
            `$${this.stats.dailyPnl.toFixed(2)}`;
        document.getElementById('active-positions').textContent = 
            this.stats.activePositions.toString();
        document.getElementById('win-rate').textContent = 
            `${this.stats.winRate.toFixed(1)}%`;
        
        // Update styling based on values
        const totalPnlEl = document.getElementById('total-pnl');
        const dailyPnlEl = document.getElementById('daily-pnl');
        
        totalPnlEl.className = `stat-value ${this.stats.totalPnl >= 0 ? 'positive' : 'negative'}`;
        dailyPnlEl.className = `stat-value ${this.stats.dailyPnl >= 0 ? 'positive' : 'negative'}`;
    }
    
    selectBot(botId) {
        if (!botId) {
            this.currentBot = null;
            const botConfigEl = document.getElementById('bot-config');
            if (botConfigEl) botConfigEl.style.display = 'none';
            
            // Clear market display when no bot is selected
            const marketDisplay = document.getElementById('market-display');
            if (marketDisplay) {
                marketDisplay.textContent = 'Select a market or bot to view';
            }
            return;
        }
        
        this.currentBot = botId;
        const bot = this.bots[botId];
        if (!bot) return;
        
        // Update configuration UI - check if elements exist first
        const assetSelectorEl = document.getElementById('asset-selector');
        if (assetSelectorEl) assetSelectorEl.value = bot.asset;
        
        const botConfigEl = document.getElementById('bot-config');
        if (botConfigEl) botConfigEl.style.display = 'block';
        
        // Update market display to show selected bot and its market
        const marketDisplay = document.getElementById('market-display');
        if (marketDisplay) {
            // Get the market name from the asset symbol
            const marketName = this.getMarketNameFromSymbol(bot.asset);
            marketDisplay.textContent = `Bot: ${bot.name} - ${marketName} (${bot.asset})`;
        }
        
        // Set current market display for chart
        this.currentMarketDisplay = {
            symbol: bot.asset,
            name: this.getMarketNameFromSymbol(bot.asset),
            type: this.getMarketType(bot.asset)
        };
        
        // Update chart with bot's market data
        this.updateChartForSelectedBot();
        
        // Bot stats are now shown in the unified market display above
        
        this.addAlert('info', 'Bot Selected', `Selected ${bot.name} for ${bot.asset}`);
    }
    
    startBot() {
        if (!this.currentBot) {
            this.showAlert('No Bot Selected', 'Please select a bot first.');
            return;
        }
        
        const bot = this.bots[this.currentBot];
        bot.active = true;
        
        this.updateBotStatus();
        this.addAlert('success', 'Bot Started', `${bot.name} is now active`);
        
        // Simulate bot activity
        this.simulateBotActivity();
        this.annotateChartEvent('START', bot.asset);
        this.renderActiveBots();
    }
    
    pauseBot() {
        if (!this.currentBot) {
            this.showAlert('No Bot Selected', 'Please select a bot first.');
            return;
        }
        
        const bot = this.bots[this.currentBot];
        bot.active = false;
        
        this.updateBotStatus();
        this.addAlert('warning', 'Bot Paused', `${bot.name} has been paused`);
        this.annotateChartEvent('PAUSE', bot.asset);
        this.renderActiveBots();
    }
    
    deactivateBot(botId) {
        if (!botId || !this.bots[botId]) {
            this.addAlert('error', 'Invalid Bot', 'Bot not found');
            return;
        }
        
        const bot = this.bots[botId];
        bot.active = false;
        
        // Stop any ongoing simulation for this bot
        if (this.botIntervals && this.botIntervals[botId]) {
            clearInterval(this.botIntervals[botId]);
            delete this.botIntervals[botId];
        }
        
        this.updateBotStatus();
        this.addAlert('info', 'Bot Deactivated', `${bot.name} has been deactivated`);
        this.renderActiveBots();
        
        // If this was the currently selected bot, clear the selection
        if (this.currentBot === botId) {
            this.currentBot = null;
            const botConfigEl = document.getElementById('bot-config');
            if (botConfigEl) botConfigEl.style.display = 'none';
        }
    }
    
    resetBot() {
        if (!this.currentBot) {
            this.showAlert('No Bot Selected', 'Please select a bot first.');
            return;
        }
        
        const bot = this.bots[this.currentBot];
        bot.active = false;
        
        // Reset bot configuration
        document.getElementById('asset-selector').value = bot.asset;
        document.getElementById('frequency-selector').value = 'realtime';
        document.getElementById('risk-selector').value = 'medium';
        
        this.updateBotStatus();
        this.addAlert('info', 'Bot Reset', `${bot.name} has been reset to default settings`);
    }
    
    updateBotStatus() {
        const startBtn = document.getElementById('start-bot');
        const pauseBtn = document.getElementById('pause-bot');
        
        if (this.currentBot && this.bots[this.currentBot].active) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Running';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        }
    }
    
    updateBotConfig(key, value) {
        if (!this.currentBot) return;
        
        this.bots[this.currentBot][key] = value;
        this.addAlert('info', 'Configuration Updated', `${key} set to ${value}`);
    }
    
    updateRiskConfig(key, value) {
        this.addAlert('info', 'Risk Settings Updated', `${key} set to ${value}`);
    }
    
    updateTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        this.userSelectedTimeframe = true; // Mark as user-selected
        this.addAlert('info', 'Timeframe Updated', `Chart timeframe set to ${timeframe}`);
        
        // Update the dropdown value to reflect the selection
        const timeframeSelector = document.getElementById('timeframe-selector');
        if (timeframeSelector) {
            timeframeSelector.value = timeframe;
        }
        
        // Stop all automatic updates when user selects a specific timeframe
        this.stopAutomaticUpdates();
        
        // Update chart with new timeframe data
        this.updateChartForTimeframe(timeframe);
    }
    
    stopAutomaticUpdates() {
        // Clear all intervals to prevent any automatic updates
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.tickerInterval) {
            clearInterval(this.tickerInterval);
            this.tickerInterval = null;
        }
        if (this.marketPriceInterval) {
            clearInterval(this.marketPriceInterval);
            this.marketPriceInterval = null;
        }
    }
    
    resumeAutomaticUpdates() {
        // Only resume if no specific timeframe is selected
        if (!this.userSelectedTimeframe || this.currentTimeframe === '1d') {
            this.startDataUpdates();
        }
    }
    
    toggleSimulationMode() {
        this.isSimulationMode = !this.isSimulationMode;
        const btn = document.getElementById('sim-mode');
        
        if (this.isSimulationMode) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-flask"></i> Live Mode';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-flask"></i> Simulation Mode';
        }
        
        this.addAlert('info', 'Mode Changed', 
            this.isSimulationMode ? 'Switched to simulation mode' : 'Switched to live mode');
    }
    
    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        const body = document.body;
        const themeIcon = document.querySelector('#theme-toggle i');
        
        if (this.isDarkTheme) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeIcon.className = 'fas fa-moon';
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeIcon.className = 'fas fa-sun';
        }
    }
    
    addAlert(type, title, message) {
        const alertsContainer = document.getElementById('alerts-container');
        const alertId = Date.now();
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${type} fade-in`;
        alertElement.id = `alert-${alertId}`;
        
        const iconMap = {
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
            danger: 'fas fa-exclamation-circle',
            success: 'fas fa-check-circle'
        };
        
        alertElement.innerHTML = `
            <i class="alert-icon ${iconMap[type]}"></i>
            <div class="alert-content">
                <div class="alert-title">${title}</div>
                <div class="alert-message">${message}</div>
                <div class="alert-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
        
        // Keep only last 10 alerts
        const alerts = alertsContainer.querySelectorAll('.alert-item');
        if (alerts.length > 10) {
            alerts[alerts.length - 1].remove();
        }
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            const alert = document.getElementById(`alert-${alertId}`);
            if (alert) {
                alert.remove();
            }
        }, 10000);
    }

    prefetchPopularTimeframes(symbol = null, skip = null) {
        const sym = symbol || (this.currentMarketDisplay && this.currentMarketDisplay.symbol);
        if (!sym) return;
        const popular = ['1d','1w','1m'];
        popular.forEach(tf => {
            if (skip && tf === skip) return;
            const has = this.timeframeCache[sym] && this.timeframeCache[sym][tf] && this.timeframeCache[sym][tf].length;
            if (has) return;
            fetch(`/api/market-data/${encodeURIComponent(sym)}/timeframe?timeframe=${encodeURIComponent(tf)}`)
                .then(r => r.json())
                .then(data => {
                    if (!Array.isArray(data) || !data.length) return;
                    this.timeframeCache[sym] = this.timeframeCache[sym] || {};
                    this.timeframeCache[sym][tf] = data;
                })
                .catch(() => {});
        });
    }
    
    showAlert(title, message) {
        document.getElementById('alert-title').textContent = title;
        document.getElementById('alert-message').textContent = message;
        document.getElementById('alert-modal').classList.add('show');
    }
    
    hideModal() {
        document.getElementById('alert-modal').classList.remove('show');
    }
    
    exportData() {
        const data = {
            bots: this.bots,
            stats: this.stats,
            marketData: this.marketData,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atb-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.addAlert('success', 'Data Exported', 'Trading data has been exported successfully');
    }
    
    simulateBotActivity() {
        if (!this.currentBot || !this.bots[this.currentBot].active) return;
        
        // Simulate trading signals
        if (Math.random() < 0.2) { // 20% chance of trade
            const bot = this.bots[this.currentBot];
            const asset = bot.asset;
            const data = this.marketData[asset];
            const currentPrice = data[data.length - 1].price;
            
            const tradeType = Math.random() < 0.5 ? 'BUY' : 'SELL';
            const quantity = Math.floor(Math.random() * 10) + 1;
            
            this.addAlert('info', 'Trade Executed', 
                `${bot.name} ${tradeType} ${quantity} ${asset} @ $${currentPrice.toFixed(2)}`);
            // Store trade for bot
            if (!this.botTrades[this.currentBot]) this.botTrades[this.currentBot] = [];
            this.botTrades[this.currentBot].push({ type: tradeType, index: (this.chart?.data?.labels?.length ?? 1) - 1, price: currentPrice, timestamp: Date.now() });
            // Update chart markers immediately
            this.updateChart();
            // Update P&L metrics
            this.updateBotPnL(this.currentBot, tradeType, quantity, currentPrice);
            this.persistBotState();
        }
        
        // Continue simulation if bot is still active
        if (this.bots[this.currentBot].active) {
            const intervalId = setTimeout(() => this.simulateBotActivity(), 10000 + Math.random() * 20000);
            this.botIntervals[this.currentBot] = intervalId;
        }
    }
    
    setupWebSocket() {
        // Simulate WebSocket connection
        this.updateConnectionStatus('online');
        
        // In a real implementation, this would connect to your WebSocket server
        // this.websocket = new WebSocket('ws://localhost:8080/ws');
    }
    
    updateConnectionStatus(status) {
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        
        indicator.className = `status-indicator ${status}`;
        text.textContent = status === 'online' ? 'Online' : 'Offline';
    }
    
    updateUI() {
        this.updateBotStatus();
        this.updateLastUpdateTime();
        this.renderActiveBots();
        this.updateAccountUI();
        this.renderBankAssets();
        
        // Auto-select the last bot (Ethereum) by default if no bot is selected
        if (!this.currentBot) {
            const lastBotId = 'bot7'; // Ethereum bot
            if (this.bots[lastBotId]) {
                this.selectBot(lastBotId);
                // Update the bot selector dropdown to reflect the selection
                const botSelector = document.getElementById('bot-selector');
                if (botSelector) {
                    botSelector.value = lastBotId;
                }
            }
        }
        
        // Ensure timeframe dropdown reflects the default 1h selection
        const timeframeSelector = document.getElementById('timeframe-selector');
        if (timeframeSelector && this.currentTimeframe) {
            timeframeSelector.value = this.currentTimeframe;
        }
        
        // Update last update time every second
        setInterval(() => {
            this.updateLastUpdateTime();
        }, 1000);
    }

    updateBotPnL(botId, tradeType, qty, price) {
        const m = this.botMetrics[botId] || { qty: 0, avgCost: 0, realizedPnl: 0, dailyRealized: 0, lastReset: new Date().toDateString() };
        const today = new Date().toDateString();
        if (m.lastReset !== today) { m.dailyRealized = 0; m.lastReset = today; }
        if (tradeType === 'BUY') {
            const totalCost = m.avgCost * m.qty + price * qty;
            m.qty += qty;
            m.avgCost = m.qty > 0 ? totalCost / m.qty : 0;
        } else if (tradeType === 'SELL') {
            const sellQty = Math.min(qty, m.qty);
            const pnl = (price - m.avgCost) * sellQty;
            m.qty -= sellQty;
            if (m.qty === 0) m.avgCost = 0;
            m.realizedPnl += pnl;
            m.dailyRealized += pnl;
        }
        this.botMetrics[botId] = m;
        this.renderActiveBots();
        if (this.currentBot === botId) this.updateSelectedBotHeader();
    }

    updateSelectedBotHeader() {
        const botId = this.currentBot;
        if (!botId) return;
        const bot = this.bots[botId];
        const m = this.botMetrics[botId] || { qty: 0, avgCost: 0, realizedPnl: 0, dailyRealized: 0 };
        const allocation = this.botAllocations[botId] || 0;
        const asset = bot.asset;
        const data = this.marketData[asset];
        const lastPrice = data && data.length ? data[data.length - 1].price : 0;
        const unrealized = m.qty > 0 ? (lastPrice - m.avgCost) * m.qty : 0;
        const total = allocation + m.realizedPnl + unrealized;
        const baseline = Math.max(allocation, 1e-9);
        const pct = ((total - allocation) / baseline) * 100;
        const arrow = pct > 0 ? '▲' : (pct < 0 ? '▼' : '•');
        // Bot stats are now shown in the unified market display
    }

    persistBotState() {
        try {
            const state = { botTrades: this.botTrades, botMetrics: this.botMetrics };
            localStorage.setItem('atb_bot_state', JSON.stringify(state));
            fetch('/api/bots/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) })
                .catch(() => {});
        } catch (e) {}
    }

    restoreBotState() {
        try {
            const raw = localStorage.getItem('atb_bot_state');
            if (!raw) return;
            const state = JSON.parse(raw);
            this.botTrades = state.botTrades || {};
            this.botMetrics = state.botMetrics || {};
        } catch (e) {}
    }

    restoreBacktestConfigs() {
        try {
            const raw = localStorage.getItem('atb_backtest_configs');
            if (!raw) return;
            this.backtestConfigs = JSON.parse(raw) || {};
        } catch (e) {}
    }

    restoreBacktestConfigToUi(botId) {
        const cfg = this.backtestConfigs && this.backtestConfigs[botId];
        if (!cfg) return;
        const typeEl = document.getElementById('strategy-type');
        const p1El = document.getElementById('param1');
        const p2El = document.getElementById('param2');
        const p3El = document.getElementById('param3');
        if (typeEl && cfg.type) typeEl.value = cfg.type;
        if (p1El && typeof cfg.p1 === 'number') p1El.value = cfg.p1;
        if (p2El && typeof cfg.p2 === 'number') p2El.value = cfg.p2;
        if (p3El && typeof cfg.p3 === 'number') p3El.value = cfg.p3;
    }

    async syncBotStateFromServer() {
        try {
            const resp = await fetch('/api/bots/state');
            if (!resp.ok) return;
            const state = await resp.json();
            if (state && typeof state === 'object') {
                this.botTrades = state.botTrades || this.botTrades;
                this.botMetrics = state.botMetrics || this.botMetrics;
            }
        } catch (e) {}
    }

    showBankModal() {
        const modal = document.getElementById('bank-modal');
        if (!modal) return;
        this.renderBankAssets();
        this.refreshBankMarketValues();
        modal.classList.add('show');
    }

    renderBankAssets() {
        const list = document.getElementById('bank-assets-list');
        if (!list) return;
        list.innerHTML = '';
        this.bankAssets.forEach(asset => {
            const row = document.createElement('div');
            row.className = 'stat-item';
            const qr = this.generateQRCodeData(`ref:${asset.ref}`);
            row.innerHTML = `
                <div class="text-left">
                    <div class="stat-label">${asset.name}</div>
                    <div class="stat-label">Ref: ${asset.ref}</div>
                    <div class="stat-label">Qty: <span data-bank-qty="${asset.id}">${asset.qty}</span></div>
                </div>
                <div class="text-right">
                    <div class="stat-value" data-bank-value="${asset.id}">$${(asset.value).toFixed(2)}</div>
                    <div class="stat-label" data-bank-total="${asset.id}">$${(asset.value * asset.qty).toFixed(2)}</div>
                    <img alt="qr" src="${qr}" style="width:64px;height:64px;border:1px solid var(--border-primary);border-radius:4px;background:white;" />
                </div>
            `;
            row.addEventListener('click', () => this.loadBankAssetForm(asset));
            list.appendChild(row);
        });
    }

    async refreshBankMarketValues() {
        // For crypto or market-like assets, update current value via backend endpoints
        for (const asset of this.bankAssets) {
            const isMarket = /crypto|btc|eth|usd|stock|coin|token/i.test(asset.name + ' ' + asset.ref);
            if (!isMarket) continue;
            try {
                // Try to infer a ticker from ref or name; fallback to BTC-USD for demo
                const symbol = /BTC|BTC-USD/i.test(asset.name + ' ' + asset.ref) ? 'BTC-USD' : (/ETH/i.test(asset.name + ' ' + asset.ref) ? 'ETH-USD' : 'AAPL');
                const resp = await fetch(`/api/market-data/${encodeURIComponent(symbol)}`);
                if (resp.ok) {
                    const data = await resp.json();
                    const latest = Array.isArray(data) && data.length ? data[data.length - 1] : null;
                    if (latest && typeof latest.price === 'number') {
                        asset.value = latest.price;
                        const valEl = document.querySelector(`[data-bank-value="${asset.id}"]`);
                        const qtyEl = document.querySelector(`[data-bank-qty="${asset.id}"]`);
                        const totEl = document.querySelector(`[data-bank-total="${asset.id}"]`);
                        if (valEl) valEl.textContent = `$${latest.price.toFixed(2)}`;
                        const qty = qtyEl ? parseFloat(qtyEl.textContent) || asset.qty : asset.qty;
                        if (totEl) totEl.textContent = `$${(latest.price * qty).toFixed(2)}`;
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    }

    async showCurrencyModal() {
        const modal = document.getElementById('currency-modal');
        if (!modal) return;
        modal.classList.add('show');
        await this.renderTopCryptos();
    }

    async renderTopCryptos() {
        const container = document.getElementById('top-cryptos');
        if (!container) return;
        container.innerHTML = '';
        const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'ADA-USD'];
        for (const sym of symbols) {
            try {
                const resp = await fetch(`/api/market-data/${encodeURIComponent(sym)}`);
                if (resp.ok) {
                    const data = await resp.json();
                    const latest = Array.isArray(data) && data.length ? data[data.length - 1] : null;
                    const price = latest ? latest.price : 0;
                    const item = document.createElement('div');
                    item.className = 'stat-item';
                    item.innerHTML = `<span class="stat-label">${sym}</span><span class="stat-value">$${price.toFixed(2)}</span>`;
                    container.appendChild(item);
                }
            } catch (e) {
                // ignore
            }
        }
    }

    loadBankAssetForm(asset) {
        document.getElementById('bank-asset-name').value = asset.name;
        document.getElementById('bank-asset-ref').value = asset.ref;
        document.getElementById('bank-asset-qty').value = asset.qty;
        document.getElementById('bank-asset-value').value = asset.value;
        this.currentBankAssetId = asset.id;
    }

    addBankAsset() {
        const name = document.getElementById('bank-asset-name').value.trim();
        const ref = document.getElementById('bank-asset-ref').value.trim();
        const qty = parseInt(document.getElementById('bank-asset-qty').value) || 0;
        const value = parseFloat(document.getElementById('bank-asset-value').value) || 0;
        if (!name || !ref || qty <= 0 || value < 0) {
            this.addAlert('warning', 'Invalid Asset', 'Please fill all asset fields');
            return;
        }
        const id = `bank_${Date.now()}`;
        this.bankAssets.push({ id, name, ref, qty, value });
        this.renderBankAssets();
        this.addAlert('success', 'Asset Added', `${name} added to bank`);
    }

    updateBankAsset() {
        if (!this.currentBankAssetId) {
            this.addAlert('warning', 'No Selection', 'Select an asset to update');
            return;
        }
        const idx = this.bankAssets.findIndex(a => a.id === this.currentBankAssetId);
        if (idx === -1) return;
        const name = document.getElementById('bank-asset-name').value.trim();
        const ref = document.getElementById('bank-asset-ref').value.trim();
        const qty = parseInt(document.getElementById('bank-asset-qty').value) || 0;
        const value = parseFloat(document.getElementById('bank-asset-value').value) || 0;
        this.bankAssets[idx] = { id: this.currentBankAssetId, name, ref, qty, value };
        this.renderBankAssets();
        this.addAlert('success', 'Asset Updated', `${name} updated`);
    }

    deleteBankAsset() {
        if (!this.currentBankAssetId) {
            this.addAlert('warning', 'No Selection', 'Select an asset to delete');
            return;
        }
        this.bankAssets = this.bankAssets.filter(a => a.id !== this.currentBankAssetId);
        this.currentBankAssetId = null;
        this.renderBankAssets();
        this.addAlert('success', 'Asset Deleted', `Asset removed from bank`);
    }

    exportBankCSV() {
        const headers = ['id', 'name', 'ref', 'qty', 'value'];
        const rows = this.bankAssets.map(a => [a.id, a.name, a.ref, a.qty, a.value]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `digital_bank_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.addAlert('success', 'Bank Exported', 'Digital bank exported to CSV');
    }

    generateQRCodeData(text) {
        if (typeof QRCode !== 'undefined') {
            const temp = document.createElement('div');
            new QRCode(temp, { text, width: 128, height: 128, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
            const img = temp.querySelector('img') || temp.querySelector('canvas');
            if (img && img.toDataURL) return img.toDataURL('image/png');
            if (img && img.src) return img.src;
        }
        // Fallback: data URL placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128; const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 128, 128); ctx.fillStyle = '#000'; ctx.fillRect(8,8,16,16); ctx.fillRect(104,8,16,16); ctx.fillRect(8,104,16,16);
        return canvas.toDataURL('image/png');
    }

    showAccountModal() {
        const modal = document.getElementById('account-modal');
        if (!modal) return;
        this.populateAccountBotSelect();
        this.updateAccountUI();
        modal.classList.add('show');
    }

    populateAccountBotSelect() {
        const sel = document.getElementById('transfer-bot');
        if (!sel) return;
        sel.innerHTML = '';
        Object.entries(this.bots).forEach(([botId, bot]) => {
            const opt = document.createElement('option');
            opt.value = botId;
            opt.textContent = `${bot.name} (${bot.asset})`;
            sel.appendChild(opt);
        });
    }

    updateAccountUI() {
        const mainBal = document.getElementById('account-balance-main');
        const avail = document.getElementById('available-funds-main');
        if (mainBal) mainBal.textContent = `$${this.accountMain.toFixed(2)}`;
        if (avail) avail.textContent = `$${this.availableFunds.toFixed(2)}`;
        const list = document.getElementById('bot-allocations-list');
        if (list) {
            list.innerHTML = '';
            Object.entries(this.bots).forEach(([botId, bot]) => {
                const amt = this.botAllocations[botId] || 0;
                const item = document.createElement('div');
                item.className = 'stat-item';
                item.innerHTML = `<span class="stat-label">${bot.name}</span><span class="stat-value">$${amt.toFixed(2)}</span>`;
                list.appendChild(item);
            });
        }
    }

    depositFunds() {
        const amt = parseFloat(document.getElementById('deposit-amount').value) || 0;
        if (amt <= 0) return;
        this.accountMain += amt;
        this.availableFunds += amt;
        this.updateAccountUI();
        this.addAlert('success', 'Deposit', `Deposited $${amt.toFixed(2)} to account`);
    }

    transferToBot() {
        const sel = document.getElementById('transfer-bot');
        const amt = parseFloat(document.getElementById('transfer-amount').value) || 0;
        if (!sel || !sel.value || amt <= 0) return;
        if (amt > this.availableFunds) {
            this.addAlert('warning', 'Insufficient Funds', 'Not enough available funds');
            return;
        }
        this.availableFunds -= amt;
        this.botAllocations[sel.value] = (this.botAllocations[sel.value] || 0) + amt;
        this.updateAccountUI();
        this.addAlert('success', 'Transfer', `Transferred $${amt.toFixed(2)} to ${this.bots[sel.value].name}`);
    }

    withdrawFromBot() {
        const sel = document.getElementById('transfer-bot');
        const amt = parseFloat(document.getElementById('transfer-amount').value) || 0;
        if (!sel || !sel.value || amt <= 0) return;
        const allocated = this.botAllocations[sel.value] || 0;
        if (amt > allocated) {
            this.addAlert('warning', 'Insufficient Allocation', 'Not enough allocated to withdraw');
            return;
        }
        this.botAllocations[sel.value] = allocated - amt;
        this.availableFunds += amt;
        this.updateAccountUI();
        this.addAlert('success', 'Withdrawal', `Withdrew $${amt.toFixed(2)} from ${this.bots[sel.value].name}`);
    }

    renderActiveBots() {
        const container = document.getElementById('active-bots-container');
        if (!container) return;
        container.innerHTML = '';
        Object.entries(this.bots).forEach(([botId, bot]) => {
            const botWrapper = document.createElement('div');
            botWrapper.className = 'bot-item-wrapper';
            botWrapper.style.display = 'flex';
            botWrapper.style.alignItems = 'center';
            botWrapper.style.gap = '8px';
            botWrapper.style.marginBottom = '8px';
            
            // Create status indicator button (clickable for activate/deactivate)
            const statusBtn = document.createElement('button');
            statusBtn.className = 'status-indicator-btn';
            statusBtn.style.background = 'none';
            statusBtn.style.border = 'none';
            statusBtn.style.padding = '4px';
            statusBtn.style.cursor = 'pointer';
            statusBtn.style.borderRadius = '50%';
            statusBtn.style.display = 'flex';
            statusBtn.style.alignItems = 'center';
            statusBtn.style.justifyContent = 'center';
            statusBtn.style.transition = 'all 0.2s ease';
            
            const dotClass = bot.active ? 'online' : 'offline';
            statusBtn.innerHTML = `<span class="status-dot ${dotClass}"></span>`;
            statusBtn.title = bot.active ? 'Click to deactivate bot' : 'Click to activate bot';
            
            // Add hover effect
            statusBtn.addEventListener('mouseenter', () => {
                statusBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            statusBtn.addEventListener('mouseleave', () => {
                statusBtn.style.backgroundColor = 'transparent';
            });
            
            // Status indicator click handler
            statusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (bot.active) {
                    if (confirm(`Are you sure you want to deactivate ${bot.name}?`)) {
                        this.deactivateBot(botId);
                    }
                } else {
                    this.currentBot = botId;
                    this.startBot();
                }
            });
            
            // Create main bot info button
            const btn = document.createElement('button');
            btn.className = 'active-bot-btn';
            const m = this.botMetrics[botId] || { qty: 0, avgCost: 0, realizedPnl: 0 };
            const allocation = this.botAllocations[botId] || 0;
            const asset = bot.asset;
            const data = this.marketData[asset];
            const lastPrice = data && data.length ? data[data.length - 1].price : 0;
            const unrealized = m.qty > 0 ? (lastPrice - m.avgCost) * m.qty : 0;
            const total = allocation + m.realizedPnl + unrealized;
            const pct = allocation > 0 ? ((total - allocation) / allocation) * 100 : 0;
            const pnlClass = pct > 0 ? 'positive' : (pct < 0 ? 'negative' : 'neutral');
            const arrow = pct > 0 ? '▲' : (pct < 0 ? '▼' : '•');
            
            btn.innerHTML = `
                <div class="bot-name">${bot.name}</div>
                <div class="bot-asset">${asset}</div>
                <div class="bot-status">
                    <span class="status-dot ${bot.active ? 'online' : 'offline'}"></span>
                    <span>${bot.active ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="bot-pnl ${pnlClass}">${arrow} ${Math.abs(pct).toFixed(1)}%</div>
            `;
            btn.title = 'Click to select bot, Right-click for management';
            btn.style.flex = '1';
            btn.addEventListener('click', () => {
                const selector = document.getElementById('bot-selector');
                if (selector) selector.value = botId;
                this.selectBot(botId); // only update main graph and header
            });
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showBotManagement(botId);
            });
            
            botWrapper.appendChild(statusBtn);
            botWrapper.appendChild(btn);
            container.appendChild(botWrapper);
        });
    }
    
    updateLastUpdateTime() {
        document.getElementById('last-update').textContent = 
            `Update: ${new Date().toLocaleTimeString()}`;
    }
    
    // Zoom functionality
    updateZoom(level) {
        this.zoomLevel = level;
        document.getElementById('zoom-value').textContent = `${Math.round(level * 100)}%`;
        
        const chartContainer = document.querySelector('.chart-container');
        chartContainer.style.transform = `scale(${level})`;
        chartContainer.classList.add('zoomed');
        
        this.addAlert('info', 'Chart Zoom', `Zoom level set to ${Math.round(level * 100)}%`);
    }
    
    // Theme customization
    showThemeModal() {
        document.getElementById('theme-modal').classList.add('show');
    }
    
    // Legal modal
    showLegalModal() {
        const modal = document.getElementById('legal-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    hideLegalModal() {
        const modal = document.getElementById('legal-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    applyPresetTheme(themeName) {
        const themes = {
            'black-gold': {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#1a1a1a',
                '--bg-tertiary': '#2a2a2a',
                '--bg-card': '#1e1e1e',
                '--bg-hover': '#333333',
                '--bg-ticker': '#3a3a3a',
                '--gold-primary': '#ffd700',
                '--gold-secondary': '#ffed4e',
                '--gold-dark': '#b8860b',
                '--gold-light': '#fff8dc',
                '--text-primary': '#ffffff',
                '--text-secondary': '#cccccc',
                '--text-muted': '#888888',
                '--border-primary': '#444444',
                '--border-secondary': '#666666',
                '--border-gold': '#ffd700',
                '--gradient-start': '#0a0a0a',
                '--gradient-end': '#1e1e1e'
            },
            'sunrise': {
                '--bg-primary': '#1a0f0a',
                '--bg-secondary': '#2e1a0f',
                '--bg-tertiary': '#3e2a14',
                '--bg-card': '#3a1e0a',
                '--bg-hover': '#4a2f1a',
                '--bg-ticker': '#5a3a2a',
                '--gold-primary': '#ff8c00',
                '--gold-secondary': '#ffa500',
                '--gold-dark': '#ff6600',
                '--gold-light': '#ffcc80',
                '--text-primary': '#ffffff',
                '--text-secondary': '#ffd9b3',
                '--text-muted': '#ffb366',
                '--border-primary': '#4a3a2a',
                '--border-secondary': '#5a4a3a',
                '--border-gold': '#ff8c00',
                '--gradient-start': '#1a0f0a',
                '--gradient-end': '#3a1e0a'
            },
            'neon': {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#1a0a1a',
                '--bg-tertiary': '#2a0a2a',
                '--bg-card': '#1e0a1e',
                '--bg-hover': '#330a33',
                '--bg-ticker': '#3a0a3a',
                '--gold-primary': '#00ffff',
                '--gold-secondary': '#4dffff',
                '--gold-dark': '#00cccc',
                '--gold-light': '#b3ffff',
                '--text-primary': '#ffffff',
                '--text-secondary': '#ff00ff',
                '--text-muted': '#cc00cc',
                '--border-primary': '#3a0a3a',
                '--border-secondary': '#4a0a4a',
                '--border-gold': '#00ffff',
                '--gradient-start': '#0a0a0a',
                '--gradient-end': '#1e0a1e'
            },
            'purple-dark': {
                '--bg-primary': '#1a0a1a',
                '--bg-secondary': '#2e1a2e',
                '--bg-tertiary': '#3e2a3e',
                '--bg-card': '#3a1e3a',
                '--bg-hover': '#4a334a',
                '--bg-ticker': '#5a3a5a',
                '--gold-primary': '#ff4aff',
                '--gold-secondary': '#ff7aff',
                '--gold-dark': '#cc3acc',
                '--gold-light': '#ffccff',
                '--text-primary': '#ffffff',
                '--text-secondary': '#d9b3d9',
                '--text-muted': '#cc99cc',
                '--border-primary': '#4a3a4a',
                '--border-secondary': '#5a4a5a',
                '--border-gold': '#ff4aff',
                '--gradient-start': '#1a0a1a',
                '--gradient-end': '#3a1e3a'
            },
            'red-dark': {
                '--bg-primary': '#1a0a0a',
                '--bg-secondary': '#2e1a1a',
                '--bg-tertiary': '#3e2a2a',
                '--bg-card': '#3a1e1e',
                '--bg-hover': '#4a3333',
                '--bg-ticker': '#5a3a3a',
                '--gold-primary': '#ff4a4a',
                '--gold-secondary': '#ff7a7a',
                '--gold-dark': '#cc3a3a',
                '--gold-light': '#ffcccc',
                '--text-primary': '#ffffff',
                '--text-secondary': '#d9b3b3',
                '--text-muted': '#cc9999',
                '--border-primary': '#4a3a3a',
                '--border-secondary': '#5a4a4a',
                '--border-gold': '#ff4a4a',
                '--gradient-start': '#1a0a0a',
                '--gradient-end': '#3a1e1e'
            },
            'ocean': {
                '--bg-primary': '#0a1f2a',
                '--bg-secondary': '#0f2f3d',
                '--bg-tertiary': '#144657',
                '--bg-card': '#1e3a4a',
                '--bg-hover': '#2a4a5a',
                '--bg-ticker': '#3a5a7a',
                '--gold-primary': '#29b6f6',
                '--gold-secondary': '#4fc3f7',
                '--gold-dark': '#0288d1',
                '--gold-light': '#b3e5fc',
                '--text-primary': '#e3f2fd',
                '--text-secondary': '#b3e5fc',
                '--text-muted': '#81d4fa',
                '--border-primary': '#2a4a5a',
                '--border-secondary': '#3a5a6a',
                '--border-gold': '#29b6f6',
                '--gradient-start': '#0a1f2a',
                '--gradient-end': '#1e3a4a'
            },
            'sunset': {
                '--bg-primary': '#2a0a0a',
                '--bg-secondary': '#3d0f0f',
                '--bg-tertiary': '#571414',
                '--bg-card': '#4a1e1e',
                '--bg-hover': '#5a2f2f',
                '--bg-ticker': '#6a3a3a',
                '--gold-primary': '#ff8a65',
                '--gold-secondary': '#ffab91',
                '--gold-dark': '#ff7043',
                '--gold-light': '#ffccbc',
                '--text-primary': '#e1bee7',
                '--text-secondary': '#ce93d8',
                '--text-muted': '#ba68c8',
                '--border-primary': '#5a3a3a',
                '--border-secondary': '#6a4a4a',
                '--border-gold': '#ff8a65',
                '--gradient-start': '#2a0a0a',
                '--gradient-end': '#4a1e1e'
            },
            'forest': {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#0f3d2a',
                '--bg-tertiary': '#14573d',
                '--bg-card': '#1e3d2a',
                '--bg-hover': '#2a4d3a',
                '--bg-ticker': '#3a5d4a',
                '--gold-primary': '#9c27b0',
                '--gold-secondary': '#ba68c8',
                '--gold-dark': '#7b1fa2',
                '--gold-light': '#e1bee7',
                '--text-primary': '#e8f5e9',
                '--text-secondary': '#c8e6c9',
                '--text-muted': '#a5d6a7',
                '--border-primary': '#2a4d3a',
                '--border-secondary': '#3a5d4a',
                '--border-gold': '#9c27b0',
                '--gradient-start': '#0a0a0a',
                '--gradient-end': '#1e3d2a'
            }
        };
        
        const theme = themes[themeName];
        if (theme) {
            const root = document.documentElement;
            Object.entries(theme).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });
            
            // Update active preset button
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-theme="${themeName}"]`).classList.add('active');
            
            this.addAlert('success', 'Theme Applied', `${themeName.replace('-', ' ')} theme applied successfully`);
        }
    }
    
    applyCustomTheme() {
        const root = document.documentElement;
        const colorInputs = document.querySelectorAll('#theme-modal input[type="color"]');
        
        colorInputs.forEach(input => {
            const property = `--${input.id.replace('-', '-')}`;
            root.style.setProperty(property, input.value);
        });
        
        const fontSelector = document.getElementById('font-family-selector');
        if (fontSelector) {
            this.applyFontFamily(fontSelector.value);
        }
        
        this.addAlert('success', 'Custom Theme Applied', 'Your custom theme has been applied');
        this.hideModal();
    }

    applyFontFamily(fontFamily) {
        document.documentElement.style.setProperty('--font-family', fontFamily);
        this.addAlert('info', 'Font Updated', 'Font family changed');
    }
    
    resetTheme() {
        const root = document.documentElement;
        const defaultTheme = {
            '--bg-primary': '#0a0a0a',
            '--bg-secondary': '#1a1a1a',
            '--bg-tertiary': '#2a2a2a',
            '--gold-primary': '#ffd700',
            '--text-primary': '#ffffff',
            '--text-secondary': '#cccccc',
            '--success': '#28a745',
            '--warning': '#ffc107',
            '--danger': '#dc3545',
            '--info': '#17a2b8'
        };
        
        Object.entries(defaultTheme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
        
        // Reset color inputs
        document.getElementById('bg-primary').value = '#0a0a0a';
        document.getElementById('bg-secondary').value = '#1a1a1a';
        document.getElementById('accent-color').value = '#ffd700';
        document.getElementById('text-primary').value = '#ffffff';
        document.getElementById('success-color').value = '#28a745';
        document.getElementById('warning-color').value = '#ffc107';
        document.getElementById('danger-color').value = '#dc3545';
        document.getElementById('info-color').value = '#17a2b8';
        
        this.addAlert('info', 'Theme Reset', 'Theme has been reset to default');
    }
    
    // Live trading functionality
    toggleTradingMode(mode) {
        this.isLiveTrading = mode === 'live';
        const brokerLogin = document.getElementById('broker-login');
        const accountInfo = document.getElementById('account-info');
        
        if (this.isLiveTrading) {
            brokerLogin.style.display = 'block';
            accountInfo.style.display = 'none';
            this.addAlert('warning', 'Live Trading Mode', 'Please connect to a broker to enable live trading');
        } else {
            brokerLogin.style.display = 'none';
            accountInfo.style.display = 'block';
            this.addAlert('info', 'Simulation Mode', 'Switched to simulation mode');
        }
    }
    
    async connectBroker() {
        const broker = document.getElementById('broker-selector').value;
        const apiKey = document.getElementById('api-key').value;
        const apiSecret = document.getElementById('api-secret').value;
        
        if (!broker || !apiKey || !apiSecret) {
            this.addAlert('danger', 'Missing Information', 'Please fill in all broker connection fields');
            return;
        }
        
        try {
            // Simulate broker connection
            this.showLoadingOverlay();
            
            // In a real implementation, this would make an API call to verify credentials
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.brokerConnected = true;
            this.isLiveTrading = true;
            
            // Update connection status in toolbar
            this.updateConnectionStatus(true);
            
            // Update UI
            document.getElementById('broker-login').style.display = 'none';
            document.getElementById('account-info').style.display = 'block';
            
            // Update account balance (simulate real broker data)
            this.updateAccountBalance();
            
            this.hideLoadingOverlay();
            this.addAlert('success', 'Broker Connected', `Successfully connected to ${broker}`);
            
        } catch (error) {
            this.hideLoadingOverlay();
            this.updateConnectionStatus(false);
            this.addAlert('danger', 'Connection Failed', 'Failed to connect to broker. Please check your credentials.');
        }
    }
    
    async disconnectBroker() {
        try {
            this.brokerConnected = false;
            this.isLiveTrading = false;
            
            // Update connection status in toolbar
            this.updateConnectionStatus(false);
            
            // Update UI
            document.getElementById('broker-login').style.display = 'block';
            document.getElementById('account-info').style.display = 'none';
            
            this.addAlert('info', 'Broker Disconnected', 'Disconnected from broker');
            
        } catch (error) {
            this.addAlert('danger', 'Disconnect Failed', 'Failed to disconnect from broker');
        }
    }
    
    updateAccountBalance() {
        // Simulate real-time account updates
        if (this.brokerConnected) {
            // In a real implementation, this would fetch from broker API
            const balance = this.accountBalance + (Math.random() - 0.5) * 1000;
            const available = this.availableFunds + (Math.random() - 0.5) * 500;
            
            document.getElementById('account-balance').textContent = `$${balance.toFixed(2)}`;
            document.getElementById('available-funds').textContent = `$${available.toFixed(2)}`;
        }
    }
    
    showLoadingOverlay() {
        document.getElementById('loading-overlay').classList.add('show');
    }
    
    hideLoadingOverlay() {
        document.getElementById('loading-overlay').classList.remove('show');
    }
    
    hideModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    // Enhanced zoom functionality for time-based data
    updateTimeZoom(level) {
        this.zoomLevel = level;
        document.getElementById('zoom-value').textContent = `${Math.round(level * 100)}%`;
        
        // Update chart data based on zoom level
        this.updateChartDataForZoom();
        
        this.addAlert('info', 'Time Zoom', `Time zoom set to ${Math.round(level * 100)}%`);
    }
    
    updateChartDataForZoom() {
        if (!this.currentBot || !this.chart) return;
        
        const asset = this.bots[this.currentBot].asset;
        const data = this.marketData[asset];
        
        if (!data) return;
        
        // Calculate data points based on zoom level
        const totalPoints = data.length;
        const visiblePoints = Math.max(10, Math.floor(totalPoints / this.zoomLevel));
        const startIndex = Math.max(0, totalPoints - visiblePoints);
        
        const visibleData = data.slice(startIndex);
        const labels = visibleData.map(d => new Date(d.time).toLocaleTimeString());
        const prices = visibleData.map(d => d.price);
        
        // Update chart
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        this.chart.update('none');
    }
    
    // Graph color customization
    updateGraphColor(color) {
        this.graphColor = color;
        
        if (this.chart) {
            this.chart.data.datasets[0].borderColor = color;
            this.chart.data.datasets[0].backgroundColor = color + '20'; // Add transparency
            this.chart.update('none');
        }
        
        this.addAlert('info', 'Graph Color', `Graph color changed to ${color}`);
    }
    
    // Market search functionality
    async searchMarkets() {
        const searchTerm = document.getElementById('market-search')?.value.trim();
        if (!searchTerm) return;
        try {
            const resp = await fetch('/api/markets/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ search_term: searchTerm }) });
            if (resp.ok) {
                const data = await resp.json();
                const results = (data.results || []).map(r => ({ key: r.key || r.symbol, symbol: r.symbol, name: r.name, price: r.price, type: r.type }));
                this.displayMarketResults(results);
            } else {
            const mockResults = this.getMockMarketResults(searchTerm);
            this.displayMarketResults(mockResults);
            }
        } catch (error) {
            const mockResults = this.getMockMarketResults(searchTerm);
            this.displayMarketResults(mockResults);
        }
    }
    
    getMockMarketResults(searchTerm) {
        const allMarkets = {
            'silver': { symbol: 'SI=F', name: 'Silver Futures', price: 24.50, type: 'commodity' },
            'gold': { symbol: 'GC=F', name: 'Gold Futures', price: 1950.00, type: 'commodity' },
            'oil': { symbol: 'CL=F', name: 'Crude Oil Futures', price: 75.30, type: 'commodity' },
            'copper': { symbol: 'HG=F', name: 'Copper Futures', price: 3.85, type: 'commodity' },
            'platinum': { symbol: 'PL=F', name: 'Platinum Futures', price: 950.00, type: 'commodity' },
            'palladium': { symbol: 'PA=F', name: 'Palladium Futures', price: 1200.00, type: 'commodity' },
            'natural gas': { symbol: 'NG=F', name: 'Natural Gas Futures', price: 2.85, type: 'commodity' },
            'wheat': { symbol: 'ZW=F', name: 'Wheat Futures', price: 6.50, type: 'commodity' },
            'corn': { symbol: 'ZC=F', name: 'Corn Futures', price: 5.20, type: 'commodity' },
            'soybeans': { symbol: 'ZS=F', name: 'Soybean Futures', price: 12.80, type: 'commodity' }
        };
        
        const results = [];
        const searchLower = searchTerm.toLowerCase();
        
        Object.entries(allMarkets).forEach(([key, market]) => {
            if (key.includes(searchLower) || market.name.toLowerCase().includes(searchLower)) {
                results.push({ key, ...market });
            }
        });
        
        return results;
    }
    
    displayMarketResults(results) {
        const resultsContainer = document.getElementById('market-results');
        resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            const searchTerm = document.getElementById('market-search')?.value.trim();
            // Allow adding custom market when not found
            if (searchTerm) {
                const custom = {
                    symbol: searchTerm.toUpperCase(),
                    name: `Custom Market (${searchTerm.toUpperCase()})`,
                    price: 0,
                    type: this.getMarketType(searchTerm.toUpperCase())
                };
                const addBtn = document.createElement('button');
                addBtn.className = 'btn btn-primary';
                addBtn.textContent = `Add ${custom.symbol}`;
                addBtn.addEventListener('click', () => {
                    this.selectMarket(custom);
                    this.addSelectedMarket();
                });
                const msg = document.createElement('div');
                msg.className = 'no-results';
                msg.textContent = 'No markets found. You can add a custom market:';
                resultsContainer.appendChild(msg);
                resultsContainer.appendChild(addBtn);
            } else {
                resultsContainer.innerHTML = '<p class="no-results">No markets found</p>';
            }
            return;
        }
        
        results.forEach(market => {
            const resultItem = document.createElement('div');
            resultItem.className = 'market-result-item';
            resultItem.innerHTML = `
                <div>
                    <div class="market-symbol">${market.symbol}</div>
                    <div class="market-name">${market.name}</div>
                </div>
                <div class="market-price">$${market.price.toFixed(2)}</div>
            `;
            
            resultItem.addEventListener('click', () => {
                this.selectMarket(market);
            });
            
            resultsContainer.appendChild(resultItem);
        });
    }
    
    selectMarket(market) {
        this.selectedMarket = market;
        this.addAlert('info', 'Market Selected', `Selected ${market.name} (${market.symbol})`);
    }
    
    addSelectedMarket() {
        if (!this.selectedMarket) {
            this.addAlert('warning', 'No Market Selected', 'Please select a market first');
            return;
        }
        
        // Add market to available markets
        this.availableMarkets.push(this.selectedMarket);
        
        // Create new bot for this market
        const botId = `bot_${Date.now()}`;
        const botName = `${this.selectedMarket.name} Bot`;
        
        this.bots[botId] = {
            name: botName,
            asset: this.selectedMarket.symbol,
            type: this.selectedMarket.type,
            active: false,
            market: this.selectedMarket
        };
        
        // Add to bot selector
        const botSelector = document.getElementById('bot-selector');
        const option = document.createElement('option');
        option.value = botId;
        option.textContent = `${botName} (${this.selectedMarket.symbol})`;
        botSelector.appendChild(option);
        
        // Clear search
        document.getElementById('market-search').value = '';
        document.getElementById('market-results').innerHTML = '';
        this.selectedMarket = null;
        
        this.addAlert('success', 'Market Added', `Added ${botName} to available bots`);
    }
    
    // Investment functionality
    showInvestmentModal() {
        document.getElementById('investment-modal').classList.add('show');
        this.updatePortfolioSummary();
    }
    
    makeInvestment(type, category) {
        const investment = {
            id: Date.now(),
            type: type,
            category: category,
            amount: this.getInvestmentAmount(type, category),
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        this.investments.push(investment);
        this.updatePortfolioSummary();
        
        this.addAlert('success', 'Investment Made', 
            `Invested $${investment.amount} in ${category} ${type}`);
    }
    
    getInvestmentAmount(type, category) {
        const amounts = {
            'reit': {
                'residential': 1000,
                'commercial': 2500,
                'industrial': 5000
            },
            'nft': {
                'digital-art': 100,
                'gaming': 50,
                'music': 200
            },
            'biotech': {
                'pharma': 10000,
                'gene-therapy': 15000,
                'devices': 7500
            },
            'metals': {
                'gold': 1500,
                'silver': 500,
                'platinum': 2000
            }
        };
        
        return amounts[type]?.[category] || 1000;
    }
    
    updatePortfolioSummary() {
        const totalInvested = this.investments.reduce((sum, inv) => sum + inv.amount, 0);
        const currentValue = totalInvested * (1 + Math.random() * 0.2 - 0.1); // Simulate returns
        const totalReturn = ((currentValue - totalInvested) / totalInvested) * 100;
        
        document.getElementById('total-invested').textContent = `$${totalInvested.toFixed(2)}`;
        document.getElementById('current-value').textContent = `$${currentValue.toFixed(2)}`;
        
        const returnElement = document.getElementById('total-return');
        returnElement.textContent = `${totalReturn.toFixed(2)}%`;
        returnElement.className = `stat-value ${totalReturn >= 0 ? 'positive' : 'negative'}`;
    }
    
    viewPortfolio() {
        this.addAlert('info', 'Portfolio View', 'Portfolio details would be displayed here');
    }
    
    exportInvestments() {
        const data = {
            investments: this.investments,
            summary: {
                totalInvested: this.investments.reduce((sum, inv) => sum + inv.amount, 0),
                count: this.investments.length,
                timestamp: new Date().toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investments-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.addAlert('success', 'Data Exported', 'Investment data exported successfully');
    }
    
    // Market Review functionality
    showMarketReviewModal() {
        document.getElementById('market-review-modal').classList.add('show');
        this.generateMarketReview();
        this.renderReviewActiveBots();
        const printBtn = document.getElementById('print-bot-report');
        if (printBtn) printBtn.addEventListener('click', () => this.printBotReport());
    }
    
    // Strategy Editor functionality
    showStrategyEditorModal() {
        const modal = document.getElementById('strategy-editor-modal');
        if (!modal) return;
        
        // Restore backtest config for current bot if available
        if (this.currentBot) {
            this.restoreBacktestConfigToUi(this.currentBot);
        }
        
        modal.classList.add('show');
    }
    
    generateMarketReview() {
        // Set current date with time scale
        const timeScale = this.currentReviewTimeScale || '1d';
        const dateText = this.getTimeScaleDateText(timeScale);
        document.getElementById('review-date').textContent = dateText;
        
        // Generate market summary based on filter
        const marketFilter = this.currentReviewMarketFilter || 'all';
        let markets = Object.keys(this.marketData);
        
        if (marketFilter !== 'all') {
            markets = markets.filter(market => market === marketFilter);
        }
        
        document.getElementById('total-markets').textContent = markets.length;
        
        // Find biggest gainer and loser
        let biggestGainer = { symbol: '-', change: 0 };
        let biggestLoser = { symbol: '-', change: 0 };
        let mostVolatile = { symbol: '-', volatility: 0 };
        
        markets.forEach(symbol => {
            const data = this.marketData[symbol];
            if (data && data.length > 1) {
                const firstPrice = data[0].price;
                const lastPrice = data[data.length - 1].price;
                const change = ((lastPrice - firstPrice) / firstPrice) * 100;
                
                if (change > biggestGainer.change) {
                    biggestGainer = { symbol, change };
                }
                if (change < biggestLoser.change) {
                    biggestLoser = { symbol, change };
                }
                
                // Calculate volatility
                const prices = data.map(d => d.price);
                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                const variance = prices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / prices.length;
                const volatility = Math.sqrt(variance) / avg * 100;
                
                if (volatility > mostVolatile.volatility) {
                    mostVolatile = { symbol, volatility };
                }
            }
        });
        
        document.getElementById('biggest-gainer').textContent = 
            biggestGainer.symbol !== '-' ? `${biggestGainer.symbol} (+${biggestGainer.change.toFixed(2)}%)` : '-';
        document.getElementById('biggest-loser').textContent = 
            biggestLoser.symbol !== '-' ? `${biggestLoser.symbol} (${biggestLoser.change.toFixed(2)}%)` : '-';
        document.getElementById('most-volatile').textContent = 
            mostVolatile.symbol !== '-' ? `${mostVolatile.symbol} (${mostVolatile.volatility.toFixed(2)}%)` : '-';
        
        // Generate dramatic shifts
        this.generateDramaticShifts();
        
        // Generate performance chart
        this.generatePerformanceChart();
    }

    renderReviewActiveBots() {
        const container = document.getElementById('review-active-bots');
        const charts = document.getElementById('bot-activity-charts');
        if (!container || !charts) return;
        container.innerHTML = '';
        charts.innerHTML = '';
        Object.entries(this.bots).forEach(([botId, bot]) => {
            if (!bot.active) return;
            const wrap = document.createElement('div');
            wrap.style.display = 'inline-flex';
            wrap.style.gap = '8px';
            const btn = document.createElement('button');
            btn.className = 'active-bot-btn';
            btn.innerHTML = `
                <div class="bot-name">${bot.name}</div>
                <div class="bot-asset">${bot.asset}</div>
                <div class="bot-status">
                    <span class="status-dot online"></span>
                    <span>Active</span>
                </div>
            `;
            btn.addEventListener('click', () => this.renderBotActivityCharts(botId));
            const pdfBtn = document.createElement('button');
            pdfBtn.className = 'btn btn-secondary';
            pdfBtn.textContent = 'PDF';
            pdfBtn.addEventListener('click', () => this.downloadBotPDF(botId));
            wrap.appendChild(btn);
            wrap.appendChild(pdfBtn);
            container.appendChild(wrap);
        });
    }

    renderBotActivityCharts(botId) {
        const charts = document.getElementById('bot-activity-charts');
        if (!charts) return;
        this.currentReviewBotId = botId;
        charts.innerHTML = '';
        const bot = this.bots[botId];
        if (!bot) return;
        const dayCanvas = document.createElement('canvas');
        dayCanvas.style.height = '240px';
        charts.appendChild(dayCanvas);
        const weekCanvas = document.createElement('canvas');
        weekCanvas.style.height = '240px';
        charts.appendChild(weekCanvas);
        const asset = bot.asset;
        const dayData = this.marketData[asset] || this.generateMockMarketData(asset);
        const labelsDay = dayData.map(d => new Date(d.time).toLocaleTimeString());
        const pricesDay = dayData.map(d => d.price);
        new Chart(dayCanvas.getContext('2d'), { type: 'line', data: { labels: labelsDay, datasets: [{ label: `${bot.name} Today`, data: pricesDay, borderColor: '#ffd700', backgroundColor: 'rgba(255,215,0,0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false }});
        // Week: try backend timeframe else synthesize
        fetch(`/api/market-data/${encodeURIComponent(asset)}/timeframe?timeframe=1w`).then(r => r.json()).then(data => {
            const arr = Array.isArray(data) && data.length ? data : this.generateDataForTimeframe(asset, '1w');
            const labelsWeek = arr.map(d => new Date(d.time).toLocaleDateString());
            const pricesWeek = arr.map(d => d.price);
            new Chart(weekCanvas.getContext('2d'), { type: 'line', data: { labels: labelsWeek, datasets: [{ label: `${bot.name} Last 7 Days`, data: pricesWeek, borderColor: '#29b6f6', backgroundColor: 'rgba(41,182,246,0.1)', fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false }});
        }).catch(() => {
            const arr = this.generateDataForTimeframe(asset, '1w');
            const labelsWeek = arr.map(d => new Date(d.time).toLocaleDateString());
            const pricesWeek = arr.map(d => d.price);
            new Chart(weekCanvas.getContext('2d'), { type: 'line', data: { labels: labelsWeek, datasets: [{ label: `${bot.name} Last 7 Days`, data: pricesWeek, borderColor: '#29b6f6', backgroundColor: 'rgba(41,182,246,0.1)', fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false }});
        });
    }

    printBotReport() {
        const modal = document.getElementById('market-review-modal');
        if (!modal) return;
        const w = window.open('', 'PRINT', 'height=800,width=1000');
        if (!w) return;
        const styles = document.querySelectorAll('link[rel="stylesheet"], style');
        w.document.write('<html><head><title>Bot Report</title>');
        styles.forEach(s => w.document.write(s.outerHTML));
        w.document.write('</head><body class="dark-theme">');
        const botId = this.currentReviewBotId;
        const bot = botId ? this.bots[botId] : null;
        w.document.write(`<h2>Bot Report${bot ? ' - ' + bot.name : ''}</h2>`);
        const charts = document.getElementById('bot-activity-charts');
        if (charts) {
            // clone canvases as images
            charts.querySelectorAll('canvas').forEach(cv => {
                const img = new Image();
                img.src = cv.toDataURL('image/png');
                img.style.maxWidth = '100%';
                img.style.display = 'block';
                img.style.marginBottom = '16px';
                w.document.body.appendChild(img);
            });
        }
        w.document.write('</body></html>');
        w.document.close();
        w.focus();
        w.print();
        w.close();
    }

    downloadBotPDF(botId) {
        const url = `/api/market-review/pdf?bot_id=${encodeURIComponent(botId)}`;
        fetch(url)
            .then(r => { if (r.ok) return r.blob(); throw new Error('PDF generation failed'); })
            .then(blob => {
                const href = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = href;
                a.download = `bot_report_${botId}_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(href);
            })
            .catch(() => this.addAlert('danger', 'PDF Error', 'Failed to download bot PDF'));
    }
    
    generateDramaticShifts() {
        const shiftsList = document.getElementById('shifts-list');
        shiftsList.innerHTML = '';
        
        const dramaticShifts = [
            { symbol: 'BTC', description: 'Bitcoin surged 15% in the last hour', change: '+15.2%', type: 'positive' },
            { symbol: 'SI=F', description: 'Silver dropped 8% due to market volatility', change: '-8.1%', type: 'negative' },
            { symbol: 'TSLA', description: 'Tesla gained 12% on positive earnings', change: '+12.3%', type: 'positive' },
            { symbol: 'GC=F', description: 'Gold stabilized after early morning dip', change: '+2.1%', type: 'positive' }
        ];
        
        dramaticShifts.forEach(shift => {
            const shiftItem = document.createElement('div');
            shiftItem.className = 'shift-item';
            shiftItem.innerHTML = `
                <div class="shift-info">
                    <div class="shift-symbol">${shift.symbol}</div>
                    <div class="shift-description">${shift.description}</div>
                </div>
                <div class="shift-change ${shift.type}">${shift.change}</div>
            `;
            shiftsList.appendChild(shiftItem);
        });
    }
    
    generatePerformanceChart() {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }
        
        const markets = Object.keys(this.marketData);
        const labels = markets.slice(0, 8); // Show top 8 markets
        const data = labels.map(symbol => {
            const marketData = this.marketData[symbol];
            if (marketData && marketData.length > 1) {
                const firstPrice = marketData[0].price;
                const lastPrice = marketData[marketData.length - 1].price;
                return ((lastPrice - firstPrice) / firstPrice) * 100;
            }
            return 0;
        });
        
        this.performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Performance (%)',
                    data: data,
                    backgroundColor: data.map(value => 
                        value >= 0 ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)'
                    ),
                    borderColor: data.map(value => 
                        value >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Market category toggles
    toggleMarketCategory(category) {
        const categoryElements = document.querySelectorAll(`.market-category:nth-child(${this.getCategoryIndex(category)})`);
        const checkbox = document.getElementById(`show-${category}`);
        
        categoryElements.forEach(element => {
            element.style.display = checkbox.checked ? 'block' : 'none';
        });
    }
    
    getCategoryIndex(category) {
        const indices = { 'commodities': 1, 'stocks': 2, 'crypto': 3 };
        return indices[category] || 1;
    }
    
    // Bot management
    showBotManagement(botId) {
        const modal = document.getElementById('bot-management-modal');
        if (!modal) return;
        if (botId && this.bots[botId]) {
            modal.classList.add('show');
            this.loadBotSettings(botId);
        } else {
            modal.classList.add('show');
            this.loadBotSettings(null);
        }
        // Inject sidebar Bot Configuration and Risk Controls into modal context
        const cfg = document.getElementById('bot-config');
        const risk = document.querySelector('.risk-controls');
        const modalBody = modal.querySelector('.modal-body');
        if (cfg && risk && modalBody && !this._botCfgInjected) {
            // recreate minimal fields in modal are already present; just hide sidebar ones permanently
            cfg.style.display = 'none';
            risk.style.display = 'none';
            this._botCfgInjected = true;
        }
    }
    
    loadBotSettings(botId) {
        this.currentBot = botId || this.currentBot;
        const bot = botId ? this.bots[botId] : null;
        document.getElementById('bot-name').value = bot?.name || '';
        document.getElementById('bot-asset').value = bot?.asset || '';
        document.getElementById('bot-strategy').value = bot?.strategy || 'ma';
        document.getElementById('bot-frequency').value = bot?.frequency || 'realtime';
        document.getElementById('bot-risk').value = bot?.risk || 'medium';
        document.getElementById('bot-floor-price').value = bot?.floor_price || 0;
        document.getElementById('bot-daily-limit').value = bot?.daily_loss_limit || 1000;
        document.getElementById('bot-max-positions').value = bot?.max_positions || 10;
        this.renderBotManagementChart(bot);
    }

    renderBotManagementChart(bot) {
        const canvas = document.getElementById('bot-management-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (this.botManagementChart) {
            this.botManagementChart.destroy();
        }
        const asset = bot?.asset || 'AAPL';
        const data = this.marketData[asset] || this.generateMockMarketData(asset);
        const labels = data.map(d => new Date(d.time).toLocaleTimeString());
        const prices = data.map(d => d.price);
        // Use same buy/sell datasets for markers
        const buySignals = [];
        const sellSignals = [];
        for (let i = 1; i < prices.length; i++) {
            if (Math.random() < 0.03) {
                if (prices[i] > prices[i-1]) buySignals.push({ x: i, y: prices[i] });
                else sellSignals.push({ x: i, y: prices[i] });
            }
        }
        this.botManagementChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: `${asset} Price`, data: prices, borderColor: '#ffd700', backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 2, fill: true, tension: 0.4 },
                    { label: 'Buy', data: buySignals, borderColor: '#28a745', backgroundColor: '#28a745', borderWidth: 0, pointRadius: 6, pointHoverRadius: 8, showLine: false },
                    { label: 'Sell', data: sellSignals, borderColor: '#dc3545', backgroundColor: '#dc3545', borderWidth: 0, pointRadius: 6, pointHoverRadius: 8, showLine: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#ffffff' } } }, scales: { x: { ticks: { color: '#cccccc' } }, y: { ticks: { color: '#cccccc' } } } }
        });
    }

    runBacktest() {
        const type = document.getElementById('strategy-type')?.value || 'ma';
        const p1 = parseInt(document.getElementById('param1')?.value) || 14;
        const p2 = parseInt(document.getElementById('param2')?.value) || 28;
        const p3 = parseInt(document.getElementById('param3')?.value) || 70;
        const activeBotId = this.currentBot || Object.keys(this.bots)[0];
        if (activeBotId) {
            this.backtestConfigs[activeBotId] = { type, p1, p2, p3 };
            try { localStorage.setItem('atb_backtest_configs', JSON.stringify(this.backtestConfigs)); } catch(e) {}
        }
        const botId = this.currentBot || Object.keys(this.bots)[0];
        if (!botId) return;
        const asset = this.bots[botId].asset;
        const data = this.marketData[asset] || this.generateMockMarketData(asset);
        const prices = data.map(d => d.price);
        const equity = [];
        const buyMarks = [];
        const sellMarks = [];
        let position = 0, cash = 10000, shares = 0, avgCost = 0;
        const ma = (arr, n, i) => {
            if (i < n) return null; let s = 0; for (let k=i-n+1; k<=i; k++) s += arr[k]; return s/n;
        };
        for (let i=0;i<prices.length;i++) {
            const price = prices[i];
            if (type === 'ma') {
                const short = ma(prices, Math.min(p1, i+1), i);
                const long = ma(prices, Math.min(p2, i+1), i);
                if (short != null && long != null) {
                    if (short > long && position <= 0) { // buy
                        shares = cash / price; cash = 0; position = 1; avgCost = price;
                        buyMarks.push({ x: i, y: price });
                    } else if (short < long && position > 0) { // sell
                        cash = shares * price; shares = 0; position = 0;
                        sellMarks.push({ x: i, y: price });
                    }
                }
            } else if (type === 'rsi') {
                // simple threshold using p1 as period and p3 as overbought
                // placeholder: buy if price below rolling average, sell if above
                const base = ma(prices, Math.min(p1, i+1), i);
                if (base != null) {
                    if (price < base && position <= 0) { shares = cash / price; cash = 0; position = 1; avgCost = price; buyMarks.push({ x: i, y: price }); }
                    else if (price > base && position > 0) { cash = shares * price; shares = 0; position = 0; sellMarks.push({ x: i, y: price }); }
                }
            } else if (type === 'macd') {
                // very rough MACD using p1 fast, p2 slow
                const fast = ma(prices, Math.min(p1, i+1), i);
                const slow = ma(prices, Math.min(p2, i+1), i);
                if (fast != null && slow != null) {
                    if (fast > slow && position <= 0) { shares = cash / price; cash = 0; position = 1; avgCost = price; buyMarks.push({ x: i, y: price }); }
                    if (fast < slow && position > 0) { cash = shares * price; shares = 0; position = 0; sellMarks.push({ x: i, y: price }); }
                }
            } else if (type === 'bollinger') {
                const n = Math.min(p1, i+1);
                const mean = ma(prices, n, i);
                if (mean != null) {
                    let variance = 0; for (let k=i-n+1;k<=i;k++) variance += Math.pow(prices[k]-mean,2); variance/=n;
                    const std = Math.sqrt(variance);
                    const upper = mean + (p3/100)*std; const lower = mean - (p3/100)*std;
                    if (price < lower && position <= 0) { shares = cash / price; cash = 0; position = 1; avgCost = price; buyMarks.push({ x: i, y: price }); }
                    if (price > upper && position > 0) { cash = shares * price; shares = 0; position = 0; sellMarks.push({ x: i, y: price }); }
                }
            }
            const equityVal = cash + shares * price;
            equity.push({ x: i, y: equityVal });
        }
        const ctx = document.getElementById('backtest-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.backtestChart) this.backtestChart.destroy();
        this.backtestChart = new Chart(ctx, {
            type: 'line',
            data: { labels: equity.map(e => e.x), datasets: [
                { label: `${asset} ${type.toUpperCase()} Backtest`, data: equity.map(e => e.y), borderColor: '#66bb6a', backgroundColor: 'rgba(102,187,106,0.1)', tension: 0.3, fill: true },
                { label: 'Buys', data: buyMarks, borderColor: '#28a745', backgroundColor: '#28a745', pointRadius: 4, showLine: false },
                { label: 'Sells', data: sellMarks, borderColor: '#dc3545', backgroundColor: '#dc3545', pointRadius: 4, showLine: false }
            ] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        this.addAlert('success', 'Backtest Complete', `Strategy: ${type.toUpperCase()} - Final Equity: $${equity[equity.length-1].y.toFixed(2)}`);
        
        // Show backtest results section in modal
        const backtestResults = document.querySelector('#strategy-editor-modal .backtest-results');
        if (backtestResults) {
            backtestResults.style.display = 'block';
        }
        
        if (p1 <= 0 || p2 <= 0 || p3 <= 0) return;
        if ((type === 'ma' || type === 'macd') && p2 <= p1) return;
        if (this.chart) {
            const displayedSymbol = this.currentMarketDisplay?.symbol || this.bots[this.currentBot || botId]?.asset || null;
            if (displayedSymbol && displayedSymbol === asset && this.chart.data?.datasets?.length >= 3) {
                this.chart.data.datasets[1].data = buyMarks;
                this.chart.data.datasets[2].data = sellMarks;
                this.chart.update('none');
                this.addAlert('info','Overlay Applied','Backtest signals overlayed on price chart');
            }
        }
    }
    
    saveBotSettings() {
        this.createOrUpdateBotFromModal(false);
    }

    createOrUpdateBotFromModal(isCreate) {
        const name = document.getElementById('bot-name').value.trim();
        const asset = document.getElementById('bot-asset').value.trim();
        const strategy = document.getElementById('bot-strategy').value;
        const frequency = document.getElementById('bot-frequency').value;
        const risk = document.getElementById('bot-risk').value;
        const floorPrice = parseFloat(document.getElementById('bot-floor-price').value) || 0;
        const dailyLimit = parseFloat(document.getElementById('bot-daily-limit').value) || 1000;
        const maxPositions = parseInt(document.getElementById('bot-max-positions').value) || 10;
        
        if (isCreate) {
            if (!name || !asset) {
                this.addAlert('warning', 'Missing Fields', 'Please provide Bot Name and Asset');
                return;
            }
            const botId = `bot_${Date.now()}`;
            this.bots[botId] = {
                name,
                asset,
                type: this.getMarketType(asset),
                active: false,
                strategy,
                frequency,
                risk,
                floor_price: floorPrice,
                daily_loss_limit: dailyLimit,
                max_positions: maxPositions,
                created: Date.now(),
                stats: { total_pnl: 0, daily_pnl: 0, trades_count: 0, win_rate: 0 }
            };
            // Add to selector
            const botSelector = document.getElementById('bot-selector');
            if (botSelector) {
                const option = document.createElement('option');
                option.value = botId;
                option.textContent = `${name} (${asset})`;
                botSelector.appendChild(option);
            }
            this.addAlert('success', 'Bot Created', `${name} created for ${asset}`);
        } else {
            const botId = this.currentBot;
            if (!botId || !this.bots[botId]) return;
            const bot = this.bots[botId];
            bot.name = name || bot.name;
            bot.asset = asset || bot.asset;
            bot.strategy = strategy;
            bot.frequency = frequency;
            bot.risk = risk;
            bot.floor_price = floorPrice;
            bot.daily_loss_limit = dailyLimit;
            bot.max_positions = maxPositions;
            const option = document.querySelector(`#bot-selector option[value="${botId}"]`);
            if (option) option.textContent = `${bot.name} (${bot.asset})`;
        this.addAlert('success', 'Settings Saved', `Bot settings updated for ${bot.name}`);
        }
        this.renderActiveBots();
    }
    
    deleteBot() {
        // Get bot ID from the selector or current bot
        const botId = document.getElementById('bot-selector').value || this.currentBot;
        if (!botId || !this.bots[botId]) {
            this.addAlert('error', 'No Bot Selected', 'Please select a bot to delete');
            return;
        }
        
        const bot = this.bots[botId];
        if (confirm(`Are you sure you want to delete "${bot.name}"? This action cannot be undone.`)) {
            delete this.bots[botId];
            
            // Remove from dropdown
            const option = document.querySelector(`#bot-selector option[value="${botId}"]`);
            if (option) {
                option.remove();
            }
            
            // Clear current bot if it was the deleted one
            if (this.currentBot === botId) {
                this.currentBot = null;
            }
            
            // Hide management panel
            const modal = document.getElementById('bot-management-modal');
            if (modal) modal.classList.remove('show');
            
            // Update UI
            this.renderActiveBots();
            this.updateBotStatus();
            
            this.addAlert('success', 'Bot Deleted', `"${bot.name}" has been removed`);
        }
    }
    
    // Update chart for timeframe
    updateChartForTimeframe(timeframe) {
        if (!this.currentBot || !this.chart) return;
        
        // Check if chart already shows this timeframe
        const currentLabel = this.chart.data.datasets[0]?.label || '';
        const expectedLabel = `${this.bots[this.currentBot].asset} Price (${timeframe})`;
        
        // If chart already shows the correct timeframe, don't reload
        if (currentLabel === expectedLabel && this.chart.data.labels.length > 0) {
            console.log('Chart already shows correct timeframe, skipping reload');
            return;
        }
        
        // Show loading indicator
        this.showChartLoading();
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            // Generate data for the selected timeframe
            const bot = this.bots[this.currentBot];
            const symbol = bot.asset;
            const data = this.generateDataForTimeframe(symbol, timeframe);
            
            if (data && data.length > 0) {
                const labels = data.map(d => {
                    const date = new Date(d.time);
                    switch(timeframe) {
                        case '1m': return date.toLocaleTimeString();
                        case '5m': return date.toLocaleTimeString();
                        case '15m': return date.toLocaleTimeString();
                        case '1h': return date.toLocaleTimeString();
                        case '4h': return date.toLocaleTimeString();
                        case '1d': return date.toLocaleDateString();
                        case '1w': return date.toLocaleDateString();
                        case '1M': return date.toLocaleDateString();
                        case '3M': return date.toLocaleDateString();
                        case '6M': return date.toLocaleDateString();
                        case '1y': return date.toLocaleDateString();
                        default: return date.toLocaleString();
                    }
                });
                const prices = data.map(d => d.price);
                
                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = prices;
                this.chart.data.datasets[0].label = `${symbol} Price (${timeframe})`;
                this.chart.update('none');
            }
            
            this.hideChartLoading();
            this.addAlert('info', 'Timeframe Updated', `Chart updated for ${timeframe} timeframe`);
        }, 300);
    }
    
    generateDataForTimeframe(symbol, timeframe) {
        const basePrices = {
            'SI=F': 24.50, 'GC=F': 1950.00, 'CL=F': 75.30, 'HG=F': 3.85, 'PL=F': 950.00,
            'AAPL': 150.00, 'GOOGL': 2800.00, 'MSFT': 300.00, 'TSLA': 200.00, 'AMZN': 3200.00,
            'BTC-USD': 45000.00, 'ETH-USD': 3000.00
        };
        
        const basePrice = basePrices[symbol] || 100.00;
        const data = [];
        const now = new Date();
        
        // Generate different amounts of data based on timeframe
        let dataPoints = 60; // Default to 60 points
        let intervalMs = 60000; // 1 minute default
        
        switch(timeframe) {
            case '1m': dataPoints = 60; intervalMs = 60000; break; // 60 points × 1 min = 1 hour
            case '5m': dataPoints = 12; intervalMs = 300000; break; // 12 points × 5 min = 1 hour
            case '15m': dataPoints = 4; intervalMs = 900000; break; // 4 points × 15 min = 1 hour
            case '1h': dataPoints = 24; intervalMs = 3600000; break; // 24 points × 1 hour = 1 day
            case '4h': dataPoints = 6; intervalMs = 14400000; break; // 6 points × 4 hours = 1 day
            case '1d': dataPoints = 7; intervalMs = 86400000; break; // 7 points × 1 day = 1 week
            case '1w': dataPoints = 4; intervalMs = 604800000; break; // 4 points × 1 week = 1 month
            case '1M': dataPoints = 12; intervalMs = 2592000000; break; // 12 points × 1 month = 1 year
            case '3M': dataPoints = 4; intervalMs = 7776000000; break; // 4 points × 3 months = 1 year
            case '6M': dataPoints = 2; intervalMs = 15552000000; break; // 2 points × 6 months = 1 year
            case '1y': dataPoints = 1; intervalMs = 31536000000; break; // 1 point × 1 year = 1 year
        }
        
        for (let i = dataPoints - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * intervalMs));
            // Deterministic pseudo-random variation based on symbol+timeframe+index
            const seed = this.hashCode(`${symbol}|${timeframe}|${i}`);
            const rand = this.prng(seed);
            const variation = (rand - 0.5) * 0.02; // ±1% variation
            const price = basePrice * (1 + variation);
            
            data.push({
                time: time.toISOString(),
                price: price,
                volume: Math.floor(this.prng(seed + 1) * 1000000),
                high: price * (1 + this.prng(seed + 2) * 0.01),
                low: price * (1 - this.prng(seed + 3) * 0.01),
                open: price * (1 + (this.prng(seed + 4) - 0.5) * 0.005)
            });
        }
        
        return data;
    }

    // Deterministic cache wrapper for timeframe data
    getOrGenerateTimeframeData(symbol, timeframe) {
        const key = symbol;
        this.timeframeCache[key] = this.timeframeCache[key] || {};
        if (this.timeframeCache[key][timeframe] && this.timeframeCache[key][timeframe].length) {
            return this.timeframeCache[key][timeframe];
        }
        const data = this.generateDataForTimeframe(symbol, timeframe);
        this.timeframeCache[key][timeframe] = data;
        return data;
    }

    // Simple deterministic hash for strings
    hashCode(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0; // Convert to 32bit int
        }
        return h >>> 0; // unsigned
    }

    // Pseudo-random number generator (0..1) based on seed
    prng(seed) {
        // xorshift32
        let x = (seed || 1) >>> 0;
        x ^= x << 13; x >>>= 0;
        x ^= x >>> 17; x >>>= 0;
        x ^= x << 5; x >>>= 0;
        return (x % 100000) / 100000; // 0..1
    }
    
    // PDF generation
    generatePDFReport() {
        this.showLoadingOverlay();
        
        const botId = this.currentReviewBotId || this.currentBot || '';
        const url = botId ? `/api/market-review/pdf?bot_id=${encodeURIComponent(botId)}` : '/api/market-review/pdf';
        fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.blob();
                }
                throw new Error('PDF generation failed');
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const nameSuffix = botId ? `_${botId}` : '';
                a.download = `market_review${nameSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.hideLoadingOverlay();
                this.addAlert('success', 'PDF Generated', 'Market review PDF has been downloaded');
            })
            .catch(error => {
                this.hideLoadingOverlay();
                this.addAlert('danger', 'PDF Error', 'Failed to generate PDF report');
                console.error('PDF generation error:', error);
            });
    }
    
    exportReviewData() {
        const reviewData = {
            date: new Date().toISOString(),
            summary: {
                totalMarkets: document.getElementById('total-markets').textContent,
                biggestGainer: document.getElementById('biggest-gainer').textContent,
                biggestLoser: document.getElementById('biggest-loser').textContent,
                mostVolatile: document.getElementById('most-volatile').textContent
            },
            dramaticShifts: Array.from(document.querySelectorAll('.shift-item')).map(item => ({
                symbol: item.querySelector('.shift-symbol').textContent,
                description: item.querySelector('.shift-description').textContent,
                change: item.querySelector('.shift-change').textContent
            })),
            marketData: this.marketData,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(reviewData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `market_review_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.addAlert('success', 'Data Exported', 'Market review data exported successfully');
    }
    
    // Market review time scale and filter updates
    updateMarketReviewTimeScale(timeScale) {
        this.currentReviewTimeScale = timeScale;
        this.generateMarketReview();
        this.addAlert('info', 'Time Scale Updated', `Market review updated for ${timeScale} period`);
    }
    
    updateMarketReviewFilter(marketFilter) {
        this.currentReviewMarketFilter = marketFilter;
        this.generateMarketReview();
        this.addAlert('info', 'Market Filter Updated', `Market review filtered for ${marketFilter === 'all' ? 'all markets' : marketFilter}`);
    }
    
    getTimeScaleDateText(timeScale) {
        const now = new Date();
        const timeScaleLabels = {
            '1h': 'Last Hour',
            '1d': 'Today',
            '1w': 'This Week',
            '1M': 'This Month',
            '3M': 'Last 3 Months',
            '6M': 'Last 6 Months',
            '1y': 'This Year'
        };
        
        return `${timeScaleLabels[timeScale] || 'Today'} - ${now.toLocaleDateString()}`;
    }
    
    // Market selection functionality
    selectMarketItem(item) {
        // Remove previous selection
        document.querySelectorAll('.market-item').forEach(marketItem => {
            marketItem.classList.remove('selected');
        });
        
        // Add selection to clicked item
        item.classList.add('selected');
        
        // Get market data
        const symbol = item.dataset.symbol;
        const name = item.dataset.name;
        const price = item.querySelector('.market-price').textContent;
        
        this.selectedMarket = {
            symbol: symbol,
            name: name,
            price: price,
            type: this.getMarketType(symbol)
        };
        
        // Set current market display for chart
        this.currentMarketDisplay = this.selectedMarket;
        
        // Update the "Selected" display to show market
        const marketDisplay = document.getElementById('market-display');
        if (marketDisplay) {
            marketDisplay.textContent = `Market: ${name} (${symbol})`;
        }
        
        // Enable buttons
        document.getElementById('create-bot').disabled = false;
        const viewMarketBtn = document.getElementById('view-market');
        if (viewMarketBtn) viewMarketBtn.disabled = false;
        
        // Update chart with new market data
        this.updateChartForSelectedMarket();
        
        this.addAlert('info', 'Market Selected', `Selected ${name} (${symbol})`);
    }
    
    updateChartForSelectedMarket() {
        if (!this.selectedMarket || !this.chart) return;
        
        // Show loading indicator
        this.showChartLoading();
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            const symbol = this.selectedMarket.symbol;
            const data = this.generateDataForTimeframe(symbol, '1d');
            
            if (data && data.length > 0) {
                const labels = data.map(d => {
                    const date = new Date(d.time);
                    // Use time format for daily data to avoid showing dates
                    return date.toLocaleTimeString();
                });
                const prices = data.map(d => d.price);
                
                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = prices;
                this.chart.data.datasets[0].label = `${symbol} Price`;
                this.chart.update('none');
            }
            
            this.hideChartLoading();
        }, 500);
    }
    
    getMarketType(symbol) {
        // Determine market type based on symbol
        if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USD') && symbol.includes('-')) {
            return 'crypto';
        } else if (symbol.includes('GOLD') || symbol.includes('OIL') || symbol.includes('SILVER')) {
            return 'commodity';
        } else {
            return 'stock';
        }
    }
    
    getMarketNameFromSymbol(symbol) {
        // Map symbol to market name
        const marketNames = {
            'BTC-USD': 'Bitcoin',
            'ETH-USD': 'Ethereum',
            'AAPL': 'Apple',
            'GOOGL': 'Google',
            'MSFT': 'Microsoft',
            'TSLA': 'Tesla',
            'AMZN': 'Amazon',
            'GOLD': 'Gold',
            'OIL': 'Oil',
            'SILVER': 'Silver'
        };
        
        return marketNames[symbol] || symbol;
    }
    
    updateChartForSelectedBot() {
        if (!this.currentBot || !this.chart) return;
        
        const bot = this.bots[this.currentBot];
        const symbol = bot.asset;
        
        // Check if chart already shows this symbol and timeframe
        const currentLabel = this.chart.data.datasets[0]?.label || '';
        const expectedLabel = `${symbol} Price (${this.currentTimeframe || '1h'})`;
        
        // If chart already shows the correct data, don't reload
        if (currentLabel === expectedLabel && this.chart.data.labels.length > 0) {
            console.log('Chart already shows correct data, skipping reload');
            return;
        }
        
        // Show loading indicator
        this.showChartLoading();
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            const timeframe = this.currentTimeframe || '1h';
            const badge = document.getElementById('data-provenance');
            fetch(`/api/market-data/${encodeURIComponent(symbol)}/timeframe?timeframe=${encodeURIComponent(timeframe)}`)
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(data => {
                    if (Array.isArray(data) && data.length) {
                        if (badge) { badge.textContent = 'Live market data'; badge.style.display = 'block'; badge.style.background = 'rgba(0,128,0,0.15)'; badge.style.color = '#aaffaa'; badge.style.borderColor = 'rgba(0,128,0,0.3)'; }
                        this.applyChartDataForTimeframe(symbol, timeframe, data);
                        this.prefetchPopularTimeframes(symbol, timeframe);
                        this.hideChartLoading();
                        return;
                    }
                    throw new Error('no data');
                })
                .catch(() => {
                    const data = this.getOrGenerateTimeframeData(symbol, timeframe);
                    if (badge) { badge.textContent = 'Simulated data'; badge.style.display = 'block'; badge.style.background = 'rgba(255,0,0,0.15)'; badge.style.color = '#ffaaaa'; badge.style.borderColor = 'rgba(255,0,0,0.3)'; }
                    this.applyChartDataForTimeframe(symbol, timeframe, data);
                    this.hideChartLoading();
                });
        }, 500);
    }
    
    viewMarketGraph() {
        if (!this.selectedMarket) {
            this.addAlert('warning', 'No Market Selected', 'Please select a market first');
            return;
        }
        
        // Show loading indicator
        this.showChartLoading();
        
        // Update market display
        this.currentMarketDisplay = this.selectedMarket;
        document.getElementById('market-display').textContent = 
            `Market: ${this.selectedMarket.name} (${this.selectedMarket.symbol})`;
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            // Update chart with selected market data
            this.updateChartForMarket(this.selectedMarket.symbol);
            this.hideChartLoading();
            this.addAlert('success', 'Market View', `Now viewing ${this.selectedMarket.name} chart`);
        }, 500);
    }
    
    showChartLoading() {
        document.getElementById('chart-loading').style.display = 'block';
    }
    
    hideChartLoading() {
        document.getElementById('chart-loading').style.display = 'none';
    }
    
    updateChartForMarket(symbol) {
        if (!this.chart) return;
        
        // Normalize symbol to match backend cache keys
        const normalized = symbol.replace('-USD', '').replace('=F', '');
        const badge = document.getElementById('data-provenance');
        const timeframe = '1m';
        // Prefer backend data
        fetch(`/api/market-data/${encodeURIComponent(symbol)}/timeframe?timeframe=${encodeURIComponent(timeframe)}`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                if (Array.isArray(data) && data.length) {
                    if (badge) { badge.textContent = 'Live market data'; badge.style.display = 'block'; badge.style.background = 'rgba(0,128,0,0.15)'; badge.style.color = '#aaffaa'; badge.style.borderColor = 'rgba(0,128,0,0.3)'; }
                    this.applyChartDataForTimeframe(symbol, timeframe, data);
                    return;
                }
                throw new Error('no data');
            })
            .catch(() => {
                const marketData = this.marketData[symbol] || this.marketData[normalized] || this.getOrGenerateTimeframeData(symbol, timeframe);
                if (badge) { badge.textContent = 'Simulated data'; badge.style.display = 'block'; badge.style.background = 'rgba(255,0,0,0.15)'; badge.style.color = '#ffaaaa'; badge.style.borderColor = 'rgba(255,0,0,0.3)'; }
                this.applyChartDataForTimeframe(symbol, timeframe, marketData);
            });
    }

    applyChartDataForTimeframe(symbol, timeframe, data) {
        if (!Array.isArray(data) || !data.length) return;
        const labels = data.map(d => {
            const date = new Date(d.time);
            switch(timeframe) {
                case '1m':
                case '5m':
                case '15m':
                case '1h':
                case '4h':
                    return date.toLocaleTimeString();
                default:
                    return date.toLocaleDateString();
            }
        });
        const prices = data.map(d => d.price);
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        this.chart.data.datasets[0].label = `${symbol} Price (${timeframe})`;
        this.chart.update('none');
    }
    
    generateMockMarketData(symbol) {
        // Delegate to timeframe generator with a default intraday timeframe and caching
        return this.getOrGenerateTimeframeData(symbol, '1m');
    }
    
    createBotForMarket() {
        if (!this.selectedMarket) {
            this.addAlert('warning', 'No Market Selected', 'Please select a market first');
            return;
        }
        
        // Create new bot
        const botId = `bot_${Date.now()}`;
        const botName = `${this.selectedMarket.name} Bot`;
        
        this.bots[botId] = {
            name: botName,
            asset: this.selectedMarket.symbol,
            type: this.getMarketType(this.selectedMarket.symbol),
            active: false,
            market: this.selectedMarket,
            strategy: 'Custom',
            frequency: 'realtime',
            risk: 'medium',
            floor_price: 0,
            daily_loss_limit: 1000,
            max_positions: 10,
            created: Date.now(),
            stats: {
                total_pnl: 0,
                daily_pnl: 0,
                trades_count: 0,
                win_rate: 0
            }
        };
        
        // Add to bot selector dropdown
        const botSelector = document.getElementById('bot-selector');
        const option = document.createElement('option');
        option.value = botId;
        option.textContent = `${botName} (${this.selectedMarket.symbol})`;
        botSelector.appendChild(option);
        
        // Clear selection
        document.querySelectorAll('.market-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.getElementById('create-bot').disabled = true;
        const viewMarketBtn2 = document.getElementById('view-market');
        if (viewMarketBtn2) viewMarketBtn2.disabled = true;
        this.selectedMarket = null;
        
        this.addAlert('success', 'Bot Created', `Created ${botName} for ${this.selectedMarket.name}`);
        this.renderActiveBots();
    }
    
    getMarketType(symbol) {
        if (symbol.includes('=F')) return 'commodity';
        if (symbol.includes('-USD')) return 'crypto';
        return 'stock';
    }
    
    // Update market prices in real-time
    updateMarketPrices() {
        const marketItems = document.querySelectorAll('.market-item');
        marketItems.forEach(item => {
            const symbol = item.dataset.symbol;
            const priceElement = item.querySelector('.market-price');
            const currentPrice = parseFloat(priceElement.textContent.replace('$', '').replace(',', ''));
            
            // Simulate price changes
            const change = (Math.random() - 0.5) * 0.02; // ±1% change
            const newPrice = currentPrice * (1 + change);
            
            priceElement.textContent = `$${newPrice.toFixed(2)}`;
            
            // Update color based on change
            if (change > 0) {
                priceElement.style.color = 'var(--success)';
            } else if (change < 0) {
                priceElement.style.color = 'var(--danger)';
            } else {
                priceElement.style.color = 'var(--text-primary)';
            }
            
            // Reset color after animation
            setTimeout(() => {
                priceElement.style.color = 'var(--text-primary)';
            }, 1000);
        });
    }
}

// Expose ATBDashboard class to window for testing
window.ATBDashboard = ATBDashboard;

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Initializing ATBDashboard...');
        window.atbDashboard = new ATBDashboard();
        console.log('✅ ATBDashboard initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing ATBDashboard:', error);
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden - pausing updates');
    } else {
        console.log('Page visible - resuming updates');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.atbDashboard && window.atbDashboard.chart) {
        window.atbDashboard.chart.resize();
    }
});
