import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { equipmentCategories } from '@/lib/drizzle/schema';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const categories = [
      {
        name: 'DOZER',
        description: 'Bulldozers and dozers for earth moving and grading',
        icon: '🚜',
        color: '#FF6B6B',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'LOADER',
        description: 'Wheel loaders and front-end loaders',
        icon: '🏗️',
        color: '#4ECDC4',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'TRUCK',
        description: 'Dump trucks, flatbed trucks, and transport vehicles',
        icon: '🚛',
        color: '#45B7D1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'WATER TANKER',
        description: 'Water tankers and water transport vehicles',
        icon: '💧',
        color: '#96CEB4',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'ROLLER',
        description: 'Road rollers and compaction equipment',
        icon: '⚙️',
        color: '#FFEAA7',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'GRADER',
        description: 'Motor graders for road construction',
        icon: '🛣️',
        color: '#DDA0DD',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'EXCAVATOR',
        description: 'Excavators and digging equipment',
        icon: '⛏️',
        color: '#FF8A80',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'CRANE',
        description: 'Cranes and lifting equipment',
        icon: '🏗️',
        color: '#FFB74D',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'COMPACTOR',
        description: 'Soil compactors and compaction equipment',
        icon: '🔨',
        color: '#81C784',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'FORKLIFT',
        description: 'Forklifts and material handling equipment',
        icon: '📦',
        color: '#64B5F6',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'TRACTOR',
        description: 'Tractors and agricultural equipment',
        icon: '🚜',
        color: '#A1887F',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'GENERATOR',
        description: 'Generators and power equipment',
        icon: '⚡',
        color: '#FFD54F',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'COMPRESSOR',
        description: 'Air compressors and pneumatic equipment',
        icon: '💨',
        color: '#7986CB',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'PUMP',
        description: 'Water pumps and pumping equipment',
        icon: '🌊',
        color: '#4FC3F7',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'WELDER',
        description: 'Welding equipment and tools',
        icon: '🔥',
        color: '#FF7043',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'OTHER',
        description: 'Other equipment types',
        icon: '🔧',
        color: '#9E9E9E',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert categories
    const insertedCategories = [];
    for (const category of categories) {
      try {
        const result = await db.insert(equipmentCategories).values(category).returning();
        insertedCategories.push(result[0]);
      } catch (error) {
        // Category might already exist, continue
        console.log(`Category ${category.name} might already exist`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${insertedCategories.length} equipment categories`,
      data: insertedCategories,
    });
  } catch (error) {
    console.error('Error seeding equipment categories:', error);
    return NextResponse.json(
      { error: 'Failed to seed equipment categories' },
      { status: 500 }
    );
  }
}
