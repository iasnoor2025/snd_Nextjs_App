/**
 * Test file for equipment utilities
 * This file can be run with: npx tsx src/lib/utils/equipment-utils.test.ts
 */

import { extractDoorNumberFromName, validateDoorNumber, autoExtractDoorNumber } from './equipment-utils';

// Test cases for door number extraction
const testCases = [
  // Pattern 1: Number followed by dash and text
  { name: '1301-DOZER', expected: '1301' },
  { name: '2500-EXCAVATOR', expected: '2500' },
  { name: '999-CRANE', expected: '999' },
  
  // Pattern 2: Text followed by number
  { name: 'LOADER 1886 AAA', expected: '1886' },
  { name: 'EXCAVATOR 2500', expected: '2500' },
  { name: 'CRANE 1500 LIFT', expected: '1500' },
  { name: 'BULLDOZER 999', expected: '999' },
  
  // Pattern 3: Number in the middle with dashes
  { name: 'CRANE-1500-LIFT', expected: '1500' },
  { name: 'EXCAVATOR-2500-HEAVY', expected: '2500' },
  
  // Pattern 4: Number at the end
  { name: 'BULLDOZER 999', expected: '999' },
  { name: 'LOADER 1886', expected: '1886' },
  
  // Pattern 5: Number at the beginning
  { name: '1886 LOADER', expected: '1886' },
  { name: '1301 DOZER', expected: '1301' },
  
  // Edge cases
  { name: 'LOADER 1886', expected: '1886' },
  { name: '1886', expected: null }, // Single number without context
  { name: 'LOADER', expected: null }, // No number
  { name: 'LOADER ABC', expected: null }, // No number
  { name: 'LOADER 1886A', expected: null }, // Number with letter attached
  { name: 'LOADER A1886', expected: null }, // Letter before number
  { name: 'LOADER 1886-AAA', expected: '1886' }, // Number followed by dash
  { name: 'LOADER-1886-AAA', expected: '1886' }, // Number in middle
  { name: '1886-LOADER-AAA', expected: '1886' }, // Number at start
];

// Test door number validation
const validationTestCases = [
  { doorNumber: '1886', expected: true },
  { doorNumber: '1301', expected: true },
  { doorNumber: '999', expected: true },
  { doorNumber: '1', expected: true },
  { doorNumber: '123456', expected: true },
  { doorNumber: '0', expected: false },
  { doorNumber: '00', expected: false },
  { doorNumber: '000', expected: false },
  { doorNumber: '1886A', expected: false },
  { doorNumber: 'A1886', expected: false },
  { doorNumber: '1886-', expected: false },
  { doorNumber: '', expected: false },
  { doorNumber: null, expected: false },
  { doorNumber: undefined, expected: false },
];

function runTests() {
  console.log('🧪 Testing Door Number Extraction Functionality\n');
  
  // Test extraction function
  console.log('📋 Testing extractDoorNumberFromName:');
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach((testCase, index) => {
    const result = extractDoorNumberFromName(testCase.name);
    const success = result === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${testCase.name}" -> "${result}"`);
    } else {
      console.log(`❌ Test ${index + 1}: "${testCase.name}" -> "${result}" (expected: "${testCase.expected}")`);
    }
  });
  
  console.log(`\n📊 Extraction Tests: ${passed}/${total} passed\n`);
  
  // Test validation function
  console.log('🔍 Testing validateDoorNumber:');
  passed = 0;
  total = validationTestCases.length;
  
  validationTestCases.forEach((testCase, index) => {
    const result = validateDoorNumber(testCase.doorNumber as string);
    const success = result === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${testCase.doorNumber}" -> ${result}`);
    } else {
      console.log(`❌ Test ${index + 1}: "${testCase.doorNumber}" -> ${result} (expected: ${testCase.expected})`);
    }
  });
  
  console.log(`\n📊 Validation Tests: ${passed}/${total} passed\n`);
  
  // Test auto-extraction function
  console.log('🤖 Testing autoExtractDoorNumber:');
  const autoTestCases = [
    { name: 'LOADER 1886 AAA', existingDoorNumber: null, expected: '1886' },
    { name: '1301-DOZER', existingDoorNumber: null, expected: '1301' },
    { name: 'LOADER 1886 AAA', existingDoorNumber: '9999', expected: '9999' }, // Keep existing valid door number
    { name: 'LOADER 1886 AAA', existingDoorNumber: '0', expected: '1886' }, // Replace invalid door number
    { name: 'LOADER', existingDoorNumber: null, expected: null }, // No number to extract
  ];
  
  passed = 0;
  total = autoTestCases.length;
  
  autoTestCases.forEach((testCase, index) => {
    const result = autoExtractDoorNumber(testCase.name, testCase.existingDoorNumber);
    const success = result === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${testCase.name}" + "${testCase.existingDoorNumber}" -> "${result}"`);
    } else {
      console.log(`❌ Test ${index + 1}: "${testCase.name}" + "${testCase.existingDoorNumber}" -> "${result}" (expected: "${testCase.expected}")`);
    }
  });
  
  console.log(`\n📊 Auto-Extraction Tests: ${passed}/${total} passed\n`);
  
  // Summary
  const totalTests = testCases.length + validationTestCases.length + autoTestCases.length;
  const totalPassed = testCases.filter(tc => extractDoorNumberFromName(tc.name) === tc.expected).length +
                     validationTestCases.filter(tc => validateDoorNumber(tc.doorNumber as string) === tc.expected).length +
                     autoTestCases.filter(tc => autoExtractDoorNumber(tc.name, tc.existingDoorNumber) === tc.expected).length;
  
  console.log(`🎯 Overall Results: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests passed! Door number extraction is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
