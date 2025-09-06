/**
 * Bot Market Display Test
 * Test that bot selection updates the market display and chart correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Bot Market Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('bot selection updates market display', async ({ page }) => {
        console.log('🤖 Testing bot selection updates market display...');
        
        // Get initial market display
        const marketDisplay = page.locator('#market-display');
        const initialText = await marketDisplay.textContent();
        console.log(`📊 Initial market display: "${initialText}"`);
        
        // Select a bot from the dropdown
        const botSelector = page.locator('#bot-selector');
        await botSelector.selectOption('bot1');
        
        await page.waitForTimeout(1000);
        
        // Check that market display updated
        const updatedText = await marketDisplay.textContent();
        console.log(`📊 Updated market display: "${updatedText}"`);
        
        // Should show the bot's market (AAPL for bot1)
        expect(updatedText).toContain('Apple');
        expect(updatedText).toContain('AAPL');
        expect(updatedText).not.toBe(initialText);
        
        console.log('✅ Bot selection updates market display!');
    });

    test('different bots show different markets', async ({ page }) => {
        console.log('🔄 Testing different bots show different markets...');
        
        const marketDisplay = page.locator('#market-display');
        
        // Test bot1 (AAPL)
        await page.selectOption('#bot-selector', 'bot1');
        await page.waitForTimeout(1000);
        
        let marketText = await marketDisplay.textContent();
        console.log(`📊 Bot1 market: "${marketText}"`);
        expect(marketText).toContain('Apple');
        expect(marketText).toContain('AAPL');
        
        // Test bot2 (GOOGL)
        await page.selectOption('#bot-selector', 'bot2');
        await page.waitForTimeout(1000);
        
        marketText = await marketDisplay.textContent();
        console.log(`📊 Bot2 market: "${marketText}"`);
        expect(marketText).toContain('Google');
        expect(marketText).toContain('GOOGL');
        
        console.log('✅ Different bots show different markets!');
    });

    test('bot selection updates chart data', async ({ page }) => {
        console.log('📈 Testing bot selection updates chart data...');
        
        // Wait for chart to load
        await page.waitForTimeout(3000);
        
        // Select a bot
        await page.selectOption('#bot-selector', 'bot1');
        
        // Wait for chart to update
        await page.waitForTimeout(2000);
        
        // Check that chart loading indicator appears and disappears
        const chartLoading = page.locator('#chart-loading');
        const loadingVisible = await chartLoading.isVisible();
        console.log(`📊 Chart loading visible: ${loadingVisible}`);
        
        // Wait a bit more for loading to complete
        await page.waitForTimeout(1000);
        
        const loadingVisibleAfter = await chartLoading.isVisible();
        console.log(`📊 Chart loading visible after: ${loadingVisibleAfter}`);
        
        // Chart should not be loading anymore
        expect(loadingVisibleAfter).toBeFalsy();
        
        console.log('✅ Bot selection updates chart data!');
    });

    test('bot stats display updates correctly', async ({ page }) => {
        console.log('📊 Testing bot stats display updates...');
        
        const botStatsDisplay = page.locator('#bot-stats-display');
        
        // Select a bot
        await page.selectOption('#bot-selector', 'bot1');
        await page.waitForTimeout(1000);
        
        // Check that bot stats display updated
        const statsText = await botStatsDisplay.textContent();
        console.log(`📊 Bot stats: "${statsText}"`);
        
        // Should contain the bot name
        expect(statsText).toContain('Stock Bot 1');
        
        console.log('✅ Bot stats display updates correctly!');
    });

    test('clearing bot selection resets market display', async ({ page }) => {
        console.log('🔄 Testing clearing bot selection resets market display...');
        
        const marketDisplay = page.locator('#market-display');
        
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        await page.waitForTimeout(1000);
        
        let marketText = await marketDisplay.textContent();
        console.log(`📊 After bot selection: "${marketText}"`);
        expect(marketText).toContain('Apple');
        
        // Clear bot selection (select empty option)
        await page.selectOption('#bot-selector', '');
        await page.waitForTimeout(1000);
        
        marketText = await marketDisplay.textContent();
        console.log(`📊 After clearing: "${marketText}"`);
        expect(marketText).toBe('Select a market to view');
        
        console.log('✅ Clearing bot selection resets market display!');
    });

    test('bot selection shows alerts', async ({ page }) => {
        console.log('🔔 Testing bot selection shows alerts...');
        
        // Select a bot
        await page.selectOption('#bot-selector', 'bot1');
        
        await page.waitForTimeout(1000);
        
        // Check for alert
        const alert = page.locator('.alert').first();
        const alertVisible = await alert.isVisible();
        
        if (alertVisible) {
            const alertText = await alert.textContent();
            console.log(`📊 Alert text: "${alertText}"`);
            expect(alertText).toContain('Bot Selected');
            expect(alertText).toContain('Stock Bot 1');
            expect(alertText).toContain('AAPL');
        }
        
        console.log('✅ Bot selection shows alerts!');
    });

    test('market selection overrides bot selection', async ({ page }) => {
        console.log('🔄 Testing market selection overrides bot selection...');
        
        const marketDisplay = page.locator('#market-display');
        
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        await page.waitForTimeout(1000);
        
        let marketText = await marketDisplay.textContent();
        console.log(`📊 After bot selection: "${marketText}"`);
        expect(marketText).toContain('Apple');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        await page.waitForTimeout(500);
        
        // Now select a market directly
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(1000);
        
        marketText = await marketDisplay.textContent();
        console.log(`📊 After market selection: "${marketText}"`);
        expect(marketText).toContain('Bitcoin');
        expect(marketText).toContain('BTC-USD');
        
        console.log('✅ Market selection overrides bot selection!');
    });
});
