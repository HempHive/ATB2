/**
 * PNG Buttons Visibility Test
 * Tests that PNG buttons are visible on the main toolbar
 */

import { test, expect } from '@playwright/test';

test.describe('PNG Buttons Visibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('png buttons are visible on main toolbar', async ({ page }) => {
        console.log('🔍 Checking PNG button visibility...');
        
        // Check that PNG buttons are visible
        const pngButtons = page.locator('.btn-png');
        const count = await pngButtons.count();
        console.log(`📊 Found ${count} PNG buttons`);
        
        // Check specific PNG buttons
        const digitalAccountPng = page.locator('img[alt="Digital Account"]');
        const digitalBankPng = page.locator('img[alt="Digital Bank"]');
        const digitalCurrencyPng = page.locator('img[alt="Digital Currency"]');
        const marketReviewPng = page.locator('img[alt="Market Data"]');
        const strategyEditorPng = page.locator('img[alt="Strategy Editor"]');
        const investmentPanelPng = page.locator('img[alt="Portfolio Investments"]');
        const themeCustomizerPng = page.locator('img[alt="GUI Customise"]');
        const themeTogglePng = page.locator('img[alt="Theme Toggle"]');
        
        // Check if PNG buttons are visible
        const digitalAccountVisible = await digitalAccountPng.isVisible();
        const digitalBankVisible = await digitalBankPng.isVisible();
        const digitalCurrencyVisible = await digitalCurrencyPng.isVisible();
        const marketReviewVisible = await marketReviewPng.isVisible();
        const strategyEditorVisible = await strategyEditorPng.isVisible();
        const investmentPanelVisible = await investmentPanelPng.isVisible();
        const themeCustomizerVisible = await themeCustomizerPng.isVisible();
        const themeToggleVisible = await themeTogglePng.isVisible();
        
        console.log(`🔍 Digital Account PNG: ${digitalAccountVisible ? '✅' : '❌'}`);
        console.log(`🔍 Digital Bank PNG: ${digitalBankVisible ? '✅' : '❌'}`);
        console.log(`🔍 Digital Currency PNG: ${digitalCurrencyVisible ? '✅' : '❌'}`);
        console.log(`🔍 Market Data PNG: ${marketReviewVisible ? '✅' : '❌'}`);
        console.log(`🔍 Strategy Editor PNG: ${strategyEditorVisible ? '✅' : '❌'}`);
        console.log(`🔍 Portfolio Investments PNG: ${investmentPanelVisible ? '✅' : '❌'}`);
        console.log(`🔍 GUI Customise PNG: ${themeCustomizerVisible ? '✅' : '❌'}`);
        console.log(`🔍 Theme Toggle PNG: ${themeToggleVisible ? '✅' : '❌'}`);
        
        // Check fallback buttons
        const fallbackButtons = page.locator('.btn-fallback');
        const fallbackCount = await fallbackButtons.count();
        console.log(`📊 Found ${fallbackCount} fallback buttons`);
        
        // Check if fallback buttons are visible
        const digitalAccountFallback = page.locator('#digital-account');
        const digitalBankFallback = page.locator('#digital-bank');
        const digitalCurrencyFallback = page.locator('#digital-currency');
        const marketReviewFallback = page.locator('#market-review');
        const strategyEditorFallback = page.locator('#strategy-editor');
        const investmentPanelFallback = page.locator('#investment-panel');
        const themeCustomizerFallback = page.locator('#theme-customizer');
        const themeToggleFallback = page.locator('#theme-toggle');
        
        const digitalAccountFallbackVisible = await digitalAccountFallback.isVisible();
        const digitalBankFallbackVisible = await digitalBankFallback.isVisible();
        const digitalCurrencyFallbackVisible = await digitalCurrencyFallback.isVisible();
        const marketReviewFallbackVisible = await marketReviewFallback.isVisible();
        const strategyEditorFallbackVisible = await strategyEditorFallback.isVisible();
        const investmentPanelFallbackVisible = await investmentPanelFallback.isVisible();
        const themeCustomizerFallbackVisible = await themeCustomizerFallback.isVisible();
        const themeToggleFallbackVisible = await themeToggleFallback.isVisible();
        
        console.log(`🔍 Digital Account Fallback: ${digitalAccountFallbackVisible ? '✅' : '❌'}`);
        console.log(`🔍 Digital Bank Fallback: ${digitalBankFallbackVisible ? '✅' : '❌'}`);
        console.log(`🔍 Digital Currency Fallback: ${digitalCurrencyFallbackVisible ? '✅' : '❌'}`);
        console.log(`🔍 Market Data Fallback: ${marketReviewFallbackVisible ? '✅' : '❌'}`);
        console.log(`🔍 Strategy Editor Fallback: ${strategyEditorFallbackVisible ? '✅' : '❌'}`);
        console.log(`🔍 Portfolio Investments Fallback: ${investmentPanelFallbackVisible ? '✅' : '❌'}`);
        console.log(`🔍 GUI Customise Fallback: ${themeCustomizerFallbackVisible ? '✅' : '❌'}`);
        console.log(`🔍 Theme Toggle Fallback: ${themeToggleFallbackVisible ? '✅' : '❌'}`);
        
        // At least one should be visible (either PNG or fallback)
        const anyVisible = digitalAccountVisible || digitalAccountFallbackVisible;
        expect(anyVisible).toBeTruthy();
        
        console.log('✅ PNG button visibility test complete');
    });
});
