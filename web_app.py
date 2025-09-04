#!/usr/bin/env python3
"""
ATB Web Application - Flask Backend
Provides REST API endpoints for the web dashboard
"""

import sys
import os
import json
import time
import threading
import io
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List
import random

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from flask import Flask, jsonify, request, send_from_directory, make_response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import yfinance as yf
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import pandas as pd
import csv
from io import StringIO

# Import existing ATB components
from core.bot_manager import BotManager
from atb_logging.log_manager import LogManager
from config.settings import load_settings

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
# Simple CSV persistence for Digital Bank assets
BANK_CSV_PATH = project_root / 'data' / 'digital_bank.csv'
BOT_STATE_PATH = project_root / 'data' / 'bot_state.json'
BOT_STATE_PATH = project_root / 'data' / 'bot_state.json'

def ensure_bank_csv():
    BANK_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not BANK_CSV_PATH.exists():
        with open(BANK_CSV_PATH, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id','name','ref','qty','value'])
            writer.writerow(['bank_1','Lamborghini','LAM-001','1','250000'])
            writer.writerow(['bank_2','A Seat in the Kop','KOP-1892','1','50000'])
            writer.writerow(['bank_3','Crypto-currency','CRY-001','3','15000'])

def read_bank_csv():
    ensure_bank_csv()
    assets = []
    with open(BANK_CSV_PATH, 'r') as f:
        rdr = csv.DictReader(f)
        for row in rdr:
            try:
                assets.append({
                    'id': row['id'],
                    'name': row['name'],
                    'ref': row['ref'],
                    'qty': int(row['qty']),
                    'value': float(row['value'])
                })
            except Exception:
                continue
    return assets

def write_bank_csv(assets):
    ensure_bank_csv()
    with open(BANK_CSV_PATH, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['id','name','ref','qty','value'])
        for a in assets:
            writer.writerow([a.get('id'), a.get('name'), a.get('ref'), a.get('qty'), a.get('value')])

def ensure_bot_state():
    BOT_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not BOT_STATE_PATH.exists():
        BOT_STATE_PATH.write_text(json.dumps({ 'botTrades': {}, 'botMetrics': {} }))

def read_bot_state():
    ensure_bot_state()
    try:
        return json.loads(BOT_STATE_PATH.read_text())
    except Exception:
        return { 'botTrades': {}, 'botMetrics': {} }

def write_bot_state(state: Dict[str, Any]):
    ensure_bot_state()
    BOT_STATE_PATH.write_text(json.dumps(state))

def ensure_bot_state():
    BOT_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not BOT_STATE_PATH.exists():
        BOT_STATE_PATH.write_text(json.dumps({ 'botTrades': {}, 'botMetrics': {} }))

def read_bot_state():
    ensure_bot_state()
    try:
        return json.loads(BOT_STATE_PATH.read_text())
    except Exception:
        return { 'botTrades': {}, 'botMetrics': {} }

def write_bot_state(state: Dict[str, Any]):
    ensure_bot_state()
    BOT_STATE_PATH.write_text(json.dumps(state))

# Global instances
log_manager = LogManager()
bot_manager = BotManager(log_manager)
settings = load_settings()

# Market data cache
market_data_cache = {}
ticker_data_cache = {}

# WebSocket clients
connected_clients = set()

# Live trading configuration
LIVE_TRADING_ENABLED = True
BROKER_CONFIGS = {
    'alpaca': {
        'name': 'Alpaca',
        'api_url': 'https://paper-api.alpaca.markets',
        'websocket_url': 'wss://stream.data.alpaca.markets/v2/iex'
    },
    'interactive_brokers': {
        'name': 'Interactive Brokers',
        'api_url': 'https://api.ibkr.com/v1',
        'websocket_url': 'wss://api.ibkr.com/v1/ws'
    },
    'td_ameritrade': {
        'name': 'TD Ameritrade',
        'api_url': 'https://api.tdameritrade.com/v1',
        'websocket_url': 'wss://stream.tdameritrade.com/v1'
    },
    'robinhood': {
        'name': 'Robinhood',
        'api_url': 'https://api.robinhood.com',
        'websocket_url': 'wss://stream.robinhood.com/v1'
    }
}

class WebBotManager:
    """Extended bot manager for web interface with 7 predefined bots."""
    
    def __init__(self):
        self.bots = {
            'bot1': {
                'id': 'bot1',
                'name': 'Stock Bot 1',
                'asset': 'AAPL',
                'type': 'stock',
                'strategy': 'MA_Cross',
                'active': False,
                'frequency': 'realtime',
                'risk': 'medium',
                'floor_price': 0,
                'daily_loss_limit': 1000,
                'max_positions': 10,
                'created': time.time(),
                'stats': {
                    'total_pnl': 0,
                    'daily_pnl': 0,
                    'trades_count': 0,
                    'win_rate': 0
                }
            },
            'bot2': {
                'id': 'bot2',
                'name': 'Stock Bot 2',
                'asset': 'GOOGL',
                'type': 'stock',
                'strategy': 'RSI',
                'active': False,
                'frequency': 'realtime',
                'risk': 'medium',
                'floor_price': 0,
                'daily_loss_limit': 1000,
                'max_positions': 10,
                'created': time.time(),
                'stats': {
                    'total_pnl': 0,
                    'daily_pnl': 0,
                    'trades_count': 0,
                    'win_rate': 0
                }
            },
            'bot3': {
                'id': 'bot3',
                'name': 'Stock Bot 3',
                'asset': 'MSFT',
                'type': 'stock',
                'strategy': 'MACD',
                'active': False,
                'frequency': 'realtime',
                'risk': 'medium',
                'floor_price': 0,
                'daily_loss_limit': 1000,
                'max_positions': 10,
                'created': time.time(),
                'stats': {
                    'total_pnl': 0,
                    'daily_pnl': 0,
                    'trades_count': 0,
                    'win_rate': 0
                }
            },
            'bot4': {
                'id': 'bot4',
                'name': 'Stock Bot 4',
                'asset': 'TSLA',
                'type': 'stock',
                'strategy': 'Bollinger',
                'active': False,
                'frequency': 'realtime',
                'risk': 'medium',
                'floor_price': 0,
                'daily_loss_limit': 1000,
                'max_positions': 10,
                'created': time.time(),
                'stats': {
                    'total_pnl': 0,
                    'daily_pnl': 0,
                    'trades_count': 0,
                    'win_rate': 0
                }
            },
            'bot5': {
                'id': 'bot5',
                'name': 'Stock Bot 5',
                'asset': 'AMZN',
                'type': 'stock',
                'strategy': 'EMA',
                'active': False,
                'frequency': 'realtime',
                'risk': 'medium',
                'floor_price': 0,
                'daily_loss_limit': 1000,
                'max_positions': 10,
                'created': time.time(),
                'stats': {
                    'total_pnl': 0,
                    'daily_pnl': 0,
                    'trades_count': 0,
                    'win_rate': 0
                }
            },
            'bot6': {
                'id': 'bot6',
                'name': 'Crypto Bot 1',
                'asset': 'BTC',
                'type': 'crypto',
                'strategy': 'Scalping',
                'active': False,
                'frequency': 'realtime',
                'risk': 'high',
                'floor_price': 0,
                'daily_loss_limit': 2000,
                'max_positions': 5,
                'created': time.time(),
                'stats': {
                    'total_pnl': 0,
                    'daily_pnl': 0,
                    'trades_count': 0,
                    'win_rate': 0
                }
            },
            'bot7': {
                'id': 'bot7',
                'name': 'Crypto Bot 2',
                'asset': 'ETH',
                'type': 'crypto',
                'strategy': 'Swing',
                'active': False,
                'frequency': 'realtime',
                'risk': 'high',
                'floor_price': 0,
                'daily_loss_limit': 2000,
                'max_positions': 5,
                'created': time.time(),
                'stats': {
                    'total_pnl': 0,
                    'daily_pnl': 0,
                    'trades_count': 0,
                    'win_rate': 0
                }
            }
        }
        
        self.market_data_thread = None
        self.running = False
        self.live_trading_enabled = False
        self.broker_connections = {}
        self.account_balances = {}
        self.investments = []
        self.available_markets = {}
        self.market_data_history = {}
        
    def start_market_data_updates(self):
        """Start background thread for market data updates."""
        if not self.running:
            self.running = True
            self.market_data_thread = threading.Thread(target=self._update_market_data_loop)
            self.market_data_thread.daemon = True
            self.market_data_thread.start()
    
    def stop_market_data_updates(self):
        """Stop market data updates."""
        self.running = False
        if self.market_data_thread:
            self.market_data_thread.join()
    
    def _update_market_data_loop(self):
        """Background loop for updating market data."""
        while self.running:
            try:
                self._update_market_data()
                self._update_ticker_data()
                self._simulate_trading_activity()
                
                # Emit updates to connected clients
                if connected_clients:
                    socketio.emit('market_update', {
                        'market_data': market_data_cache,
                        'ticker_data': ticker_data_cache,
                        'timestamp': datetime.now().isoformat()
                    })
                
                time.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                log_manager.log_error(f"Market data update error: {str(e)}")
                time.sleep(10)  # Wait longer on error
    
    def _update_market_data(self):
        """Update market data for all assets."""
        # Standard assets
        assets = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'BTC-USD', 'ETH-USD']
        
        # Add commodity futures
        commodity_assets = ['SI=F', 'GC=F', 'CL=F', 'HG=F', 'PL=F', 'PA=F', 'NG=F', 'ZW=F', 'ZC=F', 'ZS=F']
        assets.extend(commodity_assets)
        
        for asset in assets:
            try:
                # Use yfinance for real data
                ticker = yf.Ticker(asset)
                hist = ticker.history(period="1d", interval="1m")
                
                if not hist.empty:
                    # Convert to our format
                    data = []
                    for timestamp, row in hist.iterrows():
                        data.append({
                            'time': timestamp.isoformat(),
                            'price': float(row['Close']),
                            'volume': int(row['Volume']),
                            'high': float(row['High']),
                            'low': float(row['Low']),
                            'open': float(row['Open'])
                        })
                    
                    # Store in cache and history
                    clean_asset = asset.replace('-USD', '').replace('=F', '')
                    market_data_cache[clean_asset] = data
                    
                    # Store historical data for zoom functionality
                    if clean_asset not in self.market_data_history:
                        self.market_data_history[clean_asset] = []
                    
                    # Keep last 1000 data points for historical analysis
                    self.market_data_history[clean_asset].extend(data)
                    if len(self.market_data_history[clean_asset]) > 1000:
                        self.market_data_history[clean_asset] = self.market_data_history[clean_asset][-1000:]
                    
            except Exception as e:
                log_manager.log_error(f"Error fetching data for {asset}: {str(e)}")
                # Fallback to simulated data
                self._generate_simulated_data(asset.replace('-USD', '').replace('=F', ''))
    
    def _generate_simulated_data(self, asset):
        """Generate simulated market data."""
        base_prices = {
            'AAPL': 150, 'GOOGL': 2800, 'MSFT': 300, 'TSLA': 200, 'AMZN': 3200,
            'BTC': 45000, 'ETH': 3000,
            'SI': 24.50, 'GC': 1950.00, 'CL': 75.30, 'HG': 3.85, 'PL': 950.00,
            'PA': 1200.00, 'NG': 2.85, 'ZW': 6.50, 'ZC': 5.20, 'ZS': 12.80
        }
        
        base_price = base_prices.get(asset, 100)
        now = datetime.now()
        
        data = []
        for i in range(100):  # Last 100 minutes
            timestamp = now - timedelta(minutes=100-i)
            price = base_price + random.uniform(-base_price*0.05, base_price*0.05)
            
            data.append({
                'time': timestamp.isoformat(),
                'price': price,
                'volume': random.randint(100000, 1000000),
                'high': price * 1.02,
                'low': price * 0.98,
                'open': price * random.uniform(0.99, 1.01)
            })
        
        market_data_cache[asset] = data
    
    def _update_ticker_data(self):
        """Update ticker data for all assets."""
        assets = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'BTC', 'ETH']
        
        for asset in assets:
            if asset in market_data_cache and market_data_cache[asset]:
                latest = market_data_cache[asset][-1]
                previous = market_data_cache[asset][-2] if len(market_data_cache[asset]) > 1 else latest
                
                change = latest['price'] - previous['price']
                change_percent = (change / previous['price']) * 100
                
                ticker_data_cache[asset] = {
                    'symbol': asset,
                    'price': latest['price'],
                    'change': change,
                    'change_percent': change_percent,
                    'volume': latest['volume'],
                    'timestamp': latest['time']
                }
    
    def _simulate_trading_activity(self):
        """Simulate trading activity for active bots."""
        for bot_id, bot in self.bots.items():
            if bot['active'] and random.random() < 0.1:  # 10% chance of trade
                asset = bot['asset']
                if asset in market_data_cache and market_data_cache[asset]:
                    current_price = market_data_cache[asset][-1]['price']
                    
                    # Simulate trade
                    trade_type = random.choice(['BUY', 'SELL'])
                    quantity = random.randint(1, 10)
                    trade_amount = current_price * quantity
                    
                    # Update bot stats
                    if trade_type == 'BUY':
                        bot['stats']['total_pnl'] -= trade_amount * 0.001  # Simulate fees
                    else:
                        bot['stats']['total_pnl'] += trade_amount * 0.001
                    
                    bot['stats']['trades_count'] += 1
                    
                    # Emit trade event
                    if connected_clients:
                        socketio.emit('trade_executed', {
                            'bot_id': bot_id,
                            'bot_name': bot['name'],
                            'asset': asset,
                            'trade_type': trade_type,
                            'quantity': quantity,
                            'price': current_price,
                            'timestamp': datetime.now().isoformat()
                        })
    
    def get_bot(self, bot_id: str) -> Dict[str, Any]:
        """Get bot information."""
        return self.bots.get(bot_id, {})
    
    def get_all_bots(self) -> Dict[str, Dict[str, Any]]:
        """Get all bots."""
        return self.bots.copy()
    
    def update_bot_config(self, bot_id: str, config: Dict[str, Any]) -> bool:
        """Update bot configuration."""
        if bot_id not in self.bots:
            return False
        
        # Don't allow config changes while bot is active
        if self.bots[bot_id]['active']:
            return False
        
        self.bots[bot_id].update(config)
        return True
    
    def start_bot(self, bot_id: str) -> bool:
        """Start a bot."""
        if bot_id not in self.bots:
            return False
        
        self.bots[bot_id]['active'] = True
        self.bots[bot_id]['started'] = time.time()
        
        log_manager.log_info(f"Started bot: {self.bots[bot_id]['name']}")
        return True
    
    def stop_bot(self, bot_id: str) -> bool:
        """Stop a bot."""
        if bot_id not in self.bots:
            return False
        
        self.bots[bot_id]['active'] = False
        self.bots[bot_id]['stopped'] = time.time()
        
        log_manager.log_info(f"Stopped bot: {self.bots[bot_id]['name']}")
        return True
    
    def get_market_data(self, asset: str, timeframe: str = '1h') -> List[Dict[str, Any]]:
        """Get market data for an asset."""
        return market_data_cache.get(asset, [])
    
    def get_ticker_data(self) -> List[Dict[str, Any]]:
        """Get all ticker data."""
        return list(ticker_data_cache.values())
    
    def connect_broker(self, broker_name: str, api_key: str, api_secret: str) -> bool:
        """Connect to a broker for live trading."""
        try:
            if broker_name not in BROKER_CONFIGS:
                return False
            
            # Simulate broker connection
            # In a real implementation, this would make actual API calls
            broker_config = BROKER_CONFIGS[broker_name]
            
            # Store connection info (in production, use secure storage)
            self.broker_connections[broker_name] = {
                'api_key': api_key,
                'api_secret': api_secret,
                'connected': True,
                'config': broker_config
            }
            
            # Simulate account balance
            self.account_balances[broker_name] = {
                'balance': 100000.0,
                'available': 95000.0,
                'equity': 100000.0,
                'last_updated': datetime.now().isoformat()
            }
            
            log_manager.log_info(f"Connected to broker: {broker_name}")
            return True
            
        except Exception as e:
            log_manager.log_error(f"Failed to connect to broker {broker_name}: {str(e)}")
            return False
    
    def get_account_balance(self, broker_name: str) -> Dict[str, Any]:
        """Get account balance for a broker."""
        return self.account_balances.get(broker_name, {})
    
    def execute_live_trade(self, bot_id: str, trade_type: str, symbol: str, quantity: int, price: float) -> bool:
        """Execute a live trade through connected broker."""
        try:
            if not self.live_trading_enabled:
                return False
            
            # Find which broker to use (simplified - in production, map bots to brokers)
            broker_name = list(self.broker_connections.keys())[0] if self.broker_connections else None
            
            if not broker_name:
                return False
            
            # Simulate trade execution
            # In a real implementation, this would make actual broker API calls
            trade_result = {
                'order_id': f"ORD_{int(time.time())}",
                'symbol': symbol,
                'side': trade_type,
                'quantity': quantity,
                'price': price,
                'status': 'filled',
                'timestamp': datetime.now().isoformat(),
                'broker': broker_name
            }
            
            # Update account balance
            if broker_name in self.account_balances:
                trade_value = quantity * price
                if trade_type == 'BUY':
                    self.account_balances[broker_name]['available'] -= trade_value
                else:
                    self.account_balances[broker_name]['available'] += trade_value
                
                self.account_balances[broker_name]['last_updated'] = datetime.now().isoformat()
            
            log_manager.log_info(f"Live trade executed: {trade_type} {quantity} {symbol} @ ${price}")
            
            # Emit trade event to connected clients
            if connected_clients:
                socketio.emit('live_trade_executed', trade_result)
            
            return True
            
        except Exception as e:
            log_manager.log_error(f"Failed to execute live trade: {str(e)}")
            return False

