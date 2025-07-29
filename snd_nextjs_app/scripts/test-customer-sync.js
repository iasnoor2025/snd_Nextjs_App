const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCustomerSync() {
  try {
    console.log('Testing Customer Sync Functionality...\n');

    // Test 1: Check if database connection works
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check existing customers
    console.log('2. Checking existing customers...');
    const existingCustomers = await prisma.customer.count();
    console.log(`✅ Found ${existingCustomers} existing customers\n`);

    // Test 3: Check customers with ERPNext IDs
    console.log('3. Checking customers synced from ERPNext...');
    const syncedCustomers = await prisma.customer.count({
      where: {
        erpnext_id: {
          not: null
        }
      }
    });
    console.log(`✅ Found ${syncedCustomers} customers synced from ERPNext\n`);

    // Test 4: Show sample customer data
    console.log('4. Sample customer data:');
    const sampleCustomer = await prisma.customer.findFirst({
      include: {
        rentals: true
      }
    });
    
    if (sampleCustomer) {
      console.log('Customer:', {
        id: sampleCustomer.id,
        name: sampleCustomer.name,
        company_name: sampleCustomer.company_name,
        erpnext_id: sampleCustomer.erpnext_id,
        email: sampleCustomer.email,
        phone: sampleCustomer.phone,
        is_active: sampleCustomer.is_active,
        rentals_count: sampleCustomer.rentals.length
      });
    } else {
      console.log('No customers found in database');
    }

    // Test 5: Test sync API endpoint
    console.log('\n5. Testing sync API endpoint...');
    const response = await fetch('http://localhost:3000/api/customers/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sync API response:', result);
    } else {
      console.log('❌ Sync API failed:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCustomerSync(); 