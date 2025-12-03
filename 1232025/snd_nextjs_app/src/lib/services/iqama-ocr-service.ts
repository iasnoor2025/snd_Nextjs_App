import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { COUNTRIES } from '@/lib/data/countries';
import { db } from '@/lib/db';
import { designations } from '@/lib/drizzle/schema';
import { eq, ilike, isNull, sql } from 'drizzle-orm';
import sharp from 'sharp';

/**
 * Service for extracting nationality from Iqama images using OCR
 */
export class IqamaOCRService {
  private static s3Client: S3Client | null = null;

  private static getS3Client(): S3Client {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT!,
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
      });
    }
    return this.s3Client;
  }

  /**
   * Download image from S3/MinIO URL
   */
  private static async downloadImageFromUrl(imageUrl: string): Promise<Buffer> {
    try {
      // If it's a full URL, extract bucket and key
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // MinIO URLs typically: https://endpoint/bucket/key
      const bucket = pathParts[0];
      const key = pathParts.slice(1).join('/');

      const client = this.getS3Client();
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await client.send(command);
      const chunks: Uint8Array[] = [];
      
      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error downloading image from S3:', error);
      throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize image for faster OCR processing
   */
  private static async optimizeImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Resize to max 1200px width/height to speed up OCR significantly
      // Convert to grayscale for better OCR accuracy and speed
      const optimized = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .greyscale() // Grayscale is faster and often more accurate for OCR
        .normalize() // Enhance contrast
        .sharpen() // Sharpen edges for better text recognition
        .jpeg({ quality: 85, mozjpeg: true }) // Convert to JPEG for smaller size
        .toBuffer();
      
      return optimized;
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return imageBuffer;
    }
  }

  /**
   * Extract text from image using OCR with timeout and optimization
   * Uses Tesseract.js for OCR with Arabic and English support
   */
  private static async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      // Optimize image first for faster processing
      const optimizedBuffer = await this.optimizeImageForOCR(imageBuffer);
      
      // Dynamic import for Tesseract.js to avoid SSR issues
      const Tesseract = (await import('tesseract.js')).default;
      
      // Create a promise with timeout
      const ocrPromise = Tesseract.recognize(optimizedBuffer, 'ara+eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        // Optimize OCR settings for speed
        tessedit_pageseg_mode: '6', // Assume uniform block of text (faster)
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789اأإآبتثجحخدذرزسشصضطظعغفقكلمنهويىة', // Limit character set
      });

      // Add timeout (30 seconds max)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OCR timeout after 30 seconds')), 30000);
      });

      const { data: { text } } = await Promise.race([ocrPromise, timeoutPromise]);
      return text;
    } catch (error) {
      console.warn('Tesseract.js OCR failed:', error);
      // Fallback: Return empty string - user can manually input nationality
      return '';
    }
  }

  /**
   * Parse nationality from extracted text
   * Looks for Arabic text "الجنسية" (Nationality) followed by country name
   */
  private static parseNationalityFromText(text: string): string | null {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Normalize text - remove extra whitespace
    const normalizedText = text.replace(/\s+/g, ' ').toLowerCase();

    // Look for Arabic nationality indicator
    const nationalityPatterns = [
      /الجنسية\s*:?\s*([^\n\r]+)/i, // Arabic: الجنسية followed by text
      /nationality\s*:?\s*([^\n\r]+)/i, // English: Nationality
      /الجنسية\s+([^\n\r]+)/i, // Arabic without colon
    ];

    let extractedNationality: string | null = null;

    for (const pattern of nationalityPatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        extractedNationality = match[1].trim();
        break;
      }
    }

    if (!extractedNationality) {
      // Try to find country names directly in the text
      for (const country of COUNTRIES) {
        // Check for country name in English
        if (normalizedText.includes(country.name.toLowerCase())) {
          return country.nationality;
        }
        // Check for Arabic country names (common ones)
        const arabicNames: Record<string, string> = {
          'الهند': 'India',
          'باكستان': 'Pakistan',
          'بنغلاديش': 'Bangladesh',
          'الفلبين': 'Philippines',
          'نيبال': 'Nepal',
          'مصر': 'Egypt',
          'السودان': 'Sudan',
          'الأردن': 'Jordan',
          'اليمن': 'Yemen',
          'سريلانكا': 'Sri Lanka',
          'إندونيسيا': 'Indonesia',
          'إثيوبيا': 'Ethiopia',
          'كينيا': 'Kenya',
          'المغرب': 'Morocco',
          'تونس': 'Tunisia',
          'لبنان': 'Lebanon',
          'سوريا': 'Syria',
          'تركيا': 'Turkey',
          'الصين': 'China',
          'تايلاند': 'Thailand',
          'ميانمار': 'Myanmar',
          'أفغانستان': 'Afghanistan',
        };

        for (const [arabicName, englishName] of Object.entries(arabicNames)) {
          if (normalizedText.includes(arabicName) && englishName === country.name) {
            return country.nationality;
          }
        }
      }
    }

    // Map extracted nationality to system format
    if (extractedNationality) {
      // Try to match against country names
      for (const country of COUNTRIES) {
        if (
          extractedNationality.toLowerCase().includes(country.name.toLowerCase()) ||
          extractedNationality.toLowerCase().includes(country.nationality.toLowerCase())
        ) {
          return country.nationality;
        }
      }

      // Common Arabic to English mappings
      const arabicToNationality: Record<string, string> = {
        'الهند': 'Indian',
        'باكستان': 'Pakistani',
        'بنغلاديش': 'Bangladeshi',
        'الفلبين': 'Filipino',
        'نيبال': 'Nepalese',
        'مصر': 'Egyptian',
        'السودان': 'Sudanese',
        'الأردن': 'Jordanian',
        'اليمن': 'Yemeni',
        'سريلانكا': 'Sri Lankan',
        'إندونيسيا': 'Indonesian',
        'إثيوبيا': 'Ethiopian',
        'كينيا': 'Kenyan',
        'المغرب': 'Moroccan',
        'تونس': 'Tunisian',
        'لبنان': 'Lebanese',
        'سوريا': 'Syrian',
        'تركيا': 'Turkish',
        'الصين': 'Chinese',
        'تايلاند': 'Thai',
        'ميانمار': 'Burmese',
        'أفغانستان': 'Afghan',
      };

      for (const [arabic, nationality] of Object.entries(arabicToNationality)) {
        if (extractedNationality.includes(arabic)) {
          return nationality;
        }
      }
    }

    return null;
  }

  /**
   * Extract nationality from Iqama image
   */
  static async extractNationalityFromIqama(imageUrl: string, mimeType?: string): Promise<{
    nationality: string | null;
    extractedText: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    try {
      // Download image
      const imageBuffer = await this.downloadImageFromUrl(imageUrl);

      // Extract text using OCR
      const extractedText = await this.extractTextFromImage(imageBuffer, mimeType || 'image/jpeg');

      // Parse nationality from text
      const nationality = this.parseNationalityFromText(extractedText);

      // Determine confidence based on extraction success
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (nationality && extractedText.length > 50) {
        confidence = 'high';
      } else if (nationality) {
        confidence = 'medium';
      }

      return {
        nationality,
        extractedText: extractedText.substring(0, 500), // Limit text length
        confidence,
      };
    } catch (error) {
      console.error('Error extracting nationality from Iqama:', error);
      return {
        nationality: null,
        extractedText: '',
        confidence: 'low',
      };
    }
  }

  /**
   * Map country name to nationality format used in system
   */
  static mapCountryToNationality(countryName: string): string | null {
    const normalized = countryName.trim().toLowerCase();
    
    for (const country of COUNTRIES) {
      if (
        normalized === country.name.toLowerCase() ||
        normalized === country.nationality.toLowerCase() ||
        normalized.includes(country.name.toLowerCase())
      ) {
        return country.nationality;
      }
    }

    return null;
  }

  /**
   * Parse designation/profession from extracted text
   * Looks for Arabic text "المهنة" (Profession) followed by profession name
   */
  private static parseDesignationFromText(text: string): string | null {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Normalize text - remove extra whitespace
    const normalizedText = text.replace(/\s+/g, ' ');

    // Look for Arabic profession indicator
    const professionPatterns = [
      /المهنة\s*:?\s*([^\n\r]+)/i, // Arabic: المهنة followed by text
      /profession\s*:?\s*([^\n\r]+)/i, // English: Profession
      /المهنة\s+([^\n\r]+)/i, // Arabic without colon
    ];

    let extractedDesignation: string | null = null;

    for (const pattern of professionPatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        extractedDesignation = match[1].trim();
        // Clean up common suffixes/prefixes
        extractedDesignation = extractedDesignation
          .replace(/^(المهنة|profession)\s*:?\s*/i, '')
          .replace(/\s+$/g, '');
        break;
      }
    }

    // Common Arabic profession mappings to English
    if (extractedDesignation) {
      const arabicToEnglish: Record<string, string> = {
        'عامل عادي': 'General Worker',
        'عامل': 'Worker',
        'سائق': 'Driver',
        'ميكانيكي': 'Mechanic',
        'كهربائي': 'Electrician',
        'نجار': 'Carpenter',
        'حداد': 'Blacksmith',
        'سباك': 'Plumber',
        'رسام': 'Painter',
        'مهندس': 'Engineer',
        'مدير': 'Manager',
        'مشرف': 'Supervisor',
        'مراقب عام': 'General Supervisor',
        'محاسب': 'Accountant',
        'كاتب': 'Clerk',
        'حارس': 'Guard',
        'طباخ': 'Cook',
        'نادل': 'Waiter',
        'منظف': 'Cleaner',
      };

      for (const [arabic, english] of Object.entries(arabicToEnglish)) {
        if (extractedDesignation.includes(arabic)) {
          return english;
        }
      }

      // If no mapping found, return the extracted text as-is (could be Arabic or English)
      return extractedDesignation;
    }

    return null;
  }

  /**
   * Find or create designation by name
   */
  static async findOrCreateDesignation(designationName: string): Promise<number | null> {
    if (!designationName || designationName.trim().length === 0) {
      return null;
    }

    try {
      const trimmedName = designationName.trim();

      // First, try to find existing designation (case insensitive)
      const existingDesignations = await db
        .select({
          id: designations.id,
          name: designations.name,
        })
        .from(designations)
        .where(isNull(designations.deletedAt));

      const matchingDesignation = existingDesignations.find(
        (desig) => desig.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (matchingDesignation) {
        return matchingDesignation.id;
      }

      // If not found, create new designation
      const [newDesignation] = await db
        .insert(designations)
        .values({
          name: trimmedName,
          description: `Auto-created from Iqama extraction: ${trimmedName}`,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning({
          id: designations.id,
        });

      if (newDesignation) {
        console.log(`Created new designation: ${trimmedName} (ID: ${newDesignation.id})`);
        return newDesignation.id;
      }

      return null;
    } catch (error) {
      console.error('Error finding or creating designation:', error);
      return null;
    }
  }

  /**
   * Extract designation from Iqama image
   */
  static async extractDesignationFromIqama(imageUrl: string, mimeType?: string): Promise<{
    designationId: number | null;
    designationName: string | null;
    extractedText: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    try {
      // Download image
      const imageBuffer = await this.downloadImageFromUrl(imageUrl);

      // Extract text using OCR
      const extractedText = await this.extractTextFromImage(imageBuffer, mimeType || 'image/jpeg');

      // Parse designation from text
      const designationName = this.parseDesignationFromText(extractedText);

      if (!designationName) {
        return {
          designationId: null,
          designationName: null,
          extractedText: extractedText.substring(0, 500),
          confidence: 'low',
        };
      }

      // Find or create designation
      const designationId = await this.findOrCreateDesignation(designationName);

      // Determine confidence
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (designationId && extractedText.length > 50) {
        confidence = 'high';
      } else if (designationId) {
        confidence = 'medium';
      }

      return {
        designationId,
        designationName,
        extractedText: extractedText.substring(0, 500),
        confidence,
      };
    } catch (error) {
      console.error('Error extracting designation from Iqama:', error);
      return {
        designationId: null,
        designationName: null,
        extractedText: '',
        confidence: 'low',
      };
    }
  }
}

