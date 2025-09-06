/**
 * Debug Status Images Test
 * Debug why online.png and offline.png aren't loading
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Status Images', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('debug status image loading', async ({ page }) => {
        console.log('🔍 Debugging status image loading...');
        
        // Check if status PNG exists
        const statusPng = page.locator('#status-png');
        const pngExists = await statusPng.count() > 0;
        console.log(`📊 Status PNG exists: ${pngExists}`);
        
        if (pngExists) {
            // Check current src and alt
            const currentSrc = await statusPng.getAttribute('src');
            const currentAlt = await statusPng.getAttribute('alt');
            const isVisible = await statusPng.isVisible();
            
            console.log(`📊 Current src: ${currentSrc}`);
            console.log(`📊 Current alt: ${currentAlt}`);
            console.log(`📊 Is visible: ${isVisible}`);
            
            // Check if the image is actually loading
            const imageLoaded = await statusPng.evaluate(img => {
                return img.complete && img.naturalHeight !== 0;
            });
            console.log(`📊 Image loaded: ${imageLoaded}`);
            
            // Try to manually set the online image
            await page.evaluate(() => {
                const statusPng = document.getElementById('status-png');
                if (statusPng) {
                    statusPng.src = 'images/status-online.png';
                    statusPng.alt = 'Online';
                }
            });
            
            await page.waitForTimeout(1000);
            
            // Check if it changed
            const newSrc = await statusPng.getAttribute('src');
            const newAlt = await statusPng.getAttribute('alt');
            const newVisible = await statusPng.isVisible();
            
            console.log(`📊 New src: ${newSrc}`);
            console.log(`📊 New alt: ${newAlt}`);
            console.log(`📊 New visible: ${newVisible}`);
            
            // Check if the image loaded after manual change
            const imageLoadedAfter = await statusPng.evaluate(img => {
                return img.complete && img.naturalHeight !== 0;
            });
            console.log(`📊 Image loaded after change: ${imageLoadedAfter}`);
            
            // Try the updateConnectionStatus function
            await page.evaluate(() => {
                if (window.updateConnectionStatus) {
                    console.log('Calling updateConnectionStatus(true)');
                    window.updateConnectionStatus(true);
                } else {
                    console.log('updateConnectionStatus function not found');
                }
            });
            
            await page.waitForTimeout(1000);
            
            // Check final state
            const finalSrc = await statusPng.getAttribute('src');
            const finalAlt = await statusPng.getAttribute('alt');
            const finalVisible = await statusPng.isVisible();
            
            console.log(`📊 Final src: ${finalSrc}`);
            console.log(`📊 Final alt: ${finalAlt}`);
            console.log(`📊 Final visible: ${finalVisible}`);
            
            // Check if the image loaded after function call
            const imageLoadedFinal = await statusPng.evaluate(img => {
                return img.complete && img.naturalHeight !== 0;
            });
            console.log(`📊 Image loaded after function: ${imageLoadedFinal}`);
        }
        
        // Check if the images exist on the server
        const onlineImageResponse = await page.goto('http://localhost:3000/images/online.png');
        const offlineImageResponse = await page.goto('http://localhost:3000/images/offline.png');
        
        console.log(`📊 Online image accessible: ${onlineImageResponse?.status() === 200}`);
        console.log(`📊 Offline image accessible: ${offlineImageResponse?.status() === 200}`);
        
        // Go back to the main page
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        expect(pngExists).toBeTruthy();
    });

    test('test status image switching', async ({ page }) => {
        console.log('🔄 Testing status image switching...');
        
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Test switching to online
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(true);
            }
        });
        
        await page.waitForTimeout(1000);
        
        const onlineSrc = await statusPng.getAttribute('src');
        const onlineAlt = await statusPng.getAttribute('alt');
        const onlineVisible = await statusPng.isVisible();
        const fallbackText = await statusFallback.textContent();
        
        console.log(`📊 Online state - src: ${onlineSrc}, alt: ${onlineAlt}, visible: ${onlineVisible}`);
        console.log(`📊 Fallback text: ${fallbackText}`);
        
        // Test switching to offline
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(false);
            }
        });
        
        await page.waitForTimeout(1000);
        
        const offlineSrc = await statusPng.getAttribute('src');
        const offlineAlt = await statusPng.getAttribute('alt');
        const offlineVisible = await statusPng.isVisible();
        const fallbackTextOffline = await statusFallback.textContent();
        
        console.log(`📊 Offline state - src: ${offlineSrc}, alt: ${offlineAlt}, visible: ${offlineVisible}`);
        console.log(`📊 Fallback text offline: ${fallbackTextOffline}`);
        
        // Check if images are actually changing
        expect(onlineSrc).toContain('status-online.png');
        expect(offlineSrc).toContain('status-offline.png');
    });
});
