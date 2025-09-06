import { test, expect } from '@playwright/test';

test.describe('Timeframe with Bot Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('timeframe selection works after selecting a bot', async ({ page }) => {
        console.log('🤖 Testing timeframe selection with bot...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Check if there are any bots available
        const botButtons = await page.locator('.active-bot-btn').count();
        console.log('📊 Available bot buttons:', botButtons);
        
        if (botButtons > 0) {
            // Click the first bot
            const firstBot = await page.locator('.active-bot-btn').first();
            await firstBot.click();
            await page.waitForTimeout(1000);
            
            console.log('🤖 Bot selected');
            
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
            
            // Now try to change timeframe
            const timeframeSelector = await page.locator('#timeframe-selector');
            await timeframeSelector.selectOption('1h');
            await page.waitForTimeout(1000);
            
            // Check if timeframe changed
            const selectedValue = await timeframeSelector.inputValue();
            console.log('📊 Selected timeframe value:', selectedValue);
            
            // Check chart state after timeframe selection
            const chartStateAfterTimeframe = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        labels: window.chart.data.labels?.length || 0,
                        data: window.chart.data.datasets[0]?.data?.length || 0,
                        label: window.chart.data.datasets[0]?.label || ''
                    };
                }
                return null;
            });
            
            console.log('📊 Chart state after timeframe selection:', chartStateAfterTimeframe);
            
            // Check if the chart label contains the timeframe
            expect(chartStateAfterTimeframe.label).toContain('1h');
            
            console.log('✅ Timeframe selection works with bot!');
        } else {
            console.log('⚠️ No bots available, skipping test');
        }
    });

    test('timeframe selection works with market selection', async ({ page }) => {
        console.log('📈 Testing timeframe selection with market...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Try to select a market first
        const marketItems = await page.locator('.market-item').count();
        console.log('📊 Available market items:', marketItems);
        
        if (marketItems > 0) {
            // Click the first market item
            const firstMarket = await page.locator('.market-item').first();
            await firstMarket.click();
            await page.waitForTimeout(1000);
            
            console.log('📈 Market selected');
            
            // Check chart state after market selection
            const chartStateAfterMarket = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        labels: window.chart.data.labels?.length || 0,
                        data: window.chart.data.datasets[0]?.data?.length || 0,
                        label: window.chart.data.datasets[0]?.label || ''
                    };
                }
                return null;
            });
            
            console.log('📊 Chart state after market selection:', chartStateAfterMarket);
            
            // Now try to change timeframe
            const timeframeSelector = await page.locator('#timeframe-selector');
            await timeframeSelector.selectOption('4h');
            await page.waitForTimeout(1000);
            
            // Check if timeframe changed
            const selectedValue = await timeframeSelector.inputValue();
            console.log('📊 Selected timeframe value:', selectedValue);
            
            // Check chart state after timeframe selection
            const chartStateAfterTimeframe = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        labels: window.chart.data.labels?.length || 0,
                        data: window.chart.data.datasets[0]?.data?.length || 0,
                        label: window.chart.data.datasets[0]?.label || ''
                    };
                }
                return null;
            });
            
            console.log('📊 Chart state after timeframe selection:', chartStateAfterTimeframe);
            
            // Check if the chart label contains the timeframe
            expect(chartStateAfterTimeframe.label).toContain('4h');
            
            console.log('✅ Timeframe selection works with market!');
        } else {
            console.log('⚠️ No market items available, skipping test');
        }
    });
});
