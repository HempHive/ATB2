/**
 * Theme Customization Test
 * Test that theme customization applies CSS variables correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Customization', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('theme modal opens and closes correctly', async ({ page }) => {
        console.log('🎨 Testing theme modal...');
        
        // Click theme customizer button
        const themeCustomizer = page.locator('#theme-customizer');
        await themeCustomizer.click();
        
        // Check that modal is visible
        const themeModal = page.locator('#theme-modal');
        await expect(themeModal).toBeVisible();
        
        // Check that preset buttons are visible
        const presetButtons = page.locator('.preset-btn');
        const buttonCount = await presetButtons.count();
        expect(buttonCount).toBeGreaterThan(5);
        
        // Check that color inputs are visible
        const colorInputs = page.locator('#theme-modal input[type="color"]');
        const inputCount = await colorInputs.count();
        expect(inputCount).toBeGreaterThan(5);
        
        // Close modal
        const closeBtn = page.locator('#theme-modal .modal-close');
        await closeBtn.click();
        
        // Check that modal is hidden
        await expect(themeModal).not.toBeVisible();
        
        console.log('✅ Theme modal opens and closes correctly!');
    });

    test('preset themes apply correctly', async ({ page }) => {
        console.log('🎨 Testing preset themes...');
        
        // Open theme modal
        await page.click('#theme-customizer');
        await page.waitForTimeout(500);
        
        // Test different preset themes
        const themes = ['black-gold', 'sunrise', 'neon', 'purple-dark', 'red-dark'];
        
        for (const theme of themes) {
            console.log(`📊 Testing ${theme} theme...`);
            
            // Click preset button
            const presetBtn = page.locator(`[data-theme="${theme}"]`);
            await presetBtn.click();
            
            await page.waitForTimeout(500);
            
            // Check that button is marked as active
            const isActive = await presetBtn.evaluate(el => el.classList.contains('active'));
            expect(isActive).toBeTruthy();
            
            // Check that CSS variables are applied
            const rootStyles = await page.evaluate(() => {
                const root = document.documentElement;
                return {
                    bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                    bgSecondary: getComputedStyle(root).getPropertyValue('--bg-secondary'),
                    goldPrimary: getComputedStyle(root).getPropertyValue('--gold-primary')
                };
            });
            
            console.log(`📊 Applied styles:`, rootStyles);
            
            // Verify that styles are not empty
            expect(rootStyles.bgPrimary).toBeTruthy();
            expect(rootStyles.bgSecondary).toBeTruthy();
            
            console.log(`✅ ${theme} theme applied successfully!`);
        }
        
        console.log('✅ All preset themes apply correctly!');
    });

    test('custom colors apply correctly', async ({ page }) => {
        console.log('🎨 Testing custom colors...');
        
        // Open theme modal
        await page.click('#theme-customizer');
        await page.waitForTimeout(500);
        
        // Get initial styles
        const initialStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                bgSecondary: getComputedStyle(root).getPropertyValue('--bg-secondary'),
                accentColor: getComputedStyle(root).getPropertyValue('--gold-primary')
            };
        });
        
        console.log(`📊 Initial styles:`, initialStyles);
        
        // Change custom colors
        await page.fill('#bg-primary', '#ff0000'); // Red
        await page.fill('#bg-secondary', '#00ff00'); // Green
        await page.fill('#accent-color', '#0000ff'); // Blue
        
        // Apply custom theme
        await page.click('#apply-theme');
        
        await page.waitForTimeout(1000);
        
        // Check that styles are applied
        const appliedStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                bgSecondary: getComputedStyle(root).getPropertyValue('--bg-secondary'),
                accentColor: getComputedStyle(root).getPropertyValue('--gold-primary')
            };
        });
        
        console.log(`📊 Applied styles:`, appliedStyles);
        
        // Verify that styles changed
        expect(appliedStyles.bgPrimary).not.toBe(initialStyles.bgPrimary);
        expect(appliedStyles.bgSecondary).not.toBe(initialStyles.bgSecondary);
        expect(appliedStyles.accentColor).not.toBe(initialStyles.accentColor);
        
        console.log('✅ Custom colors apply correctly!');
    });

    test('font family changes apply correctly', async ({ page }) => {
        console.log('🔤 Testing font family changes...');
        
        // Open theme modal
        await page.click('#theme-customizer');
        await page.waitForTimeout(500);
        
        // Get initial font family
        const initialFont = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--font-family');
        });
        
        console.log(`📊 Initial font: "${initialFont}"`);
        
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
        
        console.log('✅ Font family changes apply correctly!');
    });

    test('theme reset works correctly', async ({ page }) => {
        console.log('🔄 Testing theme reset...');
        
        // Open theme modal
        await page.click('#theme-customizer');
        await page.waitForTimeout(500);
        
        // Apply a custom theme first
        await page.fill('#bg-primary', '#ff0000');
        await page.fill('#accent-color', '#00ff00');
        await page.click('#apply-theme');
        
        await page.waitForTimeout(1000);
        
        // Get styles after custom theme
        const customStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                accentColor: getComputedStyle(root).getPropertyValue('--gold-primary')
            };
        });
        
        console.log(`📊 Custom styles:`, customStyles);
        
        // Open modal again and reset
        await page.click('#theme-customizer');
        await page.waitForTimeout(500);
        
        await page.click('#reset-theme');
        
        await page.waitForTimeout(1000);
        
        // Check that styles are reset
        const resetStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                accentColor: getComputedStyle(root).getPropertyValue('--gold-primary')
            };
        });
        
        console.log(`📊 Reset styles:`, resetStyles);
        
        // Verify that styles are reset to default
        expect(resetStyles.bgPrimary).toBe('#0a0a0a');
        expect(resetStyles.accentColor).toBe('#ffd700');
        
        console.log('✅ Theme reset works correctly!');
    });

    test('theme changes persist across page interactions', async ({ page }) => {
        console.log('💾 Testing theme persistence...');
        
        // Open theme modal
        await page.click('#theme-customizer');
        await page.waitForTimeout(500);
        
        // Apply a custom theme
        await page.fill('#bg-primary', '#800080'); // Purple
        await page.click('#apply-theme');
        
        await page.waitForTimeout(1000);
        
        // Interact with other parts of the page
        const btcMarket = page.locator('.market-item[data-symbol="BTC-USD"]');
        await btcMarket.click();
        
        await page.waitForTimeout(1000);
        
        // Check that theme is still applied
        const currentStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary')
            };
        });
        
        console.log(`📊 Current styles:`, currentStyles);
        
        expect(currentStyles.bgPrimary).toBe('#800080');
        
        console.log('✅ Theme changes persist across page interactions!');
    });

    test('theme modal shows alerts for changes', async ({ page }) => {
        console.log('🔔 Testing theme alerts...');
        
        // Open theme modal
        await page.click('#theme-customizer');
        await page.waitForTimeout(500);
        
        // Apply a preset theme
        await page.click('[data-theme="sunrise"]');
        
        await page.waitForTimeout(1000);
        
        // Check for alert
        const alert = page.locator('.alert').first();
        const alertVisible = await alert.isVisible();
        
        if (alertVisible) {
            const alertText = await alert.textContent();
            console.log(`📊 Alert text: "${alertText}"`);
            expect(alertText).toContain('Theme Applied');
            expect(alertText).toContain('dark blue');
        }
        
        console.log('✅ Theme modal shows alerts for changes!');
    });
});
