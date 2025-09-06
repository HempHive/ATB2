/**
 * Smoke Tests for ATB2
 * Basic functionality tests to ensure the app loads and key components are visible
 */

import { test, expect } from '@playwright/test';

test.describe('ATB2 Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('app loads without errors', async ({ page }) => {
        // Check for console errors
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.waitForTimeout(2000);
        expect(errors).toHaveLength(0);
    });

    test('header is visible with logo and controls', async ({ page }) => {
        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.logo')).toBeVisible();
        await expect(page.locator('#digital-account')).toBeVisible();
        await expect(page.locator('#market-review')).toBeVisible();
        await expect(page.locator('#strategy-editor')).toBeVisible();
        await expect(page.locator('#investment-panel')).toBeVisible();
        await expect(page.locator('#theme-customizer')).toBeVisible();
    });

    test('sidebar contains market selection and bot controls', async ({ page }) => {
        await expect(page.locator('.sidebar')).toBeVisible();
        await expect(page.locator('.market-selection')).toBeVisible();
        await expect(page.locator('.bot-selector')).toBeVisible();
        await expect(page.locator('.sidebar .bot-controls')).toBeVisible();
        await expect(page.locator('#start-bot')).toBeVisible();
        await expect(page.locator('#pause-bot')).toBeVisible();
        await expect(page.locator('#reset-bot')).toBeVisible();
    });

    test('main dashboard shows market graph and stats', async ({ page }) => {
        await expect(page.locator('.dashboard')).toBeVisible();
        await expect(page.locator('.dashboard .market-graph')).toBeVisible();
        await expect(page.locator('#market-chart')).toBeVisible();
        await expect(page.locator('.live-stats')).toBeVisible();
        await expect(page.locator('#total-pnl')).toBeVisible();
        await expect(page.locator('#daily-pnl')).toBeVisible();
        await expect(page.locator('#active-positions')).toBeVisible();
        await expect(page.locator('#win-rate')).toBeVisible();
    });

    test('footer shows status and actions', async ({ page }) => {
        await expect(page.locator('.footer')).toBeVisible();
        await expect(page.locator('#last-update')).toBeVisible();
        await expect(page.locator('#export-data')).toBeVisible();
        await expect(page.locator('#sim-mode')).toBeVisible();
    });

    test('connection status indicator is visible', async ({ page }) => {
        await expect(page.locator('.connection-status')).toBeVisible();
        await expect(page.locator('#connection-text')).toBeVisible();
    });

    test('market categories are displayed', async ({ page }) => {
        await expect(page.locator('.market-category')).toHaveCount(3); // Commodities, Stocks, Crypto
        await expect(page.locator('h5:has-text("Commodities")')).toBeVisible();
        await expect(page.locator('h5:has-text("Stocks")')).toBeVisible();
        await expect(page.locator('h5:has-text("Crypto")')).toBeVisible();
    });

    test('market items are clickable', async ({ page }) => {
        const marketItems = page.locator('.market-item');
        await expect(marketItems).toHaveCount(10); // 5 commodities + 3 stocks + 2 crypto
        
        // Test clicking on a market item
        await marketItems.first().click();
        await expect(marketItems.first()).toHaveClass(/selected/);
    });

    test('bot selector dropdown is functional', async ({ page }) => {
        const botSelector = page.locator('#bot-selector');
        await expect(botSelector).toBeVisible();
        await expect(botSelector).toBeEnabled();
        
        // Check dropdown options exist in DOM
        await expect(page.locator('option[value="bot1"]')).toBeAttached();
        await expect(page.locator('option[value="bot2"]')).toBeAttached();
        
        // Test selection
        await botSelector.selectOption('bot1');
        await expect(botSelector).toHaveValue('bot1');
    });

    test('theme toggle button is visible', async ({ page }) => {
        await expect(page.locator('#theme-toggle')).toBeVisible();
    });

    test('modals can be opened', async ({ page }) => {
        // Wait for buttons to be visible
        await page.waitForSelector('#market-review', { state: 'visible' });
        
        // Test market review modal
        await page.click('#market-review');
        await expect(page.locator('#market-review-modal')).toBeVisible();
        await page.click('#market-review-modal .modal-close');
        
        // Test investment panel modal
        await page.waitForSelector('#investment-panel', { state: 'visible' });
        await page.click('#investment-panel');
        await expect(page.locator('#investment-modal')).toBeVisible();
        await page.click('#investment-modal .modal-close');
        
        // Test theme customizer modal
        await page.waitForSelector('#theme-customizer', { state: 'visible' });
        await page.click('#theme-customizer');
        await expect(page.locator('#theme-modal')).toBeVisible();
        await page.click('#theme-modal .modal-close');
    });

    test('responsive design works on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.sidebar')).toBeVisible();
        await expect(page.locator('.dashboard')).toBeVisible();
    });
});
