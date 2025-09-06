/**
 * Test Status Images Loading
 * Test if the status images actually load and display
 */

import { test, expect } from '@playwright/test';

test.describe('Status Images Loading', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('status images load and display correctly', async ({ page }) => {
        console.log('🖼️ Testing status images loading...');
        
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Wait for any initial loading
        await page.waitForTimeout(2000);
        
        // Check initial state
        const initialSrc = await statusPng.getAttribute('src');
        const initialVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        
        console.log(`📊 Initial src: ${initialSrc}`);
        console.log(`📊 PNG visible: ${initialVisible}`);
        console.log(`📊 Fallback visible: ${fallbackVisible}`);
        
        // Try to force load the online image
        await page.evaluate(() => {
            const statusPng = document.getElementById('status-png');
            if (statusPng) {
                statusPng.src = 'images/status-online.png';
                statusPng.style.display = 'block';
            }
        });
        
        // Wait for image to load
        await page.waitForTimeout(3000);
        
        // Check if image loaded
        const imageLoaded = await statusPng.evaluate(img => {
            return img.complete && img.naturalHeight !== 0;
        });
        
        const pngVisible = await statusPng.isVisible();
        const fallbackVisibleAfter = await statusFallback.isVisible();
        
        console.log(`📊 Image loaded: ${imageLoaded}`);
        console.log(`📊 PNG visible after: ${pngVisible}`);
        console.log(`📊 Fallback visible after: ${fallbackVisibleAfter}`);
        
        // If image loaded, it should be visible
        if (imageLoaded) {
            expect(pngVisible).toBeTruthy();
            console.log('✅ Status image loaded and visible');
        } else {
            console.log('⚠️ Status image failed to load, fallback should be visible');
            expect(fallbackVisibleAfter).toBeTruthy();
        }
        
        // Test switching to offline
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(false);
            }
        });
        
        await page.waitForTimeout(2000);
        
        const offlineSrc = await statusPng.getAttribute('src');
        const offlineVisible = await statusPng.isVisible();
        
        console.log(`📊 Offline src: ${offlineSrc}`);
        console.log(`📊 Offline visible: ${offlineVisible}`);
        
        expect(offlineSrc).toContain('status-offline.png');
    });

    test('status images work with updateConnectionStatus function', async ({ page }) => {
        console.log('🔄 Testing updateConnectionStatus function...');
        
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Test online status
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(true);
            }
        });
        
        await page.waitForTimeout(2000);
        
        const onlineSrc = await statusPng.getAttribute('src');
        const onlineAlt = await statusPng.getAttribute('alt');
        const onlineVisible = await statusPng.isVisible();
        const fallbackText = await statusFallback.textContent();
        
        console.log(`📊 Online - src: ${onlineSrc}, alt: ${onlineAlt}, visible: ${onlineVisible}`);
        console.log(`📊 Fallback text: ${fallbackText}`);
        
        expect(onlineSrc).toContain('status-online.png');
        expect(onlineAlt).toBe('Online');
        
        // Test offline status
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(false);
            }
        });
        
        await page.waitForTimeout(2000);
        
        const offlineSrc = await statusPng.getAttribute('src');
        const offlineAlt = await statusPng.getAttribute('alt');
        const offlineVisible = await statusPng.isVisible();
        const fallbackTextOffline = await statusFallback.textContent();
        
        console.log(`📊 Offline - src: ${offlineSrc}, alt: ${offlineAlt}, visible: ${offlineVisible}`);
        console.log(`📊 Fallback text offline: ${fallbackTextOffline}`);
        
        expect(offlineSrc).toContain('status-offline.png');
        expect(offlineAlt).toBe('Offline');
        
        console.log('✅ updateConnectionStatus function works correctly');
    });
});
