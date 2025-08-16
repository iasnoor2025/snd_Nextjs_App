#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build optimization...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${colors.bright}=== ${title} ===${colors.reset}\n`);
}

try {
  // Check if .next directory exists
  if (!fs.existsSync(path.join(process.cwd(), '.next'))) {
    log('⚠️  .next directory not found. Building project first...', 'yellow');
    execSync('npm run build', { stdio: 'inherit' });
  }

  // Analyze bundle size
  logSection('Bundle Analysis');
  log('Running bundle analyzer...', 'blue');
  
  try {
    execSync('cross-env ANALYZE=true npm run build', { stdio: 'inherit' });
    log('✅ Bundle analysis completed successfully!', 'green');
  } catch (error) {
    log('⚠️  Bundle analysis failed, continuing with optimization...', 'yellow');
  }

  // Check for large dependencies
  logSection('Dependency Analysis');
  log('Checking package.json for optimization opportunities...', 'blue');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Known large packages that could be optimized
  const largePackages = [
    'moment', 'lodash', 'jquery', 'bootstrap', 'antd', 'material-ui',
    'recharts', 'd3', 'three', 'babylonjs', 'pixi.js'
  ];
  
  const foundLargePackages = largePackages.filter(pkg => dependencies[pkg]);
  
  if (foundLargePackages.length > 0) {
    log('⚠️  Large packages detected that could be optimized:', 'yellow');
    foundLargePackages.forEach(pkg => {
      log(`   - ${pkg}`, 'yellow');
    });
    log('\n💡 Consider using lighter alternatives:', 'cyan');
    log('   - moment → date-fns or dayjs', 'cyan');
    log('   - lodash → individual lodash functions or native methods', 'cyan');
    log('   - jquery → native DOM methods', 'cyan');
  } else {
    log('✅ No large packages detected', 'green');
  }

  // Check for unused dependencies
  logSection('Unused Dependencies Check');
  log('Checking for potentially unused dependencies...', 'blue');
  
  try {
    execSync('npx depcheck --json', { stdio: 'pipe' });
    log('✅ Dependency check completed', 'green');
  } catch (error) {
    log('⚠️  Dependency check failed or found issues', 'yellow');
  }

  // Generate optimization report
  logSection('Optimization Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    bundleAnalysis: fs.existsSync('bundle-analysis.html'),
    largePackages: foundLargePackages,
    recommendations: []
  };

  if (foundLargePackages.length > 0) {
    report.recommendations.push('Consider replacing large packages with lighter alternatives');
  }

  if (fs.existsSync('bundle-analysis.html')) {
    report.recommendations.push('Review bundle-analysis.html for specific optimization opportunities');
  }

  report.recommendations.push('Use dynamic imports for heavy components');
  report.recommendations.push('Implement code splitting for routes');
  report.recommendations.push('Optimize images and use next/image');
  report.recommendations.push('Enable gzip compression on server');

  // Save report
  fs.writeFileSync('optimization-report.json', JSON.stringify(report, null, 2));
  log('📊 Optimization report saved to optimization-report.json', 'green');

  // Display recommendations
  log('\n💡 Optimization Recommendations:', 'cyan');
  report.recommendations.forEach((rec, index) => {
    log(`   ${index + 1}. ${rec}`, 'cyan');
  });

  log('\n🎯 Next Steps:', 'magenta');
  log('   1. Review bundle-analysis.html for specific insights', 'magenta');
  log('   2. Check optimization-report.json for detailed analysis', 'magenta');
  log('   3. Implement code splitting and dynamic imports', 'magenta');
  log('   4. Optimize images and assets', 'magenta');
  log('   5. Consider implementing service worker for caching', 'magenta');

  log('\n✅ Build optimization completed successfully!', 'green');

} catch (error) {
  log(`❌ Build optimization failed: ${error.message}`, 'red');
  process.exit(1);
}
