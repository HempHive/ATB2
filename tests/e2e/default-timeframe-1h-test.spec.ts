import { test, expect } from '@playwright/test';

test.describe('Default Timeframe 1h Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('default timeframe is 1h and dropdown reflects this', async ({ page }) => {
        console.log('🕐 Testing default timeframe is 1h...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Check that the timeframe dropdown shows 1h as selected
        const timeframeSelector = await page.locator('#timeframe-selector');
        const selectedValue = await timeframeSelector.inputValue();
        console.log('📊 Selected timeframe value:', selectedValue);
        expect(selectedValue).toBe('1h');
        
        // Check that the currentTimeframe in JavaScript is also 1h
        const currentTimeframe = await page.evaluate(() => {
            return window.atbDashboard?.currentTimeframe;
        });
        console.log('📊 Current timeframe in JS:', currentTimeframe);
        expect(currentTimeframe).toBe('1h');
        
        // Check that the chart shows 1h data
        const chartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    labels: window.chart.data.labels?.length || 0,
                    data: window.chart.data.datasets[0]?.data?.length || 0,
                    label: window.chart.data.datasets[0]?.label || ''
                };
            }
            return null;
        });
        
        console.log('📊 Chart data:', chartData);
        expect(chartData).toBeTruthy();
        expect(chartData.label).toContain('1h');
        
        console.log('✅ Default timeframe is 1h and dropdown reflects this!');
    });

    test('timeframe dropdown HTML has 1h selected by default', async ({ page }) => {
        console.log('🔍 Testing HTML default selection...');
        
        // Check that the 1h option has the selected attribute
        const oneHourOption = await page.locator('#timeframe-selector option[value="1h"]');
        const isSelected = await oneHourOption.getAttribute('selected');
        console.log('📊 1h option selected attribute:', isSelected);
        expect(isSelected).not.toBeNull();
        
        // Check that no other option has the selected attribute
        const otherOptions = await page.locator('#timeframe-selector option:not([value="1h"])').all();
        for (const option of otherOptions) {
            const hasSelected = await option.getAttribute('selected');
            expect(hasSelected).toBeNull();
        }
        
        console.log('✅ HTML has 1h selected by default!');
    });

    test('chart displays 1h data on initial load', async ({ page }) => {
        console.log('📊 Testing chart displays 1h data on load...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Wait for chart to load
        await page.waitForSelector('#market-chart', { state: 'visible' });
        
        // Check that chart shows 1h timeframe data
        const chartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    label: window.chart.data.datasets[0]?.label || '',
                    dataLength: window.chart.data.datasets[0]?.data?.length || 0,
                    labelsLength: window.chart.data.labels?.length || 0
                };
            }
            return null;
        });
        
        console.log('📊 Chart data on load:', chartData);
        expect(chartData).toBeTruthy();
        expect(chartData.label).toContain('1h');
        expect(chartData.dataLength).toBeGreaterThan(0);
        expect(chartData.labelsLength).toBeGreaterThan(0);
        
        // Verify the data looks like 1h data (should have reasonable number of points)
        expect(chartData.dataLength).toBeGreaterThanOrEqual(20); // 1h should have at least 20 data points
        expect(chartData.dataLength).toBeLessThanOrEqual(50); // But not too many
        
        console.log('✅ Chart displays 1h data on initial load!');
    });

    test('timeframe selection works correctly with 1h default', async ({ page }) => {
        console.log('🔄 Testing timeframe selection with 1h default...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Verify initial state is 1h
        let selectedValue = await page.locator('#timeframe-selector').inputValue();
        expect(selectedValue).toBe('1h');
        
        // Change to a different timeframe
        await page.locator('#timeframe-selector').selectOption('4h');
        await page.waitForTimeout(1000);
        
        // Verify it changed
        selectedValue = await page.locator('#timeframe-selector').inputValue();
        expect(selectedValue).toBe('4h');
        
        // Check chart updated
        const chartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return window.chart.data.datasets[0]?.label || '';
            }
            return '';
        });
        expect(chartData).toContain('4h');
        
        // Change back to 1h
        await page.locator('#timeframe-selector').selectOption('1h');
        await page.waitForTimeout(1000);
        
        // Verify it's back to 1h
        selectedValue = await page.locator('#timeframe-selector').inputValue();
        expect(selectedValue).toBe('1h');
        
        // Check chart updated back to 1h
        const finalChartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return window.chart.data.datasets[0]?.label || '';
            }
            return '';
        });
        expect(finalChartData).toContain('1h');
        
        console.log('✅ Timeframe selection works correctly with 1h default!');
    });
});
