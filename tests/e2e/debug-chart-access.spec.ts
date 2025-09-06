/**
 * Debug Chart Access Test
 * Debug how to access the chart in tests
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Chart Access', () => {
    test.beforeEach(async ({ page }) => {
        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🚨 Console error:', msg.text());
            }
        });
        
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('debug chart access methods', async ({ page }) => {
        console.log('🔍 Debugging chart access...');
        
        // Check if window.chart exists
        const windowChart = await page.evaluate(() => {
            return {
                exists: typeof window.chart !== 'undefined',
                type: typeof window.chart,
                isChart: window.chart instanceof Chart
            };
        });
        
        console.log(`📊 window.chart:`, windowChart);
        
        // Check if dashboard exists
        const dashboard = await page.evaluate(() => {
            return {
                exists: typeof window.atbDashboard !== 'undefined',
                type: typeof window.atbDashboard,
                hasChart: window.atbDashboard && window.atbDashboard.chart
            };
        });
        
        console.log(`📊 window.dashboard:`, dashboard);
        
        // Check if we can access chart through dashboard
        const chartThroughDashboard = await page.evaluate(() => {
            if (window.atbDashboard && window.atbDashboard.chart) {
                return {
                    exists: true,
                    hasData: window.atbDashboard.chart.data !== null,
                    labelCount: window.atbDashboard.chart.data ? window.atbDashboard.chart.data.labels.length : 0,
                    dataCount: window.atbDashboard.chart.data ? window.atbDashboard.chart.data.datasets[0].data.length : 0,
                    label: window.atbDashboard.chart.data ? window.atbDashboard.chart.data.datasets[0].label : null
                };
            }
            return { exists: false };
        });
        
        console.log(`📊 chart through dashboard:`, chartThroughDashboard);
        
        // Try to access chart through DOM
        const chartElement = await page.locator('#market-chart');
        const chartExists = await chartElement.count() > 0;
        console.log(`📊 Chart element exists: ${chartExists}`);
        
        if (chartExists) {
            const chartContext = await page.evaluate(() => {
                const canvas = document.getElementById('market-chart');
                if (canvas) {
                    return {
                        exists: true,
                        width: canvas.width,
                        height: canvas.height,
                        hasContext: !!canvas.getContext
                    };
                }
                return { exists: false };
            });
            
            console.log(`📊 Chart canvas:`, chartContext);
        }
        
        // Try to select a market and see if chart updates
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(2000);
        
        // Check chart after market selection
        const chartAfterMarket = await page.evaluate(() => {
            if (window.atbDashboard && window.atbDashboard.chart) {
                return {
                    hasData: window.atbDashboard.chart.data !== null,
                    labelCount: window.atbDashboard.chart.data ? window.atbDashboard.chart.data.labels.length : 0,
                    dataCount: window.atbDashboard.chart.data ? window.atbDashboard.chart.data.datasets[0].data.length : 0,
                    label: window.atbDashboard.chart.data ? window.atbDashboard.chart.data.datasets[0].label : null
                };
            }
            return { hasData: false };
        });
        
        console.log(`📊 Chart after market selection:`, chartAfterMarket);
        
        // Check if DOMContentLoaded has fired
        const domReady = await page.evaluate(() => {
            return {
                readyState: document.readyState,
                hasATBDashboard: typeof window.ATBDashboard !== 'undefined',
                hasChart: typeof Chart !== 'undefined'
            };
        });
        
        console.log(`📊 DOM state:`, domReady);
        
        // Try to manually trigger dashboard creation
        const manualDashboard = await page.evaluate(() => {
            if (typeof window.ATBDashboard !== 'undefined') {
                try {
                    const dashboard = new window.ATBDashboard();
                    window.atbDashboard = dashboard;
                    return {
                        success: true,
                        hasChart: dashboard.chart !== null
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }
            return { success: false, error: 'ATBDashboard not defined' };
        });
        
        console.log(`📊 Manual dashboard creation:`, manualDashboard);
    });
});
