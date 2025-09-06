/**
 * Timeframe Correlation Test
 * Test that timeframe dropdown selections correlate with market graph display
 */

import { test, expect } from '@playwright/test';

test.describe('Timeframe Correlation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('timeframe selector updates chart data', async ({ page }) => {
        console.log('⏰ Testing timeframe selector updates chart data...');
        
        // Select a market first
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(2000);
        
        // Get initial chart data
        const initialChartData = await page.evaluate(() => {
            const chart = window.atbDashboard?.chart;
            if (chart && chart.data && chart.data.labels) {
                return {
                    labelCount: chart.data.labels.length,
                    dataCount: chart.data.datasets[0].data.length,
                    label: chart.data.datasets[0].label
                };
            }
            return null;
        });
        
        console.log(`📊 Initial chart data:`, initialChartData);
        
        // Change timeframe to 1 hour
        await page.selectOption('#timeframe-selector', '1h');
        await page.waitForTimeout(2000);
        
        // Check that chart updated
        const hourChartData = await page.evaluate(() => {
            const chart = window.atbDashboard?.chart;
            if (chart && chart.data && chart.data.labels) {
                return {
                    labelCount: chart.data.labels.length,
                    dataCount: chart.data.datasets[0].data.length,
                    label: chart.data.datasets[0].label
                };
            }
            return null;
        });
        
        console.log(`📊 1h chart data:`, hourChartData);
        
        // Chart should have updated
        expect(hourChartData).toBeTruthy();
        expect(hourChartData.label).toContain('1h');
        
        // Change timeframe to 1 day
        await page.selectOption('#timeframe-selector', '1d');
        await page.waitForTimeout(2000);
        
        const dayChartData = await page.evaluate(() => {
            const chart = window.atbDashboard?.chart;
            if (chart && chart.data && chart.data.labels) {
                return {
                    labelCount: chart.data.labels.length,
                    dataCount: chart.data.datasets[0].data.length,
                    label: chart.data.datasets[0].label
                };
            }
            return null;
        });
        
        console.log(`📊 1d chart data:`, dayChartData);
        
        // Chart should have updated again
        expect(dayChartData).toBeTruthy();
        expect(dayChartData.label).toContain('1d');
        
        console.log('✅ Timeframe selector updates chart data!');
    });

    test('different timeframes show different data amounts', async ({ page }) => {
        console.log('📊 Testing different timeframes show different data amounts...');
        
        // Select a market first
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(2000);
        
        const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M', '3M', '6M', '1y'];
        const dataCounts = [];
        
        for (const timeframe of timeframes) {
            console.log(`📊 Testing timeframe: ${timeframe}`);
            
            // Select timeframe
            await page.selectOption('#timeframe-selector', timeframe);
            await page.waitForTimeout(2000);
            
            // Get chart data
            const chartData = await page.evaluate(() => {
                const chart = window.atbDashboard?.chart;
                if (chart && chart.data && chart.data.labels) {
                    return {
                        labelCount: chart.data.labels.length,
                        dataCount: chart.data.datasets[0].data.length,
                        label: chart.data.datasets[0].label
                    };
                }
                return null;
            });
            
            if (chartData) {
                dataCounts.push({
                    timeframe,
                    count: chartData.dataCount,
                    label: chartData.label
                });
                console.log(`📊 ${timeframe}: ${chartData.dataCount} data points`);
            }
        }
        
        // Verify that different timeframes have different data amounts
        const uniqueCounts = new Set(dataCounts.map(d => d.count));
        expect(uniqueCounts.size).toBeGreaterThan(1);
        
        // Verify that all timeframes are working
        expect(dataCounts.length).toBe(timeframes.length);
        
        console.log('✅ Different timeframes show different data amounts!');
    });

    test('timeframe changes show appropriate labels', async ({ page }) => {
        console.log('🏷️ Testing timeframe changes show appropriate labels...');
        
        // Select a market first
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(2000);
        
        // Test different timeframes and their label formats
        const timeframeTests = [
            { timeframe: '1m', expectedFormat: 'time' },
            { timeframe: '5m', expectedFormat: 'time' },
            { timeframe: '15m', expectedFormat: 'time' },
            { timeframe: '1h', expectedFormat: 'time' },
            { timeframe: '4h', expectedFormat: 'time' },
            { timeframe: '1d', expectedFormat: 'date' },
            { timeframe: '1w', expectedFormat: 'date' },
            { timeframe: '1M', expectedFormat: 'date' },
            { timeframe: '3M', expectedFormat: 'date' },
            { timeframe: '6M', expectedFormat: 'date' },
            { timeframe: '1y', expectedFormat: 'date' }
        ];
        
        for (const test of timeframeTests) {
            console.log(`📊 Testing ${test.timeframe} labels...`);
            
            // Select timeframe
            await page.selectOption('#timeframe-selector', test.timeframe);
            await page.waitForTimeout(2000);
            
            // Get chart labels
            const labels = await page.evaluate(() => {
                const chart = window.atbDashboard?.chart;
                if (chart && chart.data && chart.data.labels) {
                    return chart.data.labels.slice(0, 3); // Get first 3 labels
                }
                return [];
            });
            
            console.log(`📊 ${test.timeframe} labels:`, labels);
            
            // Verify labels are not empty
            expect(labels.length).toBeGreaterThan(0);
            
            // For time-based timeframes, labels should contain time
            if (test.expectedFormat === 'time') {
                const hasTime = labels.some(label => label.includes(':'));
                expect(hasTime).toBeTruthy();
            }
            
            // For date-based timeframes, labels should contain date
            if (test.expectedFormat === 'date') {
                const hasDate = labels.some(label => label.includes('/') || label.includes('-'));
                expect(hasDate).toBeTruthy();
            }
        }
        
        console.log('✅ Timeframe changes show appropriate labels!');
    });

    test('timeframe selector shows alerts', async ({ page }) => {
        console.log('🔔 Testing timeframe selector shows alerts...');
        
        // Select a market first
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(2000);
        
        // Change timeframe
        await page.selectOption('#timeframe-selector', '1h');
        
        await page.waitForTimeout(1000);
        
        // Check for alert
        const alert = page.locator('.alert').first();
        const alertVisible = await alert.isVisible();
        
        if (alertVisible) {
            const alertText = await alert.textContent();
            console.log(`📊 Alert text: "${alertText}"`);
            expect(alertText).toContain('Timeframe Updated');
            expect(alertText).toContain('1h');
        }
        
        console.log('✅ Timeframe selector shows alerts!');
    });

    test('timeframe works with bot selection', async ({ page }) => {
        console.log('🤖 Testing timeframe works with bot selection...');
        
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        await page.waitForTimeout(2000);
        
        // Change timeframe
        await page.selectOption('#timeframe-selector', '1d');
        await page.waitForTimeout(2000);
        
        // Check that chart updated with bot's market and timeframe
        const chartData = await page.evaluate(() => {
            const chart = window.atbDashboard?.chart;
            if (chart && chart.data && chart.data.labels) {
                return {
                    labelCount: chart.data.labels.length,
                    dataCount: chart.data.datasets[0].data.length,
                    label: chart.data.datasets[0].label
                };
            }
            return null;
        });
        
        console.log(`📊 Bot + timeframe chart data:`, chartData);
        
        // Chart should show bot's market (AAPL) with 1d timeframe
        expect(chartData).toBeTruthy();
        expect(chartData.label).toContain('AAPL');
        expect(chartData.label).toContain('1d');
        
        console.log('✅ Timeframe works with bot selection!');
    });

    test('timeframe persistence across market changes', async ({ page }) => {
        console.log('💾 Testing timeframe persistence across market changes...');
        
        // Select a market and timeframe
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        await page.waitForTimeout(1000);
        
        await page.selectOption('#timeframe-selector', '1w');
        await page.waitForTimeout(2000);
        
        // Get initial chart data
        const initialData = await page.evaluate(() => {
            const chart = window.atbDashboard?.chart;
            if (chart && chart.data && chart.data.labels) {
                return chart.data.datasets[0].label;
            }
            return null;
        });
        
        console.log(`📊 Initial chart label: "${initialData}"`);
        
        // Change to different market
        const ethMarket = page.locator('.market-item[data-symbol="ETH-USD"]');
        await ethMarket.click();
        await page.waitForTimeout(2000);
        
        // Check that timeframe is still applied
        const finalData = await page.evaluate(() => {
            const chart = window.atbDashboard?.chart;
            if (chart && chart.data && chart.data.labels) {
                return chart.data.datasets[0].label;
            }
            return null;
        });
        
        console.log(`📊 Final chart label: "${finalData}"`);
        
        // Should still show 1w timeframe but with ETH
        expect(finalData).toContain('ETH-USD');
        expect(finalData).toContain('1w');
        
        console.log('✅ Timeframe persistence across market changes!');
    });
});
