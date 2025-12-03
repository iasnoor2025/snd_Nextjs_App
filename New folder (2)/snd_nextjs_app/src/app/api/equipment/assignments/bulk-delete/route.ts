import { db } from '@/lib/drizzle';
import { equipmentRentalHistory } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheService, CACHE_TAGS } from '@/lib/redis';

// POST /api/equipment/assignments/bulk-delete - Delete multiple equipment assignments
export const POST = withPermission(PermissionConfigs.equipment.delete)(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { ids } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: 'Please provide an array of assignment IDs to delete' },
          { status: 400 }
        );
      }

      // Validate that all IDs are numbers
      const validIds = ids.filter((id: any) => !isNaN(Number(id))).map((id: any) => Number(id));

      if (validIds.length !== ids.length) {
        return NextResponse.json(
          { error: 'Some assignment IDs are invalid' },
          { status: 400 }
        );
      }

      // Check if assignments exist
      const existingAssignments = await db
        .select()
        .from(equipmentRentalHistory)
        .where(inArray(equipmentRentalHistory.id, validIds));

      if (existingAssignments.length !== validIds.length) {
        return NextResponse.json(
          { error: 'Some assignments not found' },
          { status: 404 }
        );
      }

      // Delete the assignments
      const deletedAssignments = await db
        .delete(equipmentRentalHistory)
        .where(inArray(equipmentRentalHistory.id, validIds))
        .returning();

      // Invalidate equipment cache
      await cacheService.invalidateCacheByTag(CACHE_TAGS.EQUIPMENT);

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${deletedAssignments.length} equipment assignments`,
        deleted: deletedAssignments.length,
        data: deletedAssignments,
      });
    } catch (error) {
      console.error('Error deleting equipment assignments:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete equipment assignments',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
