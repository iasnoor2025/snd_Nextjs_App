import { db } from '@/lib/drizzle';
import { equipmentCategories } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';

const seedCategoriesHandler = async (_request: NextRequest) => {
  try {

    const categories = [
      {
        name: 'DOZER',
        description: 'Bulldozers and dozers for earth moving and grading',
        icon: '🚜',
        color: '#FF6B6B',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'LOADER',
        description: 'Wheel loaders and front-end loaders',
        icon: '🏗️',
        color: '#4ECDC4',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'TRUCK',
        description: 'Dump trucks, flatbed trucks, and transport vehicles',
        icon: '🚛',
        color: '#45B7D1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'WATER TANKER',
        description: 'Water tankers and water transport vehicles',
        icon: '💧',
        color: '#96CEB4',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'ROLLER',
        description: 'Road rollers and compaction equipment',
        icon: '⚙️',
        color: '#FFEAA7',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'GRADER',
        description: 'Motor graders for road construction',
        icon: '🛣️',
        color: '#DDA0DD',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'EXCAVATOR',
        description: 'Excavators and digging equipment',
        icon: '⛏️',
        color: '#FF8A80',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'CRANE',
        description: 'Cranes and lifting equipment',
        icon: '🏗️',
        color: '#FFB74D',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'COMPACTOR',
        description: 'Soil compactors and compaction equipment',
        icon: '🔨',
        color: '#81C784',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'FORKLIFT',
        description: 'Forklifts and material handling equipment',
        icon: '📦',
        color: '#64B5F6',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'TRACTOR',
        description: 'Tractors and agricultural equipment',
        icon: '🚜',
        color: '#A1887F',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'GENERATOR',
        description: 'Generators and power equipment',
        icon: '⚡',
        color: '#FFD54F',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'COMPRESSOR',
        description: 'Air compressors and pneumatic equipment',
        icon: '💨',
        color: '#7986CB',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'PUMP',
        description: 'Water pumps and pumping equipment',
        icon: '🌊',
        color: '#4FC3F7',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'WELDER',
        description: 'Welding equipment and tools',
        icon: '🔥',
        color: '#FF7043',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'OTHER',
        description: 'Other equipment types',
        icon: '🔧',
        color: '#9E9E9E',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
};

export const POST = withPermission(PermissionConfigs.settings.manage)(seedCategoriesHandler);
