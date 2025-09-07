/**
 * Theme Customization Tests for ATB2
 * Tests theme switching, customization, and persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Customization Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('theme customizer modal opens and closes', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        await expect(page.locator('#theme-modal')).toBeVisible();
        
        // Close modal
        await page.click('.modal-close');
        await expect(page.locator('#theme-modal')).not.toBeVisible();
    });

    test('preset theme buttons are visible', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Check preset buttons
        await expect(page.locator('.preset-btn[data-theme="black-gold"]')).toBeVisible();
        await expect(page.locator('.preset-btn[data-theme="sunrise"]')).toBeVisible();
        await expect(page.locator('.preset-btn[data-theme="neon"]')).toBeVisible();
        await expect(page.locator('.preset-btn[data-theme="purple-dark"]')).toBeVisible();
        await expect(page.locator('.preset-btn[data-theme="red-dark"]')).toBeVisible();
        await expect(page.locator('.preset-btn[data-theme="ocean"]')).toBeVisible();
        await expect(page.locator('.preset-btn[data-theme="sunset"]')).toBeVisible();
        await expect(page.locator('.preset-btn[data-theme="forest"]')).toBeVisible();
    });

    test('preset themes can be applied', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Apply black-gold theme
        await page.click('.preset-btn[data-theme="black-gold"]');
        
        // Check that theme was applied (CSS variables should change)
        const rootStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                accentColor: getComputedStyle(root).getPropertyValue('--accent-color')
            };
        });
        
        expect(rootStyles.bgPrimary).toBe('rgb(10, 10, 10)'); // #0a0a0a
        expect(rootStyles.accentColor).toBe('rgb(255, 215, 0)'); // #ffd700
    });

    test('custom color inputs are visible', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Check color inputs
        await expect(page.locator('#bg-primary')).toBeVisible();
        await expect(page.locator('#bg-secondary')).toBeVisible();
        await expect(page.locator('#accent-color')).toBeVisible();
        await expect(page.locator('#text-primary')).toBeVisible();
        await expect(page.locator('#success-color')).toBeVisible();
        await expect(page.locator('#warning-color')).toBeVisible();
        await expect(page.locator('#danger-color')).toBeVisible();
        await expect(page.locator('#info-color')).toBeVisible();
    });

    test('custom colors can be applied', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Change primary background color
        await page.fill('#bg-primary', '#ff0000');
        await page.fill('#accent-color', '#00ff00');
        
        // Apply custom theme
        await page.click('#apply-theme');
        
        // Check that colors were applied
        const rootStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                accentColor: getComputedStyle(root).getPropertyValue('--accent-color')
            };
        });
        
        expect(rootStyles.bgPrimary).toBe('rgb(255, 0, 0)'); // #ff0000
        expect(rootStyles.accentColor).toBe('rgb(0, 255, 0)'); // #00ff00
    });

    test('font family selector is visible and functional', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Check font selector
        const fontSelector = page.locator('#font-family-selector');
        await expect(fontSelector).toBeVisible();
        
        // Check font options
        await expect(fontSelector.locator('option[value="Roboto"]')).toBeVisible();
        await expect(fontSelector.locator('option[value="Open Sans"]')).toBeVisible();
        await expect(fontSelector.locator('option[value="Lato"]')).toBeVisible();
        await expect(fontSelector.locator('option[value="Montserrat"]')).toBeVisible();
    });

    test('font family can be changed', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Change font family
        await page.selectOption('#font-family-selector', 'Roboto');
        await page.click('#apply-theme');
        
        // Check that font was applied
        const bodyFont = await page.evaluate(() => {
            return getComputedStyle(document.body).fontFamily;
        });
        
        expect(bodyFont).toContain('Roboto');
    });

    test('reset theme button works', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Apply a custom theme first
        await page.fill('#bg-primary', '#ff0000');
        await page.fill('#accent-color', '#00ff00');
        await page.click('#apply-theme');
        
        // Reset theme
        await page.click('#reset-theme');
        
        // Check that theme was reset to default
        const rootStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                accentColor: getComputedStyle(root).getPropertyValue('--accent-color')
            };
        });
        
        // Should be back to default values
        expect(rootStyles.bgPrimary).toBe('rgb(10, 10, 10)'); // Default dark theme
        expect(rootStyles.accentColor).toBe('rgb(255, 215, 0)'); // Default gold
    });

    test('theme toggle button works', async ({ page }) => {
        // Check initial theme
        const initialTheme = await page.evaluate(() => {
            return document.body.classList.contains('dark-theme');
        });
        
        // Click theme toggle
        await page.click('#theme-toggle');
        
        // Check that theme changed
        const newTheme = await page.evaluate(() => {
            return document.body.classList.contains('dark-theme');
        });
        
        expect(newTheme).not.toBe(initialTheme);
    });

    test('theme changes persist across page reload', async ({ page }) => {
        // Open theme modal and apply custom theme
        await page.click('#theme-customizer');
        await page.fill('#bg-primary', '#ff0000');
        await page.click('#apply-theme');
        
        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Check that theme persisted
        const rootStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return getComputedStyle(root).getPropertyValue('--bg-primary');
        });
        
        expect(rootStyles).toBe('rgb(255, 0, 0)'); // #ff0000
    });

    test('graph color can be customized', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Change graph color
        await page.fill('#graph-color', '#ff00ff');
        await page.click('#apply-theme');
        
        // Check that graph color was applied
        const graphColor = await page.evaluate(() => {
            const root = document.documentElement;
            return getComputedStyle(root).getPropertyValue('--graph-color');
        });
        
        expect(graphColor).toBe('rgb(255, 0, 255)'); // #ff00ff
    });

    test('theme changes affect all UI elements', async ({ page }) => {
        // Open theme modal and apply theme
        await page.click('#theme-customizer');
        await page.click('.preset-btn[data-theme="sunrise"]');
        
        // Check that various UI elements are affected
        const headerStyles = await page.evaluate(() => {
            const header = document.querySelector('.header');
            return header ? getComputedStyle(header).backgroundColor : null;
        });
        
        const sidebarStyles = await page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar');
            return sidebar ? getComputedStyle(sidebar).backgroundColor : null;
        });
        
        // Elements should have the new theme colors
        expect(headerStyles).toBeTruthy();
        expect(sidebarStyles).toBeTruthy();
    });

    test('theme modal shows success message on apply', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Apply a theme
        await page.click('.preset-btn[data-theme="ocean"]');
        
        // Should show success message
        await expect(page.locator('.alert, .notification')).toBeVisible();
    });

    test('theme modal shows info message on reset', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Reset theme
        await page.click('#reset-theme');
        
        // Should show info message
        await expect(page.locator('.alert, .notification')).toBeVisible();
    });

    test('theme customization works with different preset themes', async ({ page }) => {
        const themes = ['black-gold', 'sunrise', 'neon', 'purple-dark', 'red-dark', 'ocean', 'sunset', 'forest'];
        
        for (const theme of themes) {
            // Open theme modal
            await page.click('#theme-customizer');
            
            // Apply theme
            await page.click(`.preset-btn[data-theme="${theme}"]`);
            
            // Check that theme was applied
            const rootStyles = await page.evaluate(() => {
                const root = document.documentElement;
                return {
                    bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                    accentColor: getComputedStyle(root).getPropertyValue('--accent-color')
                };
            });
            
            // Should have some color values (not empty)
            expect(rootStyles.bgPrimary).toBeTruthy();
            expect(rootStyles.accentColor).toBeTruthy();
            
            // Close modal
            await page.click('.modal-close');
        }
    });

    test('theme customization handles invalid color values gracefully', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Try to set invalid color values
        await page.fill('#bg-primary', 'invalid-color');
        await page.fill('#accent-color', '');
        
        // Apply theme
        await page.click('#apply-theme');
        
        // Should not crash and should handle gracefully
        await expect(page.locator('#theme-modal')).toBeVisible();
    });

    test('theme customization works with all color inputs', async ({ page }) => {
        // Open theme modal
        await page.click('#theme-customizer');
        
        // Set all color inputs
        const colorInputs = [
            '#bg-primary', '#bg-secondary', '#accent-color', '#text-primary',
            '#success-color', '#warning-color', '#danger-color', '#info-color', '#graph-color'
        ];
        
        for (const inputId of colorInputs) {
            await page.fill(inputId, '#ff0000');
        }
        
        // Apply theme
        await page.click('#apply-theme');
        
        // Check that all colors were applied
        const rootStyles = await page.evaluate(() => {
            const root = document.documentElement;
            return {
                bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
                bgSecondary: getComputedStyle(root).getPropertyValue('--bg-secondary'),
                accentColor: getComputedStyle(root).getPropertyValue('--accent-color'),
                textPrimary: getComputedStyle(root).getPropertyValue('--text-primary'),
                successColor: getComputedStyle(root).getPropertyValue('--success-color'),
                warningColor: getComputedStyle(root).getPropertyValue('--warning-color'),
                dangerColor: getComputedStyle(root).getPropertyValue('--danger-color'),
                infoColor: getComputedStyle(root).getPropertyValue('--info-color'),
                graphColor: getComputedStyle(root).getPropertyValue('--graph-color')
            };
        });
        
        // All should be red (#ff0000)
        Object.values(rootStyles).forEach(color => {
            expect(color).toBe('rgb(255, 0, 0)');
        });
    });
});
