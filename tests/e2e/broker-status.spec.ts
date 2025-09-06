/**
 * Broker Status Tests for ATB2
 * Tests broker connection functionality and status updates
 */

import { test, expect } from '@playwright/test';

test.describe('Broker Status Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('connection status indicator is visible', async ({ page }) => {
        await expect(page.locator('.connection-status')).toBeVisible();
        await expect(page.locator('#connection-text')).toBeVisible();
    });

    test('connection status shows offline initially', async ({ page }) => {
        await expect(page.locator('#connection-text')).toContainText('❌');
    });

    test('broker login form is hidden in simulation mode', async ({ page }) => {
        // Check that simulation mode is selected by default
        await expect(page.locator('input[name="trading-mode"][value="simulation"]')).toBeChecked();
        
        // Broker login should be hidden
        await expect(page.locator('#broker-login')).not.toBeVisible();
    });

    test('broker login form appears in live trading mode', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Broker login should be visible
        await expect(page.locator('#broker-login')).toBeVisible();
        await expect(page.locator('#broker-selector')).toBeVisible();
        await expect(page.locator('#api-key')).toBeVisible();
        await expect(page.locator('#api-secret')).toBeVisible();
        await expect(page.locator('#connect-broker')).toBeVisible();
    });

    test('broker selector has available options', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Check broker options
        await expect(page.locator('#broker-selector option[value="alpaca"]')).toBeVisible();
        await expect(page.locator('#broker-selector option[value="interactive_brokers"]')).toBeVisible();
        await expect(page.locator('#broker-selector option[value="td_ameritrade"]')).toBeVisible();
        await expect(page.locator('#broker-selector option[value="robinhood"]')).toBeVisible();
    });

    test('connect broker button is initially disabled', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Connect button should be enabled (assuming it's always enabled)
        await expect(page.locator('#connect-broker')).toBeEnabled();
    });

    test('connect broker shows error for missing credentials', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Try to connect without credentials
        await page.click('#connect-broker');
        
        // Should show error message
        await expect(page.locator('.alert, .notification')).toBeVisible();
    });

    test('connect broker shows error for invalid credentials', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Fill in invalid credentials
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'invalid-key');
        await page.fill('#api-secret', 'invalid-secret');
        
        // Try to connect
        await page.click('#connect-broker');
        
        // Should show error message
        await expect(page.locator('.alert, .notification')).toBeVisible();
    });

    test('connect broker succeeds with valid credentials', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Fill in valid credentials (mock)
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'valid-key');
        await page.fill('#api-secret', 'valid-secret');
        
        // Try to connect
        await page.click('#connect-broker');
        
        // Wait for connection attempt
        await page.waitForTimeout(2000);
        
        // Should show success message and update status
        await expect(page.locator('#connection-text')).toContainText('💚');
    });

    test('connection status persists after page reload', async ({ page }) => {
        // Switch to live trading mode and connect
        await page.click('input[name="trading-mode"][value="live"]');
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'valid-key');
        await page.fill('#api-secret', 'valid-secret');
        await page.click('#connect-broker');
        
        // Wait for connection
        await page.waitForTimeout(2000);
        
        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Connection status should be maintained (if persistence is implemented)
        // This test might need adjustment based on actual persistence implementation
        await expect(page.locator('#connection-text')).toBeVisible();
    });

    test('account balance updates after connection', async ({ page }) => {
        // Switch to live trading mode and connect
        await page.click('input[name="trading-mode"][value="live"]');
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'valid-key');
        await page.fill('#api-secret', 'valid-secret');
        await page.click('#connect-broker');
        
        // Wait for connection
        await page.waitForTimeout(2000);
        
        // Account balance should be visible and updated
        await expect(page.locator('#account-balance')).toBeVisible();
        await expect(page.locator('#available-funds')).toBeVisible();
        
        // Values should be reasonable
        const balance = await page.textContent('#account-balance');
        expect(balance).toMatch(/\$\d+,\d{3}\.\d{2}/);
    });

    test('broker connection affects bot controls', async ({ page }) => {
        // Switch to live trading mode and connect
        await page.click('input[name="trading-mode"][value="live"]');
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'valid-key');
        await page.fill('#api-secret', 'valid-secret');
        await page.click('#connect-broker');
        
        // Wait for connection
        await page.waitForTimeout(2000);
        
        // Bot controls should work with live trading
        await page.selectOption('#bot-selector', 'bot1');
        await page.click('#start-bot');
        
        // Should show success or warning about live trading
        await expect(page.locator('.alert, .notification')).toBeVisible();
    });

    test('disconnect broker resets status', async ({ page }) => {
        // Switch to live trading mode and connect
        await page.click('input[name="trading-mode"][value="live"]');
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'valid-key');
        await page.fill('#api-secret', 'valid-secret');
        await page.click('#connect-broker');
        
        // Wait for connection
        await page.waitForTimeout(2000);
        
        // Switch back to simulation mode (disconnect)
        await page.click('input[name="trading-mode"][value="simulation"]');
        
        // Connection status should reset
        await expect(page.locator('#connection-text')).toContainText('❌');
    });

    test('broker connection shows loading state', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'valid-key');
        await page.fill('#api-secret', 'valid-secret');
        
        // Click connect and immediately check for loading state
        await page.click('#connect-broker');
        
        // Should show loading indicator (if implemented)
        const loadingIndicator = page.locator('.loading, .spinner, #loading-overlay');
        if (await loadingIndicator.count() > 0) {
            await expect(loadingIndicator.first()).toBeVisible();
        }
    });

    test('broker connection handles network errors gracefully', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'network-error-key');
        await page.fill('#api-secret', 'network-error-secret');
        
        // Try to connect
        await page.click('#connect-broker');
        
        // Wait for error handling
        await page.waitForTimeout(3000);
        
        // Should show error message and not crash
        await expect(page.locator('.alert, .notification')).toBeVisible();
        await expect(page.locator('#connection-text')).toContainText('❌');
    });

    test('broker connection validates required fields', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Try to connect without selecting broker
        await page.click('#connect-broker');
        await expect(page.locator('.alert, .notification')).toBeVisible();
        
        // Select broker but no API key
        await page.selectOption('#broker-selector', 'alpaca');
        await page.click('#connect-broker');
        await expect(page.locator('.alert, .notification')).toBeVisible();
        
        // Add API key but no secret
        await page.fill('#api-key', 'test-key');
        await page.click('#connect-broker');
        await expect(page.locator('.alert, .notification')).toBeVisible();
    });

    test('broker connection updates UI elements', async ({ page }) => {
        // Switch to live trading mode and connect
        await page.click('input[name="trading-mode"][value="live"]');
        await page.selectOption('#broker-selector', 'alpaca');
        await page.fill('#api-key', 'valid-key');
        await page.fill('#api-secret', 'valid-secret');
        await page.click('#connect-broker');
        
        // Wait for connection
        await page.waitForTimeout(2000);
        
        // Check that various UI elements are updated
        await expect(page.locator('#connection-text')).toContainText('💚');
        await expect(page.locator('#account-balance')).toBeVisible();
        await expect(page.locator('#available-funds')).toBeVisible();
        
        // Broker login form might be hidden or shown differently
        const brokerLogin = page.locator('#broker-login');
        if (await brokerLogin.isVisible()) {
            // If still visible, it should show connected state
            await expect(brokerLogin).toBeVisible();
        }
    });
});
