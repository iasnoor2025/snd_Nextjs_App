#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function initializeRBAC() {
  let client;
  
  if (process.env.DATABASE_URL) {
    console.log('🔗 Using DATABASE_URL connection...');
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
  } else {
    console.log('🔗 Using individual database parameters...');
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
  }

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if RBAC system already exists
    const existingRoles = await client.query('SELECT COUNT(*) as count FROM roles');
    if (parseInt(existingRoles.rows[0].count) > 0) {
      console.log('✅ RBAC system already exists, skipping initialization');
      return;
    }

    console.log('🚀 Initializing RBAC system...');

    // Call the API endpoint to initialize RBAC
    const response = await fetch('http://localhost:3000/api/rbac/initialize', {
      method: 'POST',
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ RBAC system initialized successfully!');
      console.log('📋 Result:', result.message);
    } else {
      throw new Error(`API call failed with status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ RBAC initialization failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js application is running on port 3000');
      console.log('   Run: npm run dev');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the initialization
initializeRBAC();
