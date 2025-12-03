import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projects, customers, projectTasks, projectManpower, projectMaterials } from '@/lib/drizzle/schema';

export async function POST() {
  try {
    console.log('Creating sample project data...');

    // First, create a sample customer if none exists
    let customerId = null;
    try {
      const existingCustomers = await db.select().from(customers).limit(1);
      
      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        console.log('Using existing customer ID:', customerId);
      } else {
        // Create a sample customer
        const [newCustomer] = await db
          .insert(customers)
          .values({
            name: 'ABC Corporation',
            companyName: 'ABC Corporation Ltd.',
            contactPerson: 'John Smith',
            email: 'contact@abc-corp.com',
            phone: '+966-11-123-4567',
            address: 'Riyadh, Saudi Arabia',
            city: 'Riyadh',
            state: 'Riyadh Province',
            country: 'Saudi Arabia',
            isActive: true,
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0] || null,
            updatedAt: new Date().toISOString().split('T')[0] || null
          })
          .returning();
        
        customerId = newCustomer.id;
        console.log('Created new customer with ID:', customerId);
      }
    } catch (customerError) {
      console.log('Could not create/find customer, proceeding without customer');
    }

    // Create the sample project "Colleen Bond"
    const [newProject] = await db
      .insert(projects)
      .values({
        name: 'Colleen Bond',
        description: 'Large-scale construction project for commercial development in downtown area',
        customerId: customerId,
        startDate: new Date('2024-01-01').toISOString().split('T')[0],
        endDate: new Date('2024-12-31').toISOString().split('T')[0],
        status: 'planning',
        budget: '200000000.00', // 200 million SAR
        notes: 'This is a major construction project involving multiple phases including foundation, structural work, and finishing.',
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    console.log('Created project:', newProject);

    // Create sample tasks
    const sampleTasks = [
      {
        name: 'Site Preparation',
        description: 'Clear and prepare the construction site',
        status: 'completed',
        priority: 'high',
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-02-01'),
        completionPercentage: 100,
        estimatedHours: 160,
        actualHours: 150,
      },
      {
        name: 'Foundation Work',
        description: 'Excavation and foundation construction',
        status: 'in_progress',
        priority: 'high',
        startDate: new Date('2024-02-01'),
        dueDate: new Date('2024-04-01'),
        completionPercentage: 65,
        estimatedHours: 320,
        actualHours: 210,
      },
      {
        name: 'Structural Framework',
        description: 'Steel and concrete structural work',
        status: 'pending',
        priority: 'medium',
        startDate: new Date('2024-04-01'),
        dueDate: new Date('2024-08-01'),
        completionPercentage: 0,
        estimatedHours: 480,
      },
    ];

    for (const task of sampleTasks) {
      await db
        .insert(projectTasks)
        .values({
          projectId: newProject.id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          startDate: task.startDate.toISOString().split('T')[0],
          dueDate: task.dueDate.toISOString().split('T')[0],
          completionPercentage: task.completionPercentage,
          estimatedHours: task.estimatedHours?.toString() || null,
          actualHours: task.actualHours?.toString() || null,
          updatedAt: new Date().toISOString().split('T')[0],
        });
    }

    // Create sample manpower resources
    const sampleManpower = [
      {
        workerName: 'Ahmed Al-Rashid',
        jobTitle: 'Site Supervisor',
        dailyRate: 500.00,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        totalDays: 365,
        actualDays: 90,
        status: 'active',
        notes: 'Experienced site supervisor overseeing daily operations',
      },
      {
        workerName: 'Mohammed Hassan',
        jobTitle: 'Construction Manager',
        dailyRate: 800.00,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        totalDays: 365,
        actualDays: 90,
        status: 'active',
        notes: 'Project construction manager',
      },
      {
        workerName: 'Khalid Ibrahim',
        jobTitle: 'Heavy Equipment Operator',
        dailyRate: 350.00,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        totalDays: 150,
        actualDays: 45,
        status: 'active',
        notes: 'Operating excavators and bulldozers',
      },
    ];

    for (const manpower of sampleManpower) {
      await db
        .insert(projectManpower)
        .values({
          projectId: newProject.id,
          workerName: manpower.workerName,
          jobTitle: manpower.jobTitle,
          dailyRate: manpower.dailyRate.toString(),
          startDate: manpower.startDate.toISOString().split('T')[0],
          endDate: manpower.endDate.toISOString().split('T')[0],
          totalDays: manpower.totalDays,
          actualDays: manpower.actualDays,
          status: manpower.status,
          notes: manpower.notes,
          updatedAt: new Date().toISOString().split('T')[0],
        });
    }

    // Create sample materials
    const sampleMaterials = [
      {
        name: 'Concrete Grade 40',
        description: 'High-strength concrete for foundation',
        category: 'Construction Materials',
        unit: 'cubic meter',
        quantity: 500,
        unitPrice: 250.00,
        totalCost: 125000.00,
        supplier: 'Saudi Concrete Company',
        status: 'delivered',
      },
      {
        name: 'Steel Rebar',
        description: 'Reinforcement steel bars',
        category: 'Construction Materials', 
        unit: 'ton',
        quantity: 100,
        unitPrice: 2500.00,
        totalCost: 250000.00,
        supplier: 'Riyadh Steel Industries',
        status: 'ordered',
      },
      {
        name: 'Cement',
        description: 'Portland cement',
        category: 'Construction Materials',
        unit: 'bag',
        quantity: 1000,
        unitPrice: 25.00,
        totalCost: 25000.00,
        supplier: 'Saudi Cement Company',
        status: 'delivered',
      },
    ];

    for (const material of sampleMaterials) {
      await db
        .insert(projectMaterials)
        .values({
          projectId: newProject.id,
          name: material.name,
          description: material.description,
          category: material.category,
          unit: material.unit,
          quantity: material.quantity,
          unitPrice: material.unitPrice,
          totalCost: material.totalCost,
          supplier: material.supplier,
          status: material.status,
          updatedAt: new Date(),
        });
    }

    console.log('Sample project data created successfully');

    return NextResponse.json({
      success: true,
      data: {
        project: newProject,
        message: 'Sample project "Colleen Bond" created successfully with tasks, manpower, and materials'
      }
    });

  } catch (error) {
    console.error('Error creating sample project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create sample project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
