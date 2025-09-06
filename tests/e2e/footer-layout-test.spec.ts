import { test, expect } from '@playwright/test';

test.describe('Footer Layout', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('footer has correct left-center-right layout', async ({ page }) => {
        console.log('🔍 Testing footer layout...');
        
        // Check footer content structure
        const footerContent = await page.locator('.footer-content');
        await expect(footerContent).toBeVisible();
        
        // Check that footer has flex layout with space-between
        const footerStyles = await page.evaluate(() => {
            const footer = document.querySelector('.footer-content');
            if (footer) {
                const styles = window.getComputedStyle(footer);
                return {
                    display: styles.display,
                    justifyContent: styles.justifyContent,
                    alignItems: styles.alignItems,
                    flexDirection: styles.flexDirection
                };
            }
            return null;
        });
        
        console.log('📊 Footer styles:', footerStyles);
        
        // Should be flex with space-between (left-center-right layout)
        expect(footerStyles).toBeTruthy();
        expect(footerStyles.display).toBe('flex');
        expect(footerStyles.justifyContent).toBe('space-between');
        expect(footerStyles.alignItems).toBe('center');
        expect(footerStyles.flexDirection).toBe('row'); // Not column
        
        // Check left section (footer-info)
        const footerInfo = await page.locator('.footer-info');
        await expect(footerInfo).toBeVisible();
        
        // Check center section (footer-ticker)
        const footerTicker = await page.locator('.footer-ticker');
        await expect(footerTicker).toBeVisible();
        
        // Check right section (footer-actions)
        const footerActions = await page.locator('.footer-actions');
        await expect(footerActions).toBeVisible();
        
        console.log('✅ Footer has correct left-center-right layout!');
    });

    test('footer layout works on tablet', async ({ page }) => {
        console.log('📱 Testing footer layout on tablet...');
        
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        
        // Check footer content structure on tablet
        const footerStyles = await page.evaluate(() => {
            const footer = document.querySelector('.footer-content');
            if (footer) {
                const styles = window.getComputedStyle(footer);
                return {
                    display: styles.display,
                    justifyContent: styles.justifyContent,
                    alignItems: styles.alignItems,
                    flexDirection: styles.flexDirection
                };
            }
            return null;
        });
        
        console.log('📊 Footer styles on tablet:', footerStyles);
        
        // Should still be flex with space-between (not column)
        expect(footerStyles).toBeTruthy();
        expect(footerStyles.display).toBe('flex');
        expect(footerStyles.justifyContent).toBe('space-between');
        expect(footerStyles.flexDirection).toBe('row'); // Not column
        
        console.log('✅ Footer layout works correctly on tablet!');
    });

    test('footer layout works on mobile', async ({ page }) => {
        console.log('📱 Testing footer layout on mobile...');
        
        // Set mobile viewport
        await page.setViewportSize({ width: 480, height: 800 });
        await page.waitForTimeout(1000);
        
        // Check footer content structure on mobile
        const footerStyles = await page.evaluate(() => {
            const footer = document.querySelector('.footer-content');
            if (footer) {
                const styles = window.getComputedStyle(footer);
                return {
                    display: styles.display,
                    justifyContent: styles.justifyContent,
                    alignItems: styles.alignItems,
                    flexDirection: styles.flexDirection
                };
            }
            return null;
        });
        
        console.log('📊 Footer styles on mobile:', footerStyles);
        
        // Should still be flex with space-between (not column)
        expect(footerStyles).toBeTruthy();
        expect(footerStyles.display).toBe('flex');
        expect(footerStyles.justifyContent).toBe('space-between');
        expect(footerStyles.flexDirection).toBe('row'); // Not column
        
        console.log('✅ Footer layout works correctly on mobile!');
    });
});
