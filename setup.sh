#!/bin/bash

echo "Setting up ATB2 Test Harness..."
echo "==============================="

# Install dependencies
echo "Installing dependencies..."
npm install

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install

# Create necessary directories
echo "Creating directories..."
mkdir -p docs
mkdir -p test-results
mkdir -p src/test-utils

# Make scripts executable
chmod +x scripts/lighthouse.mjs
chmod +x scripts/a11y.mjs

echo "Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run test:e2e     - Run E2E tests"
echo "  npm run audit:lighthouse - Run Lighthouse audit"
echo "  npm run audit:a11y   - Run accessibility audit"
echo ""
echo "Start the development server with: npm run dev"
