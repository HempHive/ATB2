/**
 * Mock Data Feed for ATB2 Testing
 * Provides deterministic market data for testing without real API calls
 */

export interface MarketData {
    time: number;
    price: number;
    volume: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface MarketDataPoint {
    symbol: string;
    data: MarketData[];
    lastUpdate: number;
}

export class MockDataFeed {
    private data: Map<string, MarketDataPoint> = new Map();
    private subscribers: Map<string, (data: MarketData) => void> = new Map();
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private seed: number = 12345;

    constructor() {
        this.initializeMarketData();
    }

    /**
     * Initialize mock data for all supported markets
     */
    private initializeMarketData() {
        const markets = [
            'SI=F', 'GC=F', 'CL=F', 'HG=F', 'PL=F', // Commodities
            'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', // Stocks
            'BTC-USD', 'ETH-USD' // Crypto
        ];

        markets.forEach(symbol => {
            this.data.set(symbol, {
                symbol,
                data: this.generateHistoricalData(symbol, 1000),
                lastUpdate: Date.now()
            });
        });
    }

    /**
     * Generate deterministic historical data using seeded random
     */
    private generateHistoricalData(symbol: string, count: number): MarketData[] {
        const data: MarketData[] = [];
        const basePrice = this.getBasePrice(symbol);
        const volatility = this.getVolatility(symbol);
        
        let currentPrice = basePrice;
        const now = Date.now();
        
        for (let i = 0; i < count; i++) {
            const time = now - (count - i) * 60000; // 1 minute intervals
            const change = this.seededRandom() * volatility * 0.02 - volatility * 0.01;
            currentPrice = Math.max(0.01, currentPrice * (1 + change));
            
            const open = i === 0 ? currentPrice : data[i - 1].close;
            const close = currentPrice;
            const high = Math.max(open, close) * (1 + this.seededRandom() * 0.01);
            const low = Math.min(open, close) * (1 - this.seededRandom() * 0.01);
            const volume = Math.floor(this.seededRandom() * 1000000) + 100000;
            
            data.push({
                time,
                price: close,
                volume,
                open,
                high,
                low,
                close
            });
        }
        
        return data;
    }

    /**
     * Get base price for a symbol
     */
    private getBasePrice(symbol: string): number {
        const prices: { [key: string]: number } = {
            'SI=F': 24.50,
            'GC=F': 1950.00,
            'CL=F': 75.30,
            'HG=F': 3.85,
            'PL=F': 950.00,
            'AAPL': 150.00,
            'GOOGL': 2800.00,
            'MSFT': 300.00,
            'TSLA': 200.00,
            'AMZN': 3200.00,
            'BTC-USD': 45000.00,
            'ETH-USD': 3000.00
        };
        return prices[symbol] || 100.00;
    }

    /**
     * Get volatility for a symbol
     */
    private getVolatility(symbol: string): number {
        const volatilities: { [key: string]: number } = {
            'SI=F': 0.8,
            'GC=F': 0.6,
            'CL=F': 1.2,
            'HG=F': 1.0,
            'PL=F': 0.7,
            'AAPL': 0.5,
            'GOOGL': 0.6,
            'MSFT': 0.4,
            'TSLA': 1.5,
            'AMZN': 0.7,
            'BTC-USD': 2.0,
            'ETH-USD': 2.5
        };
        return volatilities[symbol] || 1.0;
    }

