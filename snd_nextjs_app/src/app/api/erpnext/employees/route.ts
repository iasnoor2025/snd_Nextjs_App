import { NextRequest, NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET;

async function makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    throw new Error('ERPNext configuration is missing. Please check your environment variables.');
  }

  const url = `${ERPNEXT_URL}${endpoint}`;

  const defaultHeaders = {
    'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const data = await makeERPNextRequest('/api/resource/Employee?limit_page_length=1000');
    const employees = [];

    if (data.data) {
      for (const item of data.data) {
        if (item.name) {
          const detailResponse = await makeERPNextRequest(`/api/resource/Employee/${encodeURIComponent(item.name)}`);
          if (detailResponse.data) {
            employees.push(detailResponse.data);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Error fetching ERPNext employees:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch employees'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const employeeData = await request.json();

    // Check if employee exists
    const name = employeeData.employee_name || employeeData.name;
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'employee_name is required for ERPNext employee creation'
        },
        { status: 400 }
      );
    }

    // Check if employee exists
    const filters = encodeURIComponent(JSON.stringify([["employee_name", "=", name]]));
    const existingResponse = await makeERPNextRequest(`/api/resource/Employee?filters=${filters}`);

    let response;
    if (existingResponse.data && existingResponse.data.length > 0) {
      // Update existing employee
      const existingEmployee = existingResponse.data[0];
      response = await makeERPNextRequest(`/api/resource/Employee/${encodeURIComponent(existingEmployee.name)}`, {
        method: 'PUT',
        body: JSON.stringify(employeeData),
      });
    } else {
      // Create new employee
      response = await makeERPNextRequest('/api/resource/Employee', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });
    }

    return NextResponse.json({
      success: true,
      data: response.data || response,
      message: 'Employee created/updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating ERPNext employee:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create/update employee'
      },
      { status: 500 }
    );
  }
}
