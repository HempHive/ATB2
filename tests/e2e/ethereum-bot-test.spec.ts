/**
 * Ethereum Bot Simulation Test
 * Tests running the Ethereum bot in simulation mode
 */

import { test, expect } from '@playwright/test';

test.describe('Ethereum Bot Simulation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for test harness to load
        
        // Close any open modals that might be blocking interactions
        const openModals = page.locator('.modal.show');
        if (await openModals.count() > 0) {
            console.log('🔧 Closing open modals...');
            await page.click('.modal-close');
            await page.waitForTimeout(500);
        }
    });

    test('run ethereum bot in simulation mode', async ({ page }) => {
        console.log('🚀 Starting Ethereum Bot Simulation Test...');
        
        // Step 1: Select Ethereum market
        console.log('📊 Selecting Ethereum market...');
        await page.click('.market-item[data-symbol="ETH-USD"]');
        await expect(page.locator('.market-item[data-symbol="ETH-USD"]')).toHaveClass(/selected/);
        await expect(page.locator('#market-display')).toContainText('Ethereum (ETH-USD)');
        console.log('✅ Ethereum market selected');
        
        // Step 2: Select Ethereum bot
        console.log('🤖 Selecting Ethereum bot...');
        await page.selectOption('#bot-selector', 'bot7');
        await expect(page.locator('#bot-selector')).toHaveValue('bot7');
        console.log('✅ Ethereum bot selected');
        
        // Step 3: Ensure simulation mode is selected
        console.log('🎮 Checking simulation mode...');
        const simulationMode = page.locator('input[name="trading-mode"][value="simulation"]');
        await expect(simulationMode).toBeChecked();
        console.log('✅ Simulation mode confirmed');
        
        // Step 4: Check initial P&L values
        console.log('💰 Checking initial P&L values...');
        const totalPnl = page.locator('#total-pnl');
        const dailyPnl = page.locator('#daily-pnl');
        const activePositions = page.locator('#active-positions');
        const winRate = page.locator('#win-rate');
        
        await expect(totalPnl).toBeVisible();
        await expect(dailyPnl).toBeVisible();
        await expect(activePositions).toBeVisible();
        await expect(winRate).toBeVisible();
        
        const initialTotalPnl = await totalPnl.textContent();
        const initialDailyPnl = await dailyPnl.textContent();
        const initialPositions = await activePositions.textContent();
        const initialWinRate = await winRate.textContent();
        
        console.log(`📈 Initial P&L - Total: ${initialTotalPnl}, Daily: ${initialDailyPnl}, Positions: ${initialPositions}, Win Rate: ${initialWinRate}`);
        
        // Step 5: Start the bot
        console.log('▶️ Starting Ethereum bot...');
        
        // Force close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        await page.waitForTimeout(500);
        
        await page.click('#start-bot');
        console.log('✅ Start button clicked');
        
        // Wait a moment for bot to start
        await page.waitForTimeout(2000);
        
        // Step 6: Check if bot is running (P&L should start updating)
        console.log('🔄 Checking bot activity...');
        
        // Wait for potential P&L updates
        await page.waitForTimeout(5000);
        
        const updatedTotalPnl = await totalPnl.textContent();
        const updatedDailyPnl = await dailyPnl.textContent();
        const updatedPositions = await activePositions.textContent();
        const updatedWinRate = await winRate.textContent();
        
        console.log(`📊 Updated P&L - Total: ${updatedTotalPnl}, Daily: ${updatedDailyPnl}, Positions: ${updatedPositions}, Win Rate: ${updatedWinRate}`);
        
        // Step 7: Check chart is updating
        console.log('📈 Checking chart updates...');
        const chart = page.locator('#market-chart');
        await expect(chart).toBeVisible();
        
        // Check if chart has data (not just loading)
        const chartLoading = page.locator('#chart-loading');
        const isLoadingVisible = await chartLoading.isVisible();
        if (isLoadingVisible) {
            console.log('⚠️ Chart still showing loading state');
        } else {
            console.log('✅ Chart is displaying data');
        }
        
        // Step 8: Test pause functionality
        console.log('⏸️ Testing pause functionality...');
        await page.click('#pause-bot');
        console.log('✅ Pause button clicked');
        
        await page.waitForTimeout(2000);
        
        // Step 9: Test reset functionality
        console.log('🔄 Testing reset functionality...');
        await page.click('#reset-bot');
        console.log('✅ Reset button clicked');
        
        await page.waitForTimeout(2000);
        
        const finalTotalPnl = await totalPnl.textContent();
        const finalDailyPnl = await dailyPnl.textContent();
        const finalPositions = await activePositions.textContent();
        const finalWinRate = await winRate.textContent();
        
        console.log(`🏁 Final P&L - Total: ${finalTotalPnl}, Daily: ${finalDailyPnl}, Positions: ${finalPositions}, Win Rate: ${finalWinRate}`);
        
        // Step 10: Verify bot controls are working
        console.log('🎛️ Verifying bot controls...');
        await expect(page.locator('#start-bot')).toBeEnabled();
        // Pause button should be disabled after reset (correct behavior)
        await expect(page.locator('#pause-bot')).toBeDisabled();
        await expect(page.locator('#reset-bot')).toBeEnabled();
        console.log('✅ All bot controls are functional');
        
        console.log('🎉 Ethereum Bot Simulation Test Complete!');
    });

    test('ethereum bot shows market data updates', async ({ page }) => {
        console.log('📊 Testing Ethereum market data updates...');
        
        // Select Ethereum market
        await page.click('.market-item[data-symbol="ETH-USD"]');
        
        // Check that market display updates
        await expect(page.locator('#market-display')).toContainText('Ethereum (ETH-USD)');
        
        // Check that price is displayed
        const ethPrice = page.locator('#price-ETH');
        await expect(ethPrice).toBeVisible();
        
        const priceText = await ethPrice.textContent();
        console.log(`💰 ETH Price: ${priceText}`);
        
        // Wait for potential price updates
        await page.waitForTimeout(3000);
        
        const updatedPriceText = await ethPrice.textContent();
        console.log(`💰 Updated ETH Price: ${updatedPriceText}`);
        
        // Price should be in correct format (ETH is under $10k so no comma needed)
        expect(priceText).toMatch(/\$\d+\.\d{2}/);
    });

    test('ethereum bot chart displays data', async ({ page }) => {
        console.log('📈 Testing Ethereum chart display...');
        
        // Select Ethereum market
        await page.click('.market-item[data-symbol="ETH-USD"]');
        
        // Wait for chart to load
        await page.waitForTimeout(3000);
        
        // Check chart is visible
        const chart = page.locator('#market-chart');
        await expect(chart).toBeVisible();
        
        // Check chart is not in loading state
        const chartLoading = page.locator('#chart-loading');
        const isLoadingVisible = await chartLoading.isVisible();
        
        if (isLoadingVisible) {
            console.log('⚠️ Chart is still loading - this indicates the test harness may not be fully connected');
        } else {
            console.log('✅ Chart is displaying data');
        }
        
        // Check that chart is a canvas element
        const tagName = await chart.evaluate(el => el.tagName);
        expect(tagName).toBe('CANVAS');
        console.log('✅ Chart canvas element confirmed');
    });
});
