#!/usr/bin/env node

import { chromium } from 'playwright';
import * as axe from 'axe-core';
import fs from 'fs';
import path from 'path';

async function runA11yAudit() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Inject axe-core
    await page.addScriptTag({ path: require.resolve('axe-core') });
    
    // Run accessibility audit
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        axe.run(document.body, (err, results) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });
    
    // Create docs directory if it doesn't exist
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Generate accessibility report
    const report = generateA11yReport(results);
    fs.writeFileSync(path.join(docsDir, 'a11y-report.md'), report);
    
    // Save JSON results
    fs.writeFileSync(path.join(docsDir, 'a11y-results.json'), JSON.stringify(results, null, 2));
    
    console.log('Accessibility Audit Results:');
    console.log('===========================');
    console.log(`Violations: ${results.violations.length}`);
    console.log(`Passes: ${results.passes.length}`);
    console.log(`Incomplete: ${results.incomplete.length}`);
    console.log(`Inapplicable: ${results.inapplicable.length}`);
    console.log('\nDetailed report saved to docs/a11y-report.md');
    
    if (results.violations.length > 0) {
      console.log('\nViolations found:');
      results.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.helpUrl}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Accessibility audit failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

function generateA11yReport(results) {
  let report = '# Accessibility Audit Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += '## Summary\n\n';
  report += `- **Violations**: ${results.violations.length}\n`;
  report += `- **Passes**: ${results.passes.length}\n`;
  report += `- **Incomplete**: ${results.incomplete.length}\n`;
  report += `- **Inapplicable**: ${results.inapplicable.length}\n\n`;
  
  if (results.violations.length > 0) {
    report += '## Violations\n\n';
    results.violations.forEach((violation, index) => {
      report += `### ${index + 1}. ${violation.description}\n\n`;
      report += `- **Impact**: ${violation.impact}\n`;
      report += `- **Help**: [${violation.help}](${violation.helpUrl})\n`;
      report += `- **Tags**: ${violation.tags.join(', ')}\n\n`;
      
      if (violation.nodes.length > 0) {
        report += '**Affected Elements**:\n';
        violation.nodes.forEach((node, nodeIndex) => {
          report += `${nodeIndex + 1}. ${node.html}\n`;
          if (node.failureSummary) {
            report += `   - ${node.failureSummary}\n`;
          }
        });
        report += '\n';
      }
    });
  }
  
  if (results.passes.length > 0) {
    report += '## Passes\n\n';
    results.passes.forEach((pass, index) => {
      report += `${index + 1}. ${pass.description}\n`;
    });
    report += '\n';
  }
  
  if (results.incomplete.length > 0) {
    report += '## Incomplete Tests\n\n';
    results.incomplete.forEach((incomplete, index) => {
      report += `${index + 1}. ${incomplete.description}\n`;
    });
    report += '\n';
  }
  
  report += '## Recommendations\n\n';
  report += '1. Fix all violations with "critical" or "serious" impact\n';
  report += '2. Address violations with "moderate" impact\n';
  report += '3. Review incomplete tests and provide additional context\n';
  report += '4. Ensure all interactive elements have proper labels\n';
  report += '5. Verify color contrast meets WCAG guidelines\n';
  report += '6. Test with keyboard navigation\n';
  report += '7. Test with screen readers\n\n';
  
  return report;
}

runA11yAudit();
