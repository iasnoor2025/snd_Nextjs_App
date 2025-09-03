import { db } from '../src/lib/drizzle/index.js';
import { equipmentCategories } from '../src/lib/drizzle/schema.js';

async function seedEquipmentCategories() {
  try {
    console.log('Seeding equipment categories...');

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
    for (const category of categories) {
      await db.insert(equipmentCategories).values(category);
      console.log(`Inserted category: ${category.name}`);
    }

    console.log('Equipment categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding equipment categories:', error);
  } finally {
    process.exit(0);
  }
}

seedEquipmentCategories();
