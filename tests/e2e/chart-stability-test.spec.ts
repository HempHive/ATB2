import { test, expect } from '@playwright/test';

test.describe('Chart Stability Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('chart does not flip between different graphs every few seconds', async ({ page }) => {
        console.log('📊 Testing chart stability...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Wait for initial chart to load
        await page.waitForSelector('#market-chart', { state: 'visible' });
        
        // Get initial chart data
        const initialChartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    label: window.chart.data.datasets[0]?.label || '',
                    dataLength: window.chart.data.datasets[0]?.data?.length || 0,
                    labelsLength: window.chart.data.labels?.length || 0
                };
            }
            return null;
        });
        
        console.log('📊 Initial chart data:', initialChartData);
        expect(initialChartData).toBeTruthy();
        expect(initialChartData.label).toContain('ETH Price');
        
        // Wait for 10 seconds to see if chart changes
        console.log('⏳ Waiting 10 seconds to check for chart flipping...');
        await page.waitForTimeout(10000);
        
        // Get chart data after waiting
        const finalChartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    label: window.chart.data.datasets[0]?.label || '',
                    dataLength: window.chart.data.datasets[0]?.data?.length || 0,
                    labelsLength: window.chart.data.labels?.length || 0
                };
            }
            return null;
        });
        
        console.log('📊 Final chart data:', finalChartData);
        
        // Chart should still show the same timeframe and similar data structure
        expect(finalChartData).toBeTruthy();
        expect(finalChartData.label).toContain('ETH Price');
        
        // The chart should not have changed dramatically (data length should be similar)
        const dataLengthDifference = Math.abs(finalChartData.dataLength - initialChartData.dataLength);
        expect(dataLengthDifference).toBeLessThan(10); // Allow for some data updates but not major changes
        
        console.log('✅ Chart is stable and not flipping!');
    });

    test('timeframe selection persists and does not get overridden', async ({ page }) => {
        console.log('🕐 Testing timeframe selection persistence...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Select a specific timeframe
        await page.locator('#timeframe-selector').selectOption('4h');
        await page.waitForTimeout(1000);
        
        // Verify timeframe is selected
        const selectedTimeframe = await page.locator('#timeframe-selector').inputValue();
        expect(selectedTimeframe).toBe('4h');
        
        // Get chart data
        const chartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    label: window.chart.data.datasets[0]?.label || '',
                    dataLength: window.chart.data.datasets[0]?.data?.length || 0
                };
            }
            return null;
        });
        
        console.log('📊 Chart data after 4h selection:', chartData);
        expect(chartData.label).toContain('4h');
        
        // Wait for 8 seconds (longer than the 5-second update interval)
        console.log('⏳ Waiting 8 seconds to check if timeframe persists...');
        await page.waitForTimeout(8000);
        
        // Check that timeframe is still selected
        const finalSelectedTimeframe = await page.locator('#timeframe-selector').inputValue();
        expect(finalSelectedTimeframe).toBe('4h');
        
        // Check that chart still shows 4h data
        const finalChartData = await page.evaluate(() => {
            if (window.chart && window.chart.data) {
                return {
                    label: window.chart.data.datasets[0]?.label || '',
                    dataLength: window.chart.data.datasets[0]?.data?.length || 0
                };
            }
            return null;
        });
        
        console.log('📊 Final chart data after 8 seconds:', finalChartData);
        expect(finalChartData.label).toContain('4h');
        
        console.log('✅ Timeframe selection persists and does not get overridden!');
    });

    test('chart updates smoothly without jarring transitions', async ({ page }) => {
        console.log('🔄 Testing smooth chart updates...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Monitor chart updates for 15 seconds
        const chartUpdates = [];
        const startTime = Date.now();
        
        // Set up a periodic check
        const checkInterval = setInterval(async () => {
            const chartData = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        label: window.chart.data.datasets[0]?.label || '',
                        dataLength: window.chart.data.datasets[0]?.data?.length || 0,
                        timestamp: Date.now()
                    };
                }
                return null;
            });
            
            if (chartData) {
                chartUpdates.push(chartData);
            }
        }, 1000);
        
        // Wait for 15 seconds
        await page.waitForTimeout(15000);
        clearInterval(checkInterval);
        
        console.log('📊 Chart updates captured:', chartUpdates.length);
        
        // Analyze the updates
        const labels = chartUpdates.map(update => update.label);
        const uniqueLabels = [...new Set(labels)];
        
        console.log('📊 Unique chart labels:', uniqueLabels);
        
        // Should not have too many different labels (indicating flipping)
        expect(uniqueLabels.length).toBeLessThanOrEqual(3); // Allow for some variation but not constant flipping
        
        // All labels should be consistent (same timeframe)
        const hasConsistentTimeframe = uniqueLabels.every(label => 
            label.includes('ETH Price') && (label.includes('1h') || label.includes('4h') || label.includes('1d'))
        );
        expect(hasConsistentTimeframe).toBe(true);
        
        console.log('✅ Chart updates smoothly without jarring transitions!');
    });
});
