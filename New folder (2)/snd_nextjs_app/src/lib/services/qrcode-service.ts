import QRCode from 'qrcode';
import { uploadToMinIO } from '@/lib/utils/file-upload';

export class QRCodeService {
  /**
   * Generate QR code for H2S card
   * @param cardUrl - Public URL that will show the card details
   * @returns QR code image as Buffer
   */
  static async generateQRCode(cardUrl: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(cardUrl, {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 300,
        margin: 1,
      });
      return qrCodeBuffer;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate and upload QR code to MinIO
   * @param cardId - Employee training ID
   * @param baseUrl - Base URL of the application (from APP_URL env)
   * @returns URL of uploaded QR code
   */
  static async generateAndUploadQRCode(
    cardId: number,
    baseUrl: string
  ): Promise<string | null> {
    const cardUrl = `${baseUrl}/h2s-card/${cardId}`;
    const qrCodeBuffer = await this.generateQRCode(cardUrl);
    
    const fileName = `h2s-cards/qr-codes/${cardId}-${Date.now()}.png`;
    const bucket = process.env.S3_BUCKET_QR || process.env.S3_BUCKET_DOCUMENTS || 'employee-documents';
    try {
      const uploadResult = await uploadToMinIO(
        qrCodeBuffer,
        fileName,
        'image/png',
        bucket
      );
      if (!uploadResult.success) {
        console.error('QR upload failed:', uploadResult.error);
        return null;
      }
      return uploadResult.url ?? null;
    } catch (e) {
      console.error('QR upload exception:', e);
      return null;
    }
  }
}

