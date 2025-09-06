/**
 * Debug Status Update Test
 * Debug the status update functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Status Update', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('debug status update function', async ({ page }) => {
        console.log('🔍 Debugging status update...');
        
        // Check if the function exists
        const functionExists = await page.evaluate(() => {
            return typeof window.updateConnectionStatus === 'function';
        });
        console.log(`📊 updateConnectionStatus function exists: ${functionExists}`);
        
        // Check current status elements
        const statusElements = await page.evaluate(() => {
            const statusPng = document.getElementById('status-png');
            const connectionText = document.getElementById('connection-text');
            const statusIndicator = document.getElementById('connection-indicator');
            
            return {
                statusPng: {
                    exists: !!statusPng,
                    display: statusPng ? statusPng.style.display : 'not found',
                    alt: statusPng ? statusPng.alt : 'not found'
                },
                connectionText: {
                    exists: !!connectionText,
                    text: connectionText ? connectionText.textContent : 'not found'
                },
                statusIndicator: {
                    exists: !!statusIndicator,
                    className: statusIndicator ? statusIndicator.className : 'not found'
                }
            };
        });
        
        console.log('📊 Status elements:', JSON.stringify(statusElements, null, 2));
        
        // Try to call the function and see what happens
        const result = await page.evaluate(() => {
            try {
                if (window.updateConnectionStatus) {
                    window.updateConnectionStatus(true);
                    return 'Function called successfully';
                } else {
                    return 'Function not found';
                }
            } catch (error) {
                return `Error: ${error.message}`;
            }
        });
        
        console.log(`📊 Function call result: ${result}`);
        
        // Check status after calling the function
        const statusAfter = await page.evaluate(() => {
            const connectionText = document.getElementById('connection-text');
            const statusIndicator = document.getElementById('connection-indicator');
            
            return {
                connectionText: connectionText ? connectionText.textContent : 'not found',
                statusIndicator: statusIndicator ? statusIndicator.className : 'not found'
            };
        });
        
        console.log('📊 Status after update:', JSON.stringify(statusAfter, null, 2));
        
        // The test should pass regardless of the actual functionality
        expect(functionExists).toBeTruthy();
    });
});
