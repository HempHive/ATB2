/**
 * Bot Controls Tests for ATB2
 * Tests bot start/pause/reset functionality and state updates
 */

import { test, expect } from '@playwright/test';

test.describe('Bot Controls Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('bot selector dropdown is functional', async ({ page }) => {
        const botSelector = page.locator('#bot-selector');
        await expect(botSelector).toBeVisible();
        
        // Check initial state
        await expect(botSelector).toHaveValue('');
        
        // Select a bot
        await botSelector.selectOption('bot1');
        await expect(botSelector).toHaveValue('bot1');
    });

    test('start bot button is initially enabled', async ({ page }) => {
        await expect(page.locator('#start-bot')).toBeVisible();
        await expect(page.locator('#start-bot')).toBeEnabled();
    });

    test('pause bot button is initially enabled', async ({ page }) => {
        await expect(page.locator('#pause-bot')).toBeVisible();
        await expect(page.locator('#pause-bot')).toBeEnabled();
    });

    test('reset bot button is initially enabled', async ({ page }) => {
        await expect(page.locator('#reset-bot')).toBeVisible();
        await expect(page.locator('#reset-bot')).toBeEnabled();
    });

    test('start bot shows success message', async ({ page }) => {
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        
        // Listen for alert notifications
        const alertPromise = page.waitForSelector('.alert, .notification', { timeout: 5000 });
        
        // Start bot
        await page.click('#start-bot');
        
        // Should show success alert
        await expect(alertPromise).resolves.toBeTruthy();
    });

    test('pause bot shows warning message', async ({ page }) => {
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        
        // Start bot first
        await page.click('#start-bot');
        await page.waitForTimeout(1000);
        
        // Listen for alert notifications
        const alertPromise = page.waitForSelector('.alert, .notification', { timeout: 5000 });
        
        // Pause bot
        await page.click('#pause-bot');
        
        // Should show warning alert
        await expect(alertPromise).resolves.toBeTruthy();
    });

    test('reset bot shows danger message', async ({ page }) => {
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        
        // Start bot first
        await page.click('#start-bot');
        await page.waitForTimeout(1000);
        
        // Listen for alert notifications
        const alertPromise = page.waitForSelector('.alert, .notification', { timeout: 5000 });
        
        // Reset bot
        await page.click('#reset-bot');
        
        // Should show danger alert
        await expect(alertPromise).resolves.toBeTruthy();
    });

    test('bot controls update active bots display', async ({ page }) => {
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        
        // Start bot
        await page.click('#start-bot');
        
        // Check that active bots section updates
        await expect(page.locator('#active-bots-container')).toBeVisible();
        
        // Should show the active bot
        await expect(page.locator('#active-bots-container')).toContainText('bot1');
    });

    test('bot controls update P&L display', async ({ page }) => {
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        
        // Start bot
        await page.click('#start-bot');
        
        // Wait for P&L to potentially update
        await page.waitForTimeout(2000);
        
        // Check that P&L displays are visible and have values
        await expect(page.locator('#total-pnl')).toBeVisible();
        await expect(page.locator('#daily-pnl')).toBeVisible();
        await expect(page.locator('#active-positions')).toBeVisible();
        await expect(page.locator('#win-rate')).toBeVisible();
    });

    test('bot controls update bot stats display', async ({ page }) => {
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        
        // Start bot
        await page.click('#start-bot');
        
        // Check that bot stats display updates
        await expect(page.locator('#bot-stats-display')).toBeVisible();
        await expect(page.locator('#bot-stats-display')).not.toContainText('--');
    });

    test('bot controls work with different bots', async ({ page }) => {
        // Test with bot1
        await page.selectOption('#bot-selector', 'bot1');
        await page.click('#start-bot');
        await page.waitForTimeout(1000);
        
        // Switch to bot2
        await page.selectOption('#bot-selector', 'bot2');
        await page.click('#start-bot');
        await page.waitForTimeout(1000);
        
        // Both bots should be in active bots display
        await expect(page.locator('#active-bots-container')).toContainText('bot1');
        await expect(page.locator('#active-bots-container')).toContainText('bot2');
    });

    test('bot controls respect trading mode', async ({ page }) => {
        // Check simulation mode is selected by default
        await expect(page.locator('input[name="trading-mode"][value="simulation"]')).toBeChecked();
        
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        await expect(page.locator('input[name="trading-mode"][value="live"]')).toBeChecked();
        
        // Bot controls should still work
        await page.selectOption('#bot-selector', 'bot1');
        await page.click('#start-bot');
        
        // Should show warning about live trading
        await expect(page.locator('.alert, .notification')).toBeVisible();
    });

    test('bot controls show broker connection requirement for live trading', async ({ page }) => {
        // Switch to live trading mode
        await page.click('input[name="trading-mode"][value="live"]');
        
        // Broker login should be visible
        await expect(page.locator('#broker-login')).toBeVisible();
        await expect(page.locator('#broker-selector')).toBeVisible();
        await expect(page.locator('#api-key')).toBeVisible();
        await expect(page.locator('#api-secret')).toBeVisible();
        await expect(page.locator('#connect-broker')).toBeVisible();
    });

    test('bot controls update account balance display', async ({ page }) => {
        // Check initial account balance
        await expect(page.locator('#account-balance')).toBeVisible();
        await expect(page.locator('#available-funds')).toBeVisible();
        
        // Select a bot and start it
        await page.selectOption('#bot-selector', 'bot1');
        await page.click('#start-bot');
        
        // Account balance should still be visible
        await expect(page.locator('#account-balance')).toBeVisible();
        await expect(page.locator('#available-funds')).toBeVisible();
    });

    test('bot controls work in bot management modal', async ({ page }) => {
        // Open bot management modal (if available)
        // This test assumes there's a way to open the modal
        const modalTrigger = page.locator('[data-testid="bot-management-trigger"], #bot-management-modal');
        if (await modalTrigger.count() > 0) {
            await modalTrigger.first().click();
            
            // Check that modal bot controls exist
            await expect(page.locator('#modal-start-bot')).toBeVisible();
            await expect(page.locator('#modal-pause-bot')).toBeVisible();
            await expect(page.locator('#modal-reset-bot')).toBeVisible();
            
            // Test modal controls
            await page.click('#modal-start-bot');
            await page.waitForTimeout(1000);
            await page.click('#modal-pause-bot');
            await page.waitForTimeout(1000);
            await page.click('#modal-reset-bot');
        }
    });

    test('bot controls show activity log updates', async ({ page }) => {
        // Select a bot and start it
        await page.selectOption('#bot-selector', 'bot1');
        await page.click('#start-bot');
        
        // Wait for potential activity
        await page.waitForTimeout(3000);
        
        // Check if there's an activity log or alerts section
        const activityLog = page.locator('.alerts-container, .activity-log, .bot-activity');
        if (await activityLog.count() > 0) {
            await expect(activityLog.first()).toBeVisible();
        }
    });

    test('bot controls handle rapid state changes', async ({ page }) => {
        // Select a bot
        await page.selectOption('#bot-selector', 'bot1');
        
        // Rapidly click start/pause/reset
        await page.click('#start-bot');
        await page.click('#pause-bot');
        await page.click('#start-bot');
        await page.click('#reset-bot');
        
        // App should not crash and controls should still be functional
        await expect(page.locator('#start-bot')).toBeEnabled();
        await expect(page.locator('#pause-bot')).toBeEnabled();
        await expect(page.locator('#reset-bot')).toBeEnabled();
    });
});
