#!/usr/bin/env python3
"""
ATB Web Application Startup Script
Starts the web dashboard and backend services
"""

import sys
import os
import subprocess
import time
from pathlib import Path

def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import flask
        import flask_cors
        import flask_socketio
        import yfinance
        print("✓ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Please install dependencies with: pip install -r requirements.txt")
        return False

def start_web_app():
    """Start the web application."""
    if not check_dependencies():
        return False
    
    print("🚀 Starting ATB Web Dashboard...")
    print("📊 Dashboard will be available at: http://localhost:5000")
    print("🔄 Press Ctrl+C to stop the application")
    print("-" * 50)
    
    try:
        # Start the web application
        from web_app import app, socketio, web_bot_manager
        
        # Start market data updates
        web_bot_manager.start_market_data_updates()
        
        # Run the application
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ATB Web Dashboard...")
        web_bot_manager.stop_market_data_updates()
        print("✅ Shutdown complete")
    except Exception as e:
        print(f"❌ Error starting web application: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = start_web_app()
    sys.exit(0 if success else 1)
