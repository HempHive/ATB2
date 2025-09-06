/**
 * Debug Theme Button Test
 * Debug why the theme customizer button is not visible
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Theme Button', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('debug theme customizer button visibility', async ({ page }) => {
        console.log('🔍 Debugging theme customizer button...');
        
        // Check if theme customizer button exists
        const themeCustomizer = page.locator('#theme-customizer');
        const buttonCount = await themeCustomizer.count();
        console.log(`📊 Theme customizer button count: ${buttonCount}`);
        
        if (buttonCount > 0) {
            // Check if it's visible
            const isVisible = await themeCustomizer.isVisible();
            console.log(`📊 Theme customizer visible: ${isVisible}`);
            
            // Check if it's enabled
            const isEnabled = await themeCustomizer.isEnabled();
            console.log(`📊 Theme customizer enabled: ${isEnabled}`);
            
            // Check button container
            const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
            const containerVisible = await buttonContainer.isVisible();
            console.log(`📊 Button container visible: ${containerVisible}`);
            
            // Check PNG image
            const pngImage = page.locator('[data-button-id="theme-customizer"] .btn-png');
            const pngVisible = await pngImage.isVisible();
            console.log(`📊 PNG image visible: ${pngVisible}`);
            
            // Check fallback button
            const fallbackButton = page.locator('[data-button-id="theme-customizer"] .btn-fallback');
            const fallbackVisible = await fallbackButton.isVisible();
            console.log(`📊 Fallback button visible: ${fallbackVisible}`);
            
            // Check CSS properties
            const buttonStyles = await themeCustomizer.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    display: computed.display,
                    visibility: computed.visibility,
                    opacity: computed.opacity,
                    position: computed.position,
                    zIndex: computed.zIndex
                };
            });
            console.log(`📊 Button styles:`, buttonStyles);
            
            // Check if button is in viewport
            const isInViewport = await themeCustomizer.isVisible();
            console.log(`📊 Button in viewport: ${isInViewport}`);
            
            // Try to scroll to button
            await themeCustomizer.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            
            const isVisibleAfterScroll = await themeCustomizer.isVisible();
            console.log(`📊 Button visible after scroll: ${isVisibleAfterScroll}`);
            
            // Check all toolbar buttons
            const allButtons = page.locator('.button-container');
            const buttonCount = await allButtons.count();
            console.log(`📊 Total button containers: ${buttonCount}`);
            
            for (let i = 0; i < buttonCount; i++) {
                const button = allButtons.nth(i);
                const buttonId = await button.getAttribute('data-button-id');
                const visible = await button.isVisible();
                console.log(`📊 Button ${i}: ${buttonId} - visible: ${visible}`);
            }
        }
    });

    test('try clicking theme customizer with force', async ({ page }) => {
        console.log('🖱️ Trying to click theme customizer with force...');
        
        const themeCustomizer = page.locator('#theme-customizer');
        
        try {
            // Try clicking with force
            await themeCustomizer.click({ force: true });
            console.log('✅ Clicked theme customizer with force');
            
            // Check if modal opened
            const themeModal = page.locator('#theme-modal');
            const modalVisible = await themeModal.isVisible();
            console.log(`📊 Theme modal visible: ${modalVisible}`);
            
        } catch (error) {
            console.log(`❌ Error clicking theme customizer: ${error}`);
        }
    });
});
