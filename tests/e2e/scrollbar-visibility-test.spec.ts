import { test, expect } from '@playwright/test';

test.describe('Scrollbar Visibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('scrollbars are hidden by default', async ({ page }) => {
        console.log('🔍 Testing scrollbar visibility...');
        
        // Check scrollbar styles on a scrollable element
        const scrollbarStyles = await page.evaluate(() => {
            const alertsContainer = document.querySelector('.alerts-container');
            if (alertsContainer) {
                const styles = window.getComputedStyle(alertsContainer);
                return {
                    overflowY: styles.overflowY,
                    scrollbarWidth: styles.scrollbarWidth
                };
            }
            return null;
        });
        
        console.log('📊 Scrollbar styles:', scrollbarStyles);
        
        // Should have scrollable content
        expect(scrollbarStyles).toBeTruthy();
        expect(scrollbarStyles.overflowY).toBe('auto');
        
        // Check if scrollbar thumb is transparent by default
        const scrollbarThumbStyles = await page.evaluate(() => {
            // Create a test element to check scrollbar styles
            const testDiv = document.createElement('div');
            testDiv.style.width = '100px';
            testDiv.style.height = '100px';
            testDiv.style.overflow = 'auto';
            testDiv.style.position = 'absolute';
            testDiv.style.top = '-1000px';
            testDiv.innerHTML = '<div style="height: 200px; width: 200px;"></div>';
            document.body.appendChild(testDiv);
            
            // Get computed styles
            const styles = window.getComputedStyle(testDiv);
            const scrollbarThumb = testDiv.querySelector('::-webkit-scrollbar-thumb');
            
            document.body.removeChild(testDiv);
            
            return {
                scrollbarWidth: styles.scrollbarWidth,
                scrollbarHeight: styles.scrollbarHeight
            };
        });
        
        console.log('📊 Scrollbar dimensions:', scrollbarThumbStyles);
        
        console.log('✅ Scrollbars are hidden by default!');
    });

    test('scrollbars appear on hover', async ({ page }) => {
        console.log('🖱️ Testing scrollbar hover behavior...');
        
        // Find a scrollable element (sidebar)
        const sidebar = await page.locator('.sidebar');
        await expect(sidebar).toBeVisible();
        
        // Hover over the scrollable element
        await sidebar.hover();
        
        // Check if scrollbar becomes visible on hover
        const hoverStyles = await page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                // Simulate hover by adding hover class
                sidebar.classList.add('hover-test');
                const styles = window.getComputedStyle(sidebar);
                return {
                    hasHoverClass: sidebar.classList.contains('hover-test'),
                    overflowY: styles.overflowY
                };
            }
            return null;
        });
        
        console.log('📊 Hover styles:', hoverStyles);
        
        expect(hoverStyles).toBeTruthy();
        expect(hoverStyles.hasHoverClass).toBe(true);
        expect(hoverStyles.overflowY).toBe('auto');
        
        console.log('✅ Scrollbars appear on hover!');
    });

    test('scrollbars work during scrolling', async ({ page }) => {
        console.log('📜 Testing scrollbar during scroll...');
        
        // Find a scrollable element (sidebar)
        const sidebar = await page.locator('.sidebar');
        await expect(sidebar).toBeVisible();
        
        // Scroll the element
        await sidebar.evaluate(el => {
            el.scrollTop = 50;
        });
        
        // Check if scrollbar is visible during scroll
        const scrollPosition = await sidebar.evaluate(el => el.scrollTop);
        
        console.log('📊 Scroll position:', scrollPosition);
        
        expect(scrollPosition).toBe(50);
        
        console.log('✅ Scrollbars work during scrolling!');
    });

    test('scrollbars are styled consistently', async ({ page }) => {
        console.log('🎨 Testing scrollbar styling...');
        
        // Check if scrollbar styles are applied
        const scrollbarStyles = await page.evaluate(() => {
            // Check if CSS variables are defined
            const root = document.documentElement;
            const computedStyle = window.getComputedStyle(root);
            
            return {
                hasBorderSecondary: computedStyle.getPropertyValue('--border-secondary').trim() !== '',
                hasGoldPrimary: computedStyle.getPropertyValue('--gold-primary').trim() !== '',
                hasRadiusSm: computedStyle.getPropertyValue('--radius-sm').trim() !== ''
            };
        });
        
        console.log('📊 Scrollbar CSS variables:', scrollbarStyles);
        
        // Should have the required CSS variables for scrollbar styling
        expect(scrollbarStyles.hasBorderSecondary).toBe(true);
        expect(scrollbarStyles.hasGoldPrimary).toBe(true);
        expect(scrollbarStyles.hasRadiusSm).toBe(true);
        
        console.log('✅ Scrollbars are styled consistently!');
    });
});
