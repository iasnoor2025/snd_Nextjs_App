import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id: _id } = resolvedParams;

    // Mock advance data
    const advances = [
      {
        id: 1,
        amount: 5000,
        reason: 'Medical expenses',
        status: 'approved',
        created_at: '2024-01-15',
        monthly_deduction: 500,
        repaid_amount: 2000,
        remaining_balance: 3000,
        type: 'advance',
      },
      {
        id: 2,
        amount: 3000,
        reason: 'Home repairs',
        status: 'paid',
        created_at: '2024-02-10',
        monthly_deduction: 300,
        repaid_amount: 3000,
        remaining_balance: 0,
        type: 'advance',
      },
      {
        id: 3,
        amount: 2000,
        reason: 'Education fees',
        status: 'pending',
        created_at: '2024-03-05',
        type: 'advance',
      },
      {
        id: 4,
        amount: 1500,
        reason: 'Travel expenses',
        status: 'partially_repaid',
        created_at: '2024-03-20',
        monthly_deduction: 150,
        repaid_amount: 750,
        remaining_balance: 750,
        type: 'advance',
      },
    ];

    return NextResponse.json({
      success: true,
      data: advances,
      message: 'Advance payments retrieved successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch advance payments: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    const body = await request.json();

    // Mock create response
    return NextResponse.json({
      success: true,
      message: 'Advance payment request created successfully',
      data: { id: Math.floor(Math.random() * 1000), employee_id: parseInt(id), ...body },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create advance payment request: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