# Initialize web bot manager
web_bot_manager = WebBotManager()

# API Routes
@app.route('/')
def index():
    """Serve the main dashboard."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files."""
    return send_from_directory('.', filename)

@app.route('/api/bots', methods=['GET'])
def get_bots():
    """Get all bots."""
    return jsonify(web_bot_manager.get_all_bots())

@app.route('/api/bots/<bot_id>', methods=['GET'])
def get_bot(bot_id):
    """Get specific bot."""
    bot = web_bot_manager.get_bot(bot_id)
    if not bot:
        return jsonify({'error': 'Bot not found'}), 404
    return jsonify(bot)

@app.route('/api/bots/<bot_id>/start', methods=['POST'])
def start_bot(bot_id):
    """Start a bot."""
    if web_bot_manager.start_bot(bot_id):
        return jsonify({'success': True, 'message': 'Bot started'})
    return jsonify({'error': 'Failed to start bot'}), 400

@app.route('/api/bots/<bot_id>/stop', methods=['POST'])
def stop_bot(bot_id):
    """Stop a bot."""
    if web_bot_manager.stop_bot(bot_id):
        return jsonify({'success': True, 'message': 'Bot stopped'})
    return jsonify({'error': 'Failed to stop bot'}), 400

@app.route('/api/bots/<bot_id>/config', methods=['PUT'])
def update_bot_config(bot_id):
    """Update bot configuration."""
    config = request.get_json()
    if web_bot_manager.update_bot_config(bot_id, config):
        return jsonify({'success': True, 'message': 'Configuration updated'})
    return jsonify({'error': 'Failed to update configuration'}), 400

