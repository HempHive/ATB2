/**
 * Mock Broker for ATB2 Testing
 * Simulates broker operations without real API calls
 */

export interface Order {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    status: 'pending' | 'filled' | 'cancelled' | 'rejected';
    timestamp: number;
    fees: number;
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

export interface AccountInfo {
    balance: number;
    availableFunds: number;
    buyingPower: number;
    equity: number;
    marginUsed: number;
    marginAvailable: number;
}

export interface Trade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    timestamp: number;
    fees: number;
    pnl: number;
}

export class MockBroker {
    private accountInfo: AccountInfo = {
        balance: 100000,
        availableFunds: 95000,
        buyingPower: 95000,
        equity: 100000,
        marginUsed: 0,
        marginAvailable: 95000
    };
    
    private orders: Map<string, Order> = new Map();
    private positions: Map<string, Position> = new Map();
    private trades: Trade[] = [];
    private orderIdCounter = 1;
    private tradeIdCounter = 1;
    private isConnected = false;
    private currentPrices: Map<string, number> = new Map();
    
    // Configuration
    private commissionRate = 0.001; // 0.1% commission
    private slippageRate = 0.0005; // 0.05% slippage
    private minOrderSize = 1;
    private maxOrderSize = 10000;

    constructor() {
        this.initializePositions();
    }

    /**
     * Initialize some default positions for testing
     */
    private initializePositions(): void {
        // Add some sample positions
        this.positions.set('AAPL', {
            symbol: 'AAPL',
            quantity: 10,
            averagePrice: 150.00,
            currentPrice: 150.00,
            unrealizedPnl: 0,
            realizedPnl: 0,
            marketValue: 1500.00
        });
    }

    /**
     * Connect to broker
     */
    async connect(apiKey: string, apiSecret: string, broker: string): Promise<boolean> {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Validate credentials (mock validation)
        if (!apiKey || !apiSecret || !broker) {
            throw new Error('Invalid credentials');
        }
        
        this.isConnected = true;
        this.updateAccountInfo();
        return true;
    }

    /**
     * Disconnect from broker
     */
    disconnect(): void {
        this.isConnected = false;
    }

    /**
     * Check if connected
     */
    isConnectedToBroker(): boolean {
        return this.isConnected;
    }

    /**
     * Place an order
     */
    async placeOrder(symbol: string, side: 'buy' | 'sell', quantity: number, price?: number): Promise<string> {
        if (!this.isConnected) {
            throw new Error('Not connected to broker');
        }

        if (quantity < this.minOrderSize || quantity > this.maxOrderSize) {
            throw new Error(`Invalid quantity. Must be between ${this.minOrderSize} and ${this.maxOrderSize}`);
        }

        const currentPrice = this.currentPrices.get(symbol) || 100;
        const orderPrice = price || currentPrice;
        const fees = orderPrice * quantity * this.commissionRate;
        
        // Check if we have enough funds for buy orders
        if (side === 'buy') {
            const totalCost = (orderPrice * quantity) + fees;
            if (totalCost > this.accountInfo.availableFunds) {
                throw new Error('Insufficient funds');
            }
        }

        // Check if we have enough shares for sell orders
        if (side === 'sell') {
            const position = this.positions.get(symbol);
            if (!position || position.quantity < quantity) {
                throw new Error('Insufficient shares');
            }
        }

        const orderId = `order_${this.orderIdCounter++}`;
        const order: Order = {
            id: orderId,
            symbol,
            side,
            quantity,
            price: orderPrice,
            status: 'pending',
            timestamp: Date.now(),
            fees
        };

        this.orders.set(orderId, order);

        // Simulate order execution with some delay
        setTimeout(() => {
            this.executeOrder(orderId);
        }, Math.random() * 2000 + 500);

        return orderId;
    }

    /**
     * Execute a pending order
     */
    private executeOrder(orderId: string): void {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') {
            return;
        }

        const currentPrice = this.currentPrices.get(order.symbol) || order.price;
        
        // Apply slippage
        const slippage = currentPrice * this.slippageRate * (Math.random() - 0.5) * 2;
        const executionPrice = order.price + slippage;
        
        // Update order
        order.status = 'filled';
        order.price = executionPrice;
        order.fees = executionPrice * order.quantity * this.commissionRate;

        // Update position
        this.updatePosition(order.symbol, order.side, order.quantity, executionPrice);

        // Record trade
        const trade: Trade = {
            id: `trade_${this.tradeIdCounter++}`,
            symbol: order.symbol,
            side: order.side,
            quantity: order.quantity,
            price: executionPrice,
            timestamp: Date.now(),
            fees: order.fees,
            pnl: 0 // Will be calculated when position is closed
        };
        this.trades.push(trade);