    /**
     * Seeded random number generator for deterministic data
     */
    private seededRandom(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    /**
     * Get historical data for a symbol
     */
    getHistory(symbol: string, timeframe: string = '1m', from: number, to: number): MarketData[] {
        const marketData = this.data.get(symbol);
        if (!marketData) {
            return [];
        }

        const interval = this.getTimeframeInterval(timeframe);
        const filtered = marketData.data.filter(d => d.time >= from && d.time <= to);
        
        // Downsample based on timeframe
        if (interval > 60000) {
            const downsampled: MarketData[] = [];
            for (let i = 0; i < filtered.length; i += Math.floor(interval / 60000)) {
                if (i < filtered.length) {
                    downsampled.push(filtered[i]);
                }
            }
            return downsampled;
        }
        
        return filtered;
    }

    /**
     * Subscribe to real-time data updates
     */
    subscribe(symbol: string, timeframe: string, onBar: (data: MarketData) => void): string {
        const subscriptionId = `${symbol}_${timeframe}_${Date.now()}`;
        this.subscribers.set(subscriptionId, onBar);
        
        // Start emitting data every second for real-time simulation
        const interval = setInterval(() => {
            const marketData = this.data.get(symbol);
            if (marketData) {
                const lastData = marketData.data[marketData.data.length - 1];
                const change = this.seededRandom() * this.getVolatility(symbol) * 0.001 - this.getVolatility(symbol) * 0.0005;
                const newPrice = Math.max(0.01, lastData.close * (1 + change));
                
                const newData: MarketData = {
                    time: Date.now(),
                    price: newPrice,
                    volume: Math.floor(this.seededRandom() * 10000) + 1000,
                    open: lastData.close,
                    high: Math.max(lastData.close, newPrice) * (1 + this.seededRandom() * 0.005),
                    low: Math.min(lastData.close, newPrice) * (1 - this.seededRandom() * 0.005),
                    close: newPrice
                };
                
                // Update stored data
                marketData.data.push(newData);
                marketData.lastUpdate = Date.now();
                
                // Keep only last 1000 data points
                if (marketData.data.length > 1000) {
                    marketData.data = marketData.data.slice(-1000);
                }
                
                onBar(newData);
            }
        }, 1000);
        
        this.intervals.set(subscriptionId, interval);
        return subscriptionId;
    }

    /**
     * Unsubscribe from data updates
     */
    unsubscribe(subscriptionId: string): void {
        const interval = this.intervals.get(subscriptionId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(subscriptionId);
        }
        this.subscribers.delete(subscriptionId);
    }

    /**
     * Get current price for a symbol
     */
    getCurrentPrice(symbol: string): number {
        const marketData = this.data.get(symbol);
        if (!marketData || marketData.data.length === 0) {
            return this.getBasePrice(symbol);
        }
        return marketData.data[marketData.data.length - 1].close;
    }

    /**
     * Get timeframe interval in milliseconds
     */
    private getTimeframeInterval(timeframe: string): number {
        const intervals: { [key: string]: number } = {
            '1m': 60000,
            '5m': 300000,
            '15m': 900000,
            '1h': 3600000,
            '4h': 14400000,
            '1d': 86400000,
            '1w': 604800000,
            '1M': 2592000000,
            '3M': 7776000000,
            '6M': 15552000000,
            '1y': 31536000000
        };
        return intervals[timeframe] || 60000;
    }

    /**
     * Get all available symbols
     */
    getAvailableSymbols(): string[] {
        return Array.from(this.data.keys());
    }

    /**
     * Get market data summary
     */
    getMarketSummary(): { [symbol: string]: { price: number; change: number; changePercent: number } } {
        const summary: { [symbol: string]: { price: number; change: number; changePercent: number } } = {};
        
        this.data.forEach((marketData, symbol) => {
            if (marketData.data.length >= 2) {
                const current = marketData.data[marketData.data.length - 1];
                const previous = marketData.data[marketData.data.length - 2];
                const change = current.close - previous.close;
                const changePercent = (change / previous.close) * 100;
                
                summary[symbol] = {
                    price: current.close,
                    change,
                    changePercent
                };
            }
        });
        
        return summary;
    }

    /**
     * Cleanup all subscriptions
     */
    destroy(): void {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        this.subscribers.clear();
    }
}

// Export singleton instance
export const mockFeed = new MockDataFeed();
