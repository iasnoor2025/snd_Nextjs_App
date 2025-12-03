import { cacheService } from './cache-service';

export interface DocumentCacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class DocumentCacheService {
  private defaultTTL = 300; // 5 minutes default
  private defaultTags = ['documents'];

  /**
   * Cache employee documents
   */
  async cacheEmployeeDocuments(employeeId: number, documents: any[], options: DocumentCacheOptions = {}) {
    const cacheKey = `employee:${employeeId}:documents`;
    const tags = [...this.defaultTags, 'employee', `employee:${employeeId}`];
    
    await cacheService.set(cacheKey, documents, {
      ttl: options.ttl || this.defaultTTL,
      prefix: 'documents',
      tags: options.tags || tags
    });
  }

  /**
   * Cache equipment documents
   */
  async cacheEquipmentDocuments(equipmentId: number, documents: any[], options: DocumentCacheOptions = {}) {
    const cacheKey = `equipment:${equipmentId}:documents`;
    const tags = [...this.defaultTags, 'equipment', `equipment:${equipmentId}`];
    
    await cacheService.set(cacheKey, documents, {
      ttl: options.ttl || this.defaultTTL,
      prefix: 'documents',
      tags: options.tags || tags
    });
  }

  /**
   * Cache general documents list
   */
  async cacheDocumentsList(type: string, limit: number, documents: any[], options: DocumentCacheOptions = {}) {
    const cacheKey = `documents:${type}:${limit}`;
    const tags = [...this.defaultTags, type];
    
    await cacheService.set(cacheKey, documents, {
      ttl: options.ttl || this.defaultTTL,
      prefix: 'documents',
      tags: options.tags || tags
    });
  }

  /**
   * Get cached employee documents
   */
  async getEmployeeDocuments(employeeId: number): Promise<any[] | null> {
    const cacheKey = `employee:${employeeId}:documents`;
    return await cacheService.get(cacheKey, 'documents');
  }

  /**
   * Get cached equipment documents
   */
  async getEquipmentDocuments(equipmentId: number): Promise<any[] | null> {
    const cacheKey = `equipment:${equipmentId}:documents`;
    return await cacheService.get(cacheKey, 'documents');
  }

  /**
   * Get cached documents list
   */
  async getDocumentsList(type: string, limit: number): Promise<any | null> {
    const cacheKey = `documents:${type}:${limit}`;
    return await cacheService.get(cacheKey, 'documents');
  }

  /**
   * Invalidate employee documents cache
   */
  async invalidateEmployeeDocuments(employeeId: number) {
    const cacheKey = `employee:${employeeId}:documents`;
    await cacheService.delete(cacheKey, 'documents');
    
    // Also invalidate general document caches
    await cacheService.clearByTags(['documents', 'employee']);
  }

  /**
   * Invalidate equipment documents cache
   */
  async invalidateEquipmentDocuments(equipmentId: number) {
    const cacheKey = `equipment:${equipmentId}:documents`;
    await cacheService.delete(cacheKey, 'documents');
    
    // Also invalidate general document caches
    await cacheService.clearByTags(['documents', 'equipment']);
  }

  /**
   * Invalidate all document caches
   */
  async invalidateAllDocumentCaches() {
    await cacheService.clearByTags(['documents']);
  }

  /**
   * Invalidate caches by document type
   */
  async invalidateCachesByType(type: 'employee' | 'equipment') {
    await cacheService.clearByTags(['documents', type]);
  }

  /**
   * Get cache statistics for documents
   */
  async getDocumentCacheStats() {
    const stats = await cacheService.getStats();
    return {
      ...stats,
      documentCaches: {
        employee: await this.getEmployeeCacheCount(),
        equipment: await this.getEquipmentCacheCount(),
        general: await this.getGeneralCacheCount()
      }
    };
  }

  /**
   * Get count of cached employee document sets
   */
  private async getEmployeeCacheCount(): Promise<number> {
    try {
      const client = cacheService['redisService'].getClient();
      const keys = await client.keys('app:documents:employee:*:documents');
      return keys.length;
    } catch (error) {
      console.error('Error getting employee cache count:', error);
      return 0;
    }
  }

  /**
   * Get count of cached equipment document sets
   */
  private async getEquipmentCacheCount(): Promise<number> {
    try {
      const client = cacheService['redisService'].getClient();
      const keys = await client.keys('app:documents:equipment:*:documents');
      return keys.length;
    } catch (error) {
      console.error('Error getting equipment cache count:', error);
      return 0;
    }
  }

  /**
   * Get count of cached general document lists
   */
  private async getGeneralCacheCount(): Promise<number> {
    try {
      const client = cacheService['redisService'].getClient();
      const keys = await client.keys('app:documents:documents:*');
      return keys.length;
    } catch (error) {
      console.error('Error getting general cache count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const documentCacheService = new DocumentCacheService();
export default documentCacheService;
