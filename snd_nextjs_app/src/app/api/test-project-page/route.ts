import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projects, customers, rentals } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Test the same queries that the project detail page uses
    console.log('Testing project page queries...');
    
    // Test project query
    const projectData = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        customerId: projects.customerId,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        notes: projects.notes,
      })
      .from(projects)
      .where(eq(projects.id, 1))
      .limit(1);

    console.log('Project query successful, found:', projectData.length);

    if (projectData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No project found with ID 1' 
      });
    }

    const project = projectData[0];
    console.log('Project data:', project);

    // Test customer query
    let customer = null;
    if (project.customerId) {
      try {
        const customerData = await db
          .select({
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone
          })
          .from(customers)
          .where(eq(customers.id, project.customerId))
          .limit(1);
        
        customer = customerData[0] || null;
        console.log('Customer query successful:', customer);
      } catch (customerError) {
        console.error('Customer query failed:', customerError);
      }
    }

    // Test rental query
    let rental = null;
    try {
      const rentalData = await db
        .select({
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        })
        .from(rentals)
        .where(eq(rentals.projectId, project.id))
        .limit(1);

      rental = rentalData[0] || null;
      console.log('Rental query successful:', rental);
    } catch (rentalError) {
      console.error('Rental query failed:', rentalError);
    }

    // Transform data like the main API does
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      client_name: customer?.name || 'Unknown Client',
      client_contact: customer?.email || customer?.phone || 'No contact info',
      status: project.status,
      priority: 'medium',
      start_date: project.startDate ? project.startDate.toString() : '',
      end_date: project.endDate ? project.endDate.toString() : '',
      budget: Number(project.budget) || 0,
      progress: 0,
      manager: {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@company.com'
      },
      location: 'Downtown Business District',
      notes: project.notes || 'Project is progressing well.',
      rental: rental
    };

    console.log('Data transformation successful');

    return NextResponse.json({ 
      success: true,
      message: 'All project page queries successful',
      data: transformedProject
    });
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
