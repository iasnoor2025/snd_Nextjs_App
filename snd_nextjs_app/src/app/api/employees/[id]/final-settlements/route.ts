import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return empty data since we're not connected to Laravel backend
    // In the future, this would fetch from Laravel API
    const finalSettlements = {
      data: [],
    };

    return NextResponse.json(finalSettlements);
  } catch (error) {
    console.error('Error fetching final settlements:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch final settlements',
      },
      { status: 500 }
    );
  }
}
