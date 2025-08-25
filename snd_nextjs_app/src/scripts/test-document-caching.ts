#!/usr/bin/env tsx

import { documentCacheService } from '@/lib/redis/document-cache-service';
import { cacheService } from '@/lib/redis/cache-service';

async function testDocumentCaching() {
  console.log('🧪 Testing Document Caching System...\n');

  try {
    // Test 1: Cache employee documents
    console.log('1. Testing employee document caching...');
    const employeeDocs = [
      { id: 1, name: 'Passport', type: 'passport' },
      { id: 2, name: 'Contract', type: 'contract' }
    ];
    
    await documentCacheService.cacheEmployeeDocuments(123, employeeDocs);
    console.log('✅ Employee documents cached');

    // Test 2: Retrieve from cache
    const cachedEmployeeDocs = await documentCacheService.getEmployeeDocuments(123);
    if (cachedEmployeeDocs) {
      console.log('✅ Employee documents retrieved from cache:', cachedEmployeeDocs.length, 'documents');
    } else {
      console.log('❌ Failed to retrieve employee documents from cache');
    }

    // Test 3: Cache equipment documents
    console.log('\n2. Testing equipment document caching...');
    const equipmentDocs = [
      { id: 1, name: 'Manual', type: 'manual' },
      { id: 2, name: 'Warranty', type: 'warranty' }
    ];
    
    await documentCacheService.cacheEquipmentDocuments(456, equipmentDocs);
    console.log('✅ Equipment documents cached');

    // Test 4: Retrieve from cache
    const cachedEquipmentDocs = await documentCacheService.getEquipmentDocuments(456);
    if (cachedEquipmentDocs) {
      console.log('✅ Equipment documents retrieved from cache:', cachedEquipmentDocs.length, 'documents');
    } else {
      console.log('❌ Failed to retrieve equipment documents from cache');
    }

    // Test 5: Cache general documents list
    console.log('\n3. Testing general documents list caching...');
    const generalDocs = {
      documents: [...employeeDocs, ...equipmentDocs],
      pagination: { page: 1, total: 4 },
      counts: { employee: 2, equipment: 2, total: 4 }
    };
    
    await documentCacheService.cacheDocumentsList('all', 10, generalDocs);
    console.log('✅ General documents list cached');

    // Test 6: Retrieve from cache
    const cachedGeneralDocs = await documentCacheService.getDocumentsList('all', 10);
    if (cachedGeneralDocs) {
      console.log('✅ General documents list retrieved from cache');
    } else {
      console.log('❌ Failed to retrieve general documents list from cache');
    }

    // Test 7: Test cache invalidation
    console.log('\n4. Testing cache invalidation...');
    await documentCacheService.invalidateEmployeeDocuments(123);
    console.log('✅ Employee documents cache invalidated');

    const invalidatedEmployeeDocs = await documentCacheService.getEmployeeDocuments(123);
    if (!invalidatedEmployeeDocs) {
      console.log('✅ Employee documents cache properly invalidated');
    } else {
      console.log('❌ Employee documents cache still exists after invalidation');
    }

    // Test 8: Test tag-based invalidation
    console.log('\n5. Testing tag-based cache invalidation...');
    await documentCacheService.invalidateCachesByType('equipment');
    console.log('✅ Equipment documents cache invalidated by type');

    const invalidatedEquipmentDocs = await documentCacheService.getEquipmentDocuments(456);
    if (!invalidatedEquipmentDocs) {
      console.log('✅ Equipment documents cache properly invalidated by type');
    } else {
      console.log('❌ Equipment documents cache still exists after type invalidation');
    }

    // Test 9: Get cache statistics
    console.log('\n6. Getting cache statistics...');
    const stats = await documentCacheService.getDocumentCacheStats();
    console.log('✅ Cache statistics retrieved:', {
      connected: stats.connected,
      keys: stats.keys,
      memory: stats.memory,
      documentCaches: stats.documentCaches
    });

    // Test 10: Clear all document caches
    console.log('\n7. Testing complete document cache clearing...');
    await documentCacheService.invalidateAllDocumentCaches();
    console.log('✅ All document caches cleared');

    // Verify all caches are cleared
    const finalEmployeeDocs = await documentCacheService.getEmployeeDocuments(123);
    const finalEquipmentDocs = await documentCacheService.getEquipmentDocuments(456);
    const finalGeneralDocs = await documentCacheService.getDocumentsList('all', 10);

    if (!finalEmployeeDocs && !finalEquipmentDocs && !finalGeneralDocs) {
      console.log('✅ All document caches properly cleared');
    } else {
      console.log('❌ Some document caches still exist after clearing');
    }

    console.log('\n🎉 All document caching tests passed!');

  } catch (error) {
    console.error('\n❌ Document caching test failed:', error);
  } finally {
    // Clean up test data
    try {
      await documentCacheService.invalidateAllDocumentCaches();
      console.log('\n🧹 Test data cleaned up');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

// Run the test
if (require.main === module) {
  testDocumentCaching().catch(console.error);
}

export { testDocumentCaching };
