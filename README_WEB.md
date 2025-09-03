# ATB - Auto Trading Bot Web Dashboard

A sophisticated web-based trading bot dashboard with real-time market data, advanced charting, and intelligent bot management.

## 🚀 Features

### 📊 **Modern Web Dashboard**
- **Black & Gold Theme** - Professional trading interface
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode Toggle** - Customizable interface
- **Real-time Updates** - Live market data and bot status

### 🤖 **7 Trading Bots**
- **5 Stock Bots** - AAPL, GOOGL, MSFT, TSLA, AMZN
- **2 Crypto Bots** - Bitcoin (BTC), Ethereum (ETH)
- **Individual Configuration** - Each bot operates independently
- **Multiple Strategies** - MA Cross, RSI, MACD, Bollinger Bands, EMA, Scalping, Swing

### 📈 **Advanced Charting**
- **Chart.js Integration** - Professional trading charts
- **Real-time Price Updates** - Live market data
- **Buy/Sell Signal Overlay** - Visual trade indicators
- **Historical View Toggle** - Switch between live and historical data
- **Multiple Timeframes** - 1H, 4H, 1D, 1W, 1M

### 🎛️ **Risk Management**
- **Floor Price Warnings** - Prevent losses below set thresholds
- **Daily Loss Limits** - Automatic trading halt on excessive losses
- **Position Limits** - Control maximum concurrent positions
- **Risk Profiles** - Low, Medium, High risk settings
- **Real-time Alerts** - Instant notifications for important events

### 📱 **Market Ticker**
- **Live Price Feed** - Scrolling ticker with all assets
- **Price Change Indicators** - Color-coded gains/losses
- **Auto-refresh** - Updates every 1-5 seconds
- **Asset Highlighting** - Emphasize bot-assigned assets

### 🔔 **Smart Alerts & Notifications**
- **Floor Price Alerts** - When assets drop below thresholds
- **Trade Executions** - Real-time trade notifications
- **System Status** - Connection and error alerts
- **Performance Warnings** - Daily loss limit notifications

### 💾 **Data Management**
- **CSV Export** - Download trading history and logs
- **JSON Export** - Complete system data backup
- **Local Storage** - Browser-based settings persistence
- **Cloud Sync Ready** - Prepared for cloud backend integration

### 🧪 **Simulation Mode**
- **Paper Trading** - Test strategies without real money
- **Historical Backtesting** - Validate strategies on past data
- **Risk-free Testing** - Perfect for strategy development

## 🛠️ **Technology Stack**

### Frontend
- **HTML5/CSS3** - Modern web standards
- **JavaScript (ES6+)** - Advanced client-side logic
- **Chart.js** - Professional charting library
- **Font Awesome** - Icon library
- **CSS Grid/Flexbox** - Responsive layout

### Backend
- **Flask** - Python web framework
- **Flask-SocketIO** - Real-time WebSocket communication
- **yfinance** - Yahoo Finance API integration
- **Pandas** - Data manipulation and analysis
- **Threading** - Background data updates

### Data Sources
- **Yahoo Finance** - Real-time stock data
- **WebSocket Feeds** - Live market updates
- **Local Caching** - Optimized data storage

## 🚀 **Quick Start**

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Web Application
```bash
python start_web.py
```

### 3. Access the Dashboard
Open your browser and navigate to:
```
http://localhost:5000
```

## 📋 **Usage Guide**

### **Selecting a Bot**
1. Use the **Bot Selector** dropdown in the sidebar
2. Choose from 7 available bots (5 stocks, 2 crypto)
3. Configure asset, frequency, and risk settings

### **Configuring Bot Settings**
- **Asset**: Select trading symbol (AAPL, GOOGL, BTC, etc.)
- **Frequency**: Choose update interval (Real-time, 1m, 5m, 15m, 1h)
- **Risk Profile**: Set risk level (Low, Medium, High)

### **Risk Management Setup**
- **Floor Price**: Set minimum price threshold
- **Daily Loss Limit**: Maximum daily loss amount
- **Max Positions**: Maximum concurrent trades

### **Starting Trading**
1. Configure your bot settings
2. Set risk parameters
3. Click **Start** to begin trading
4. Monitor performance in real-time

