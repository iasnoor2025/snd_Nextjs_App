import { db } from '@/lib/drizzle';
import { projects, customers } from '@/lib/drizzle/schema';

export async function createSampleProject() {
  try {
    console.log('Creating sample project...');

    // First, check if we have any customers
    const existingCustomers = await db.select().from(customers).limit(1);
    
    let customerId = null;
    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
      console.log('Using existing customer ID:', customerId);
    } else {
      console.log('No customers found, creating project without customer');
    }

    // Create a sample project
    const [newProject] = await db
      .insert(projects)
      .values({
        name: 'Colleen Bond',
        description: 'Sample project for testing project management functionality',
        customerId: customerId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'planning',
        budget: '200000000.00', // 200 million SAR
        notes: 'This is a sample project to test the project management system',
        updatedAt: new Date().toISOString(),
      })
      .returning();

    console.log('Sample project created successfully:', newProject);
    return newProject;
  } catch (error) {
    console.error('Error creating sample project:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createSampleProject()
    .then(() => {
      console.log('Sample project creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create sample project:', error);
      process.exit(1);
    });
}