@app.route('/api/market-data', methods=['GET'])
def get_market_data():
    """Get market data for all assets."""
    return jsonify(market_data_cache)

@app.route('/api/market-data/<asset>', methods=['GET'])
def get_asset_market_data(asset):
    """Get market data for specific asset."""
    timeframe = request.args.get('timeframe', '1h')
    data = web_bot_manager.get_market_data(asset, timeframe)
    return jsonify(data)

@app.route('/api/bank/assets', methods=['GET'])
def bank_list_assets():
    return jsonify({'assets': read_bank_csv()})

@app.route('/api/bank/assets', methods=['POST'])
def bank_add_asset():
    incoming = request.get_json() or {}
    assets = read_bank_csv()
    assets.append({
        'id': incoming.get('id') or f"bank_{int(time.time())}",
        'name': incoming.get('name', ''),
        'ref': incoming.get('ref', ''),
        'qty': int(incoming.get('qty') or 0),
        'value': float(incoming.get('value') or 0)
    })
    write_bank_csv(assets)
    return jsonify({'success': True})

@app.route('/api/bank/assets/<asset_id>', methods=['PUT'])
def bank_update_asset(asset_id):
    incoming = request.get_json() or {}
    assets = read_bank_csv()
    updated = False
    for a in assets:
        if a['id'] == asset_id:
            a['name'] = incoming.get('name', a['name'])
            a['ref'] = incoming.get('ref', a['ref'])
            a['qty'] = int(incoming.get('qty', a['qty']))
            a['value'] = float(incoming.get('value', a['value']))
            updated = True
            break
    if updated:
        write_bank_csv(assets)
        return jsonify({'success': True})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/bank/assets/<asset_id>', methods=['DELETE'])
