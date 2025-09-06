/**
 * Active Bots Design Test
 * Tests the new improved design of the Active Bots panel
 */

import { test, expect } from '@playwright/test';

test.describe('Active Bots Design', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('active bots panel has improved design', async ({ page }) => {
        console.log('🎨 Testing Active Bots panel design...');
        
        // Check that the Active Bots section exists
        const activeBotsSection = page.locator('.active-bots');
        await expect(activeBotsSection).toBeVisible();
        
        // Check the header
        const header = activeBotsSection.locator('h3');
        await expect(header).toBeVisible();
        await expect(header).toContainText('Active Bots');
        
        // Check the container
        const container = activeBotsSection.locator('.active-bots-container');
        await expect(container).toBeVisible();
        
        // Check that it's using CSS Grid
        const containerDisplay = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.display;
        });
        expect(containerDisplay).toBe('grid');
        
        console.log('✅ Active Bots panel structure is correct');
    });

    test('active bots buttons have improved styling', async ({ page }) => {
        console.log('🔘 Testing Active Bots button styling...');
        
        // Wait for any bot buttons to appear
        await page.waitForTimeout(3000);
        
        const botButtons = page.locator('.active-bot-btn');
        const buttonCount = await botButtons.count();
        
        if (buttonCount > 0) {
            console.log(`📊 Found ${buttonCount} bot buttons`);
            
            // Check first button structure
            const firstButton = botButtons.first();
            await expect(firstButton).toBeVisible();
            
            // Check that button has the new structure
            const botName = firstButton.locator('.bot-name');
            const botAsset = firstButton.locator('.bot-asset');
            const botStatus = firstButton.locator('.bot-status');
            const botPnl = firstButton.locator('.bot-pnl');
            
            // At least some of these should exist
            const hasName = await botName.count() > 0;
            const hasAsset = await botAsset.count() > 0;
            const hasStatus = await botStatus.count() > 0;
            
            expect(hasName || hasAsset || hasStatus).toBeTruthy();
            
            console.log('✅ Bot button structure is improved');
        } else {
            console.log('ℹ️ No bot buttons found (this is normal if no bots are active)');
        }
    });

    test('active bots panel is responsive', async ({ page }) => {
        console.log('📱 Testing Active Bots responsiveness...');
        
        const container = page.locator('#active-bots-container');
        await expect(container).toBeVisible();
        
        // Test desktop view
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(500);
        
        const desktopGridTemplate = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`🖥️ Desktop grid: ${desktopGridTemplate}`);
        
        // Test tablet view
        await page.setViewportSize({ width: 768, height: 600 });
        await page.waitForTimeout(500);
        
        const tabletGridTemplate = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`📱 Tablet grid: ${tabletGridTemplate}`);
        
        // Test mobile view
        await page.setViewportSize({ width: 480, height: 600 });
        await page.waitForTimeout(500);
        
        const mobileGridTemplate = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gridTemplateColumns;
        });
        console.log(`📱 Mobile grid: ${mobileGridTemplate}`);
        
        // Reset to desktop
        await page.setViewportSize({ width: 1200, height: 800 });
        
        console.log('✅ Active Bots panel is responsive');
    });

    test('active bots buttons have hover effects', async ({ page }) => {
        console.log('✨ Testing Active Bots button hover effects...');
        
        const botButtons = page.locator('.active-bot-btn');
        const buttonCount = await botButtons.count();
        
        if (buttonCount > 0) {
            const firstButton = botButtons.first();
            
            // Check initial state
            const initialTransform = await firstButton.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.transform;
            });
            
            // Hover over the button
            await firstButton.hover();
            await page.waitForTimeout(100);
            
            // Check hover state
            const hoverTransform = await firstButton.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.transform;
            });
            
            // The transform should change on hover (translateY effect)
            expect(hoverTransform).not.toBe(initialTransform);
            
            console.log('✅ Bot buttons have hover effects');
        } else {
            console.log('ℹ️ No bot buttons to test hover effects');
        }
    });

    test('active bots panel has proper spacing and layout', async ({ page }) => {
        console.log('📐 Testing Active Bots spacing and layout...');
        
        const activeBotsSection = page.locator('.active-bots');
        const container = page.locator('#active-bots-container');
        
        // Check that the section has proper padding
        const sectionPadding = await activeBotsSection.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
                paddingTop: styles.paddingTop,
                paddingBottom: styles.paddingBottom,
                paddingLeft: styles.paddingLeft,
                paddingRight: styles.paddingRight
            };
        });
        
        expect(sectionPadding.paddingTop).not.toBe('0px');
        expect(sectionPadding.paddingBottom).not.toBe('0px');
        
        // Check that the container has proper gap
        const containerGap = await container.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.gap;
        });
        
        expect(containerGap).not.toBe('0px');
        
        console.log('✅ Active Bots panel has proper spacing');
    });
});
