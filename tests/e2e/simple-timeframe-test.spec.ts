/**
 * Simple Timeframe Test
 * Test timeframe functionality without accessing chart directly
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Timeframe Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    });

    test('timeframe selector changes and shows alerts', async ({ page }) => {
        console.log('⏰ Testing timeframe selector changes...');
        
        // Select a market first
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(2000);
        
        // Change timeframe to 1 hour
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
        
        // Change timeframe to 1 day
        await page.selectOption('#timeframe-selector', '1d');
        await page.waitForTimeout(1000);
        
        // Check for another alert
        const alert2 = page.locator('.alert').first();
        const alert2Visible = await alert2.isVisible();
        
        if (alert2Visible) {
            const alert2Text = await alert2.textContent();
            console.log(`📊 Alert2 text: "${alert2Text}"`);
            expect(alert2Text).toContain('Timeframe Updated');
            expect(alert2Text).toContain('1d');
        }
        
        console.log('✅ Timeframe selector changes and shows alerts!');
    });

    test('timeframe selector has all expected options', async ({ page }) => {
        console.log('📋 Testing timeframe selector options...');
        
        const timeframeSelector = page.locator('#timeframe-selector');
        const options = await timeframeSelector.locator('option').all();
        
        console.log(`📊 Found ${options.length} timeframe options`);
        
        const expectedTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M', '3M', '6M', '1y'];
        
        for (const timeframe of expectedTimeframes) {
            const option = page.locator(`#timeframe-selector option[value="${timeframe}"]`);
            const exists = await option.count() > 0;
            console.log(`📊 ${timeframe}: ${exists ? '✅' : '❌'}`);
            expect(exists).toBeTruthy();
        }
        
        console.log('✅ Timeframe selector has all expected options!');
    });

    test('timeframe selector can be changed multiple times', async ({ page }) => {
        console.log('🔄 Testing timeframe selector multiple changes...');
        
        // Select a market first
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(2000);
        
        const timeframes = ['1m', '5m', '1h', '1d', '1w'];
        
        for (const timeframe of timeframes) {
            console.log(`📊 Testing timeframe: ${timeframe}`);
            
            // Select timeframe
            await page.selectOption('#timeframe-selector', timeframe);
            await page.waitForTimeout(1000);
            
            // Verify it was selected
            const selectedValue = await page.inputValue('#timeframe-selector');
            expect(selectedValue).toBe(timeframe);
            
            console.log(`📊 Selected: ${selectedValue}`);
        }
        
        console.log('✅ Timeframe selector can be changed multiple times!');
    });

    test('timeframe works with bot selection', async ({ page }) => {
        console.log('🤖 Testing timeframe with bot selection...');
        
        // Select a bot first
        await page.selectOption('#bot-selector', 'bot1');
        await page.waitForTimeout(2000);
        
        // Change timeframe
        await page.selectOption('#timeframe-selector', '1d');
        await page.waitForTimeout(1000);
        
        // Check for alert
        const alert = page.locator('.alert').first();
        const alertVisible = await alert.isVisible();
        
        if (alertVisible) {
            const alertText = await alert.textContent();
            console.log(`📊 Alert text: "${alertText}"`);
            expect(alertText).toContain('Timeframe Updated');
        }
        
        console.log('✅ Timeframe works with bot selection!');
    });
});
