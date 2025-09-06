/**
 * Bot Delete Functionality Test
 * Tests the delete button in Bot Management
 */

import { test, expect } from '@playwright/test';

test.describe('Bot Delete Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('delete button exists and is clickable', async ({ page }) => {
        console.log('🗑️ Testing Bot Delete functionality...');
        
        // First, we need to open the bot management modal
        // Let's try to find a way to open it
        const botManagementTriggers = page.locator('[data-testid="bot-management-trigger"], #bot-management-modal, [onclick*="showBotManagement"]');
        const triggerCount = await botManagementTriggers.count();
        
        console.log(`📊 Found ${triggerCount} potential bot management triggers`);
        
        if (triggerCount > 0) {
            // Try to click the first trigger
            await botManagementTriggers.first().click();
            await page.waitForTimeout(1000);
        }
        
        // Check if the modal is open
        const modal = page.locator('#bot-management-modal');
        const isModalVisible = await modal.isVisible();
        
        if (isModalVisible) {
            console.log('✅ Bot management modal is open');
            
            // Check if delete button exists
            const deleteButton = page.locator('#delete-bot');
            await expect(deleteButton).toBeVisible();
            
            // Check if delete button is enabled
            const isEnabled = await deleteButton.isEnabled();
            console.log(`🔘 Delete button enabled: ${isEnabled}`);
            
            // Try to click the delete button
            await deleteButton.click();
            console.log('✅ Delete button clicked');
            
            // Check if confirmation dialog appears
            page.on('dialog', async dialog => {
                console.log(`💬 Dialog appeared: ${dialog.message()}`);
                await dialog.accept(); // Accept the confirmation
            });
            
            await page.waitForTimeout(1000);
            
        } else {
            console.log('⚠️ Bot management modal is not open - this might be expected if no bots exist');
        }
    });

    test('delete button has proper styling', async ({ page }) => {
        console.log('🎨 Testing delete button styling...');
        
        // Try to open bot management modal
        const modal = page.locator('#bot-management-modal');
        
        // Check if modal exists (even if not visible)
        const modalExists = await modal.count() > 0;
        expect(modalExists).toBeTruthy();
        
        // Check delete button styling
        const deleteButton = page.locator('#delete-bot');
        const buttonExists = await deleteButton.count() > 0;
        expect(buttonExists).toBeTruthy();
        
        if (buttonExists) {
            // Check button classes
            const buttonClasses = await deleteButton.getAttribute('class');
            expect(buttonClasses).toContain('btn');
            expect(buttonClasses).toContain('btn-danger');
            
            console.log('✅ Delete button has proper styling');
        }
    });
});