### **Monitoring Performance**
- **Live Stats**: Total P&L, Daily P&L, Win Rate
- **Market Graph**: Real-time price charts with signals
- **Alerts**: Important notifications and warnings
- **Ticker**: Live price feed for all assets

## 🔧 **API Endpoints**

### Bot Management
- `GET /api/bots` - Get all bots
- `GET /api/bots/<id>` - Get specific bot
- `POST /api/bots/<id>/start` - Start bot
- `POST /api/bots/<id>/stop` - Stop bot
- `PUT /api/bots/<id>/config` - Update bot config

### Market Data
- `GET /api/market-data` - Get all market data
- `GET /api/market-data/<asset>` - Get asset data
- `GET /api/ticker` - Get ticker data
- `GET /api/stats` - Get overall statistics

### Data Export
- `GET /api/export` - Export all data

## 🌐 **WebSocket Events**

### Client → Server
- `bot_action` - Start/stop bot actions
- `connect` - Client connection
- `disconnect` - Client disconnection

### Server → Client
- `initial_data` - Initial dashboard data
- `market_update` - Real-time market updates
- `trade_executed` - Trade execution notifications
- `bot_action_result` - Bot action confirmations

## 🎨 **Customization**

### **Theming**
The dashboard uses CSS custom properties for easy theming:
```css
:root {
    --bg-primary: #0a0a0a;
    --gold-primary: #ffd700;
    --text-primary: #ffffff;
    /* ... more variables */
}
```

### **Adding New Bots**
1. Update the `bots` dictionary in `web_app.py`
2. Add new bot configuration
3. Update the frontend bot selector

### **Custom Strategies**
1. Extend the `WebBotManager` class
2. Implement strategy logic
3. Add to bot configuration

## 📊 **Performance Features**

### **Auto-Correction & Intelligence**
- **Self-correction mechanisms** based on market signals
- **RSI/MACD/EMA analysis** for trend detection
- **Profit delta analysis** comparing expected vs actual results
- **Pullback detection** for optimal entry/exit points
- **AI tuning toggle** for dynamic strategy adjustment

### **Advanced Analytics**
- **Win rate tracking** per bot and overall
- **P&L analysis** with daily and total metrics
- **Trade frequency monitoring**
- **Risk-adjusted returns** calculation

## 🔒 **Security Features**

- **Paper trading mode** for safe testing
- **Risk limits** to prevent excessive losses
- **Floor price protection** against market crashes
- **Position size limits** for portfolio protection
- **Daily loss limits** with automatic halt

## 🚀 **Deployment Options**

### **Local Development**
```bash
python start_web.py
```

### **Production Deployment**
```bash
# Using Gunicorn
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 web_app:app

# Using Docker
docker build -t atb-dashboard .
docker run -p 5000:5000 atb-dashboard
```

### **Cloud Deployment**
- **Render** - Easy deployment with automatic scaling
- **Vercel** - Serverless deployment option
- **AWS/GCP/Azure** - Full cloud infrastructure

## 📈 **Future Enhancements**

### **Planned Features**
- **Multi-user support** with authentication
- **Advanced backtesting** with historical data
- **Machine learning** strategy optimization
- **Mobile app** for iOS/Android
- **Social trading** features
- **Portfolio management** tools

### **Integration Options**
- **Broker APIs** (Interactive Brokers, TD Ameritrade)
- **Crypto exchanges** (Binance, Coinbase Pro)
- **News sentiment** analysis
- **Economic calendar** integration
- **Social media** sentiment tracking

## 🐛 **Troubleshooting**

### **Common Issues**

**Dashboard not loading:**
- Check if port 5000 is available
- Verify all dependencies are installed
- Check browser console for errors

**Market data not updating:**
- Verify internet connection
- Check Yahoo Finance API status
- Review server logs for errors

**Bots not responding:**
- Ensure bot is properly configured
- Check risk settings and limits
- Verify market data availability

### **Logs and Debugging**
- Server logs: Check console output
- Browser logs: Open Developer Tools
- Market data: Check `/api/market-data` endpoint

## 📞 **Support**

For issues, feature requests, or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check server and browser logs
4. Create an issue with detailed information

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

**⚠️ Disclaimer**: This software is for educational and research purposes. Trading involves risk, and past performance does not guarantee future results. Always test strategies in simulation mode before using real money.