        // Update account
        this.updateAccountInfo();
    }

    /**
     * Update position after order execution
     */
    private updatePosition(symbol: string, side: 'buy' | 'sell', quantity: number, price: number): void {
        let position = this.positions.get(symbol);
        
        if (!position) {
            position = {
                symbol,
                quantity: 0,
                averagePrice: 0,
                currentPrice: price,
                unrealizedPnl: 0,
                realizedPnl: 0,
                marketValue: 0
            };
        }

        if (side === 'buy') {
            const totalCost = position.quantity * position.averagePrice + quantity * price;
            const totalQuantity = position.quantity + quantity;
            position.quantity = totalQuantity;
            position.averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        } else {
            // Calculate realized P&L for sell
            const realizedPnl = (price - position.averagePrice) * quantity;
            position.realizedPnl += realizedPnl;
            position.quantity -= quantity;
            
            // Update trade P&L
            const lastTrade = this.trades[this.trades.length - 1];
            if (lastTrade && lastTrade.symbol === symbol) {
                lastTrade.pnl = realizedPnl;
            }
        }

        position.currentPrice = price;
        position.marketValue = position.quantity * price;
        position.unrealizedPnl = (price - position.averagePrice) * position.quantity;

        this.positions.set(symbol, position);
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId: string): Promise<boolean> {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') {
            return false;
        }

        order.status = 'cancelled';
        return true;
    }

    /**
     * Get order status
     */
    getOrderStatus(orderId: string): Order | null {
        return this.orders.get(orderId) || null;
    }

    /**
     * Get all orders
     */
    getOrders(): Order[] {
        return Array.from(this.orders.values());
    }

    /**
     * Get all positions
     */
    getPositions(): Position[] {
        return Array.from(this.positions.values());
    }

    /**
     * Get position for a symbol
     */
    getPosition(symbol: string): Position | null {
        return this.positions.get(symbol) || null;
    }

    /**
     * Get all trades
     */
    getTrades(): Trade[] {
        return [...this.trades];
    }

    /**
     * Get account information
     */
    getAccountInfo(): AccountInfo {
        return { ...this.accountInfo };
    }

    /**
     * Update account information
     */
    private updateAccountInfo(): void {
        // Calculate total unrealized P&L
        let totalUnrealizedPnl = 0;
        this.positions.forEach(position => {
            totalUnrealizedPnl += position.unrealizedPnl;
        });

        // Calculate total realized P&L
        let totalRealizedPnl = 0;
        this.trades.forEach(trade => {
            totalRealizedPnl += trade.pnl;
        });

        // Update account values
        this.accountInfo.equity = this.accountInfo.balance + totalRealizedPnl + totalUnrealizedPnl;
        this.accountInfo.availableFunds = this.accountInfo.equity - this.accountInfo.marginUsed;
        this.accountInfo.buyingPower = this.accountInfo.availableFunds;
    }

    /**
     * Update current prices for all positions
     */
    updatePrices(prices: Map<string, number>): void {
        this.currentPrices = new Map(prices);
        
        // Update position P&L
        this.positions.forEach((position, symbol) => {
            const currentPrice = prices.get(symbol) || position.currentPrice;
            position.currentPrice = currentPrice;
            position.marketValue = position.quantity * currentPrice;
            position.unrealizedPnl = (currentPrice - position.averagePrice) * position.quantity;
        });

        this.updateAccountInfo();
    }

    /**
     * Get total P&L
     */
    getTotalPnl(): { realized: number; unrealized: number; total: number } {
        let realizedPnl = 0;
        let unrealizedPnl = 0;

        this.positions.forEach(position => {
            realizedPnl += position.realizedPnl;
            unrealizedPnl += position.unrealizedPnl;
        });

        return {
            realized: realizedPnl,
            unrealized: unrealizedPnl,
            total: realizedPnl + unrealizedPnl
        };
    }

    /**
     * Get daily P&L
     */
    getDailyPnl(): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        return this.trades
            .filter(trade => trade.timestamp >= todayTimestamp)
            .reduce((sum, trade) => sum + trade.pnl, 0);
    }

    /**
     * Get win rate
     */
    getWinRate(): number {
        const winningTrades = this.trades.filter(trade => trade.pnl > 0).length;
        const totalTrades = this.trades.length;
        
        return totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    }

    /**
     * Get active positions count
     */
    getActivePositionsCount(): number {
        return Array.from(this.positions.values()).filter(pos => pos.quantity > 0).length;
    }

    /**
     * Reset all data (for testing)
     */
    reset(): void {
        this.accountInfo = {
            balance: 100000,
            availableFunds: 95000,
            buyingPower: 95000,
            equity: 100000,
            marginUsed: 0,
            marginAvailable: 95000
        };
        this.orders.clear();
        this.positions.clear();
        this.trades = [];
        this.orderIdCounter = 1;
        this.tradeIdCounter = 1;
        this.isConnected = false;
        this.currentPrices.clear();
        this.initializePositions();
    }

    /**
     * Get broker status
     */
    getStatus(): { connected: boolean; accountInfo: AccountInfo; positions: number; orders: number } {
        return {
            connected: this.isConnected,
            accountInfo: this.getAccountInfo(),
            positions: this.getActivePositionsCount(),
            orders: this.getOrders().filter(o => o.status === 'pending').length
        };
    }
}

// Export singleton instance
export const mockBroker = new MockBroker();
