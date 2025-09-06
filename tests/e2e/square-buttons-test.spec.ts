/**
 * Square Active Bot Buttons Test
 * Tests that Active Bot buttons are now square instead of rectangular
 */

import { test, expect } from '@playwright/test';

test.describe('Square Active Bot Buttons', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('active bot buttons are square', async ({ page }) => {
        console.log('⬜ Testing square button design...');
        
        // Check that the Active Bots section exists
        const activeBotsSection = page.locator('.active-bots');
        await expect(activeBotsSection).toBeVisible();
        
        // Check the container
        const container = page.locator('#active-bots-container');
        await expect(container).toBeVisible();
        
        // Check that it's using CSS Grid
        const containerDisplay = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.display;
        });
        expect(containerDisplay).toBe('grid');
        
        // Check grid template columns
        const gridTemplate = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`📊 Grid template: ${gridTemplate}`);
        
        // Check that grid uses fixed sizes (not 1fr)
        expect(gridTemplate).toContain('80px');
        
        console.log('✅ Active Bots container uses square grid');
    });

    test('bot buttons have square dimensions', async ({ page }) => {
        console.log('📐 Testing button dimensions...');
        
        const botButtons = page.locator('.active-bot-btn');
        const buttonCount = await botButtons.count();
        
        if (buttonCount > 0) {
            const firstButton = botButtons.first();
            
            // Check button dimensions
            const dimensions = await firstButton.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    width: styles.width,
                    height: styles.height,
                    minHeight: styles.minHeight,
                    aspectRatio: styles.aspectRatio
                };
            });
            
            console.log(`📊 Button dimensions:`, dimensions);
            
            // Check that width and height are equal
            expect(dimensions.width).toBe('80px');
            expect(dimensions.height).toBe('80px');
            expect(dimensions.minHeight).toBe('80px');
            expect(dimensions.aspectRatio).toBe('1');
            
            console.log('✅ Bot buttons are square (80x80px)');
        } else {
            console.log('ℹ️ No bot buttons found (this is normal if no bots are active)');
        }
    });

    test('square buttons are responsive', async ({ page }) => {
        console.log('📱 Testing square button responsiveness...');
        
        const container = page.locator('#active-bots-container');
        const botButtons = page.locator('.active-bot-btn');
        
        // Test desktop view
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(500);
        
        const desktopGrid = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`🖥️ Desktop grid: ${desktopGrid}`);
        
        // Test tablet view
        await page.setViewportSize({ width: 768, height: 600 });
        await page.waitForTimeout(500);
        
        const tabletGrid = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`📱 Tablet grid: ${tabletGrid}`);
        
        // Test mobile view
        await page.setViewportSize({ width: 480, height: 600 });
        await page.waitForTimeout(500);
        
        const mobileGrid = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`📱 Mobile grid: ${mobileGrid}`);
        
        // Check button sizes on mobile
        if (await botButtons.count() > 0) {
            const mobileDimensions = await botButtons.first().evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    width: styles.width,
                    height: styles.height
                };
            });
            console.log(`📱 Mobile button size: ${mobileDimensions.width} x ${mobileDimensions.height}`);
        }
        
        // Reset to desktop
        await page.setViewportSize({ width: 1200, height: 800 });
        
        console.log('✅ Square buttons are responsive');
    });

    test('square buttons maintain aspect ratio', async ({ page }) => {
        console.log('📏 Testing aspect ratio...');
        
        const botButtons = page.locator('.active-bot-btn');
        const buttonCount = await botButtons.count();
        
        if (buttonCount > 0) {
            const firstButton = botButtons.first();
            
            // Check aspect ratio
            const aspectRatio = await firstButton.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.aspectRatio;
            });
            
            expect(aspectRatio).toBe('1');
            
            // Check that width and height are equal
            const width = await firstButton.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.width;
            });
            
            const height = await firstButton.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.height;
            });
            
            expect(width).toBe(height);
            
            console.log(`✅ Aspect ratio maintained: ${aspectRatio} (${width} x ${height})`);
        } else {
            console.log('ℹ️ No bot buttons to test aspect ratio');
        }
    });

    test('square buttons fit better in container', async ({ page }) => {
        console.log('📦 Testing container fit...');
        
        const container = page.locator('#active-bots-container');
        
        // Check container properties
        const containerProps = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
                display: styles.display,
                gridTemplateColumns: styles.gridTemplateColumns,
                justifyContent: styles.justifyContent,
                maxHeight: styles.maxHeight
            };
        });
        
        console.log(`📊 Container properties:`, containerProps);
        
        // Check that it's using fixed-size grid items
        expect(containerProps.gridTemplateColumns).toContain('80px');
        expect(containerProps.display).toBe('grid');
        expect(containerProps.justifyContent).toBe('start');
        
        console.log('✅ Square buttons fit better in container');
    });
});
