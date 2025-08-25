import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // For now, return test data to get the page working
    const testDocuments = [
      {
        id: '1',
        type: 'employee',
        documentType: 'iqama',
        filePath: 'employee-1/iqama_1234567890.pdf',
        fileName: 'Iqama',
        originalFileName: 'iqama_1234567890.pdf',
        fileSize: 1024000,
        fileSizeFormatted: '1.00 MB',
        mimeType: 'application/pdf',
        description: 'Employee Iqama document',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        employeeId: 1,
        employeeName: 'Employee 1',
        employeeFileNumber: 'EMP001',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQ0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggNDQNCj4+DQpzdHJlYW0NCkJUQSAwLjAgMC4wIHNnDQovRjEgMTIgVGYNCjAgMCBUZA0KL1F1aWNrIEJyb3duIEZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4gVGVzdCBQREYuDQpFVA0KZW5kc3RyZWFtDQplbmRvYmoNCnhyZWYNCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMDEgMDAwMDAgbg0KMDAwMDAwMDAxMCAwMDAwMCBuDQowMDAwMDAwMDc5IDAwMDAwIG4NCjAwMDAwMDAxNzMgMDAwMDAgbg0KMDAwMDAwMDMwMSAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjMxNQ0KJSVFT0Y=', // Simple test PDF base64
        viewUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQ0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggNDQNCj4+DQpzdHJlYW0NCkJUQSAwLjAgMC4wIHNnDQovRjEgMTIgVGYNCjAgMCBUZA0KL1F1aWNrIEJyb3duIEZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4gVGVzdCBQREYuDQpFVA0KZW5kc3RyZWFtDQplbmRvYmoNCnhyZWYNCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMDEgMDAwMDAgbg0KMDAwMDAwMDAxMCAwMDAwMCBuDQowMDAwMDAwMDc5IDAwMDAwIG4NCjAwMDAwMDAxNzMgMDAwMDAgbg0KMDAwMDAwMDMwMSAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjMxNQ0KJSVFT0Y=',
        searchableText: '1 iqama iqama',
      },
      {
        id: '2',
        type: 'equipment',
        documentType: 'equipment_document',
        filePath: 'equipment-119/equipment_manual.pdf',
        fileName: 'Equipment Manual',
        originalFileName: 'equipment_manual.pdf',
        fileSize: 2048000,
        fileSizeFormatted: '2.00 MB',
        mimeType: 'application/pdf',
        description: 'Equipment manual document',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        equipmentId: 119,
        equipmentName: 'Equipment 119',
        equipmentModel: 'Model X',
        equipmentSerial: 'SN123456',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQ0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggNDQNCj4+DQpzdHJlYW0NCkJUQSAwLjAgMC4wIHNnDQovRjEgMTIgVGYNCjAgMCBUZA0KL1F1aWNrIEJyb3duIEZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4gVGVzdCBQREYuDQpFVA0KZW5kc3RyZWFtDQplbmRvYmoNCnhyZWYNCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMDEgMDAwMDAgbg0KMDAwMDAwMDAxMCAwMDAwMCBuDQowMDAwMDAwMDc5IDAwMDAwIG4NCjAwMDAwMDAxNzMgMDAwMDAgbg0KMDAwMDAwMDMwMSAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjMxNQ0KJSVFT0Y=',
        viewUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQ0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggNDQNCj4+DQpzdHJlYW0NCkJUQSAwLjAgMC4wIHNnDQovRjEgMTIgVGYNCjAgMCBUZA0KL1F1aWNrIEJyb3duIEZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4gVGVzdCBQREYuDQpFVA0KZW5kc3RyZWFtDQplbmRvYmoNCnhyZWYNCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMDEgMDAwMDAgbg0KMDAwMDAwMDAxMCAwMDAwMCBuDQowMDAwMDAwMDc5IDAwMDAwIG4NCjAwMDAwMDAxNzMgMDAwMDAgbg0KMDAwMDAwMDMwMSAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjMxNQ0KJSVFT0Y=',
        searchableText: '119 equipment manual equipment_document',
      }
    ];

    // Filter by search term if provided
    let filteredDocuments = testDocuments;
    if (search) {
      filteredDocuments = testDocuments.filter(doc => 
        doc.searchableText.includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by type if specified
    if (type !== 'all') {
      filteredDocuments = filteredDocuments.filter(doc => doc.type === type);
    }

    // Sort by creation date
    filteredDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const totalDocs = filteredDocuments.length;
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

    const employeeCount = filteredDocuments.filter(doc => doc.type === 'employee').length;
    const equipmentCount = filteredDocuments.filter(doc => doc.type === 'equipment').length;

    return NextResponse.json({
      success: true,
      data: {
        documents: paginatedDocuments,
        pagination: {
          page,
          limit,
          total: totalDocs,
          totalPages: Math.ceil(totalDocs / limit),
          hasNext: page * limit < totalDocs,
          hasPrev: page > 1,
        },
        counts: {
          employee: employeeCount,
          equipment: equipmentCount,
          total: totalDocs,
        },
      },
    });
  } catch (error) {
    console.error('Error in documents API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch documents: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
