import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Create sample users
    const user1 = await prisma.user.upsert({
      where: { email: 'john.smith@company.com' },
      update: {},
      create: {
        email: 'john.smith@company.com',
        name: 'John Smith',
        role: 'MANAGER',
        isActive: true
      }
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'sarah.johnson@company.com' },
      update: {},
      create: {
        email: 'sarah.johnson@company.com',
        name: 'Sarah Johnson',
        role: 'USER',
        isActive: true
      }
    });

    const user3 = await prisma.user.upsert({
      where: { email: 'mike.davis@company.com' },
      update: {},
      create: {
        email: 'mike.davis@company.com',
        name: 'Mike Davis',
        role: 'USER',
        isActive: true
      }
    });

    // Create sample customer
    const customer = await prisma.customer.upsert({
      where: { email: 'john.doe@abccorp.com' },
      update: {},
      create: {
        name: 'ABC Corporation',
        contactPerson: 'John Doe',
        email: 'john.doe@abccorp.com',
        phone: '+1-555-0123',
        address: '123 Business St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        isActive: true
      }
    });

    // Create sample project
    const project = await prisma.project.upsert({
      where: { id: 'project-2' },
      update: {},
      create: {
        id: 'project-2',
        name: 'Office Building Construction',
        description: 'Construction of a 10-story office building with modern amenities and sustainable design features.',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        status: 'active',
        priority: 'high',
        budget: 500000,
        initialBudget: 500000,
        currentBudget: 325000,
        budgetStatus: 'On Track',
        budgetNotes: 'Project is progressing well within budget constraints.',
        progress: 65,
        managerId: user1.id
      }
    });

    // Create sample tasks
    const task1 = await prisma.projectTask.create({
      data: {
        projectId: project.id,
        title: 'Foundation Work',
        description: 'Complete foundation excavation and concrete pouring',
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-02-15'),
        completionPercentage: 100,
        assignedToId: user1.id
      }
    });

    const task2 = await prisma.projectTask.create({
      data: {
        projectId: project.id,
        title: 'Structural Framework',
        description: 'Install steel framework and concrete columns',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-04-30'),
        completionPercentage: 65,
        assignedToId: user2.id
      }
    });

    const task3 = await prisma.projectTask.create({
      data: {
        projectId: project.id,
        title: 'Electrical Systems',
        description: 'Install electrical wiring and systems',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date('2024-05-15'),
        completionPercentage: 0,
        assignedToId: user3.id
      }
    });

    // Create sample milestones
    const milestone1 = await prisma.milestone.create({
      data: {
        projectId: project.id,
        name: 'Foundation Complete',
        description: 'All foundation work completed and inspected',
        dueDate: new Date('2024-02-15'),
        status: 'completed',
        completedAt: new Date('2024-02-12')
      }
    });

    const milestone2 = await prisma.milestone.create({
      data: {
        projectId: project.id,
        name: 'Structural Framework',
        description: 'Steel framework installation complete',
        dueDate: new Date('2024-04-30'),
        status: 'active'
      }
    });

    const milestone3 = await prisma.milestone.create({
      data: {
        projectId: project.id,
        name: 'Building Envelope',
        description: 'Exterior walls and roofing complete',
        dueDate: new Date('2024-05-30'),
        status: 'pending'
      }
    });

    // Create sample documents
    const document1 = await prisma.projectDocument.create({
      data: {
        projectId: project.id,
        userId: user1.id,
        name: 'Project Specifications.pdf',
        description: 'Detailed project specifications and requirements',
        category: 'Specifications',
        filePath: '/documents/specifications.pdf',
        fileSize: 2621440, // 2.5 MB
        fileType: 'PDF',
        uploadedBy: user1.id,
        isShared: true
      }
    });

    const document2 = await prisma.projectDocument.create({
      data: {
        projectId: project.id,
        userId: user2.id,
        name: 'Construction Plans.dwg',
        description: 'Detailed construction plans and blueprints',
        category: 'Plans',
        filePath: '/documents/plans.dwg',
        fileSize: 15925248, // 15.2 MB
        fileType: 'DWG',
        uploadedBy: user2.id,
        isShared: true
      }
    });

    const document3 = await prisma.projectDocument.create({
      data: {
        projectId: project.id,
        userId: user3.id,
        name: 'Budget Breakdown.xlsx',
        description: 'Detailed budget breakdown and cost analysis',
        category: 'Financial',
        filePath: '/documents/budget.xlsx',
        fileSize: 1887437, // 1.8 MB
        fileType: 'XLSX',
        uploadedBy: user3.id,
        isShared: false
      }
    });

    // Create sample resources
    const resource1 = await prisma.projectResource.create({
      data: {
        projectId: project.id,
        type: 'equipment',
        name: 'Excavator',
        description: 'Heavy excavation equipment for foundation work',
        quantity: 2,
        unitCost: 500,
        totalCost: 1000,
        date: new Date('2024-01-15'),
        status: 'approved',
        equipmentType: 'Excavator',
        equipmentNumber: 'EXC-001',
        operatorName: 'Bob Wilson',
        usageHours: 160,
        maintenanceCost: 200
      }
    });

    const resource2 = await prisma.projectResource.create({
      data: {
        projectId: project.id,
        type: 'manpower',
        name: 'Construction Team A',
        description: 'Skilled construction workers for structural work',
        quantity: 8,
        unitCost: 150,
        totalCost: 1200,
        date: new Date('2024-02-01'),
        status: 'approved',
        workerName: 'Construction Team A',
        position: 'Skilled Worker',
        dailyRate: 150,
        daysWorked: 8
      }
    });

    const resource3 = await prisma.projectResource.create({
      data: {
        projectId: project.id,
        type: 'material',
        name: 'Steel Beams',
        description: 'Structural steel beams for framework',
        quantity: 50,
        unitCost: 800,
        totalCost: 40000,
        date: new Date('2024-03-01'),
        status: 'approved',
        materialName: 'Steel Beams',
        unit: 'pieces'
      }
    });

    // Create sample rental to link project with customer
    const rental = await prisma.rental.create({
      data: {
        customerId: customer.id,
        projectId: project.id,
        rentalNumber: 'RENT-001',
        startDate: new Date('2024-01-01'),
        expectedEndDate: new Date('2024-06-30'),
        status: 'active',
        totalAmount: 500000,
        createdById: user1.id
      }
    });

    return NextResponse.json({
      message: 'Sample data created successfully',
      data: {
        users: [user1, user2, user3],
        customer,
        project,
        tasks: [task1, task2, task3],
        milestones: [milestone1, milestone2, milestone3],
        documents: [document1, document2, document3],
        resources: [resource1, resource2, resource3],
        rental
      }
    });

  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
