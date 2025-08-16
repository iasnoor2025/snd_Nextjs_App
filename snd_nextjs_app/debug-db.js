const { Pool } = require('pg');
require('dotenv').config();

async function testDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test if employee_documents table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employee_documents'
      );
    `);
    
    console.log('employee_documents table exists:', tableCheck.rows[0].exists);
    
    // Test if employees table exists
    const employeesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
      );
    `);
    
    console.log('employees table exists:', employeesCheck.rows[0].exists);
    
    // Test if employee with ID 1 exists
    const employeeCheck = await client.query(`
      SELECT id, first_name, last_name FROM employees WHERE id = 1;
    `);
    
    console.log('Employee with ID 1:', employeeCheck.rows[0] || 'Not found');
    
    // Test if there are any documents
    const documentsCheck = await client.query(`
      SELECT COUNT(*) as count FROM employee_documents;
    `);
    
    console.log('Total documents:', documentsCheck.rows[0].count);
    
    // Test the specific query that's failing
    try {
      const documentsQuery = await client.query(`
        SELECT 
          ed.id,
          ed.employee_id,
          ed.document_type,
          ed.file_path,
          ed.file_name,
          ed.file_size,
          ed.mime_type,
          ed.description,
          ed.created_at,
          ed.updated_at,
          e.file_number
        FROM employee_documents ed
        LEFT JOIN employees e ON e.id = ed.employee_id
        WHERE ed.employee_id = 1
        ORDER BY ed.created_at;
      `);
      
      console.log('✅ Documents query successful');
      console.log('Documents found:', documentsQuery.rows.length);
      console.log('Sample document:', documentsQuery.rows[0] || 'None');
      
    } catch (queryError) {
      console.error('❌ Documents query failed:', queryError.message);
      console.error('Error details:', queryError);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();
