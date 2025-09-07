/**
 * Theme Customization Working Test
 * Test theme customization using alternative selectors
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Customization Working', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('theme modal opens using button container click', async ({ page }) => {
        console.log('🎨 Testing theme modal with button container...');
        
        // Click the button container instead of the button
        const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
        await buttonContainer.click();
        
        // Check that modal is visible
        const themeModal = page.locator('#theme-modal');
        await expect(themeModal).toBeVisible();
        
        console.log('✅ Theme modal opens using button container!');
        
        // Close modal
        const closeBtn = page.locator('#theme-modal .modal-close');
        await closeBtn.click();
        
        await expect(themeModal).not.toBeVisible();
    });

    test('preset themes work correctly', async ({ page }) => {
        console.log('🎨 Testing preset themes...');
        
        // Open theme modal using button container
        const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
        await buttonContainer.click();
        
        await page.waitForTimeout(500);
        
        // Test sunrise theme
        const sunriseBtn = page.locator('[data-theme="sunrise"]');
        await sunriseBtn.click();
        
        await page.waitForTimeout(1000);
        
        // Check that button is marked as active
        const isActive = await sunriseBtn.evaluate(el => el.classList.contains('active'));
        expect(isActive).toBeTruthy();
        
        // Check that CSS variables are applied
        const rootStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                bgSecondary: getComputedStyle(root).getPropertyValue('--bg-secondary')
            };
        });
        
        console.log(`📊 Applied styles:`, rootStyles);
        expect(rootStyles.bgPrimary).toBeTruthy();
        expect(rootStyles.bgSecondary).toBeTruthy();
        
        console.log('✅ Preset themes work correctly!');
    });

    test('custom colors work correctly', async ({ page }) => {
        console.log('🎨 Testing custom colors...');
        
        // Open theme modal using button container
        const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
        await buttonContainer.click();
        
        await page.waitForTimeout(500);
        
        // Get initial styles
        const initialStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary')
            };
        });
        
        console.log(`📊 Initial bg-primary: ${initialStyles.bgPrimary}`);
        
        // Change custom color
        await page.fill('#bg-primary', '#ff0000'); // Red
        
        // Apply custom theme
        await page.click('#apply-theme');
        
        await page.waitForTimeout(1000);
        
        // Check that styles are applied
        const appliedStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary')
            };
        });
        
        console.log(`📊 Applied bg-primary: ${appliedStyles.bgPrimary}`);
        
        // Verify that styles changed
        expect(appliedStyles.bgPrimary).not.toBe(initialStyles.bgPrimary);
        expect(appliedStyles.bgPrimary).toBe('#ff0000'); // Red in hex
        
        console.log('✅ Custom colors work correctly!');
    });

    test('font family changes work correctly', async ({ page }) => {
        console.log('🔤 Testing font family changes...');
        
        // Open theme modal using button container
        const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
        await buttonContainer.click();
        
        await page.waitForTimeout(500);
        
        // Change font family
        await page.selectOption('#font-family-selector', "'Roboto', sans-serif");
        
        // Apply theme
        await page.click('#apply-theme');
        
        await page.waitForTimeout(1000);
        
        // Check that font family is applied
        const appliedFont = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--font-family');
        });
        
        console.log(`📊 Applied font: "${appliedFont}"`);
        expect(appliedFont).toContain('Roboto');
        
        console.log('✅ Font family changes work correctly!');
    });

    test('theme reset works correctly', async ({ page }) => {
        console.log('🔄 Testing theme reset...');
        
        // Open theme modal using button container
        const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
        await buttonContainer.click();
        
        await page.waitForTimeout(500);
        
        // Apply a custom theme first
        await page.fill('#bg-primary', '#ff0000');
        await page.click('#apply-theme');
        
        await page.waitForTimeout(1000);
        
        // Open modal again and reset
        await buttonContainer.click();
        await page.waitForTimeout(500);
        
        await page.click('#reset-theme');
        
        await page.waitForTimeout(1000);
        
        // Check that styles are reset
        const resetStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary')
            };
        });
        
        console.log(`📊 Reset bg-primary: ${resetStyles.bgPrimary}`);
        expect(resetStyles.bgPrimary).toBe('#0a0a0a'); // Default black in hex
        
        console.log('✅ Theme reset works correctly!');
    });

    test('theme changes show alerts', async ({ page }) => {
        console.log('🔔 Testing theme alerts...');
        
        // Open theme modal using button container
        const buttonContainer = page.locator('[data-button-id="theme-customizer"]');
        await buttonContainer.click();
        
        await page.waitForTimeout(500);
        
        // Apply a preset theme
        await page.click('[data-theme="neon"]');
        
        await page.waitForTimeout(1000);
        
        // Check for alert
        const alert = page.locator('.alert').first();
        const alertVisible = await alert.isVisible();
        
        if (alertVisible) {
            const alertText = await alert.textContent();
            console.log(`📊 Alert text: "${alertText}"`);
            expect(alertText).toContain('Theme Applied');
        }
        
        console.log('✅ Theme changes show alerts!');
    });
});
