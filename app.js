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
        this.graphColor = '#ffd700';
        this.investments = [];
        this.marketData = {};
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
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeChart();
        this.loadInitialData();
        this.startDataUpdates();
        this.setupWebSocket();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Market review panel
        document.getElementById('market-review').addEventListener('click', () => {
            this.showMarketReviewModal();
        });
        
        // Investment panel
        document.getElementById('investment-panel').addEventListener('click', () => {
            this.showInvestmentModal();
        });
        
        // Theme customizer
        document.getElementById('theme-customizer').addEventListener('click', () => {
            this.showThemeModal();
        });
        
        // Bot selector
        document.getElementById('bot-selector').addEventListener('change', (e) => {
            this.selectBot(e.target.value);
            this.showBotManagement(e.target.value);
        });
        
        // Bot controls
        document.getElementById('start-bot').addEventListener('click', () => {
            this.startBot();
        });
        
        document.getElementById('pause-bot').addEventListener('click', () => {
            this.pauseBot();
        });
        
        document.getElementById('reset-bot').addEventListener('click', () => {
            this.resetBot();
        });
        
        // Configuration changes
        document.getElementById('asset-selector').addEventListener('change', (e) => {
            this.updateBotConfig('asset', e.target.value);
        });
        
        document.getElementById('frequency-selector').addEventListener('change', (e) => {
            this.updateBotConfig('frequency', e.target.value);
        });
        
        document.getElementById('risk-selector').addEventListener('change', (e) => {
            this.updateBotConfig('risk', e.target.value);
        });
        
        // Risk controls
        document.getElementById('floor-price').addEventListener('change', (e) => {
            this.updateRiskConfig('floorPrice', parseFloat(e.target.value));
        });
        
        document.getElementById('daily-loss-limit').addEventListener('change', (e) => {
            this.updateRiskConfig('dailyLossLimit', parseFloat(e.target.value));
        });
        
        document.getElementById('max-positions').addEventListener('change', (e) => {
            this.updateRiskConfig('maxPositions', parseInt(e.target.value));
        });
        
        // Graph controls
        document.getElementById('toggle-historical').addEventListener('click', () => {
            this.toggleHistoricalView();
        });
        
        document.getElementById('timeframe-selector').addEventListener('change', (e) => {
            this.updateTimeframe(e.target.value);
        });
        
        // Zoom controls
        document.getElementById('zoom-slider').addEventListener('input', (e) => {
            this.updateTimeZoom(parseFloat(e.target.value));
        });
        
        // Graph color controls
        document.getElementById('graph-color').addEventListener('change', (e) => {
            this.updateGraphColor(e.target.value);
        });
        
        // Market selection - immediate graph display
        document.querySelectorAll('.market-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectMarketItem(item);
                this.viewMarketGraph(); // Show graph immediately
            });
        });
        
        // Market category toggles
        document.getElementById('show-commodities').addEventListener('change', () => {
            this.toggleMarketCategory('commodities');
        });
        document.getElementById('show-stocks').addEventListener('change', () => {
            this.toggleMarketCategory('stocks');
        });
        document.getElementById('show-crypto').addEventListener('change', () => {
            this.toggleMarketCategory('crypto');
        });
        
        // Create bot for selected market
        document.getElementById('create-bot').addEventListener('click', () => {
            this.createBotForMarket();
        });
        
        // Bot management
        document.getElementById('save-bot-settings').addEventListener('click', () => {
            this.saveBotSettings();
        });
        document.getElementById('delete-bot').addEventListener('click', () => {
            this.deleteBot();
        });
        
        // Footer actions
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('sim-mode').addEventListener('click', () => {
            this.toggleSimulationMode();
        });
        
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
        
        document.getElementById('alert-ok').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Close modal on outside click
        document.getElementById('alert-modal').addEventListener('click', (e) => {
            if (e.target.id === 'alert-modal') {
                this.hideModal();
            }
        });
        
        document.getElementById('theme-modal').addEventListener('click', (e) => {
            if (e.target.id === 'theme-modal') {
                this.hideModal();
            }
        });
        
        document.getElementById('investment-modal').addEventListener('click', (e) => {
            if (e.target.id === 'investment-modal') {
                this.hideModal();
            }
        });
        
        const botMgmtModal = document.getElementById('bot-management-modal');
        if (botMgmtModal) {
            botMgmtModal.addEventListener('click', (e) => {
                if (e.target.id === 'bot-management-modal') {
                    botMgmtModal.classList.remove('show');
                }
            });
        }
        
        // Theme customization
        document.getElementById('apply-theme').addEventListener('click', () => {
            this.applyCustomTheme();
        });
        
        document.getElementById('reset-theme').addEventListener('click', () => {
            this.resetTheme();
        });
        
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
            const changeSymbol = item.change >= 0 ? '+' : '';
            
            tickerItem.innerHTML = `
                <span class="ticker-symbol">${item.symbol}</span>
                <span class="ticker-price">$${item.price.toFixed(2)}</span>
                <span class="ticker-change ${changeClass}">
                    ${changeSymbol}${item.change.toFixed(2)} (${changeSymbol}${item.changePercent.toFixed(2)}%)
                </span>
            `;
            
            tickerContainer.appendChild(tickerItem);
        });
    }
    
    startDataUpdates() {
        // Update market data every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updateMarketData();
            this.updateTicker();
            this.updateStats();
        }, 5000);
        
        // Update ticker animation
        this.tickerInterval = setInterval(() => {
            this.updateTicker();
        }, 30000);
        
        // Update market prices every 2 seconds
        this.marketPriceInterval = setInterval(() => {
            this.updateMarketPrices();
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
        
        if (this.currentBot) {
            this.updateChart();
        }
    }
    
    updateChart() {
        if (!this.currentBot || !this.chart) return;
        
        const asset = this.bots[this.currentBot].asset;
        const data = this.marketData[asset];
        
        if (!data) return;
        
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
            document.getElementById('bot-config').style.display = 'none';
            return;
        }
        
        this.currentBot = botId;
        const bot = this.bots[botId];
        
        // Update configuration UI
        document.getElementById('asset-selector').value = bot.asset;
        document.getElementById('bot-config').style.display = 'block';
        
        // Update chart
        this.updateChart();
        // Update bot stats badge in graph header
        const allocation = this.botAllocations[botId] || 0;
        const pnlPercent = (Math.random() - 0.5) * 10; // placeholder; replace with real calc
        const arrow = pnlPercent > 0 ? '▲' : (pnlPercent < 0 ? '▼' : '•');
        const statsEl = document.getElementById('bot-stats-display');
        if (statsEl) statsEl.innerHTML = `${bot.name}: $${allocation.toFixed(2)} <span style="color:${pnlPercent>=0?'var(--success)':'var(--danger)'}">${arrow} ${Math.abs(pnlPercent).toFixed(1)}%</span>`;
        
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
    
    toggleHistoricalView() {
        const btn = document.getElementById('toggle-historical');
        const isHistorical = btn.classList.contains('active');
        
        if (isHistorical) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-history"></i> Historical View';
        } else {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-chart-line"></i> Live View';
        }
        
        this.addAlert('info', 'View Mode Changed', isHistorical ? 'Switched to live view' : 'Switched to historical view');
    }
    
    updateTimeframe(timeframe) {
        this.addAlert('info', 'Timeframe Updated', `Chart timeframe set to ${timeframe}`);
        // Update chart data based on timeframe
        this.updateChart();
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
        }
        
        // Continue simulation if bot is still active
        if (this.bots[this.currentBot].active) {
            setTimeout(() => this.simulateBotActivity(), 10000 + Math.random() * 20000);
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
        
        // Update last update time every second
        setInterval(() => {
            this.updateLastUpdateTime();
        }, 1000);
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
        const symbols = ['BTC-USD', 'ETH-USD', 'AAPL', 'MSFT', 'TSLA'];
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
        // Simple placeholder QR using data URL with text; integrate real QR lib later
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000';
        for (let i = 0; i < text.length; i++) {
            const x = (i * 7) % size;
            const y = Math.floor((i * 7) / size) * 7 % size;
            if ((text.charCodeAt(i) + i) % 3 === 0) ctx.fillRect(x, y, 4, 4);
        }
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
            const btn = document.createElement('button');
            btn.className = 'active-bot-btn';
            const dotClass = bot.active ? 'online' : 'offline';
            const botPnl = (this.botAllocations[botId] || 0) > 0 ? (Math.random() - 0.5) * 10 : 0; // placeholder P&L%
            const arrow = botPnl > 0 ? '▲' : (botPnl < 0 ? '▼' : '•');
            btn.innerHTML = `<span class="status-dot ${dotClass}"></span><span>${bot.name} (${bot.asset})</span><span style="margin-left:6px;color:${botPnl>=0?'var(--success)':'var(--danger)'}">${arrow} ${Math.abs(botPnl).toFixed(1)}%</span>`;
            btn.title = bot.active ? 'Active' : 'Inactive';
            btn.addEventListener('click', () => {
                const selector = document.getElementById('bot-selector');
                if (selector) selector.value = botId;
                this.selectBot(botId); // only update main graph and header
            });
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showBotManagement(botId);
            });
            container.appendChild(btn);
        });
    }
    
    updateLastUpdateTime() {
        document.getElementById('last-update').textContent = 
            `Last Update: ${new Date().toLocaleTimeString()}`;
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
    
    applyPresetTheme(themeName) {
        const themes = {
            'black-gold': {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#1a1a1a',
                '--bg-tertiary': '#2a2a2a',
                '--gold-primary': '#ffd700',
                '--text-primary': '#ffffff',
                '--text-secondary': '#cccccc'
            },
            'dark-blue': {
                '--bg-primary': '#0a0f1a',
                '--bg-secondary': '#1a2332',
                '--bg-tertiary': '#2a3441',
                '--gold-primary': '#4a9eff',
                '--text-primary': '#ffffff',
                '--text-secondary': '#b3c7d9'
            },
            'green-dark': {
                '--bg-primary': '#0a1a0a',
                '--bg-secondary': '#1a2e1a',
                '--bg-tertiary': '#2a3e2a',
                '--gold-primary': '#00ff88',
                '--text-primary': '#ffffff',
                '--text-secondary': '#b3d9b3'
            },
            'purple-dark': {
                '--bg-primary': '#1a0a1a',
                '--bg-secondary': '#2e1a2e',
                '--bg-tertiary': '#3e2a3e',
                '--gold-primary': '#ff4aff',
                '--text-primary': '#ffffff',
                '--text-secondary': '#d9b3d9'
            },
            'red-dark': {
                '--bg-primary': '#1a0a0a',
                '--bg-secondary': '#2e1a1a',
                '--bg-tertiary': '#3e2a2a',
                '--gold-primary': '#ff4a4a',
                '--text-primary': '#ffffff',
                '--text-secondary': '#d9b3b3'
            },
            'ocean': {
                '--bg-primary': '#0a1f2a',
                '--bg-secondary': '#0f2f3d',
                '--bg-tertiary': '#144657',
                '--gold-primary': '#29b6f6',
                '--text-primary': '#e3f2fd',
                '--text-secondary': '#b3e5fc'
            },
            'sunset': {
                '--bg-primary': '#2a0a0a',
                '--bg-secondary': '#3d0f0f',
                '--bg-tertiary': '#571414',
                '--gold-primary': '#ff8a65',
                '--text-primary': '#ffe0b2',
                '--text-secondary': '#ffccbc'
            },
            'forest': {
                '--bg-primary': '#0a2a1a',
                '--bg-secondary': '#0f3d2a',
                '--bg-tertiary': '#14573d',
                '--gold-primary': '#66bb6a',
                '--text-primary': '#e8f5e9',
                '--text-secondary': '#c8e6c9'
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
            
            // Update UI
            document.getElementById('broker-login').style.display = 'none';
            document.getElementById('account-info').style.display = 'block';
            
            // Update account balance (simulate real broker data)
            this.updateAccountBalance();
            
            this.hideLoadingOverlay();
            this.addAlert('success', 'Broker Connected', `Successfully connected to ${broker}`);
            
        } catch (error) {
            this.hideLoadingOverlay();
            this.addAlert('danger', 'Connection Failed', 'Failed to connect to broker. Please check your credentials.');
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
            resultsContainer.innerHTML = '<p class="no-results">No markets found</p>';
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
        const botId = this.currentBot;
        if (!botId || !this.bots[botId]) return;
        
        if (confirm('Are you sure you want to delete this bot?')) {
            delete this.bots[botId];
            
            // Remove from dropdown
            const option = document.querySelector(`#bot-selector option[value="${botId}"]`);
            if (option) {
                option.remove();
            }
            
            // Hide management panel
            const modal = document.getElementById('bot-management-modal');
            if (modal) modal.classList.remove('show');
            
            this.addAlert('success', 'Bot Deleted', 'Bot has been removed');
        }
    }
    
    // Update chart for timeframe
    updateChartForTimeframe(timeframe) {
        if (!this.currentMarketDisplay || !this.chart) return;
        
        // Show loading indicator
        this.showChartLoading();
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            // Generate data for the selected timeframe
            const symbol = this.currentMarketDisplay.symbol;
            const data = this.generateDataForTimeframe(symbol, timeframe);
            
            if (data && data.length > 0) {
                const labels = data.map(d => {
                    const date = new Date(d.time);
                    switch(timeframe) {
                        case '1m': return date.toLocaleTimeString();
                        case '5m': return date.toLocaleTimeString();
                        case '15m': return date.toLocaleTimeString();
                        case '1h': return date.toLocaleTimeString();
                        case '1d': return date.toLocaleDateString();
                        case '1w': return date.toLocaleDateString();
                        case '1M': return date.toLocaleDateString();
                        default: return date.toLocaleTimeString();
                    }
                });
                const prices = data.map(d => d.price);
                
                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = prices;
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
            case '1m': dataPoints = 60; intervalMs = 60000; break;
            case '5m': dataPoints = 60; intervalMs = 300000; break;
            case '15m': dataPoints = 60; intervalMs = 900000; break;
            case '1h': dataPoints = 24; intervalMs = 3600000; break;
            case '1d': dataPoints = 30; intervalMs = 86400000; break;
            case '1w': dataPoints = 52; intervalMs = 604800000; break;
            case '1M': dataPoints = 12; intervalMs = 2592000000; break;
        }
        
        for (let i = dataPoints - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * intervalMs));
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            const price = basePrice * (1 + variation);
            
            data.push({
                time: time.toISOString(),
                price: price,
                volume: Math.floor(Math.random() * 1000000),
                high: price * (1 + Math.random() * 0.01),
                low: price * (1 - Math.random() * 0.01),
                open: price * (1 + (Math.random() - 0.5) * 0.005)
            });
        }
        
        return data;
    }
    
    // PDF generation
    generatePDFReport() {
        this.showLoadingOverlay();
        
        fetch('/api/market-review/pdf')
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
                a.download = `market_review_${new Date().toISOString().split('T')[0]}.pdf`;
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
            price: price
        };
        
        // Enable buttons
        document.getElementById('create-bot').disabled = false;
        const viewMarketBtn = document.getElementById('view-market');
        if (viewMarketBtn) viewMarketBtn.disabled = false;
        
        this.addAlert('info', 'Market Selected', `Selected ${name} (${symbol})`);
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
            `${this.selectedMarket.name} (${this.selectedMarket.symbol})`;
        
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
        // Get market data for the symbol
        const marketData = this.marketData[symbol] || this.marketData[normalized] || this.generateMockMarketData(symbol);
        
        if (marketData && marketData.length > 0) {
            const labels = marketData.map(d => new Date(d.time).toLocaleTimeString());
            const prices = marketData.map(d => d.price);
            
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = prices;
            this.chart.data.datasets[0].label = `${symbol} Price`;
            this.chart.update('none');
        }
    }
    
    generateMockMarketData(symbol) {
        // Generate mock data for the selected market
        const basePrices = {
            'SI=F': 24.50, 'GC=F': 1950.00, 'CL=F': 75.30, 'HG=F': 3.85, 'PL=F': 950.00,
            'AAPL': 150.00, 'GOOGL': 2800.00, 'MSFT': 300.00, 'TSLA': 200.00, 'AMZN': 3200.00,
            'BTC-USD': 45000.00, 'ETH-USD': 3000.00
        };
        
        const basePrice = basePrices[symbol] || 100.00;
        const data = [];
        const now = new Date();
        
        for (let i = 59; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60000)); // 1 minute intervals
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            const price = basePrice * (1 + variation);
            
            data.push({
                time: time.toISOString(),
                price: price,
                volume: Math.floor(Math.random() * 1000000),
                high: price * (1 + Math.random() * 0.01),
                low: price * (1 - Math.random() * 0.01),
                open: price * (1 + (Math.random() - 0.5) * 0.005)
            });
        }
        
        return data;
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

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.atbDashboard = new ATBDashboard();
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
