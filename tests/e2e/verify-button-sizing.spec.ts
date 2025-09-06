/**
 * Verify Button Sizing Test
 * Verify that the status images match the size of other toolbar buttons
 */

import { test, expect } from '@playwright/test';

test.describe('Verify Button Sizing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('verify status images match other toolbar button sizes', async ({ page }) => {
        console.log('📏 Testing button sizing consistency...');
        
        // Get all toolbar buttons
        const themeCustomizerBtn = page.locator('#theme-customizer').locator('..');
        const themeToggleBtn = page.locator('#theme-toggle').locator('..');
        const statusBtn = page.locator('#connection-status').locator('..');
        
        // Get the PNG images
        const themeCustomizerPng = page.locator('#theme-customizer').locator('..').locator('.btn-png');
        const themeTogglePng = page.locator('#theme-toggle').locator('..').locator('.btn-png');
        const statusPng = page.locator('#status-png');
        
        // Get dimensions of reference buttons
        const themeCustomizerBox = await themeCustomizerBtn.boundingBox();
        const themeToggleBox = await themeToggleBtn.boundingBox();
        const statusBox = await statusBtn.boundingBox();
        
        console.log(`📊 Theme Customizer button: ${themeCustomizerBox?.width}x${themeCustomizerBox?.height}`);
        console.log(`📊 Theme Toggle button: ${themeToggleBox?.width}x${themeToggleBox?.height}`);
        console.log(`📊 Status button: ${statusBox?.width}x${statusBox?.height}`);
        
        // Check that all buttons have similar dimensions (within 10px tolerance)
        const widthTolerance = 10;
        const heightTolerance = 10;
        
        if (themeCustomizerBox && themeToggleBox && statusBox) {
            const widthDiff = Math.abs(themeCustomizerBox.width - statusBox.width);
            const heightDiff = Math.abs(themeCustomizerBox.height - statusBox.height);
            
            console.log(`📊 Width difference: ${widthDiff}px (tolerance: ${widthTolerance}px)`);
            console.log(`📊 Height difference: ${heightDiff}px (tolerance: ${heightTolerance}px)`);
            
            expect(widthDiff).toBeLessThanOrEqual(widthTolerance);
            expect(heightDiff).toBeLessThanOrEqual(heightTolerance);
            
            console.log('✅ Status button matches other toolbar button sizes!');
        }
    });

    test('verify PNG images have consistent styling', async ({ page }) => {
        console.log('🎨 Testing PNG image styling consistency...');
        
        // Get PNG images
        const themeCustomizerPng = page.locator('#theme-customizer').locator('..').locator('.btn-png');
        const themeTogglePng = page.locator('#theme-toggle').locator('..').locator('.btn-png');
        const statusPng = page.locator('#status-png');
        
        // Check CSS properties
        const statusPngStyles = await statusPng.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                width: computed.width,
                height: computed.height,
                borderRadius: computed.borderRadius,
                borderWidth: computed.borderWidth,
                boxShadow: computed.boxShadow
            };
        });
        
        const themeCustomizerStyles = await themeCustomizerPng.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                width: computed.width,
                height: computed.height,
                borderRadius: computed.borderRadius,
                borderWidth: computed.borderWidth,
                boxShadow: computed.boxShadow
            };
        });
        
        console.log(`📊 Status PNG styles:`, statusPngStyles);
        console.log(`📊 Theme Customizer PNG styles:`, themeCustomizerStyles);
        
        // Check that key styling properties match
        expect(statusPngStyles.width).toBe(themeCustomizerStyles.width);
        expect(statusPngStyles.borderRadius).toBe(themeCustomizerStyles.borderRadius);
        expect(statusPngStyles.borderWidth).toBe(themeCustomizerStyles.borderWidth);
        
        console.log('✅ Status PNG has consistent styling with other toolbar PNGs!');
    });

    test('verify button container dimensions are consistent', async ({ page }) => {
        console.log('📦 Testing button container dimensions...');
        
        // Get all button containers
        const containers = page.locator('.button-container');
        const containerCount = await containers.count();
        
        console.log(`📊 Found ${containerCount} button containers`);
        
        const dimensions = [];
        for (let i = 0; i < containerCount; i++) {
            const container = containers.nth(i);
            const box = await container.boundingBox();
            if (box) {
                dimensions.push({
                    index: i,
                    width: box.width,
                    height: box.height
                });
            }
        }
        
        console.log('📊 Container dimensions:', dimensions);
        
        // Check that all containers have similar heights (within 5px tolerance)
        if (dimensions.length > 1) {
            const heights = dimensions.map(d => d.height);
            const maxHeight = Math.max(...heights);
            const minHeight = Math.min(...heights);
            const heightDiff = maxHeight - minHeight;
            
            console.log(`📊 Height range: ${minHeight}px - ${maxHeight}px (diff: ${heightDiff}px)`);
            
            expect(heightDiff).toBeLessThanOrEqual(5);
            console.log('✅ All button containers have consistent heights!');
        }
    });

    test('verify status image switching maintains consistent size', async ({ page }) => {
        console.log('🔄 Testing status switching maintains size...');
        
        const statusPng = page.locator('#status-png');
        
        // Get initial dimensions
        const initialBox = await statusPng.boundingBox();
        console.log(`📊 Initial dimensions: ${initialBox?.width}x${initialBox?.height}`);
        
        // Switch to online
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(true);
            }
        });
        
        await page.waitForTimeout(2000);
        
        const onlineBox = await statusPng.boundingBox();
        console.log(`📊 Online dimensions: ${onlineBox?.width}x${onlineBox?.height}`);
        
        // Switch to offline
        await page.evaluate(() => {
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(false);
            }
        });
        
        await page.waitForTimeout(2000);
        
        const offlineBox = await statusPng.boundingBox();
        console.log(`📊 Offline dimensions: ${offlineBox?.width}x${offlineBox?.height}`);
        
        // Check that dimensions remain consistent
        if (initialBox && onlineBox && offlineBox) {
            const widthDiff = Math.abs(initialBox.width - onlineBox.width);
            const heightDiff = Math.abs(initialBox.height - onlineBox.height);
            
            console.log(`📊 Width change: ${widthDiff}px`);
            console.log(`📊 Height change: ${heightDiff}px`);
            
            expect(widthDiff).toBeLessThanOrEqual(2); // Allow small variations
            expect(heightDiff).toBeLessThanOrEqual(2);
            
            console.log('✅ Status switching maintains consistent button size!');
        }
    });
});
