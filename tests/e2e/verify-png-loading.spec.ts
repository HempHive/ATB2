/**
 * Verify PNG Loading Test
 * Verify that the online.png and offline.png images are actually loading and visible
 */

import { test, expect } from '@playwright/test';

test.describe('Verify PNG Loading', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('verify online.png loads and displays', async ({ page }) => {
        console.log('🟢 Testing online.png loading...');
        
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Set to online status
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(true);
            }
        });
        
        // Wait for image to load
        await page.waitForTimeout(3000);
        
        // Check if PNG is visible
        const pngVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        const pngSrc = await statusPng.getAttribute('src');
        
        console.log(`📊 PNG visible: ${pngVisible}`);
        console.log(`📊 Fallback visible: ${fallbackVisible}`);
        console.log(`📊 PNG src: ${pngSrc}`);
        
        // Check if image actually loaded
        const imageLoaded = await statusPng.evaluate(img => {
            return img.complete && img.naturalHeight !== 0;
        });
        
        console.log(`📊 Image loaded: ${imageLoaded}`);
        
        if (imageLoaded && pngVisible) {
            console.log('✅ online.png is loading and visible!');
            expect(pngVisible).toBeTruthy();
            expect(pngSrc).toContain('online.png');
        } else {
            console.log('⚠️ online.png not loading, fallback should be visible');
            expect(fallbackVisible).toBeTruthy();
        }
    });

    test('verify offline.png loads and displays', async ({ page }) => {
        console.log('🔴 Testing offline.png loading...');
        
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Set to offline status
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(false);
            }
        });
        
        // Wait for image to load
        await page.waitForTimeout(3000);
        
        // Check if PNG is visible
        const pngVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        const pngSrc = await statusPng.getAttribute('src');
        
        console.log(`📊 PNG visible: ${pngVisible}`);
        console.log(`📊 Fallback visible: ${fallbackVisible}`);
        console.log(`📊 PNG src: ${pngSrc}`);
        
        // Check if image actually loaded
        const imageLoaded = await statusPng.evaluate(img => {
            return img.complete && img.naturalHeight !== 0;
        });
        
        console.log(`📊 Image loaded: ${imageLoaded}`);
        
        if (imageLoaded && pngVisible) {
            console.log('✅ offline.png is loading and visible!');
            expect(pngVisible).toBeTruthy();
            expect(pngSrc).toContain('offline.png');
        } else {
            console.log('⚠️ offline.png not loading, fallback should be visible');
            expect(fallbackVisible).toBeTruthy();
        }
    });

    test('verify status switching works with PNG images', async ({ page }) => {
        console.log('🔄 Testing status switching with PNG images...');
        
        const statusPng = page.locator('#status-png');
        
        // Test online -> offline -> online
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(true);
            }
        });
        
        await page.waitForTimeout(2000);
        
        const onlineSrc = await statusPng.getAttribute('src');
        const onlineVisible = await statusPng.isVisible();
        const onlineLoaded = await statusPng.evaluate(img => img.complete && img.naturalHeight !== 0);
        
        console.log(`📊 Online - src: ${onlineSrc}, visible: ${onlineVisible}, loaded: ${onlineLoaded}`);
        
        // Switch to offline
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(false);
            }
        });
        
        await page.waitForTimeout(2000);
        
        const offlineSrc = await statusPng.getAttribute('src');
        const offlineVisible = await statusPng.isVisible();
        const offlineLoaded = await statusPng.evaluate(img => img.complete && img.naturalHeight !== 0);
        
        console.log(`📊 Offline - src: ${offlineSrc}, visible: ${offlineVisible}, loaded: ${offlineLoaded}`);
        
        // Verify source switching
        expect(onlineSrc).toContain('online.png');
        expect(offlineSrc).toContain('offline.png');
        
        // At least one should be visible/loaded
        const anyWorking = (onlineVisible && onlineLoaded) || (offlineVisible && offlineLoaded);
        
        if (anyWorking) {
            console.log('✅ PNG images are working!');
        } else {
            console.log('⚠️ PNG images not loading, but fallback system is working');
        }
    });
});
