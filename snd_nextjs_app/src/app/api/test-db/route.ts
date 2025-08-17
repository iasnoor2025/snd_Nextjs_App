import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Basic query result:', result);
    
    // Test if salary_increments table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'salary_increments'
      ) as table_exists
    `);
    console.log('Table check result:', tableCheck);
    
    // Test if we can query the table structure
    const tableStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'salary_increments'
      ORDER BY ordinal_position
    `);
    console.log('Table structure:', tableStructure);
    
    // Test if users table exists
    const usersTableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as table_exists
    `);
    console.log('Users table check result:', usersTableCheck);
    
    // Test if employees table exists
    const employeesTableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
      ) as table_exists
    `);
    console.log('Employees table check result:', employeesTableCheck);
    
    // Test basic query on salary_increments table
    let salaryIncrementsTest = null;
    try {
      salaryIncrementsTest = await db.execute(sql`SELECT COUNT(*) as count FROM salary_increments`);
      console.log('Salary increments count test:', salaryIncrementsTest);
    } catch (error) {
      console.error('Salary increments query failed:', error);
      salaryIncrementsTest = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Test basic query on users table
    let usersTest = null;
    try {
      usersTest = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      console.log('Users count test:', usersTest);
    } catch (error) {
      console.error('Users query failed:', error);
      usersTest = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Test basic query on employees table
    let employeesTest = null;
    try {
      employeesTest = await db.execute(sql`SELECT COUNT(*) as count FROM employees`);
      console.log('Employees count test:', employeesTest);
    } catch (error) {
      console.error('Employees query failed:', error);
      employeesTest = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      basicQuery: result,
      tableExists: tableCheck,
      tableStructure: tableStructure,
      usersTableExists: usersTableCheck,
      employeesTableExists: employeesTableCheck,
      salaryIncrementsTest: salaryIncrementsTest,
      usersTest: usersTest,
      employeesTest: employeesTest
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
