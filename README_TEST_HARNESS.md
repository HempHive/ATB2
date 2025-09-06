# ATB2 Test Harness

A comprehensive testing and development environment for the ATB2 Auto Trading Bot application.

## Overview

This test harness provides:
- Mock data feeds for realistic market data simulation
- Mock broker for paper trading simulation
- State management for reactive UI updates
- E2E test suite with Playwright
- Accessibility and performance auditing
- Complete development environment

## Quick Start

1. **Setup**
   ```bash
   ./setup.sh
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm run test:e2e
   ```

## Project Structure

```
ATB2/
├── src/
│   ├── test-utils/
│   │   ├── mockFeed.ts          # Mock market data feed
│   │   └── mockBroker.ts        # Mock broker simulation
│   ├── state.ts                 # Central state management
│   └── test-harness.ts          # Main test harness
├── tests/e2e/
│   ├── smoke.spec.ts           # Basic functionality tests
│   ├── market-selection.spec.ts # Market selection tests
│   ├── bot-controls.spec.ts    # Bot control tests
│   ├── broker-status.spec.ts   # Broker connection tests
│   └── theme.spec.ts           # Theme customization tests
├── scripts/
│   ├── lighthouse.mjs          # Performance auditing
│   └── a11y.mjs               # Accessibility auditing
├── docs/
│   ├── audit.md               # Comprehensive audit report
│   ├── lighthouse-report.html # Performance report
│   └── a11y-report.md        # Accessibility report
└── package.json
```

## Features

### Mock Data Feed
- Deterministic market data generation
- Real-time price updates
- Historical data retrieval
- Multiple timeframe support
- Seeded random for consistent testing

### Mock Broker
- Paper trading simulation
- Order management and execution
- Position tracking
- P&L calculation
- Account balance management
- Commission and slippage simulation

### State Management
- Centralized application state
- Reactive UI updates
- Local storage persistence
- Event subscription system
- Type-safe state updates

### E2E Test Suite
- **Smoke Tests**: Basic app loading and component visibility
- **Market Selection**: Market selection and chart updates
- **Bot Controls**: Start/pause/reset functionality
- **Broker Status**: Connection and status updates
- **Theme Customization**: Theme switching and persistence

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing
- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests with UI
- `npm run test:e2e:headed` - Run tests in headed mode
- `npm run test:e2e:debug` - Debug tests

### Auditing
- `npm run audit:lighthouse` - Run Lighthouse performance audit
- `npm run audit:a11y` - Run accessibility audit

## Usage

### Running the Test Harness

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** to `http://localhost:3000`

3. **The test harness will automatically**:
   - Initialize mock data feeds
   - Set up state management
   - Wire UI controls to functionality
   - Start real-time data updates

### Testing Market Selection

1. Click on any market item (Commodities/Stocks/Crypto)
2. The chart should update with mock data
3. The "Current Market" header should update
4. P&L and stats should start updating

### Testing Bot Controls

1. Select a bot from the dropdown
2. Click "Start" - bot should become active
3. Click "Pause" - bot should pause
4. Click "Reset" - bot should reset

### Testing Broker Connection

1. Switch to "Live Trading" mode
2. Fill in broker credentials (any values work in mock mode)
3. Click "Connect" - status should change to "💚"
4. Account balance should update

### Testing Theme Customization

1. Click "GUI Customise" button
2. Select a preset theme or customize colors
3. Click "Apply" - UI should update immediately
4. Changes should persist across page reloads

## Mock Data Configuration

### Market Data
The mock feed generates realistic market data for:
- **Commodities**: SI=F (Silver), GC=F (Gold), CL=F (Oil), HG=F (Copper), PL=F (Platinum)
- **Stocks**: AAPL, GOOGL, MSFT, TSLA, AMZN
- **Crypto**: BTC-USD, ETH-USD

### Broker Simulation
The mock broker provides:
- $100,000 starting balance
- 0.1% commission rate
- 0.05% slippage simulation
- Real-time P&L calculation
- Position tracking

## Troubleshooting

### Common Issues

1. **Chart not loading**:
   - Check browser console for errors
   - Ensure Chart.js is loaded
   - Verify market selection is working

2. **Tests failing**:
   - Run `npx playwright install` to install browsers
   - Check that dev server is running on port 3000
   - Verify all dependencies are installed

3. **Mock data not updating**:
   - Check browser console for JavaScript errors
   - Verify test harness is loaded
   - Refresh the page

### Debug Mode

Enable debug mode by adding `?debug=true` to the URL:
```
http://localhost:3000?debug=true
```

This will show additional console logging and debug information.

## Contributing

### Adding New Tests

1. Create a new test file in `tests/e2e/`
2. Follow the existing test patterns
3. Use descriptive test names
4. Include both positive and negative test cases

### Extending Mock Data

1. Modify `src/test-utils/mockFeed.ts` for market data
2. Modify `src/test-utils/mockBroker.ts` for broker simulation
3. Update state management in `src/state.ts` if needed

### Adding New Features

1. Update the test harness in `src/test-harness.ts`
2. Add corresponding E2E tests
3. Update documentation

## Performance

### Lighthouse Scores
- **Performance**: 90+ (target)
- **Accessibility**: 95+ (target)
- **Best Practices**: 90+ (target)
- **SEO**: 85+ (target)

### Test Execution
- **Smoke Tests**: ~30 seconds
- **Full E2E Suite**: ~2 minutes
- **Lighthouse Audit**: ~1 minute
- **Accessibility Audit**: ~30 seconds

## Security

- No real API keys or credentials required
- All data is mock/simulated
- No external network calls in test mode
- Safe for development and testing

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the audit report in `docs/audit.md`
2. Review test results in `test-results/`
3. Check browser console for errors
4. Verify all dependencies are installed

## Next Steps

1. **Fix P0 Issues**: Implement chart integration and state management
2. **Add Real Features**: Build actual trading functionality
3. **Improve Tests**: Add more comprehensive test coverage
4. **Performance**: Optimize for production use
5. **Documentation**: Add user guides and API documentation
