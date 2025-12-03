import { db } from '@/lib/db';
import { employees as employeesTable, departments, designations, employeeDocuments } from '@/lib/drizzle/schema';
import { EmployeeContractPDFService } from '@/lib/services/employee-contract-pdf-service';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// GET - Generate and download contract PDF
const generateContractHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId || isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Fetch employee data with department and designation
    const employeeResult = await db
      .select({
        employee: employeesTable,
        department: departments,
        designation: designations,
      })
      .from(employeesTable)
      .leftJoin(departments, eq(departments.id, employeesTable.departmentId))
      .leftJoin(designations, eq(designations.id, employeesTable.designationId))
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (!employeeResult[0]?.employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const { employee, department, designation } = employeeResult[0];

    // Prepare contract data
    const contractData = {
      fileNumber: employee.fileNumber || '',
      firstName: employee.firstName,
      middleName: employee.middleName,
      lastName: employee.lastName,
      nationality: employee.nationality,
      dateOfBirth: employee.dateOfBirth?.toString(),
      iqamaNumber: employee.iqamaNumber,
      passportNumber: employee.passportNumber,
      address: employee.address,
      city: employee.city,
      phone: employee.phone,
      email: employee.email,
      designation: designation ? { name: designation.name } : null,
      department: department ? { name: department.name } : null,
      hireDate: employee.hireDate?.toString(),
      contractHoursPerDay: employee.contractHoursPerDay || 8,
      contractDaysPerMonth: employee.contractDaysPerMonth || 30,
      basicSalary: employee.basicSalary || '0',
      foodAllowance: employee.foodAllowance || '0',
      housingAllowance: employee.housingAllowance || '0',
      transportAllowance: employee.transportAllowance || '0',
      companyName: 'Samhan Naser Al-Dosri Est.',
      companyAddress: 'For Gen. Contracting & Rent. Equipments',
    };

    // Generate PDF
    const pdfBlob = await EmployeeContractPDFService.generateContractPDF(contractData);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Save to S3
    if (process.env.S3_ENDPOINT && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      });

      const fileName = `employment-contract-${employee.fileNumber || employeeId}-${Date.now()}.pdf`;
      const path = `employee-${employee.fileNumber || employeeId}`;
      const fullPath = `${path}/${fileName}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: 'employee-documents',
          Key: fullPath,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        })
      );

      const baseUrl = process.env.S3_ENDPOINT?.replace(/\/$/, '');
      const secureUrl = baseUrl?.replace(/^http:\/\//, 'https://') || baseUrl;
      const fileUrl = `${secureUrl}/employee-documents/${fullPath}`;

      // Save document record
      await db.insert(employeeDocuments).values({
        employeeId,
        documentType: 'employment_contract',
        filePath: fileUrl,
        fileName,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        description: 'Employment Contract - Saudi Labor Law',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    // Return PDF as download
    const fileName = `employment-contract-${employee.fileNumber || employeeId}.pdf`;
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.employee.read)(generateContractHandler);

