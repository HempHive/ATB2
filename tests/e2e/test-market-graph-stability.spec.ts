import { test, expect } from '@playwright/test';

test.describe('Market Graph Stability Test', () => {
    test('market graph shows current view and updates without constant reloading', async ({ page }) => {
        console.log('📊 Testing Market Graph stability...');
        
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Monitor chart updates for 20 seconds
        const chartUpdates = [];
        const startTime = Date.now();
        
        // Set up a periodic check every 1 second
        for (let i = 0; i < 20; i++) {
            await page.waitForTimeout(1000);
            
            const chartState = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        timestamp: Date.now(),
                        label: window.chart.data.datasets[0]?.label || '',
                        dataLength: window.chart.data.datasets[0]?.data?.length || 0,
                        labelsLength: window.chart.data.labels?.length || 0,
                        currentTimeframe: window.atbDashboard?.currentTimeframe || '',
                        userSelectedTimeframe: window.atbDashboard?.userSelectedTimeframe || false,
                        currentBot: window.atbDashboard?.currentBot || '',
                        chartId: window.chart.id || 'unknown'
                    };
                }
                return null;
            });
            
            if (chartState) {
                chartUpdates.push(chartState);
                console.log(`📊 Second ${i + 1}/20:`, {
                    label: chartState.label,
                    dataLength: chartState.dataLength,
                    timeframe: chartState.currentTimeframe,
                    userSelected: chartState.userSelectedTimeframe,
                    chartId: chartState.chartId
                });
            }
        }
        
        console.log('📊 Total chart states captured:', chartUpdates.length);
        
        // Analyze the data
        const uniqueLabels = [...new Set(chartUpdates.map(s => s.label))];
        const uniqueDataLengths = [...new Set(chartUpdates.map(s => s.dataLength))];
        const uniqueChartIds = [...new Set(chartUpdates.map(s => s.chartId))];
        
        console.log('📊 Unique labels:', uniqueLabels);
        console.log('📊 Unique data lengths:', uniqueDataLengths);
        console.log('📊 Unique chart IDs:', uniqueChartIds);
        
        // Check for changes that indicate constant reloading
        const labelChanges = chartUpdates.filter((state, index) => 
            index > 0 && state.label !== chartUpdates[index - 1].label
        );
        
        const dataLengthChanges = chartUpdates.filter((state, index) => 
            index > 0 && state.dataLength !== chartUpdates[index - 1].dataLength
        );
        
        const chartIdChanges = chartUpdates.filter((state, index) => 
            index > 0 && state.chartId !== chartUpdates[index - 1].chartId
        );
        
        console.log('📊 Label changes:', labelChanges.length);
        console.log('📊 Data length changes:', dataLengthChanges.length);
        console.log('📊 Chart ID changes:', chartIdChanges.length);
        
        // The chart should be stable - minimal changes
        expect(labelChanges.length).toBeLessThanOrEqual(1); // Allow for initial load
        expect(dataLengthChanges.length).toBeLessThanOrEqual(1); // Allow for initial load
        expect(chartIdChanges.length).toBe(0); // Chart should not be recreated
        
        // Should have consistent data
        expect(uniqueLabels.length).toBeLessThanOrEqual(2); // Allow for initial load and one update
        expect(uniqueDataLengths.length).toBeLessThanOrEqual(2); // Allow for initial load and one update
        expect(uniqueChartIds.length).toBe(1); // Only one chart instance
        
        console.log('✅ Market Graph is stable and not constantly reloading!');
    });

    test('market graph updates smoothly when timeframe changes', async ({ page }) => {
        console.log('🕐 Testing Market Graph updates on timeframe changes...');
        
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Test different timeframes
        const timeframes = ['1h', '4h', '1d', '1w'];
        
        for (const timeframe of timeframes) {
            console.log(`📊 Testing timeframe: ${timeframe}`);
            
            // Select timeframe
            await page.locator('#timeframe-selector').selectOption(timeframe);
            await page.waitForTimeout(2000); // Wait for update
            
            // Verify timeframe is selected
            const selectedTimeframe = await page.locator('#timeframe-selector').inputValue();
            expect(selectedTimeframe).toBe(timeframe);
            
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
            
            console.log(`📊 Chart data for ${timeframe}:`, chartData);
            expect(chartData.label).toContain(timeframe);
            expect(chartData.dataLength).toBeGreaterThan(0);
            
            // Wait 3 seconds and check that it's stable
            await page.waitForTimeout(3000);
            
            const finalChartData = await page.evaluate(() => {
                if (window.chart && window.chart.data) {
                    return {
                        label: window.chart.data.datasets[0]?.label || '',
                        dataLength: window.chart.data.datasets[0]?.data?.length || 0
                    };
                }
                return null;
            });
            
            console.log(`📊 Final chart data for ${timeframe}:`, finalChartData);
            expect(finalChartData.label).toContain(timeframe);
            expect(finalChartData.dataLength).toBe(chartData.dataLength); // Should be same length
        }
        
        console.log('✅ Market Graph updates smoothly on timeframe changes!');
    });
});
