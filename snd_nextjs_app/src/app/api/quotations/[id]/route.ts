import { NextRequest, NextResponse } from 'next/server';

// Mock data that mirrors the Laravel controller response
const getMockQuotationData = (id: string) => {
  return {
    quotation: {
      id: parseInt(id),
      quotation_number: `QUOT-2024-${id.padStart(3, '0')}`,
      customer_id: 1,
      customer: {
        id: 1,
        name: 'ABC Construction Ltd',
        company_name: 'ABC Construction Ltd',
        contact_person: 'John Smith',
        email: 'john@abcconstruction.com',
        phone: '+1-555-0123',
      },
      issue_date: '2024-01-15',
      valid_until: '2024-02-15',
      status: 'sent',
      subtotal: 15000.0,
      discount_percentage: 5.0,
      discount_amount: 750.0,
      tax_percentage: 8.5,
      tax_amount: 1275.0,
      total_amount: 15525.0,
      notes:
        'Equipment quotation for downtown construction project. Includes operator and delivery.',
      terms_and_conditions: 'Standard terms and conditions apply. Payment terms: 30 days net.',
      created_by: 1,
      is_separate: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      quotationItems: [
        {
          id: 1,
          equipment_id: 1,
          equipment: {
            id: 1,
            name: 'Excavator CAT 320',
            model: 'CAT 320',
            manufacturer: 'Caterpillar',
            serial_number: 'CAT320-2024-001',
            status: 'active',
          },
          operator_id: 1,
          operator: {
            id: 1,
            name: 'Mike Johnson',
            employee_id: 'EMP001',
            first_name: 'Mike',
            last_name: 'Johnson',
          },
          description: 'Excavator with operator for excavation work',
          quantity: 1,
          rate: 500.0,
          rate_type: 'daily',
          total_amount: 15000.0,
        },
      ],
    },
    quotationItems: {
      data: [
        {
          id: 1,
          equipment_id: 1,
          equipment: {
            id: 1,
            name: 'Excavator CAT 320',
            model: 'CAT 320',
            manufacturer: 'Caterpillar',
            serial_number: 'CAT320-2024-001',
            status: 'active',
          },
          operator_id: 1,
          operator: {
            id: 1,
            name: 'Mike Johnson',
            employee_id: 'EMP001',
            first_name: 'Mike',
            last_name: 'Johnson',
          },
          description: 'Excavator with operator for excavation work',
          quantity: 1,
          rate: 500.0,
          rate_type: 'daily',
          total_amount: 15000.0,
        },
      ],
      total: 1,
    },
    canApprove: true,
    canReject: true,
    canEdit: true,
    canDelete: true,
  };
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // In a real implementation, this would call the Laravel API
    // const response = await fetch(`${process.env.LARAVEL_API_URL}/api/quotations/${id}`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // For now, return mock data that mirrors the Laravel controller response
    const data = getMockQuotationData(id);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotation data' }, { status: 500 });
  }
}

export async function PUT(_request: NextRequest) {
  try {
    const body = await _request.json();

    // In a real implementation, this would call the Laravel API
    // const response = await fetch(`${process.env.LARAVEL_API_URL}/api/quotations/${id}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(body),
    // });

    // For now, return success response
    return NextResponse.json({
      success: true,
      message: 'Quotation updated successfully',
      data: body,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    // In a real implementation, this would call the Laravel API
    // const response = await fetch(`${process.env.LARAVEL_API_URL}/api/quotations/${id}`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // For now, return success response
    return NextResponse.json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}
