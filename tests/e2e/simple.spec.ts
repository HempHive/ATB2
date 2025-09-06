/**
 * Simple Tests for ATB2 - Basic functionality without test harness
 */

import { test, expect } from '@playwright/test';

test.describe('ATB2 Simple Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('page loads and shows basic elements', async ({ page }) => {
        // Check basic page structure
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.sidebar')).toBeVisible();
        await expect(page.locator('.dashboard')).toBeVisible();
    });

    test('buttons are visible after CSS fix', async ({ page }) => {
        // Wait a bit for any dynamic loading
        await page.waitForTimeout(2000);
        
        // Check if buttons are visible
        const digitalAccount = page.locator('#digital-account');
        const marketReview = page.locator('#market-review');
        const themeToggle = page.locator('#theme-toggle');
        
        // Check if they exist in DOM
        await expect(digitalAccount).toBeAttached();
        await expect(marketReview).toBeAttached();
        await expect(themeToggle).toBeAttached();
        
        // Check computed styles
        const digitalAccountStyle = await digitalAccount.evaluate(el => {
            return window.getComputedStyle(el).display;
        });
        
        console.log('Digital Account button display:', digitalAccountStyle);
        
        // Should be visible now
        await expect(digitalAccount).toBeVisible();
        await expect(marketReview).toBeVisible();
        await expect(themeToggle).toBeVisible();
    });

    test('market items are clickable', async ({ page }) => {
        // Wait for page to load
        await page.waitForTimeout(2000);
        
        // Find market items
        const marketItems = page.locator('.market-item');
        await expect(marketItems).toHaveCount(10);
        
        // Click on first market item
        await marketItems.first().click();
        
        // Check if it got selected
        await expect(marketItems.first()).toHaveClass(/selected/);
    });

    test('bot selector works', async ({ page }) => {
        // Wait for page to load
        await page.waitForTimeout(2000);
        
        const botSelector = page.locator('#bot-selector');
        await expect(botSelector).toBeVisible();
        
        // Select a bot
        await botSelector.selectOption('bot1');
        await expect(botSelector).toHaveValue('bot1');
    });

    test('chart canvas exists', async ({ page }) => {
        // Wait for page to load
        await page.waitForTimeout(2000);
        
        const chartCanvas = page.locator('#market-chart');
        await expect(chartCanvas).toBeVisible();
        
        // Check if it's a canvas element
        const tagName = await chartCanvas.evaluate(el => el.tagName);
        expect(tagName).toBe('CANVAS');
    });
});
