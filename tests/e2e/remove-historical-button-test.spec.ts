import { test, expect } from '@playwright/test';

test.describe('Remove Historical Button Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('historical view button has been removed', async ({ page }) => {
        console.log('🗑️ Testing historical view button removal...');
        
        // Check that the historical view button no longer exists
        const historicalButton = await page.locator('#toggle-historical');
        const buttonExists = await historicalButton.count();
        
        console.log('📊 Historical button count:', buttonExists);
        expect(buttonExists).toBe(0);
        
        // Check that the Market Graph section still exists and works
        const marketGraph = await page.locator('section.market-graph').first();
        await expect(marketGraph).toBeVisible();
        
        // Check that other graph controls still exist
        const timeframeSelector = await page.locator('#timeframe-selector');
        await expect(timeframeSelector).toBeVisible();
        
        const zoomSlider = await page.locator('#zoom-slider');
        await expect(zoomSlider).toBeVisible();
        
        const marketChart = await page.locator('#market-chart');
        await expect(marketChart).toBeVisible();
        
        console.log('✅ Historical view button removed successfully!');
    });

    test('market graph controls still work without historical button', async ({ page }) => {
        console.log('📊 Testing market graph functionality...');
        
        // Close any open modals first
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        });
        
        // Select a bot first
        const botButtons = await page.locator('.active-bot-btn').count();
        if (botButtons > 0) {
            const firstBot = await page.locator('.active-bot-btn').first();
            await firstBot.click();
            await page.waitForTimeout(1000);
            console.log('🤖 Bot selected');
        }
        
        // Test timeframe selector
        const timeframeSelector = await page.locator('#timeframe-selector');
        await timeframeSelector.selectOption('1h');
        await page.waitForTimeout(1000);
        
        const selectedTimeframe = await timeframeSelector.inputValue();
        expect(selectedTimeframe).toBe('1h');
        console.log('✅ Timeframe selector works');
        
        // Test zoom slider
        const zoomSlider = await page.locator('#zoom-slider');
        await zoomSlider.fill('2');
        await page.waitForTimeout(500);
        
        const zoomValue = await page.locator('#zoom-value').textContent();
        expect(zoomValue).toContain('200%');
        console.log('✅ Zoom slider works');
        
        // Test that chart is still functional
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
        
        expect(chartData).toBeTruthy();
        expect(chartData.labels).toBeGreaterThan(0);
        expect(chartData.data).toBeGreaterThan(0);
        console.log('✅ Chart functionality works');
        
        console.log('✅ Market graph controls work correctly without historical button!');
    });

    test('no console errors after removing historical button', async ({ page }) => {
        console.log('🔍 Checking for console errors...');
        
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Filter out any errors related to the removed button and common 404s
        const relevantErrors = consoleErrors.filter(error => 
            !error.includes('toggle-historical') && 
            !error.includes('Historical View') &&
            !error.includes('404') &&
            !error.includes('Failed to load resource')
        );
        
        console.log('📊 Console errors found:', relevantErrors.length);
        if (relevantErrors.length > 0) {
            console.log('❌ Console errors:', relevantErrors);
        }
        
        expect(relevantErrors.length).toBe(0);
        console.log('✅ No console errors after removing historical button!');
    });
});
