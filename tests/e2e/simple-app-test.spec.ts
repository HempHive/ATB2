import { test, expect } from '@playwright/test';

test.describe('Simple App Test', () => {
    test('check app initialization', async ({ page }) => {
        console.log('🔍 Checking app initialization...');
        
        // Listen for console messages
        page.on('console', msg => {
            console.log(`📝 Console [${msg.type()}]:`, msg.text());
        });
        
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        
        // Wait for scripts to load
        await page.waitForTimeout(3000);
        
        // Check if Chart.js is loaded
        const chartJsLoaded = await page.evaluate(() => {
            return typeof Chart !== 'undefined';
        });
        console.log('📊 Chart.js loaded:', chartJsLoaded);
        
        // Check if app.js is loaded
        const appJsLoaded = await page.evaluate(() => {
            return typeof ATBDashboard !== 'undefined';
        });
        console.log('📊 ATBDashboard class loaded:', appJsLoaded);
        
        // Check if dashboard is initialized
        const dashboardInitialized = await page.evaluate(() => {
            return typeof window.atbDashboard !== 'undefined';
        });
        console.log('📊 Dashboard initialized:', dashboardInitialized);
        
        // Check for any JavaScript errors
        const errors = await page.evaluate(() => {
            return window.errors || [];
        });
        console.log('❌ JavaScript errors:', errors);
        
        // Check if there are any elements that should be there
        const elements = await page.evaluate(() => {
            return {
                marketChart: !!document.getElementById('market-chart'),
                timeframeSelector: !!document.getElementById('timeframe-selector'),
                activeBotsContainer: !!document.getElementById('active-bots-container')
            };
        });
        console.log('📊 Key elements present:', elements);
        
        console.log('✅ App check complete!');
    });
});
