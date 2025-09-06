import { test, expect } from '@playwright/test';

test.describe('Timeframe Dropdown Fix', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('timeframe dropdown selection persists and updates chart', async ({ page }) => {
        console.log('🕐 Testing timeframe dropdown persistence...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Wait for chart to be ready
        await page.waitForSelector('#market-chart', { state: 'visible' });
        
        // Select a bot first (required for timeframe selection to work)
        const botButtons = await page.locator('.active-bot-btn').count();
        if (botButtons > 0) {
            const firstBot = await page.locator('.active-bot-btn').first();
            await firstBot.click();
            await page.waitForTimeout(1000);
            console.log('🤖 Bot selected for timeframe test');
        }
        
        // Get initial chart data
        const initialChartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    labels: window.chart.data.labels?.length || 0,
                    data: window.chart.data.datasets[0]?.data?.length || 0,
                    label: window.chart.data.datasets[0]?.label || ''
                };
            }
            return null;
        });
        
        console.log('📊 Initial chart data:', initialChartData);
        
        // Select a different timeframe (1h)
        const timeframeSelector = await page.locator('#timeframe-selector');
        await timeframeSelector.selectOption('1h');
        
        // Wait for chart to update
        await page.waitForTimeout(1000);
        
        // Check that dropdown value is set correctly
        const selectedValue = await timeframeSelector.inputValue();
        console.log('📊 Selected timeframe value:', selectedValue);
        expect(selectedValue).toBe('1h');
        
        // Check that chart has updated
        const updatedChartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    labels: window.chart.data.labels?.length || 0,
                    data: window.chart.data.datasets[0]?.data?.length || 0,
                    label: window.chart.data.datasets[0]?.label || ''
                };
            }
            return null;
        });
        
        console.log('📊 Updated chart data:', updatedChartData);
        
        // Chart should have updated
        expect(updatedChartData).toBeTruthy();
        expect(updatedChartData.label).toContain('1h');
        
        // Wait a bit more to ensure it doesn't reset
        await page.waitForTimeout(3000);
        
        // Check that dropdown value is still correct after waiting
        const finalValue = await timeframeSelector.inputValue();
        console.log('📊 Final timeframe value:', finalValue);
        expect(finalValue).toBe('1h');
        
        // Check that chart label still shows the correct timeframe
        const finalChartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    label: window.chart.data.datasets[0]?.label || ''
                };
            }
            return null;
        });
        
        console.log('📊 Final chart label:', finalChartData);
        expect(finalChartData.label).toContain('1h');
        
        console.log('✅ Timeframe dropdown selection persists!');
    });

    test('timeframe dropdown works with different timeframes', async ({ page }) => {
        console.log('🕐 Testing different timeframe selections...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Select a bot first (required for timeframe selection to work)
        const botButtons = await page.locator('.active-bot-btn').count();
        if (botButtons > 0) {
            const firstBot = await page.locator('.active-bot-btn').first();
            await firstBot.click();
            await page.waitForTimeout(1000);
            console.log('🤖 Bot selected for timeframe test');
        }
        
        const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];
        
        for (const timeframe of timeframes) {
            console.log(`🕐 Testing timeframe: ${timeframe}`);
            
            // Select the timeframe
            const timeframeSelector = await page.locator('#timeframe-selector');
            await timeframeSelector.selectOption(timeframe);
            
            // Wait for update
            await page.waitForTimeout(500);
            
            // Check dropdown value
            const selectedValue = await timeframeSelector.inputValue();
            expect(selectedValue).toBe(timeframe);
            
            // Check chart label
            const chartData = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return window.chart.data.datasets[0]?.label || '';
                }
                return '';
            });
            
            expect(chartData).toContain(timeframe);
            console.log(`✅ ${timeframe} timeframe works correctly`);
        }
        
        console.log('✅ All timeframe selections work correctly!');
    });

    test('timeframe persists through automatic updates', async ({ page }) => {
        console.log('🔄 Testing timeframe persistence through automatic updates...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Select a bot first (required for timeframe selection to work)
        const botButtons = await page.locator('.active-bot-btn').count();
        if (botButtons > 0) {
            const firstBot = await page.locator('.active-bot-btn').first();
            await firstBot.click();
            await page.waitForTimeout(1000);
            console.log('🤖 Bot selected for timeframe test');
        }
        
        // Select a specific timeframe
        const timeframeSelector = await page.locator('#timeframe-selector');
        await timeframeSelector.selectOption('4h');
        
        // Wait for initial update
        await page.waitForTimeout(1000);
        
        // Verify initial selection
        let selectedValue = await timeframeSelector.inputValue();
        expect(selectedValue).toBe('4h');
        
        // Wait for automatic updates (5+ seconds)
        await page.waitForTimeout(6000);
        
        // Check that timeframe is still selected
        selectedValue = await timeframeSelector.inputValue();
        console.log('📊 Timeframe after automatic updates:', selectedValue);
        expect(selectedValue).toBe('4h');
        
        // Check that chart still shows the correct timeframe
        const chartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return window.chart.data.datasets[0]?.label || '';
            }
            return '';
        });
        
        console.log('📊 Chart label after automatic updates:', chartData);
        expect(chartData).toContain('4h');
        
        console.log('✅ Timeframe persists through automatic updates!');
    });
});
