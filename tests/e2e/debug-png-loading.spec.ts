/**
 * Debug PNG Loading Test
 * Debug why PNG images are not displaying properly
 */

import { test, expect } from '@playwright/test';

test.describe('Debug PNG Loading', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('debug PNG image loading for theme customizer', async ({ page }) => {
        console.log('🖼️ Debugging PNG image loading...');
        
        const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
        const pngImage = buttonContainer.locator('.btn-png');
        const fallbackButton = buttonContainer.locator('.btn-fallback');
        
        // Check if PNG image exists
        const pngCount = await pngImage.count();
        console.log(`📊 PNG image count: ${pngCount}`);
        
        if (pngCount > 0) {
            // Check PNG image properties
            const pngSrc = await pngImage.getAttribute('src');
            console.log(`📊 PNG src: ${pngSrc}`);
            
            // Check if image is loaded
            const imageLoaded = await pngImage.evaluate(img => {
                return img.complete && img.naturalHeight !== 0;
            });
            console.log(`📊 Image loaded: ${imageLoaded}`);
            
            // Check image dimensions
            const imageDimensions = await pngImage.evaluate(img => {
                return {
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    clientWidth: img.clientWidth,
                    clientHeight: img.clientHeight
                };
            });
            console.log(`📊 Image dimensions:`, imageDimensions);
            
            // Check CSS properties
            const pngStyles = await pngImage.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    display: computed.display,
                    visibility: computed.visibility,
                    opacity: computed.opacity,
                    width: computed.width,
                    height: computed.height,
                    objectFit: computed.objectFit
                };
            });
            console.log(`📊 PNG styles:`, pngStyles);
            
            // Check fallback button styles
            const fallbackStyles = await fallbackButton.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    display: computed.display,
                    visibility: computed.visibility,
                    opacity: computed.opacity
                };
            });
            console.log(`📊 Fallback styles:`, fallbackStyles);
            
            // Check if image has onerror handler
            const hasOnError = await pngImage.evaluate(img => {
                return img.onerror !== null;
            });
            console.log(`📊 Has onerror handler: ${hasOnError}`);
            
            // Try to trigger onerror manually
            await pngImage.evaluate(img => {
                if (img.onerror) {
                    img.onerror();
                }
            });
            
            await page.waitForTimeout(1000);
            
            // Check if fallback is now visible
            const fallbackVisibleAfter = await fallbackButton.isVisible();
            console.log(`📊 Fallback visible after onerror: ${fallbackVisibleAfter}`);
            
            // Check if PNG is now hidden
            const pngVisibleAfter = await pngImage.isVisible();
            console.log(`📊 PNG visible after onerror: ${pngVisibleAfter}`);
        }
    });

    test('test all toolbar PNG images', async ({ page }) => {
        console.log('🔍 Testing all toolbar PNG images...');
        
        const allButtons = page.locator('.button-container');
        const buttonCount = await allButtons.count();
        console.log(`📊 Total button containers: ${buttonCount}`);
        
        for (let i = 0; i < buttonCount; i++) {
            const button = allButtons.nth(i);
            const buttonId = await button.getAttribute('data-button-id');
            const pngImage = button.locator('.btn-png');
            const fallbackButton = button.locator('.btn-fallback');
            
            const pngVisible = await pngImage.isVisible();
            const fallbackVisible = await fallbackButton.isVisible();
            const pngSrc = await pngImage.getAttribute('src');
            
            console.log(`📊 Button ${i} (${buttonId}):`);
            console.log(`  - PNG visible: ${pngVisible}`);
            console.log(`  - Fallback visible: ${fallbackVisible}`);
            console.log(`  - PNG src: ${pngSrc}`);
            
            if (pngVisible && !fallbackVisible) {
                // Check if PNG is actually loaded
                const imageLoaded = await pngImage.evaluate(img => {
                    return img.complete && img.naturalHeight !== 0;
                });
                console.log(`  - Image loaded: ${imageLoaded}`);
            }
        }
    });
});
