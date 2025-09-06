import { test, expect } from '@playwright/test';

test.describe('Debug Timeframe Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000); // Wait longer for initialization
    });

    test('debug timeframe dropdown and chart state', async ({ page }) => {
        console.log('🔍 Debugging timeframe dropdown and chart...');
        
        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console error:', msg.text());
            }
        });
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Check if chart exists
        const chartExists = await page.evaluate(() => {
            return {
                chart: !!window.chart,
                atbDashboard: !!window.atbDashboard,
                currentTimeframe: window.atbDashboard?.currentTimeframe,
                currentBot: window.atbDashboard?.currentBot,
                selectedMarket: window.atbDashboard?.selectedMarket
            };
        });
        
        console.log('📊 Chart state:', chartExists);
        
        // Check if timeframe selector exists
        const timeframeSelector = await page.locator('#timeframe-selector');
        const selectorExists = await timeframeSelector.isVisible();
        console.log('📊 Timeframe selector visible:', selectorExists);
        
        if (selectorExists) {
            // Get current value
            const currentValue = await timeframeSelector.inputValue();
            console.log('📊 Current timeframe value:', currentValue);
            
            // Get all options
            const options = await timeframeSelector.locator('option').all();
            console.log('📊 Available options:', options.length);
            
            // Try to select a different timeframe
            await timeframeSelector.selectOption('1h');
            await page.waitForTimeout(1000);
            
            // Check if value changed
            const newValue = await timeframeSelector.inputValue();
            console.log('📊 New timeframe value:', newValue);
            
            // Check chart state after selection
            const chartStateAfter = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        labels: window.chart.data.labels?.length || 0,
                        data: window.chart.data.datasets[0]?.data?.length || 0,
                        label: window.chart.data.datasets[0]?.label || ''
                    };
                }
                return null;
            });
            
            console.log('📊 Chart state after selection:', chartStateAfter);
            
            // Check if there are any console errors
            const consoleErrors = await page.evaluate(() => {
                return window.consoleErrors || [];
            });
            
            if (consoleErrors.length > 0) {
                console.log('❌ Console errors:', consoleErrors);
            }
        }
        
        // Check if we need to select a bot first
        const botButtons = await page.locator('.active-bot-btn').count();
        console.log('📊 Available bot buttons:', botButtons);
        
        if (botButtons > 0) {
            // Try clicking the first bot
            const firstBot = await page.locator('.active-bot-btn').first();
            await firstBot.click();
            await page.waitForTimeout(1000);
            
            // Check chart state after bot selection
            const chartStateAfterBot = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        labels: window.chart.data.labels?.length || 0,
                        data: window.chart.data.datasets[0]?.data?.length || 0,
                        label: window.chart.data.datasets[0]?.label || ''
                    };
                }
                return null;
            });
            
            console.log('📊 Chart state after bot selection:', chartStateAfterBot);
        }
        
        console.log('✅ Debug complete!');
    });
});
