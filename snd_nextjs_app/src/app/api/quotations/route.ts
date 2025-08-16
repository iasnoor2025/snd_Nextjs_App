import { NextRequest, NextResponse } from 'next/server';

// Mock data that mirrors the Laravel controller response
const getMockQuotationsData = (search: string = '', status: string = 'all', startDate: string = '', endDate: string = '', page: number = 1) => {
  const mockQuotations = [
    {
      id: 1,
      quotation_number: "QUOT-2024-001",
      customer: {
        id: 1,
        company_name: "ABC Construction Ltd",
        contact_person: "John Smith",
        email: "john@abcconstruction.com",
        phone: "+1-555-0123"
      },
      issue_date: "2024-01-15",
      valid_until: "2024-02-15",
      status: "sent",
      subtotal: 15000.00,
      discount_percentage: 5.0,
      discount_amount: 750.00,
      tax_percentage: 8.5,
      tax_amount: 1275.00,
      total_amount: 15525.00,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      quotationItems: [
        {
          id: 1,
          equipment: {
            id: 1,
            name: "Excavator CAT 320",
            model: "CAT 320"
          }
        }
      ]
    },
    {
      id: 2,
      quotation_number: "QUOT-2024-002",
      customer: {
        id: 2,
        company_name: "XYZ Developers",
        contact_person: "Jane Doe",
        email: "jane@xyzdevelopers.com",
        phone: "+1-555-0456"
      },
      issue_date: "2024-01-10",
      valid_until: "2024-02-10",
      status: "approved",
      subtotal: 12000.00,
      discount_percentage: 0.0,
      discount_amount: 0.00,
      tax_percentage: 8.5,
      tax_amount: 1020.00,
      total_amount: 13020.00,
      created_at: "2024-01-10T10:00:00Z",
      updated_at: "2024-01-12T14:30:00Z",
      quotationItems: [
        {
          id: 2,
          equipment: {
            id: 2,
            name: "Bulldozer Komatsu D65",
            model: "D65"
          }
        }
      ]
    },
    {
      id: 3,
      quotation_number: "QUOT-2024-003",
      customer: {
        id: 3,
        company_name: "City Projects Ltd",
        contact_person: "Bob Wilson",
        email: "bob@cityprojects.com",
        phone: "+1-555-0789"
      },
      issue_date: "2024-01-20",
      valid_until: "2024-02-20",
      status: "draft",
      subtotal: 24000.00,
      discount_percentage: 10.0,
      discount_amount: 2400.00,
      tax_percentage: 8.5,
      tax_amount: 1836.00,
      total_amount: 23436.00,
      created_at: "2024-01-20T10:00:00Z",
      updated_at: "2024-01-20T10:00:00Z",
      quotationItems: [
        {
          id: 3,
          equipment: {
            id: 3,
            name: "Crane Mobile 50T",
            model: "50T"
          }
        }
      ]
    }
  ];

  // Apply filters
  let filteredQuotations = mockQuotations;

  if (search) {
    filteredQuotations = filteredQuotations.filter(quotation =>
      quotation.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      quotation.customer.company_name.toLowerCase().includes(search.toLowerCase()) ||
      quotation.customer.contact_person.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status !== 'all') {
    filteredQuotations = filteredQuotations.filter(quotation => quotation.status === status);
  }

  if (startDate) {
    filteredQuotations = filteredQuotations.filter(quotation =>
      new Date(quotation.issue_date) >= new Date(startDate)
    );
  }

  if (endDate) {
    filteredQuotations = filteredQuotations.filter(quotation =>
      new Date(quotation.valid_until) <= new Date(endDate)
    );
  }

  // Pagination
  const perPage = 10;
  const total = filteredQuotations.length;
  const lastPage = Math.ceil(total / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedQuotations = filteredQuotations.slice(startIndex, endIndex);

  return {
    data: paginatedQuotations,
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total,
    from: startIndex + 1,
    to: Math.min(endIndex, total),
    next_page_url: page < lastPage ? `/api/quotations?page=${page + 1}` : null,
    prev_page_url: page > 1 ? `/api/quotations?page=${page - 1}` : null,
    first_page_url: '/api/quotations?page=1',
    last_page_url: `/api/quotations?page=${lastPage}`,
    path: '/api/quotations',
    links: []
  };
};

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';
    const page = parseInt(searchParams.get('page') || '1');

    // In a real implementation, this would call the Laravel API
    // const response = await fetch(`${process.env.LARAVEL_API_URL}/api/quotations?${searchParams.toString()}`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // For now, return mock data that mirrors the Laravel controller response
    const data = getMockQuotationsData(search, status, startDate, endDate, page);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching quotations data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations data' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();

    // In a real implementation, this would call the Laravel API
    // const response = await fetch(`${process.env.LARAVEL_API_URL}/api/quotations`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(body),
    // });

    // For now, return success response
    return NextResponse.json({
      success: true,
      message: 'Quotation created successfully',
      data: {
        id: Math.floor(Math.random() * 1000) + 1,
        quotation_number: `QUOT-2024-${Math.floor(Math.random() * 1000) + 1}`,
        ...body
      }
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}
