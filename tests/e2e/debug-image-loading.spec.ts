/**
 * Debug Image Loading Test
 * Debug why the status images aren't loading
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Image Loading', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('debug image loading issues', async ({ page }) => {
        console.log('🔍 Debugging image loading issues...');
        
        // Test loading the images directly
        const onlineImageResponse = await page.goto('http://localhost:3000/images/online.png');
        const offlineImageResponse = await page.goto('http://localhost:3000/images/offline.png');
        
        console.log(`📊 Online image status: ${onlineImageResponse?.status()}`);
        console.log(`📊 Offline image status: ${offlineImageResponse?.status()}`);
        
        // Go back to main page
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check the status PNG element
        const statusPng = page.locator('#status-png');
        const statusFallback = page.locator('#connection-status');
        
        // Check initial state
        const initialSrc = await statusPng.getAttribute('src');
        const initialVisible = await statusPng.isVisible();
        const fallbackVisible = await statusFallback.isVisible();
        
        console.log(`📊 Initial src: ${initialSrc}`);
        console.log(`📊 PNG visible: ${initialVisible}`);
        console.log(`📊 Fallback visible: ${fallbackVisible}`);
        
        // Try to manually load the image with a timeout
        await page.evaluate(() => {
            const statusPng = document.getElementById('status-png');
            if (statusPng) {
                // Create a new image to test loading
                const testImg = new Image();
                testImg.onload = function() {
                    console.log('Test image loaded successfully');
                    statusPng.src = testImg.src;
                    statusPng.style.display = 'block';
                };
                testImg.onerror = function() {
                    console.log('Test image failed to load');
                };
                testImg.src = 'images/status-online.png';
            }
        });
        
        // Wait for potential loading
        await page.waitForTimeout(5000);
        
        // Check final state
        const finalSrc = await statusPng.getAttribute('src');
        const finalVisible = await statusPng.isVisible();
        const fallbackVisibleFinal = await statusFallback.isVisible();
        
        console.log(`📊 Final src: ${finalSrc}`);
        console.log(`📊 PNG visible after: ${finalVisible}`);
        console.log(`📊 Fallback visible after: ${fallbackVisibleFinal}`);
        
        // Check if image actually loaded
        const imageLoaded = await statusPng.evaluate(img => {
            return img.complete && img.naturalHeight !== 0;
        });
        
        console.log(`📊 Image loaded: ${imageLoaded}`);
        
        // Check console logs for any errors
        const logs = await page.evaluate(() => {
            return window.console.logs || [];
        });
        
        console.log(`📊 Console logs: ${logs}`);
    });

    test('test with smaller image paths', async ({ page }) => {
        console.log('🖼️ Testing with different image paths...');
        
        const statusPng = page.locator('#status-png');
        
        // Try different image paths
        const imagePaths = [
            'images/online.png',
            'images/offline.png',
            'images/status-online.png',
            'images/status-offline.png',
            'images/logo.png' // Test with a known working image
        ];
        
        for (const path of imagePaths) {
            console.log(`📊 Testing path: ${path}`);
            
            await page.evaluate((imgPath) => {
                const statusPng = document.getElementById('status-png');
                if (statusPng) {
                    statusPng.src = imgPath;
                    statusPng.style.display = 'block';
                }
            }, path);
            
            await page.waitForTimeout(2000);
            
            const loaded = await statusPng.evaluate(img => {
                return img.complete && img.naturalHeight !== 0;
            });
            
            const visible = await statusPng.isVisible();
            
            console.log(`📊 Path ${path}: loaded=${loaded}, visible=${visible}`);
            
            if (loaded && visible) {
                console.log(`✅ Success with path: ${path}`);
                break;
            }
        }
    });

    test('check image loading with network monitoring', async ({ page }) => {
        console.log('🌐 Monitoring network requests...');
        
        const requests = [];
        const responses = [];
        
        page.on('request', request => {
            if (request.url().includes('online.png') || request.url().includes('offline.png')) {
                requests.push(request.url());
                console.log(`📤 Request: ${request.url()}`);
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('online.png') || response.url().includes('offline.png')) {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers()
                });
                console.log(`📥 Response: ${response.url()} - ${response.status()}`);
            }
        });
        
        // Try to load the status images
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(true);
            }
        });
        
        await page.waitForTimeout(3000);
        
        console.log(`📊 Total requests: ${requests.length}`);
        console.log(`📊 Total responses: ${responses.length}`);
        
        // Check if any requests were made
        expect(requests.length).toBeGreaterThan(0);
    });
});
