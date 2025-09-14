#!/usr/bin/env tsx

/**
 * Check Employee File Numbers Script
 * 
 * This script checks the file numbers for employees that were migrated
 */

require('dotenv').config({ path: '.env.local' });

import { db } from '../src/lib/drizzle';
import { employees } from '../src/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

console.log('🔍 Employee File Numbers Check Script');
console.log('=====================================\n');

async function checkEmployeeFileNumbers() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Employee IDs that were used in the migration
    const employeeIds = [46, 48, 51, 52, 53, 55, 56, 58, 59, 60, 61];
    
    console.log('📋 Checking employee file numbers for migrated employees:');
    
    const employeesData = await db
      .select()
      .from(employees)
      .where(inArray(employees.id, employeeIds));
    
    console.log('\n📊 Employee File Numbers:');
    employeesData.forEach(emp => {
      console.log(`ID: ${emp.id}, FileNumber: ${emp.fileNumber || 'N/A'}, EmployeeNumber: ${emp.employeeNumber || 'N/A'}, Name: ${emp.firstName || 'N/A'} ${emp.lastName || 'N/A'}`);
    });
    
    console.log('\n📋 Summary:');
    const withFileNumbers = employeesData.filter(emp => emp.fileNumber);
    const withoutFileNumbers = employeesData.filter(emp => !emp.fileNumber);
    
    console.log(`  Employees with file numbers: ${withFileNumbers.length}`);
    console.log(`  Employees without file numbers: ${withoutFileNumbers.length}`);
    
    if (withoutFileNumbers.length > 0) {
      console.log('\n⚠️  Employees without file numbers:');
      withoutFileNumbers.forEach(emp => {
        console.log(`  ID: ${emp.id}, Name: ${emp.firstName || 'N/A'} ${emp.lastName || 'N/A'}`);
      });
    }
    
    console.log('\n💡 Recommendation:');
    console.log('The migration used employee database IDs, but the application uses file numbers.');
    console.log('Files should be moved to the correct folder structure using file numbers.');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the check
checkEmployeeFileNumbers().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
