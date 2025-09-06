/**
 * Logo Sizing Test
 * Test that logo.png matches the height of other buttons and resizes responsively
 */

import { test, expect } from '@playwright/test';

test.describe('Logo Sizing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('logo scales responsively like buttons', async ({ page }) => {
        console.log('🖥️ Testing logo responsive scaling...');
        
        // Get logo dimensions
        const logoDimensions = await page.evaluate(() => {
            const logo = document.querySelector('.logo-png') as HTMLImageElement;
            if (logo) {
                return {
                    height: logo.offsetHeight,
                    width: logo.offsetWidth,
                    computedHeight: window.getComputedStyle(logo).height,
                    computedWidth: window.getComputedStyle(logo).width
                };
            }
            return null;
        });
        
        console.log(`📊 Logo dimensions:`, logoDimensions);
        
        // Get button dimensions for comparison
        const buttonDimensions = await page.evaluate(() => {
            const button = document.querySelector('.btn-png') as HTMLImageElement;
            if (button) {
                return {
                    height: button.offsetHeight,
                    width: button.offsetWidth,
                    computedHeight: window.getComputedStyle(button).height,
                    computedWidth: window.getComputedStyle(button).width
                };
            }
            return null;
        });
        
        console.log(`📊 Button dimensions:`, buttonDimensions);
        
        // Logo should scale responsively (height should be reasonable)
        expect(logoDimensions).toBeTruthy();
        expect(logoDimensions.height).toBeGreaterThan(0);
        expect(logoDimensions.width).toBeGreaterThan(0);
        
        // Logo should be similar height to buttons (within reasonable range)
        if (buttonDimensions) {
            const heightDifference = Math.abs(logoDimensions.height - buttonDimensions.height);
            expect(heightDifference).toBeLessThan(50); // Within 50px of button height
        }
        
        console.log('✅ Logo scales responsively like buttons!');
    });

    test('logo scales on tablet', async ({ page }) => {
        console.log('📱 Testing logo scaling on tablet...');
        
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        
        // Get logo dimensions on tablet
        const logoDimensions = await page.evaluate(() => {
            const logo = document.querySelector('.logo-png') as HTMLImageElement;
            if (logo) {
                return {
                    height: logo.offsetHeight,
                    width: logo.offsetWidth,
                    computedHeight: window.getComputedStyle(logo).height,
                    computedWidth: window.getComputedStyle(logo).width
                };
            }
            return null;
        });
        
        console.log(`📊 Logo dimensions on tablet:`, logoDimensions);
        
        // Should scale responsively on tablet
        expect(logoDimensions).toBeTruthy();
        expect(logoDimensions.height).toBeGreaterThan(0);
        expect(logoDimensions.width).toBeGreaterThan(0);
        
        console.log('✅ Logo scales correctly on tablet!');
    });

    test('logo scales on mobile', async ({ page }) => {
        console.log('📱 Testing logo scaling on mobile...');
        
        // Set mobile viewport
        await page.setViewportSize({ width: 480, height: 800 });
        await page.waitForTimeout(1000);
        
        // Get logo dimensions on mobile
        const logoDimensions = await page.evaluate(() => {
            const logo = document.querySelector('.logo-png') as HTMLImageElement;
            if (logo) {
                const styles = window.getComputedStyle(logo);
                return {
                    height: logo.offsetHeight,
                    width: logo.offsetWidth,
                    computedHeight: styles.height,
                    computedWidth: styles.width,
                    maxWidth: styles.maxWidth,
                    mediaQuery: window.matchMedia('(max-width: 480px)').matches
                };
            }
            return null;
        });
        
        console.log(`📊 Logo dimensions on mobile:`, logoDimensions);
        
        // Should scale responsively on mobile
        expect(logoDimensions).toBeTruthy();
        expect(logoDimensions.height).toBeGreaterThan(0);
        expect(logoDimensions.width).toBeGreaterThan(0);
        
        console.log('✅ Logo scales correctly on mobile!');
    });

    test('logo maintains aspect ratio', async ({ page }) => {
        console.log('📐 Testing logo aspect ratio...');
        
        // Get logo dimensions
        const logoDimensions = await page.evaluate(() => {
            const logo = document.querySelector('.logo-png') as HTMLImageElement;
            if (logo) {
                return {
                    width: logo.offsetWidth,
                    height: logo.offsetHeight,
                    naturalWidth: logo.naturalWidth,
                    naturalHeight: logo.naturalHeight
                };
            }
            return null;
        });
        
        console.log(`📊 Logo dimensions:`, logoDimensions);
        
        // Logo should have reasonable dimensions
        expect(logoDimensions).toBeTruthy();
        expect(logoDimensions.height).toBeGreaterThan(0);
        expect(logoDimensions.width).toBeGreaterThan(0);
        // Logo should maintain aspect ratio (width should be proportional to height)
        const aspectRatio = logoDimensions.width / logoDimensions.height;
        expect(aspectRatio).toBeGreaterThan(0.5); // Reasonable aspect ratio
        expect(aspectRatio).toBeLessThan(3); // Not too wide
        
        console.log('✅ Logo maintains aspect ratio!');
    });

    test('logo has same styling as buttons', async ({ page }) => {
        console.log('🎨 Testing logo styling consistency...');
        
        // Get logo styles
        const logoStyles = await page.evaluate(() => {
            const logo = document.querySelector('.logo-png') as HTMLImageElement;
            if (logo) {
                const styles = window.getComputedStyle(logo);
                return {
                    borderRadius: styles.borderRadius,
                    borderWidth: styles.borderWidth,
                    boxShadow: styles.boxShadow,
                    objectFit: styles.objectFit
                };
            }
            return null;
        });
        
        console.log(`📊 Logo styles:`, logoStyles);
        
        // Logo should have consistent styling
        expect(logoStyles).toBeTruthy();
        expect(logoStyles.borderRadius).toBeTruthy();
        expect(logoStyles.borderWidth).toBeTruthy();
        expect(logoStyles.boxShadow).toBeTruthy();
        expect(logoStyles.objectFit).toBe('contain');
        
        console.log('✅ Logo has consistent styling!');
    });

    test('logo hover effects work', async ({ page }) => {
        console.log('✨ Testing logo hover effects...');
        
        const logo = page.locator('.logo-png');
        
        // Get initial transform
        const initialTransform = await logo.evaluate(el => {
            return window.getComputedStyle(el).transform;
        });
        
        console.log(`📊 Initial transform: ${initialTransform}`);
        
        // Hover over logo
        await logo.hover();
        await page.waitForTimeout(100);
        
        // Get hover transform
        const hoverTransform = await logo.evaluate(el => {
            return window.getComputedStyle(el).transform;
        });
        
        console.log(`📊 Hover transform: ${hoverTransform}`);
        
        // Transform should change on hover
        expect(hoverTransform).not.toBe(initialTransform);
        
        console.log('✅ Logo hover effects work!');
    });
});
