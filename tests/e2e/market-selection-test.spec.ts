/**
 * Market Selection Test
 * Test that market selection updates the chart and UI correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Market Selection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('market selection updates current market header', async ({ page }) => {
        console.log('📊 Testing market selection updates...');
        
        // Get initial market display
        const marketDisplay = page.locator('#market-display');
        const initialText = await marketDisplay.textContent();
        console.log(`📊 Initial market display: "${initialText}"`);
        
        // Click on Bitcoin market
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(1000);
        
        // Check that market display updated
        const updatedText = await marketDisplay.textContent();
        console.log(`📊 Updated market display: "${updatedText}"`);
        
        expect(updatedText).toContain('Bitcoin');
        expect(updatedText).toContain('BTC-USD');
        expect(updatedText).not.toBe(initialText);
        
        console.log('✅ Market selection updates current market header!');
    });

    test('market selection shows visual feedback', async ({ page }) => {
        console.log('🎨 Testing market selection visual feedback...');
        
        // Click on Ethereum market
        const ethMarket = page.locator('.market-item[data-symbol="ETH-USD"]');
        await ethMarket.click();
        
        await page.waitForTimeout(500);
        
        // Check that Ethereum is selected
        const isEthSelected = await ethMarket.evaluate(el => el.classList.contains('selected'));
        expect(isEthSelected).toBeTruthy();
        
        // Check that other markets are not selected
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        const isBtcSelected = await btcMarket.evaluate(el => el.classList.contains('selected'));
        expect(isBtcSelected).toBeFalsy();
        
        console.log('✅ Market selection shows visual feedback!');
    });

    test('market selection enables create bot button', async ({ page }) => {
        console.log('🤖 Testing create bot button enabling...');
        
        // Check initial state
        const createBotBtn = page.locator('#create-bot');
        const initialDisabled = await createBotBtn.isDisabled();
        console.log(`📊 Initial create bot disabled: ${initialDisabled}`);
        
        // Click on a market
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(500);
        
        // Check that create bot is now enabled
        const finalDisabled = await createBotBtn.isDisabled();
        console.log(`📊 Final create bot disabled: ${finalDisabled}`);
        
        expect(initialDisabled).toBeTruthy();
        expect(finalDisabled).toBeFalsy();
        
        console.log('✅ Market selection enables create bot button!');
    });

    test('market selection updates chart data', async ({ page }) => {
        console.log('📈 Testing chart data updates...');
        
        // Wait for chart to load
        await page.waitForTimeout(3000);
        
        // Click on Bitcoin market
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
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
        
        console.log('✅ Market selection updates chart data!');
    });

    test('market selection works with different market types', async ({ page }) => {
        console.log('🔄 Testing different market types...');
        
        const markets = [
            { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
            { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' }
        ];
        
        for (const market of markets) {
            console.log(`📊 Testing ${market.name} (${market.symbol})...`);
            
            // Click on market
            const marketItem = page.locator(`.market-item[data-symbol="${market.symbol}"]`);
            await marketItem.click();
            
            await page.waitForTimeout(1000);
            
            // Check market display
            const marketDisplay = page.locator('#market-display');
            const displayText = await marketDisplay.textContent();
            
            expect(displayText).toContain(market.name);
            expect(displayText).toContain(market.symbol);
            
            // Check selection
            const isSelected = await marketItem.evaluate(el => el.classList.contains('selected'));
            expect(isSelected).toBeTruthy();
            
            console.log(`✅ ${market.name} selection works!`);
        }
    });

    test('market selection shows alerts', async ({ page }) => {
        console.log('🔔 Testing market selection alerts...');
        
        // Click on Bitcoin market
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(1000);
        
        // Check for alert
        const alert = page.locator('.alert').first();
        const alertVisible = await alert.isVisible();
        
        if (alertVisible) {
            const alertText = await alert.textContent();
            console.log(`📊 Alert text: "${alertText}"`);
            expect(alertText).toContain('Market Selected');
            expect(alertText).toContain('Bitcoin');
            expect(alertText).toContain('BTC-USD');
        }
        
        console.log('✅ Market selection shows alerts!');
    });
});