def bank_delete_asset(asset_id):
    assets = read_bank_csv()
    assets = [a for a in assets if a['id'] != asset_id]
    write_bank_csv(assets)
    return jsonify({'success': True})

@app.route('/api/ticker', methods=['GET'])
def get_ticker_data():
    """Get ticker data."""
    return jsonify(web_bot_manager.get_ticker_data())

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics."""
    total_pnl = sum(bot['stats']['total_pnl'] for bot in web_bot_manager.bots.values())
    daily_pnl = sum(bot['stats']['daily_pnl'] for bot in web_bot_manager.bots.values())
    active_bots = sum(1 for bot in web_bot_manager.bots.values() if bot['active'])
    total_trades = sum(bot['stats']['trades_count'] for bot in web_bot_manager.bots.values())
    
    return jsonify({
        'total_pnl': total_pnl,
        'daily_pnl': daily_pnl,
        'active_bots': active_bots,
        'total_trades': total_trades,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/export', methods=['GET'])
def export_data():
    """Export all data."""
    export_data = {
        'bots': web_bot_manager.get_all_bots(),
        'market_data': market_data_cache,
        'ticker_data': ticker_data_cache,
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(export_data)

@app.route('/api/bots/state', methods=['GET'])
def bots_state_get():
    return jsonify(read_bot_state())

@app.route('/api/bots/state', methods=['POST'])
def bots_state_post():
    payload = request.get_json() or {}
    safe = {
        'botTrades': payload.get('botTrades', {}),
        'botMetrics': payload.get('botMetrics', {})
    }
    write_bot_state(safe)
    return jsonify({'success': True})

@app.route('/api/broker/connect', methods=['POST'])
def connect_broker():
    """Connect to a broker for live trading."""
    data = request.get_json()
    broker_name = data.get('broker')
    api_key = data.get('api_key')
    api_secret = data.get('api_secret')
    
    if not all([broker_name, api_key, api_secret]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    success = web_bot_manager.connect_broker(broker_name, api_key, api_secret)
    
    if success:
        return jsonify({'success': True, 'message': f'Connected to {broker_name}'})
    else:
        return jsonify({'error': 'Failed to connect to broker'}), 400

@app.route('/api/broker/balance/<broker_name>', methods=['GET'])
def get_broker_balance(broker_name):
    """Get account balance for a broker."""
    balance = web_bot_manager.get_account_balance(broker_name)
    if balance:
        return jsonify(balance)
    else:
        return jsonify({'error': 'Broker not found or not connected'}), 404

@app.route('/api/live-trading/enable', methods=['POST'])
def enable_live_trading():
    """Enable live trading mode."""
    web_bot_manager.live_trading_enabled = True
    return jsonify({'success': True, 'message': 'Live trading enabled'})

@app.route('/api/live-trading/disable', methods=['POST'])
def disable_live_trading():
    """Disable live trading mode."""
    web_bot_manager.live_trading_enabled = False
    return jsonify({'success': True, 'message': 'Live trading disabled'})

@app.route('/api/live-trading/execute', methods=['POST'])
def execute_live_trade():
    """Execute a live trade."""
    data = request.get_json()
    bot_id = data.get('bot_id')
    trade_type = data.get('trade_type')
    symbol = data.get('symbol')
    quantity = data.get('quantity')
    price = data.get('price')
    
    if not all([bot_id, trade_type, symbol, quantity, price]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    success = web_bot_manager.execute_live_trade(bot_id, trade_type, symbol, quantity, price)
    
    if success:
        return jsonify({'success': True, 'message': 'Trade executed successfully'})
    else:
        return jsonify({'error': 'Failed to execute trade'}), 400

@app.route('/api/markets/search', methods=['POST'])
def search_markets():
    """Search for available markets."""
    data = request.get_json()
    search_term = data.get('search_term', '').lower()
    
    # Mock market data - in production, use real market APIs
    all_markets = {
        'silver': {'symbol': 'SI=F', 'name': 'Silver Futures', 'price': 24.50, 'type': 'commodity'},
        'gold': {'symbol': 'GC=F', 'name': 'Gold Futures', 'price': 1950.00, 'type': 'commodity'},
        'oil': {'symbol': 'CL=F', 'name': 'Crude Oil Futures', 'price': 75.30, 'type': 'commodity'},
        'copper': {'symbol': 'HG=F', 'name': 'Copper Futures', 'price': 3.85, 'type': 'commodity'},
        'platinum': {'symbol': 'PL=F', 'name': 'Platinum Futures', 'price': 950.00, 'type': 'commodity'},
        'palladium': {'symbol': 'PA=F', 'name': 'Palladium Futures', 'price': 1200.00, 'type': 'commodity'},
        'natural gas': {'symbol': 'NG=F', 'name': 'Natural Gas Futures', 'price': 2.85, 'type': 'commodity'},
        'wheat': {'symbol': 'ZW=F', 'name': 'Wheat Futures', 'price': 6.50, 'type': 'commodity'},
        'corn': {'symbol': 'ZC=F', 'name': 'Corn Futures', 'price': 5.20, 'type': 'commodity'},
        'soybeans': {'symbol': 'ZS=F', 'name': 'Soybean Futures', 'price': 12.80, 'type': 'commodity'}
    }
    
    results = []
    for key, market in all_markets.items():
        if search_term in key or search_term in market['name'].lower():
            results.append({**market, 'key': key})
    
    return jsonify({'results': results})

@app.route('/api/markets/add', methods=['POST'])
def add_market():
    """Add a new market to the system."""
    data = request.get_json()
    market_data = data.get('market')
    
    if not market_data:
        return jsonify({'error': 'Market data required'}), 400
    
    # Add market to available markets
    web_bot_manager.available_markets[market_data['symbol']] = market_data
    
    # Create new bot for this market
    bot_id = f"bot_{int(time.time())}"
    bot_name = f"{market_data['name']} Bot"
    
    web_bot_manager.bots[bot_id] = {
        'id': bot_id,
        'name': bot_name,
        'asset': market_data['symbol'],
        'type': market_data['type'],
        'strategy': 'Custom',
        'active': False,
        'frequency': 'realtime',
        'risk': 'medium',
        'floor_price': 0,
        'daily_loss_limit': 1000,
        'max_positions': 10,
        'created': time.time(),
        'market': market_data,
        'stats': {
            'total_pnl': 0,
            'daily_pnl': 0,
            'trades_count': 0,
            'win_rate': 0
        }
    }
    
    return jsonify({'success': True, 'bot_id': bot_id, 'message': f'Added {bot_name}'})

@app.route('/api/investments', methods=['GET'])
def get_investments():
    """Get all investments."""
    return jsonify(web_bot_manager.investments)

@app.route('/api/investments', methods=['POST'])
def add_investment():
    """Add a new investment."""
    data = request.get_json()
    
    investment = {
        'id': int(time.time()),
        'type': data.get('type'),
        'category': data.get('category'),
        'amount': data.get('amount'),
        'date': datetime.now().isoformat(),
        'status': 'active'
    }
    
    web_bot_manager.investments.append(investment)
    
    return jsonify({'success': True, 'investment': investment})

@app.route('/api/investments/<int:investment_id>', methods=['DELETE'])
def remove_investment(investment_id):
    """Remove an investment."""
    web_bot_manager.investments = [
        inv for inv in web_bot_manager.investments 
        if inv['id'] != investment_id
    ]
    
    return jsonify({'success': True, 'message': 'Investment removed'})

@app.route('/api/market-data/<asset>/history', methods=['GET'])
def get_market_history(asset):
    """Get historical market data for zoom functionality."""
    history = web_bot_manager.market_data_history.get(asset, [])
    return jsonify(history)

@app.route('/api/market-data/<asset>/timeframe', methods=['GET'])
def get_market_data_timeframe(asset):
    """Get market data for specific timeframe."""
    timeframe = request.args.get('timeframe', '1d')
    tf_map = {
        '1m': ('1d', '1m'),
        '5m': ('5d', '5m'),
        '15m': ('5d', '15m'),
        '1h': ('7d', '60m'),
        '4h': ('1mo', '60m'),
        '1d': ('1mo', '1d'),
        '1w': ('3mo', '1d'),
        '1M': ('6mo', '1d'),
        '3M': ('1y', '1d'),
        '6M': ('2y', '1d'),
        '1y': ('5y', '1d')
    }
    period, interval = tf_map.get(timeframe, ('1mo', '1d'))
    try:
        ticker = yf.Ticker(asset)
        hist = ticker.history(period=period, interval=interval)
        if not hist.empty:
            data = []
            for timestamp, row in hist.iterrows():
                data.append({
                    'time': timestamp.isoformat(),
                    'price': float(row['Close']),
                    'volume': int(row.get('Volume', 0) or 0),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'open': float(row['Open'])
                })
            return jsonify(data)
        return jsonify({'error': 'No data available'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market-review/pdf', methods=['GET'])
def generate_market_review_pdf():
    """Generate PDF report for market review."""
    try:
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, spaceAfter=30, alignment=TA_CENTER)
        heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=16, spaceAfter=12)
        
        # Build PDF content
        story = []
        
        # Title
        story.append(Paragraph("ATB - Auto Trading Bot Market Review", title_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Market Summary
        story.append(Paragraph("Market Summary", heading_style))
        story.append(Paragraph("Daily market performance analysis and dramatic shifts.", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Market Performance Table
        markets_data = [
            ['Market', 'Symbol', 'Current Price', 'Daily Change', 'Volatility'],
            ['Silver Futures', 'SI=F', '$24.50', '+2.1%', 'Medium'],
            ['Gold Futures', 'GC=F', '$1,950.00', '-0.5%', 'Low'],
            ['Crude Oil', 'CL=F', '$75.30', '+3.2%', 'High'],
            ['Bitcoin', 'BTC-USD', '$45,000.00', '+15.2%', 'Very High'],
            ['Apple', 'AAPL', '$150.00', '+1.8%', 'Low'],
            ['Tesla', 'TSLA', '$200.00', '+12.3%', 'High']
        ]
        
        market_table = Table(markets_data)
        market_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(market_table)
        story.append(Spacer(1, 20))
        
        # Dramatic Shifts
        story.append(Paragraph("Dramatic Market Shifts", heading_style))
        shifts_data = [
            ['Time', 'Market', 'Event', 'Impact'],
            ['09:30 AM', 'BTC', 'Bitcoin surged 15% in the last hour', '+15.2%'],
            ['10:15 AM', 'SI=F', 'Silver dropped 8% due to volatility', '-8.1%'],
            ['11:00 AM', 'TSLA', 'Tesla gained 12% on earnings', '+12.3%'],
            ['02:30 PM', 'GC=F', 'Gold stabilized after morning dip', '+2.1%']
        ]
        
        shifts_table = Table(shifts_data)
        shifts_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(shifts_table)
        story.append(Spacer(1, 20))
        
        # Bot Performance
        story.append(Paragraph("Bot Performance Summary", heading_style))
        bot_data = [
            ['Bot Name', 'Asset', 'Status', 'P&L', 'Trades'],
            ['Stock Bot 1', 'AAPL', 'Active', '+$1,250.00', '15'],
            ['Crypto Bot 1', 'BTC', 'Active', '+$3,450.00', '8'],
            ['Commodity Bot 1', 'SI=F', 'Paused', '-$150.00', '3'],
            ['Stock Bot 2', 'GOOGL', 'Active', '+$890.00', '12']
        ]
        
        bot_table = Table(bot_data)
        bot_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(bot_table)
        story.append(Spacer(1, 20))
        
        # If requested, include a specific bot's trades (simple example)
        bot_id = request.args.get('bot_id')
        if bot_id:
            state = read_bot_state()
            trades = state.get('botTrades', {}).get(bot_id, [])
            story.append(Paragraph(f"Trades for {bot_id}", heading_style))
            trades_data = [['Time', 'Type', 'Price']]
            for t in trades[-50:]:
                ts = datetime.fromtimestamp(t.get('timestamp', time.time())/1000.0).strftime('%Y-%m-%d %H:%M') if t.get('timestamp') else '-'
                trades_data.append([ts, t.get('type','-'), f"${t.get('price',0):.2f}"])
            ttable = Table(trades_data)
            ttable.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 1, colors.black),
                ('BACKGROUND', (0,0), (-1,0), colors.darkgrey),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ]))
            story.append(ttable)
        
        # Footer
        story.append(Paragraph("This report was generated automatically by the ATB Auto Trading Bot Dashboard.", styles['Normal']))
        story.append(Paragraph("For more information, visit the dashboard at http://localhost:5000", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Create response
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=market_review_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    connected_clients.add(request.sid)
    log_manager.log_info(f"Client connected: {request.sid}")
    
    # Send initial data
    emit('initial_data', {
        'bots': web_bot_manager.get_all_bots(),
        'market_data': market_data_cache,
        'ticker_data': ticker_data_cache
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    connected_clients.discard(request.sid)
    log_manager.log_info(f"Client disconnected: {request.sid}")

@socketio.on('bot_action')
def handle_bot_action(data):
    """Handle bot actions from client."""
    action = data.get('action')
    bot_id = data.get('bot_id')
    
    if action == 'start':
        success = web_bot_manager.start_bot(bot_id)
    elif action == 'stop':
        success = web_bot_manager.stop_bot(bot_id)
    else:
        success = False
    
    emit('bot_action_result', {
        'action': action,
        'bot_id': bot_id,
        'success': success
    })

if __name__ == '__main__':
    try:
        # Start market data updates
        web_bot_manager.start_market_data_updates()
        
        # Start Flask-SocketIO server
        log_manager.log_info("Starting ATB Web Application...")
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
        
    except KeyboardInterrupt:
        log_manager.log_info("Shutting down ATB Web Application...")
        web_bot_manager.stop_market_data_updates()
    except Exception as e:
        log_manager.log_error(f"Application error: {str(e)}")
        web_bot_manager.stop_market_data_updates()
