# 🤖 ATB Auto Trading Bot v3.0

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![PyQt6](https://img.shields.io/badge/PyQt6-6.4+-green.svg)](https://pypi.org/project/PyQt6/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-red.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A sophisticated multi-platform trading bot system featuring both desktop GUI and web dashboard interfaces. Built with PyQt6 for desktop and Flask for web, ATB v3.0 provides comprehensive trading automation with real-time market data, advanced charting, and professional portfolio management.

## 🌟 Key Features

### 🖥️ **Dual Interface Support**
- **Desktop Application**: Native PyQt6 GUI with advanced controls
- **Web Dashboard**: Modern responsive web interface with real-time updates
- **Cross-Platform**: Works on Windows, macOS, and Linux

### 📊 **Advanced Trading Features**
- **Multi-Bot Management**: Run multiple trading bots simultaneously
- **Real-Time Market Data**: Live price feeds for stocks, crypto, and commodities
- **Interactive Charts**: Professional Chart.js integration with zoom and timeframe controls
- **Portfolio Management**: Comprehensive investment tracking and analysis
- **Risk Management**: Advanced stop-loss, position sizing, and daily limits

### 🎨 **Modern UI/UX**
- **8 Theme Presets**: Black & Gold, Sunrise, Neon, Purple Dark, Red Dark, Ocean, Sunset, Forest
- **Custom Theme Editor**: Real-time color and font customization
- **Portrait PNG Buttons**: Custom toolbar buttons with automatic fallback
- **Responsive Design**: Optimized for all screen sizes
- **Dark Gradients**: Professional panel styling with darker left-side gradients

### 📈 **Market Analysis Tools**
- **Market Review System**: Daily market analysis with dramatic shifts detection
- **Live Market Ticker**: Real-time price updates in footer
- **Performance Charts**: Visual representation of trading performance
- **PDF Report Generation**: Professional market analysis reports

### 🔧 **Technical Features**
- **Modular Architecture**: Pluggable strategies and broker integrations
- **Backtesting Engine**: Historical strategy testing with performance metrics
- **Comprehensive Logging**: Advanced logging system with export capabilities
- **Docker Support**: Containerized deployment options
- **REST API**: Full API support for external integrations

## 🚀 Quick Start

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/ATB2.git
   cd ATB2
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Applications

#### Desktop Application
```bash
python main.py
```

#### Web Dashboard
```bash
python start_web.py
# Or use the simple HTTP server
python -m http.server 8000
```

The web dashboard will be available at `http://localhost:5000` or `http://localhost:8000`

## 📁 Project Structure

```
ATB2/
├── 📱 Desktop Application
│   ├── main.py                          # Desktop app entry point
│   ├── gui/                             # PyQt6 GUI components
│   │   ├── main_window.py               # Main application window
│   │   ├── sidebar.py                   # Bot selection sidebar
│   │   ├── central_panel.py             # Main content area
│   │   └── bot_controls.py              # Bot control interface
│   └── core/                            # Core application logic
│       └── bot_manager.py               # Bot management system
│
├── 🌐 Web Application
│   ├── start_web.py                     # Web app entry point
│   ├── web_app.py                       # Flask backend
│   ├── index.html                       # Main web interface
│   ├── styles.css                       # Responsive CSS styling
│   └── app.js                           # Frontend JavaScript
│
├── 🧠 Core Components
│   ├── strategies/                      # Trading strategies
│   │   └── base_strategy.py             # Strategy base class
│   ├── brokers/                         # Broker integrations
│   │   └── base_broker.py               # Broker interface
│   ├── backtesting/                     # Backtesting engine
│   │   └── backtester.py                # Historical testing
│   ├── atb_logging/                     # Logging system
│   │   └── log_manager.py               # Centralized logging
│   └── config/                          # Configuration
│       ├── settings.py                  # App settings
│       └── app_config.json              # Configuration file
│
├── 🎨 Assets & Resources
│   ├── images/                          # Custom PNG buttons
│   │   ├── digital-account.png          # Account button
│   │   ├── digital-bank.png             # Bank button
│   │   ├── market-review.png            # Market review button
│   │   └── ...                          # Other toolbar buttons
│   ├── data/                            # Data storage
│   └── logs/                            # Application logs
│
├── 🐳 Deployment
│   ├── Dockerfile                       # Docker configuration
│   ├── docker-compose.yml               # Multi-container setup
│   └── requirements.txt                 # Python dependencies
│
└── 📚 Documentation
    ├── README.md                        # This file
    ├── FINAL_FEATURES_SUMMARY.md        # Feature documentation
    └── MARKET_FEATURES_SUMMARY.md       # Market features
```

## 🎯 Usage Guide

### Desktop Application

#### Main Interface
- **Sidebar**: Select and manage trading bots
- **Central Panel**: View logs, performance metrics, and trade history
- **Bot Controls**: Start/stop individual bots and configure settings
- **Menu Bar**: Access backtester, settings, and other tools

#### Sample Bots
The application comes with pre-configured sample bots:
1. **AAPL_MA_Bot**: Simple Moving Average strategy on AAPL
2. **GOOGL_RSI_Bot**: RSI strategy on GOOGL
3. **TSLA_MACD_Bot**: MACD strategy on TSLA

### Web Dashboard

#### Header Toolbar
- **Custom PNG Buttons**: Portrait-oriented custom buttons with fallback
- **Theme Customizer**: Real-time theme switching
- **Market Review**: Daily market analysis and reports
- **Portfolio Management**: Investment tracking and allocation

#### Main Dashboard
- **Market Graph**: Interactive Chart.js with multiple timeframes
- **Live Stats**: Real-time P&L and performance metrics
- **Active Bots**: Bot management and monitoring
- **Alerts**: System notifications and warnings

#### Footer
- **Market Ticker**: Real-time price updates
- **Version Info**: Application version and last update
- **Export Tools**: Data export and simulation mode

## 🎨 Theme Customization

### Built-in Themes
1. **Black & Gold** - Professional dark theme with gold accents
2. **Sunrise** - Warm yellow/orange sunrise theme
3. **Neon** - Bright neon colors with cyan and magenta accents
4. **Purple Dark** - Creative purple theme
5. **Red Dark** - Bold red theme
6. **Ocean** - Calming blue ocean theme
7. **Sunset** - Warm orange sunset theme
8. **Forest** - Natural green forest theme

### Custom Themes
- **Color Picker**: Customize all interface colors
- **Font Selection**: Choose from 20+ professional fonts
- **Real-time Preview**: See changes instantly
- **Export/Import**: Save and share custom themes

## 🔧 Configuration

### Application Settings
Configuration is stored in `config/app_config.json`:

```json
{
  "window": {
    "width": 1400,
    "height": 900,
    "theme": "dark"
  },
  "trading": {
    "paper_balance": 100000,
    "risk_per_trade": 0.02,
    "max_positions": 10
  },
  "logging": {
    "level": "INFO",
    "max_size": "10MB",
    "backup_count": 5
  }
}
```

### Broker Configuration
- **Paper Trading**: Built-in simulation mode
- **Live Trading**: Connect to real brokers
- **API Keys**: Secure credential management
- **Risk Controls**: Position sizing and limits

## 🧪 Development

### Adding New Strategies

1. Create a new strategy class in `strategies/`:
   ```python
   from strategies.base_strategy import BaseStrategy
   
   class MyStrategy(BaseStrategy):
       def __init__(self, config):
           super().__init__(config)
       
       def generate_signals(self, data):
           # Implement your strategy logic
           pass
   ```

2. Register in the strategy factory
3. Add to bot configuration

### Adding New Brokers

1. Create a new broker class in `brokers/`:
   ```python
   from brokers.base_broker import BaseBroker
   
   class MyBroker(BaseBroker):
       def __init__(self, config):
           super().__init__(config)
       
       def place_order(self, order):
           # Implement order placement
           pass
   ```

2. Register in the broker factory
3. Add configuration options

### Running Tests

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_strategies.py

# Run with coverage
pytest --cov=. tests/
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
docker build -t atb-trading-bot .

# Run the container
docker run -p 5000:5000 atb-trading-bot
```

## 📊 API Documentation

### REST Endpoints

#### Market Data
- `GET /api/market-data/<symbol>` - Get current market data
- `GET /api/historical-data/<symbol>` - Get historical data
- `GET /api/market-summary` - Get market summary

#### Bot Management
- `GET /api/bots` - List all bots
- `POST /api/bots` - Create new bot
- `PUT /api/bots/<id>` - Update bot
- `DELETE /api/bots/<id>` - Delete bot

#### Portfolio
- `GET /api/portfolio` - Get portfolio summary
- `POST /api/portfolio/invest` - Make investment
- `GET /api/portfolio/performance` - Get performance metrics

### WebSocket Events

- `market_update` - Real-time market data updates
- `bot_status` - Bot status changes
- `trade_executed` - Trade execution notifications
- `alert` - System alerts and warnings

## 🔒 Security Features

- **API Key Management**: Secure credential storage
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API rate limiting protection
- **Error Handling**: Graceful error management
- **Logging**: Comprehensive audit trails

## 📈 Performance Monitoring

### Metrics Tracked
- **Trading Performance**: P&L, win rate, drawdown
- **System Performance**: CPU, memory, network usage
- **Bot Performance**: Individual bot statistics
- **Market Performance**: Market analysis metrics

### Logging
- **Structured Logging**: JSON-formatted logs
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Log Rotation**: Automatic log file rotation
- **Export**: Log export in multiple formats

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `pytest`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- Follow PEP 8 for Python code
- Use type hints where appropriate
- Write comprehensive docstrings
- Include unit tests for new features

## 📝 Changelog

### v3.0.0 (Latest)
- ✨ Added web dashboard interface
- 🎨 Implemented 8 theme presets with custom editor
- 📊 Added market review system with PDF reports
- 🖼️ Custom PNG button support with portrait orientation
- 🌐 Real-time market ticker in footer
- 📱 Responsive design improvements
- 🔧 Enhanced bot management panel
- 📈 Interactive chart improvements

### v2.0.0
- 🖥️ Desktop GUI with PyQt6
- 🤖 Multi-bot management system
- 📊 Backtesting engine
- 🔌 Broker integrations
- 📝 Comprehensive logging

## 🐛 Troubleshooting

### Common Issues

#### Desktop Application Won't Start
```bash
# Check Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check PyQt6 installation
python -c "import PyQt6; print('PyQt6 installed successfully')"
```

#### Web Dashboard Issues
```bash
# Check Flask installation
pip install Flask Flask-CORS Flask-SocketIO

# Check port availability
netstat -an | grep 5000

# Run with debug mode
python start_web.py --debug
```

#### Market Data Not Loading
- Check internet connection
- Verify API keys are configured
- Check broker connection status
- Review logs for error messages

### Getting Help

1. **Check the logs**: Look in `logs/atb.log` for error messages
2. **Review documentation**: Check the feature summary files
3. **Open an issue**: Use GitHub Issues for bug reports
4. **Community support**: Join our Discord server

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**This software is for educational and research purposes only.**

- Trading involves substantial risk of loss and is not suitable for all investors
- Past performance does not guarantee future results
- Always test strategies thoroughly before live trading
- Never risk more than you can afford to lose
- Consult with financial professionals before making investment decisions

## 🙏 Acknowledgments

- **PyQt6 Team** - For the excellent GUI framework
- **Flask Team** - For the web framework
- **Chart.js** - For the charting library
- **Yahoo Finance** - For market data
- **Contributors** - Thank you to all contributors who help improve ATB

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/ATB2/issues)
- **Discord**: [Join our community](https://discord.gg/your-discord)
- **Email**: support@atb-trading.com
- **Documentation**: [Full documentation](https://docs.atb-trading.com)

---

**Made with ❤️ by the ATB Development Team**

*Happy Trading! 🚀📈*