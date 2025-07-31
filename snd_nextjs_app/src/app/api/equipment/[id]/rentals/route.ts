import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Fetch rental history for this equipment
    const rentalHistory = await prisma.rentalItem.findMany({
      where: {
        equipment_id: id
      },
      include: {
        rental: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform the data to include more useful information
    const history = rentalHistory.map(item => ({
      id: item.id,
      rental_id: item.rental_id,
      rental_number: item.rental.rental_number,
      customer_name: item.rental.customer?.name || 'Unknown',
      customer_email: item.rental.customer?.email,
      customer_phone: item.rental.customer?.phone,
      equipment_name: item.equipment_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      rate_type: item.rate_type,
      days: item.days,
      status: item.status,
      notes: item.notes,
      rental_start_date: item.rental.start_date,
      rental_expected_end_date: item.rental.expected_end_date,
      rental_actual_end_date: item.rental.actual_end_date,
      rental_status: item.rental.status,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching equipment rental history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rental history' },
      { status: 500 }
    );
  }
} 