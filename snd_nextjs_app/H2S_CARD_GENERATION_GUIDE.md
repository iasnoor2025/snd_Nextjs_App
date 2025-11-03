# H2S Card Generation Guide

## Overview
The H2S certification card system automatically generates professional ID cards with QR codes for employees who have completed H2S training. The cards include front and back pages with all required information.

## How to Generate H2S Cards

### Method 1: Via API Endpoint (Direct)
Call the API endpoint directly:

```bash
POST /api/employee/[employeeId]/training/[trainingId]/h2s-card-pdf
```

**Example:**
```javascript
// Using fetch
const response = await fetch(
  `/api/employee/123/training/456/h2s-card-pdf`,
  {
    method: 'POST',
    credentials: 'include',
  }
);

const data = await response.json();
if (response.ok) {
  console.log('H2S card generated successfully!');
  console.log('Document:', data.document);
}
```

**cURL Example:**
```bash
curl -X POST \
  http://localhost:3000/api/employee/123/training/456/h2s-card-pdf \
  -H "Cookie: your-session-cookie"
```

### Method 2: Using the Generate Button Component
Add the button component to your training list or employee detail page:

```tsx
import { GenerateH2SCardButton } from '@/components/h2s-card/GenerateH2SCardButton';

// In your component
<GenerateH2SCardButton
  employeeId={employee.id}
  trainingId={training.id}
  trainingName={training.name}
/>
```

### Method 3: From Documents Tab
The H2S card will automatically appear in the employee's Documents tab after generation. If an H2S card already exists, it will be replaced with the new one.

## What Happens When You Generate

1. **Finds Employee Photo**: Automatically searches for employee iqama photo or employee photo from documents
2. **Generates QR Code**: Creates a QR code that links to `/h2s-card/[trainingId]` for public viewing
3. **Creates Card Number**: Auto-generates card number like "SND-0408" if not already set
4. **Generates PDF**: Creates a 2-page PDF (front and back) sized for ID card printers (85.6mm × 53.98mm)
5. **Uploads to Storage**: Saves PDF to MinIO storage
6. **Saves to Database**: Creates document record with type 'h2s_card' in employee documents
7. **Replaces Existing**: If employee already has an H2S card, it's automatically replaced

## Card Information Included

### Front Page:
- Company logo and name
- Card number
- Employee name and Iqama number
- Employee photo (from documents)
- Course name and completion date
- Expiry date (2 years from completion)
- QR code
- Trainer information and signature
- IADC certification logos

### Back Page:
- H2S certification statement
- Exposure levels chart:
  - LOW (0-10 PPM) - Green
  - MODERATE (10-50 PPM) - Yellow
  - HIGH (50-200 PPM) - Red
- Safety assistance contact numbers

## Prerequisites

1. **Database Migration**: Run the migration to add H2S card fields:
   ```bash
   npm run drizzle:push
   ```

2. **Environment Variables**: Ensure these are set:
   - `APP_URL` - Base URL of your application (for QR code links)
   - `S3_ENDPOINT` - MinIO endpoint
   - `AWS_ACCESS_KEY_ID` - MinIO access key
   - `AWS_SECRET_ACCESS_KEY` - MinIO secret key

3. **Employee Training Record**: The employee must have a completed training record with:
   - `endDate` set (completion date)
   - Training program exists in the system

4. **Employee Photo** (Optional but recommended):
   - Upload employee iqama photo or employee photo in Documents tab
   - System will automatically find and use it

## Viewing Generated Cards

### In System:
- Go to Employee → Documents tab
- Look for document with type "H2S Card"
- Download or view the PDF

### Via QR Code:
- Scan the QR code on the printed card
- Opens public page: `/h2s-card/[trainingId]`
- Shows full card details (front and back)

## Printing Cards

The PDF is sized for standard ID card printers (85.6mm × 53.98mm). You can:

1. **Print from Documents Tab**: Download and print the PDF
2. **Use Print Component**: Import `H2SCardPrint` component for direct printing:
   ```tsx
   import { H2SCardPrint } from '@/components/h2s-card/H2SCardPrint';
   
   <H2SCardPrint cardData={cardData} />
   ```

## Troubleshooting

### Card not generating?
- Check employee has completed training (endDate is set)
- Verify employee photo exists in documents
- Check API response for error messages
- Ensure MinIO is configured correctly

### QR code not working?
- Verify `APP_URL` environment variable is set correctly
- Check the generated QR code URL in the public page
- Ensure the route `/h2s-card/[id]` is accessible

### Photo not appearing?
- Upload employee iqama photo or employee photo to Documents tab
- System searches for: `employee_iqama`, `employee_photo`, or files with "iqama" or "photo" in name/type
- Check file URLs are accessible

## API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "H2S card PDF generated and saved successfully",
  "document": {
    "id": 123,
    "employeeId": 456,
    "documentType": "h2s_card",
    "filePath": "https://minio.example.com/employee-documents/...",
    "fileName": "h2s-card-123-2024-01-01.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf"
  }
}
```

**Error Response:**
```json
{
  "error": "Training record not found"
}
```

