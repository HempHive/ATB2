/**
 * Market Selection Tests for ATB2
 * Tests market selection functionality and chart updates
 */

import { test, expect } from '@playwright/test';

test.describe('Market Selection Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('selecting a commodity updates current market display', async ({ page }) => {
        // Click on Silver commodity
        await page.click('.market-item[data-symbol="SI=F"]');
        
        // Check that the market display updates
        await expect(page.locator('#market-display')).toContainText('Silver Futures (SI=F)');
        
        // Check that the item is selected
        await expect(page.locator('.market-item[data-symbol="SI=F"]')).toHaveClass(/selected/);
    });

    test('selecting a stock updates current market display', async ({ page }) => {
        // Click on Apple stock
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // Check that the market display updates
        await expect(page.locator('#market-display')).toContainText('Apple Inc. (AAPL)');
        
        // Check that the item is selected
        await expect(page.locator('.market-item[data-symbol="AAPL"]')).toHaveClass(/selected/);
    });

    test('selecting a crypto updates current market display', async ({ page }) => {
        // Click on Bitcoin crypto
        await page.click('.market-item[data-symbol="BTC-USD"]');
        
        // Check that the market display updates
        await expect(page.locator('#market-display')).toContainText('Bitcoin (BTC-USD)');
        
        // Check that the item is selected
        await expect(page.locator('.market-item[data-symbol="BTC-USD"]')).toHaveClass(/selected/);
    });

    test('only one market can be selected at a time', async ({ page }) => {
        // Select first market
        await page.click('.market-item[data-symbol="SI=F"]');
        await expect(page.locator('.market-item[data-symbol="SI=F"]')).toHaveClass(/selected/);
        
        // Select second market
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // First market should no longer be selected
        await expect(page.locator('.market-item[data-symbol="SI=F"]')).not.toHaveClass(/selected/);
        // Second market should be selected
        await expect(page.locator('.market-item[data-symbol="AAPL"]')).toHaveClass(/selected/);
    });

    test('chart updates when market is selected', async ({ page }) => {
        // Wait for chart to be ready
        await page.waitForSelector('#market-chart');
        
        // Select a market
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // Wait for chart to update (loading should disappear)
        await page.waitForSelector('#chart-loading', { state: 'hidden' });
        
        // Check that chart has data
        const chart = page.locator('#market-chart');
        await expect(chart).toBeVisible();
        
        // Check that chart is not showing loading state
        await expect(page.locator('#chart-loading')).not.toBeVisible();
    });

    test('market prices are displayed and updated', async ({ page }) => {
        // Check that price elements exist
        await expect(page.locator('#price-SI')).toBeVisible();
        await expect(page.locator('#price-GC')).toBeVisible();
        await expect(page.locator('#price-AAPL')).toBeVisible();
        await expect(page.locator('#price-BTC')).toBeVisible();
        
        // Check that prices are in correct format
        const silverPrice = await page.textContent('#price-SI');
        expect(silverPrice).toMatch(/\$\d+\.\d{2}/);
        
        const goldPrice = await page.textContent('#price-GC');
        expect(goldPrice).toMatch(/\$\d+,\d{3}\.\d{2}/);
    });

    test('market selection enables create bot button', async ({ page }) => {
        // Initially create bot button should be disabled
        await expect(page.locator('#create-bot')).toBeDisabled();
        
        // Select a market
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // Create bot button should now be enabled
        await expect(page.locator('#create-bot')).toBeEnabled();
    });

    test('market categories can be toggled', async ({ page }) => {
        // Check initial state - all categories should be visible
        await expect(page.locator('#show-commodities')).toBeChecked();
        await expect(page.locator('#show-stocks')).toBeChecked();
        await expect(page.locator('#show-crypto')).toBeChecked();
        
        // Toggle commodities off
        await page.click('#show-commodities');
        await expect(page.locator('#show-commodities')).not.toBeChecked();
        
        // Toggle stocks off
        await page.click('#show-stocks');
        await expect(page.locator('#show-stocks')).not.toBeChecked();
        
        // Toggle crypto off
        await page.click('#show-crypto');
        await expect(page.locator('#show-crypto')).not.toBeChecked();
    });

    test('timeframe selector updates chart', async ({ page }) => {
        // Select a market first
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // Wait for chart to load
        await page.waitForSelector('#chart-loading', { state: 'hidden' });
        
        // Change timeframe
        await page.selectOption('#timeframe-selector', '1h');
        
        // Chart should still be visible
        await expect(page.locator('#market-chart')).toBeVisible();
    });

    test('zoom slider affects chart display', async ({ page }) => {
        // Select a market first
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // Wait for chart to load
        await page.waitForSelector('#chart-loading', { state: 'hidden' });
        
        // Get initial zoom value
        const initialZoom = await page.inputValue('#zoom-slider');
        
        // Change zoom
        await page.fill('#zoom-slider', '2');
        
        // Check that zoom value display updates
        await expect(page.locator('#zoom-value')).toContainText('200%');
    });

    test('historical view toggle works', async ({ page }) => {
        // Select a market first
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // Wait for chart to load
        await page.waitForSelector('#chart-loading', { state: 'hidden' });
        
        // Toggle historical view
        await page.click('#toggle-historical');
        
        // Chart should still be visible
        await expect(page.locator('#market-chart')).toBeVisible();
    });

    test('market selection shows alert notification', async ({ page }) => {
        // Listen for alert notifications
        const alertPromise = page.waitForSelector('.alert, .notification', { timeout: 5000 });
        
        // Select a market
        await page.click('.market-item[data-symbol="AAPL"]');
        
        // Should show alert
        await expect(alertPromise).resolves.toBeTruthy();
    });

    test('market selection persists across page reload', async ({ page }) => {
        // Select a market
        await page.click('.market-item[data-symbol="BTC-USD"]');
        
        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Market should still be selected (if persistence is implemented)
        // This test might need to be adjusted based on actual persistence implementation
        await expect(page.locator('.market-item[data-symbol="BTC-USD"]')).toHaveClass(/selected/);
    });
});
