import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        modelNumber: true,
        status: true,
        categoryId: true,
        manufacturer: true,
        dailyRate: true,
        weeklyRate: true,
        monthlyRate: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ data: equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        manufacturer: body.manufacturer,
        modelNumber: body.modelNumber,
        serialNumber: body.serialNumber,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        status: body.status || 'available',
        dailyRate: body.dailyRate ? parseFloat(body.dailyRate) : null,
        weeklyRate: body.weeklyRate ? parseFloat(body.weeklyRate) : null,
        monthlyRate: body.monthlyRate ? parseFloat(body.monthlyRate) : null,
        isActive: true
      }
    });

    return NextResponse.json({ data: equipment }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      categoryId,
      manufacturer,
      modelNumber,
      serialNumber,
      purchaseDate,
      purchasePrice,
      status,
      locationId,
      notes,
      dailyRate,
      weeklyRate,
      monthlyRate,
    } = body;

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        manufacturer,
        modelNumber,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        status,
        locationId,
        notes,
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        weeklyRate: weeklyRate ? parseFloat(weeklyRate) : null,
        monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      { error: 'Failed to delete equipment' },
      { status: 500 }
    );
  }
}
