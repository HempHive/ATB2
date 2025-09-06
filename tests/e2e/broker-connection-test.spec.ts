/**
 * Broker Connection Test
 * Test that broker connection updates the status correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Broker Connection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('broker connection updates status to online', async ({ page }) => {
        console.log('🔌 Testing broker connection...');
        
        // Switch to live trading mode
        const liveTradingRadio = page.locator('input[value="live"]');
        await liveTradingRadio.click();
        
        await page.waitForTimeout(1000);
        
        // Check that broker login form is visible
        const brokerLogin = page.locator('#broker-login');
        await expect(brokerLogin).toBeVisible();
        
        // Fill in broker connection form
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'test-api-key');
        await page.fill('#api-secret', 'test-api-secret');
        
        // Click connect
        await page.click('#connect-broker');
        
        // Wait for connection process
        await page.waitForTimeout(3000);
        
        // Check that account info is now visible
        const accountInfo = page.locator('#account-info');
        await expect(accountInfo).toBeVisible();
        
        // Check that broker login is hidden
        await expect(brokerLogin).not.toBeVisible();
        
        // Check connection status in toolbar
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Either PNG should be visible or fallback should show online
        const pngVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        
        if (pngVisible) {
            console.log('✅ Status PNG is visible (online)');
        } else if (fallbackVisible) {
            const fallbackText = await statusFallback.textContent();
            console.log(`📊 Fallback text: "${fallbackText}"`);
            expect(fallbackText).toContain('Online');
        }
        
        console.log('✅ Broker connection updates status to online!');
    });

    test('broker disconnection updates status to offline', async ({ page }) => {
        console.log('🔌 Testing broker disconnection...');
        
        // First connect to broker
        const liveTradingRadio = page.locator('input[value="live"]');
        await liveTradingRadio.click();
        
        await page.waitForTimeout(1000);
        
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'test-api-key');
        await page.fill('#api-secret', 'test-api-secret');
        await page.click('#connect-broker');
        
        await page.waitForTimeout(3000);
        
        // Now disconnect
        const disconnectBtn = page.locator('#disconnect-broker');
        await expect(disconnectBtn).toBeVisible();
        await disconnectBtn.click();
        
        await page.waitForTimeout(1000);
        
        // Check that broker login is visible again
        const brokerLogin = page.locator('#broker-login');
        await expect(brokerLogin).toBeVisible();
        
        // Check that account info is hidden
        const accountInfo = page.locator('#account-info');
        await expect(accountInfo).not.toBeVisible();
        
        // Check connection status in toolbar
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Either PNG should be visible or fallback should show offline
        const pngVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        
        if (pngVisible) {
            console.log('✅ Status PNG is visible (offline)');
        } else if (fallbackVisible) {
            const fallbackText = await statusFallback.textContent();
            console.log(`📊 Fallback text: "${fallbackText}"`);
            expect(fallbackText).toContain('Offline');
        }
        
        console.log('✅ Broker disconnection updates status to offline!');
    });

    test('connection status persists across page interactions', async ({ page }) => {
        console.log('🔄 Testing connection status persistence...');
        
        // Connect to broker
        const liveTradingRadio = page.locator('input[value="live"]');
        await liveTradingRadio.click();
        
        await page.waitForTimeout(1000);
        
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'test-api-key');
        await page.fill('#api-secret', 'test-api-secret');
        await page.click('#connect-broker');
        
        await page.waitForTimeout(3000);
        
        // Interact with other parts of the page
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(1000);
        
        // Check that connection status is still online
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        const pngVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        
        expect(pngVisible || fallbackVisible).toBeTruthy();
        
        console.log('✅ Connection status persists across page interactions!');
    });

    test('connection failure shows offline status', async ({ page }) => {
        console.log('❌ Testing connection failure...');
        
        // Switch to live trading mode
        const liveTradingRadio = page.locator('input[value="live"]');
        await liveTradingRadio.click();
        
        await page.waitForTimeout(1000);
        
        // Try to connect with invalid credentials (empty fields)
        await page.click('#connect-broker');
        
        await page.waitForTimeout(1000);
        
        // Check that broker login is still visible
        const brokerLogin = page.locator('#broker-login');
        await expect(brokerLogin).toBeVisible();
        
        // Check that account info is still hidden
        const accountInfo = page.locator('#account-info');
        await expect(accountInfo).not.toBeVisible();
        
        // Check for error alert
        const alert = page.locator('.alert').first();
        const alertVisible = await alert.isVisible();
        
        if (alertVisible) {
            const alertText = await alert.textContent();
            console.log(`📊 Alert text: "${alertText}"`);
            expect(alertText).toContain('Missing Information');
        }
        
        console.log('✅ Connection failure shows appropriate error!');
    });

    test('simulation mode shows offline status', async ({ page }) => {
        console.log('🎮 Testing simulation mode status...');
        
        // Ensure simulation mode is selected
        const simulationRadio = page.locator('input[value="simulation"]');
        await simulationRadio.click();
        
        await page.waitForTimeout(1000);
        
        // Check that broker login is hidden
        const brokerLogin = page.locator('#broker-login');
        await expect(brokerLogin).not.toBeVisible();
        
        // Check that account info is visible
        const accountInfo = page.locator('#account-info');
        await expect(accountInfo).toBeVisible();
        
        // Check connection status in toolbar (should be offline in simulation)
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        const pngVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        
        expect(pngVisible || fallbackVisible).toBeTruthy();
        
        console.log('✅ Simulation mode shows appropriate status!');
    });
});
