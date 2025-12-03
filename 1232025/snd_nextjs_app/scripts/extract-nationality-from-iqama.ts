import { config } from 'dotenv';
import { db } from '../src/lib/db';
import { employees, employeeDocuments } from '../src/lib/drizzle/schema';
import { eq, and, or, ilike, sql, inArray } from 'drizzle-orm';
import { IqamaOCRService } from '../src/lib/services/iqama-ocr-service';

// Load environment variables from .env.local
config({ path: '.env.local' });

interface ProcessingResult {
  employeeId: number;
  employeeName: string;
  fileNumber: string | null;
  iqamaNumber: string | null;
  previousNationality: string | null;
  extractedNationality: string | null;
  previousDesignationId: number | null;
  extractedDesignationId: number | null;
  extractedDesignationName: string | null;
  status: 'success' | 'failed' | 'skipped' | 'no_iqama';
  error?: string;
  confidence?: 'high' | 'medium' | 'low';
}

async function extractNationalityFromAllIqamas() {
  try {
    console.log('🚀 Starting bulk nationality extraction from Iqama images...\n');

    // Find all unique employees with Iqama documents
    const iqamaDocs = await db
      .select({
        employeeId: employeeDocuments.employeeId,
      })
      .from(employeeDocuments)
      .where(
        or(
          eq(employeeDocuments.documentType, 'iqama'),
          ilike(employeeDocuments.documentType, '%iqama%'),
          ilike(employeeDocuments.fileName, '%iqama%')
        )
      );

    const uniqueEmployeeIds = [...new Set(iqamaDocs.map(doc => doc.employeeId))];

    if (uniqueEmployeeIds.length === 0) {
      console.log('✅ No employees with Iqama documents found.');
      return;
    }

    // Get employee details
    const employeesWithIqama = await db
      .select({
        employeeId: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
        iqamaNumber: employees.iqamaNumber,
        nationality: employees.nationality,
        designationId: employees.designationId,
      })
      .from(employees)
      .where(inArray(employees.id, uniqueEmployeeIds));

    console.log(`📋 Found ${employeesWithIqama.length} employees with Iqama documents\n`);

    if (employeesWithIqama.length === 0) {
      console.log('✅ No employees with Iqama documents found.');
      return;
    }

    const results: ProcessingResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let noIqamaCount = 0;

    // Process each employee
    for (let i = 0; i < employeesWithIqama.length; i++) {
      const emp = employeesWithIqama[i];
      const employeeName = `${emp.firstName} ${emp.lastName}`;
      
      console.log(`\n[${i + 1}/${employeesWithIqama.length}] Processing: ${employeeName} (ID: ${emp.employeeId})`);

      try {
        // Find Iqama document for this employee
        const iqamaDocs = await db
          .select({
            id: employeeDocuments.id,
            filePath: employeeDocuments.filePath,
            fileName: employeeDocuments.fileName,
            mimeType: employeeDocuments.mimeType,
            documentType: employeeDocuments.documentType,
          })
          .from(employeeDocuments)
          .where(
            and(
              eq(employeeDocuments.employeeId, emp.employeeId),
              or(
                eq(employeeDocuments.documentType, 'iqama'),
                ilike(employeeDocuments.documentType, '%iqama%'),
                ilike(employeeDocuments.fileName, '%iqama%')
              )
            )
          )
          .orderBy(employeeDocuments.createdAt)
          .limit(1);

        if (iqamaDocs.length === 0) {
          console.log(`  ⚠️  No Iqama document found for ${employeeName}`);
          results.push({
            employeeId: emp.employeeId,
            employeeName,
            fileNumber: emp.fileNumber,
            iqamaNumber: emp.iqamaNumber,
            previousNationality: emp.nationality,
            extractedNationality: null,
            previousDesignationId: emp.designationId,
            extractedDesignationId: null,
            extractedDesignationName: null,
            status: 'no_iqama',
          });
          noIqamaCount++;
          continue;
        }

        const iqamaDoc = iqamaDocs[0];

        // Check if it's an image file
        const isImage = iqamaDoc.mimeType?.startsWith('image/') || false;
        if (!isImage) {
          console.log(`  ⚠️  Iqama document is not an image: ${iqamaDoc.fileName}`);
          results.push({
            employeeId: emp.employeeId,
            employeeName,
            fileNumber: emp.fileNumber,
            iqamaNumber: emp.iqamaNumber,
            previousNationality: emp.nationality,
            extractedNationality: null,
            previousDesignationId: emp.designationId,
            extractedDesignationId: null,
            extractedDesignationName: null,
            status: 'skipped',
            error: 'Document is not an image',
          });
          skippedCount++;
          continue;
        }

        // Check what needs to be extracted
        const needsNationality = !emp.nationality || emp.nationality.trim() === '';
        const needsDesignation = !emp.designationId;

        if (!needsNationality && !needsDesignation) {
          console.log(`  ⏭️  Nationality and designation already set - Skipping`);
          results.push({
            employeeId: emp.employeeId,
            employeeName,
            fileNumber: emp.fileNumber,
            iqamaNumber: emp.iqamaNumber,
            previousNationality: emp.nationality,
            extractedNationality: emp.nationality,
            previousDesignationId: emp.designationId,
            extractedDesignationId: emp.designationId,
            extractedDesignationName: null,
            status: 'skipped',
          });
          skippedCount++;
          continue;
        }

        // Extract data from Iqama image
        console.log(`  🔍 Extracting data from Iqama image...`);
        const startTime = Date.now();
        
        const updateData: any = {};
        let extractedNationality: string | null = null;
        let extractedDesignationId: number | null = null;
        let extractedDesignationName: string | null = null;
        let extractionSuccess = false;

        // Extract nationality if needed
        if (needsNationality) {
          const nationalityResult = await IqamaOCRService.extractNationalityFromIqama(
            iqamaDoc.filePath,
            iqamaDoc.mimeType || undefined
          );
          if (nationalityResult.nationality) {
            extractedNationality = nationalityResult.nationality;
            updateData.nationality = nationalityResult.nationality;
            console.log(`  ✅ Nationality: ${nationalityResult.nationality}`);
            extractionSuccess = true;
          } else {
            console.log(`  ⚠️  Could not extract nationality`);
          }
        }

        // Extract designation if needed
        if (needsDesignation) {
          const designationResult = await IqamaOCRService.extractDesignationFromIqama(
            iqamaDoc.filePath,
            iqamaDoc.mimeType || undefined
          );
          if (designationResult.designationId) {
            extractedDesignationId = designationResult.designationId;
            extractedDesignationName = designationResult.designationName;
            updateData.designationId = designationResult.designationId;
            console.log(`  ✅ Designation: ${designationResult.designationName}`);
            extractionSuccess = true;
          } else {
            console.log(`  ⚠️  Could not extract designation`);
          }
        }

        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!extractionSuccess) {
          console.log(`  ❌ Failed to extract data (${processingTime}s)`);
          results.push({
            employeeId: emp.employeeId,
            employeeName,
            fileNumber: emp.fileNumber,
            iqamaNumber: emp.iqamaNumber,
            previousNationality: emp.nationality,
            extractedNationality: null,
            previousDesignationId: emp.designationId,
            extractedDesignationId: null,
            extractedDesignationName: null,
            status: 'failed',
            error: 'Could not extract nationality or designation from image',
          });
          failedCount++;
          continue;
        }

        // Update employee with extracted data
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date().toISOString();
          await db
            .update(employees)
            .set(updateData)
            .where(eq(employees.id, emp.employeeId));
        }

        console.log(`  ✅ Extraction complete (${processingTime}s)`);

        results.push({
          employeeId: emp.employeeId,
          employeeName,
          fileNumber: emp.fileNumber,
          iqamaNumber: emp.iqamaNumber,
          previousNationality: emp.nationality,
          extractedNationality: extractedNationality || emp.nationality,
          previousDesignationId: emp.designationId,
          extractedDesignationId: extractedDesignationId || emp.designationId,
          extractedDesignationName,
          status: 'success',
        });
        successCount++;

        // Add small delay to avoid overwhelming the system
        if (i < employeesWithIqama.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${employeeName}:`, error);
        results.push({
          employeeId: emp.employeeId,
          employeeName,
          fileNumber: emp.fileNumber,
          iqamaNumber: emp.iqamaNumber,
          previousNationality: emp.nationality,
          extractedNationality: null,
          previousDesignationId: emp.designationId,
          extractedDesignationId: null,
          extractedDesignationName: null,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failedCount++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 PROCESSING SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total employees processed: ${employeesWithIqama.length}`);
    console.log(`✅ Successfully extracted: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`⏭️  Skipped (already has nationality): ${skippedCount}`);
    console.log(`⚠️  No Iqama document: ${noIqamaCount}`);
    console.log('='.repeat(80));

    // Show failed cases
    if (failedCount > 0) {
      console.log('\n❌ FAILED EXTRACTIONS:');
      results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`  - ${r.employeeName} (ID: ${r.employeeId}): ${r.error || 'Unknown error'}`);
        });
    }

    // Show successful extractions
    if (successCount > 0) {
      console.log('\n✅ SUCCESSFUL EXTRACTIONS:');
      results
        .filter(r => r.status === 'success')
        .slice(0, 10) // Show first 10
        .forEach(r => {
          console.log(`  - ${r.employeeName}: ${r.previousNationality || 'None'} → ${r.extractedNationality} (${r.confidence})`);
        });
      if (successCount > 10) {
        console.log(`  ... and ${successCount - 10} more`);
      }
    }

    console.log('\n✨ Processing complete!');

  } catch (error) {
    console.error('❌ Fatal error during processing:', error);
    process.exit(1);
  }
}

// Run the script
extractNationalityFromAllIqamas()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

