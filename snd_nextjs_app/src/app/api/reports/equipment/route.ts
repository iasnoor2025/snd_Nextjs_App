
import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  equipment,
  equipmentCategories,
  locations,
  employees
} from '@/lib/drizzle/schema';
import { eq, sql, count, and, asc, or } from 'drizzle-orm';
import { getEquipmentReportAssignmentFields } from '@/lib/services/equipment-report-assignment-data';

/** Sort rows: equipment name, then company (assignment), then operator/employee */
function compareEquipmentReportRows(a: {
  name?: string | null;
  assignmentSummary?: string | null;
  operatorDisplay?: string | null;
}, b: {
  name?: string | null;
  assignmentSummary?: string | null;
  operatorDisplay?: string | null;
}): number {
  const opts = { numeric: true, sensitivity: 'base' as const };
  const byName = String(a.name ?? '').trim().localeCompare(String(b.name ?? '').trim(), undefined, opts);
  if (byName !== 0) return byName;
  const byCompany = String(a.assignmentSummary ?? '').trim().localeCompare(String(b.assignmentSummary ?? '').trim(), undefined, opts);
  if (byCompany !== 0) return byCompany;
  return String(a.operatorDisplay ?? '').trim().localeCompare(String(b.operatorDisplay ?? '').trim(), undefined, opts);
}

