#!/usr/bin/env node

import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse('http://localhost:3000', options);
    
    // Create docs directory if it doesn't exist
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Save HTML report
    const reportHtml = runnerResult.report;
    fs.writeFileSync(path.join(docsDir, 'lighthouse-report.html'), reportHtml);
    
    // Save JSON report
    const reportJson = JSON.stringify(runnerResult.lhr, null, 2);
    fs.writeFileSync(path.join(docsDir, 'lighthouse-report.json'), reportJson);
    
    // Log scores
    const scores = runnerResult.lhr.categories;
    console.log('Lighthouse Audit Results:');
    console.log('========================');
    console.log(`Performance: ${scores.performance.score * 100}`);
    console.log(`Accessibility: ${scores.accessibility.score * 100}`);
    console.log(`Best Practices: ${scores['best-practices'].score * 100}`);
    console.log(`SEO: ${scores.seo.score * 100}`);
    console.log('\nDetailed report saved to docs/lighthouse-report.html');
    
  } catch (error) {
    console.error('Lighthouse audit failed:', error);
    process.exit(1);
  } finally {
    await chrome.kill();
  }
}

runLighthouse();
