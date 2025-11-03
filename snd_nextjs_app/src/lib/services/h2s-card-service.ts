import { db } from '@/lib/drizzle';
import { employeeTraining, employees, trainings, employeeDocuments } from '@/lib/drizzle/schema';
import { eq, and, or, ilike, isNotNull } from 'drizzle-orm';
import { QRCodeService } from './qrcode-service';

export interface H2SCardData {
  id: number;
  employeeName: string;
  iqamaNumber: string | null;
  fileNumber: string | null;
  employeePhoto: string | null;
  courseName: string;
  cardNumber: string;
  completionDate: string;
  expiryDate: string;
  trainerName: string;
  trainerSignature: string | null;
  qrCodeUrl: string | null;
  companyName: string;
  companyLogo: string | null;
}

export class H2SCardService {
  /**
   * Find employee iqama photo from documents
   */
  static async findEmployeeIqamaPhoto(employeeId: number): Promise<string | null> {
    try {
      const iqamaDocs = await db
        .select()
        .from(employeeDocuments)
        .where(
          and(
            eq(employeeDocuments.employeeId, employeeId),
            or(
              eq(employeeDocuments.documentType, 'employee_iqama'),
              ilike(employeeDocuments.documentType, '%iqama%'),
              ilike(employeeDocuments.fileName, '%iqama%')
            )
          )
        )
        .limit(1);

      if (iqamaDocs.length > 0) {
        return iqamaDocs[0].filePath;
      }

      // Also check for employee photo
      const photoDocs = await db
        .select()
        .from(employeeDocuments)
        .where(
          and(
            eq(employeeDocuments.employeeId, employeeId),
            or(
              eq(employeeDocuments.documentType, 'employee_photo'),
              ilike(employeeDocuments.documentType, '%photo%'),
              ilike(employeeDocuments.fileName, '%photo%')
            )
          )
        )
        .limit(1);

      if (photoDocs.length > 0) {
        return photoDocs[0].filePath;
      }

      return null;
    } catch (error) {
      console.error('Error finding employee photo:', error);
      return null;
    }
  }

  /**
   * Get H2S card data for a training record
   */
  static async getCardData(trainingId: number): Promise<H2SCardData | null> {
    const result = await db
      .select({
        training: employeeTraining,
        employee: employees,
        trainingProgram: trainings,
      })
      .from(employeeTraining)
      .innerJoin(employees, eq(employeeTraining.employeeId, employees.id))
      .innerJoin(trainings, eq(employeeTraining.trainingId, trainings.id))
      .where(eq(employeeTraining.id, trainingId))
      .limit(1);

    if (!result.length) {
      return null;
    }

    const { training, employee, trainingProgram } = result[0];
    
    // Find employee photo from documents
    const employeePhoto = await this.findEmployeeIqamaPhoto(employee.id);

    // Generate QR code if not exists
    let qrCodeUrl = training.qrCodeUrl;
    if (!qrCodeUrl) {
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      qrCodeUrl = await QRCodeService.generateAndUploadQRCode(
        training.id,
        baseUrl
      );
      
      // Update training record with QR code URL when available
      if (qrCodeUrl) {
        await db
          .update(employeeTraining)
          .set({ qrCodeUrl, updatedAt: new Date() })
          .where(eq(employeeTraining.id, training.id));
      }
    }

    // Generate card number if not exists: find highest existing and +1, else start from 1
    let cardNumber = training.cardNumber as string | null;
    if (!cardNumber) {
      // Read existing card numbers and compute next
      const existing = await db
        .select({ num: employeeTraining.cardNumber })
        .from(employeeTraining)
        .where(isNotNull(employeeTraining.cardNumber)) as Array<{ num: string | null }>;

      let maxNum = 0;
      for (const row of existing) {
        const val = row.num || '';
        const match = val.match(/(\d+)/g);
        if (match && match.length) {
          const n = parseInt(match[match.length - 1] || '0', 10);
          if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n);
        }
      }
      const next = maxNum + 1;
      cardNumber = `SND-${String(next).padStart(4, '0')}`;
      await db
        .update(employeeTraining)
        .set({ cardNumber, updatedAt: new Date() })
        .where(eq(employeeTraining.id, training.id));
    }

    return {
      id: training.id,
      employeeName: `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim(),
      iqamaNumber: employee.iqamaNumber,
      fileNumber: employee.fileNumber,
      employeePhoto,
      courseName: trainingProgram.name,
      cardNumber: cardNumber!,
      completionDate: training.endDate ? (() => {
        const date = new Date(training.endDate);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      })() : '',
      expiryDate: training.expiryDate ? (() => {
        const date = new Date(training.expiryDate);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      })() : (() => {
        const endDate = training.endDate ? new Date(training.endDate) : new Date();
        const expiryDate = new Date(endDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
        const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
        const day = String(expiryDate.getDate()).padStart(2, '0');
        const year = expiryDate.getFullYear();
        return `${month}/${day}/${year}`;
      })(),
      trainerName: training.trainerName || 'Mohsin Mushtaque',
      trainerSignature: training.trainerSignature,
      qrCodeUrl,
      companyName: 'SAMHAN NASER AL - DOSRI EST.',
      companyLogo: '/snd-logo.png',
    };
  }

  /**
   * Update H2S card data
   */
  static async updateCard(
    trainingId: number,
    data: {
      cardNumber?: string;
      completionDate?: string;
      expiryDate?: string;
      trainerName?: string;
      trainerSignature?: string;
    }
  ) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.cardNumber) updateData.cardNumber = data.cardNumber;
    if (data.completionDate) updateData.endDate = new Date(data.completionDate);
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
    if (data.trainerName) updateData.trainerName = data.trainerName;
    if (data.trainerSignature) updateData.trainerSignature = data.trainerSignature;

    const [updated] = await db
      .update(employeeTraining)
      .set(updateData)
      .where(eq(employeeTraining.id, trainingId))
      .returning();

    return updated;
  }
}