/** DB status from EquipmentStatusService: assigned = rental or project; under_maintenance = open maintenance */
function equipmentStatusFilter(status: string) {
  if (status === 'rented') {
    return or(eq(equipment.status, 'rented'), eq(equipment.status, 'assigned'));
  }
  if (status === 'maintenance') {
    return or(eq(equipment.status, 'maintenance'), eq(equipment.status, 'under_maintenance'));
  }
  return eq(equipment.status, status);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build equipment query with category information
    let equipmentQuery: any = db
      .select({
        id: equipment.id,
        name: equipment.name,
        description: equipment.description,
        categoryId: equipment.categoryId,
        categoryName: equipmentCategories.name,
        categoryDescription: equipmentCategories.description,
        categoryIcon: equipmentCategories.icon,
        categoryColor: equipmentCategories.color,
        manufacturer: equipment.manufacturer,
        modelNumber: equipment.modelNumber,
        serialNumber: equipment.serialNumber,
        chassisNumber: equipment.chassisNumber,
        doorNumber: equipment.doorNumber,
        purchaseDate: equipment.purchaseDate,
        purchasePrice: equipment.purchasePrice,
        purchaseCost: equipment.purchaseCost,
        warrantyExpiryDate: equipment.warrantyExpiryDate,
        status: equipment.status,
        locationId: equipment.locationId,
        locationName: locations.name,
        assignedTo: equipment.assignedTo,
        assignedEmployeeName: sql<string>`CONCAT_WS(' ', ${employees.firstName}, ${employees.middleName}, ${employees.lastName})`,
        lastMaintenanceDate: equipment.lastMaintenanceDate,
        nextMaintenanceDate: equipment.nextMaintenanceDate,
        notes: equipment.notes,
        unit: equipment.unit,
        defaultUnitCost: equipment.defaultUnitCost,
        dailyRate: equipment.dailyRate,
        weeklyRate: equipment.weeklyRate,
        monthlyRate: equipment.monthlyRate,
        currentOperatingHours: equipment.currentOperatingHours,
        currentMileage: equipment.currentMileage,
        currentCycleCount: equipment.currentCycleCount,
        assetCondition: equipment.assetCondition,
        depreciatedValue: equipment.depreciatedValue,
        isActive: equipment.isActive,
        istimara: equipment.istimara,
        istimaraExpiryDate: equipment.istimaraExpiryDate,
        createdAt: equipment.createdAt,
        updatedAt: equipment.updatedAt
      })
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(locations, eq(equipment.locationId, locations.id))
      .leftJoin(employees, eq(equipment.assignedTo, employees.id));

    // Apply filters
    const conditions = [];

    if (categoryId) {
      conditions.push(eq(equipment.categoryId, parseInt(categoryId)));
    }

    if (status && status !== 'all') {
      conditions.push(equipmentStatusFilter(status));
    }

    if (locationId) {
      conditions.push(eq(equipment.locationId, parseInt(locationId)));
    }

    if (!includeInactive) {
      conditions.push(eq(equipment.isActive, true));
    }

    if (conditions.length > 0) {
      equipmentQuery = equipmentQuery.where(and(...conditions));
    }

    // Order by category name, then equipment name
    equipmentQuery = equipmentQuery.orderBy(
      asc(equipmentCategories.name),
      asc(equipment.name)
    );

    const equipmentRows = await equipmentQuery;

    const uniqueIds = [...new Set(equipmentRows.map((r: { id: number }) => r.id))];
    const assignmentById = await getEquipmentReportAssignmentFields(uniqueIds);

    const equipmentData = equipmentRows.map((row: (typeof equipmentRows)[number]) => {
      const af = assignmentById[row.id];
      const opFromAssignment = af?.operatorDisplay?.trim();
      const operatorDisplay =
        opFromAssignment && opFromAssignment !== '—'
          ? opFromAssignment
          : (row.assignedEmployeeName && String(row.assignedEmployeeName).trim()) || '—';
      return {
        ...row,
        assignmentSummary: af?.assignmentSummary ?? '—',
        operatorDisplay,
      };
    });

    // Apply same filters to category stats
    let categoryStatsQuery: any = db
      .select({
        categoryId: equipmentCategories.id,
        categoryName: equipmentCategories.name,
        categoryDescription: equipmentCategories.description,
        categoryIcon: equipmentCategories.icon,
        categoryColor: equipmentCategories.color,
        totalEquipment: count(equipment.id),
        activeEquipment: count(sql`CASE WHEN ${equipment.isActive} = true THEN 1 END`),
        availableEquipment: count(sql`CASE WHEN ${equipment.status} = 'available' THEN 1 END`),
        rentedEquipment: count(
          sql`CASE WHEN ${equipment.status} IN ('rented', 'assigned') THEN 1 END`
        ),
        maintenanceEquipment: count(
          sql`CASE WHEN ${equipment.status} IN ('maintenance', 'under_maintenance') THEN 1 END`
        ),
        totalValue: sql<number>`COALESCE(SUM(${equipment.purchasePrice}), 0)`,
        totalDepreciatedValue: sql<number>`COALESCE(SUM(${equipment.depreciatedValue}), 0)`,
        avgDailyRate: sql<number>`COALESCE(AVG(${equipment.dailyRate}), 0)`,
        avgWeeklyRate: sql<number>`COALESCE(AVG(${equipment.weeklyRate}), 0)`,
        avgMonthlyRate: sql<number>`COALESCE(AVG(${equipment.monthlyRate}), 0)`
      })
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .groupBy(
        equipmentCategories.id,
        equipmentCategories.name,
        equipmentCategories.description,
        equipmentCategories.icon,
        equipmentCategories.color
      )
      .orderBy(asc(equipmentCategories.name));

    const categoryStatsConditions = [];

    if (categoryId) {
      categoryStatsConditions.push(eq(equipment.categoryId, parseInt(categoryId)));
    }

    if (status && status !== 'all') {
      categoryStatsConditions.push(equipmentStatusFilter(status));
    }

    if (locationId) {
      categoryStatsConditions.push(eq(equipment.locationId, parseInt(locationId)));
    }

    if (!includeInactive) {
      categoryStatsConditions.push(eq(equipment.isActive, true));
    }

    if (categoryStatsConditions.length > 0) {
      categoryStatsQuery = categoryStatsQuery.where(and(...categoryStatsConditions));
    }

    const categoryStatsData = await categoryStatsQuery;

    // Apply same filters to overall stats
    let overallStatsQuery: any = db
      .select({
        totalEquipment: count(equipment.id),
        activeEquipment: count(sql`CASE WHEN ${equipment.isActive} = true THEN 1 END`),
        availableEquipment: count(sql`CASE WHEN ${equipment.status} = 'available' THEN 1 END`),
        rentedEquipment: count(
          sql`CASE WHEN ${equipment.status} IN ('rented', 'assigned') THEN 1 END`
        ),
        maintenanceEquipment: count(
          sql`CASE WHEN ${equipment.status} IN ('maintenance', 'under_maintenance') THEN 1 END`
        ),
        totalValue: sql<number>`COALESCE(SUM(${equipment.purchasePrice}), 0)`,
        totalDepreciatedValue: sql<number>`COALESCE(SUM(${equipment.depreciatedValue}), 0)`,
        avgDailyRate: sql<number>`COALESCE(AVG(${equipment.dailyRate}), 0)`,
        avgWeeklyRate: sql<number>`COALESCE(AVG(${equipment.weeklyRate}), 0)`,
        avgMonthlyRate: sql<number>`COALESCE(AVG(${equipment.monthlyRate}), 0)`
      })
      .from(equipment);

    const overallStatsConditions = [];

    if (categoryId) {
      overallStatsConditions.push(eq(equipment.categoryId, parseInt(categoryId)));
    }

    if (status && status !== 'all') {
      overallStatsConditions.push(equipmentStatusFilter(status));
    }

    if (locationId) {
      overallStatsConditions.push(eq(equipment.locationId, parseInt(locationId)));
    }

    if (!includeInactive) {
      overallStatsConditions.push(eq(equipment.isActive, true));
    }

    if (overallStatsConditions.length > 0) {
      overallStatsQuery = overallStatsQuery.where(and(...overallStatsConditions));
    }

    const overallStatsData = await overallStatsQuery;

    // Group equipment by category for better organization
    const equipmentByCategory = equipmentData.reduce((acc: any, item: any) => {
      const categoryKey = item.categoryId || 'uncategorized';
      const categoryName = item.categoryName || 'Uncategorized';

      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          categoryId: item.categoryId,
          categoryName: categoryName,
          categoryDescription: item.categoryDescription,
          categoryIcon: item.categoryIcon,
          categoryColor: item.categoryColor,
          equipment: []
        };
      }

      acc[categoryKey].equipment.push(item);
      return acc;
    }, {});

    for (const key of Object.keys(equipmentByCategory)) {
      equipmentByCategory[key].equipment.sort(compareEquipmentReportRows);
    }

    const equipmentListSorted = [...equipmentData].sort(compareEquipmentReportRows);

    const reportData = {
      summary_stats: overallStatsData[0] || {
        totalEquipment: 0,
        activeEquipment: 0,
        availableEquipment: 0,
        rentedEquipment: 0,
        maintenanceEquipment: 0,
        totalValue: 0,
        totalDepreciatedValue: 0,
        avgDailyRate: 0,
        avgWeeklyRate: 0,
        avgMonthlyRate: 0
      },
      category_stats: categoryStatsData,
      equipment_by_category: equipmentByCategory,
      equipment_list: equipmentListSorted,
      generated_at: new Date().toISOString(),
      parameters: {
        categoryId,
        status,
        locationId,
        includeInactive
      }
    };

    return NextResponse.json({
      success: true,
      data: reportData,
      generated_at: new Date().toISOString(),
      report_type: 'equipment_by_category',
      parameters: { categoryId, status, locationId, includeInactive }
    });

  } catch (error) {
    console.error('Error generating equipment report:', error);
    return NextResponse.json({
      error: 'Failed to generate equipment report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
