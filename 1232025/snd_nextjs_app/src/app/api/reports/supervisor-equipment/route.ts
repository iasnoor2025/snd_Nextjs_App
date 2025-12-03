import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { 
  employees, 
  equipment, 
  rentals, 
  rentalItems,
  customers,
} from '@/lib/drizzle/schema';
import { eq, sql, count, and, isNotNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

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
    const status = searchParams.get('status') || 'active'; // Default to active items
    const supervisorId = searchParams.get('supervisorId'); // Optional filter by specific supervisor

    // Create alias for operator employee
    const operatorEmp = alias(employees, 'operator_emp');

    // Build base conditions
    const baseConditions = [isNotNull(rentalItems.supervisorId)];

    // Apply status filter
    if (status === 'active') {
      baseConditions.push(
        eq(rentalItems.status, 'active'),
        sql`${rentalItems.completedDate} IS NULL`
      );
    } else if (status === 'completed') {
      baseConditions.push(eq(rentalItems.status, 'completed'));
    }
    // If status is 'all', no additional status filter

    // Apply supervisor filter if provided
    if (supervisorId) {
      baseConditions.push(eq(rentalItems.supervisorId, parseInt(supervisorId)));
    }

    // Build query to get rental items with supervisor and equipment information
    const supervisorEquipmentQuery = db
      .select({
        supervisor_id: rentalItems.supervisorId,
        supervisor_first_name: employees.firstName,
        supervisor_last_name: employees.lastName,
        supervisor_file_number: employees.fileNumber,
        equipment_id: rentalItems.equipmentId,
        equipment_name: rentalItems.equipmentName,
        equipment_istimara: equipment.istimara,
        rental_id: rentalItems.rentalId,
        rental_number: rentals.rentalNumber,
        rental_status: rentals.status,
        customer_id: rentals.customerId,
        customer_name: customers.name,
        operator_id: rentalItems.operatorId,
        operator_first_name: operatorEmp.firstName,
        operator_last_name: operatorEmp.lastName,
        operator_file_number: operatorEmp.fileNumber,
        item_status: rentalItems.status,
        item_start_date: rentalItems.startDate,
        item_completed_date: rentalItems.completedDate,
      })
      .from(rentalItems)
      .leftJoin(rentals, eq(rentalItems.rentalId, rentals.id))
      .leftJoin(equipment, eq(rentalItems.equipmentId, equipment.id))
      .leftJoin(employees, eq(rentalItems.supervisorId, employees.id))
      .leftJoin(operatorEmp, eq(rentalItems.operatorId, operatorEmp.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(and(...baseConditions));

    const supervisorEquipmentData = await supervisorEquipmentQuery;

    // Group by supervisor
    const supervisorGroups = supervisorEquipmentData.reduce((acc: any, item: any) => {
      const supervisorId = item.supervisor_id;
      
      if (!supervisorId) return acc;

      if (!acc[supervisorId]) {
        acc[supervisorId] = {
          supervisor_id: supervisorId,
          supervisor_name: item.supervisor_first_name && item.supervisor_last_name
            ? `${item.supervisor_first_name} ${item.supervisor_last_name}`
            : `Employee ${supervisorId}`,
          supervisor_file_number: item.supervisor_file_number || null,
          equipment_count: 0,
          equipment: [],
          unique_equipment: new Set(),
        };
      }

      // Add equipment if it exists and is unique
      if (item.equipment_id) {
        const equipmentKey = `${item.equipment_id}-${item.rental_id}`;
        if (!acc[supervisorId].unique_equipment.has(equipmentKey)) {
          acc[supervisorId].unique_equipment.add(equipmentKey);
          acc[supervisorId].equipment.push({
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name || 'Unknown Equipment',
            equipment_istimara: item.equipment_istimara || null,
            rental_id: item.rental_id,
            rental_number: item.rental_number || 'N/A',
            rental_status: item.rental_status || 'N/A',
            customer_id: item.customer_id,
            customer_name: item.customer_name || 'N/A',
            operator_id: item.operator_id,
            operator_name: item.operator_first_name && item.operator_last_name
              ? `${item.operator_first_name} ${item.operator_last_name}`
              : item.operator_id ? `Employee ${item.operator_id}` : null,
            operator_file_number: item.operator_file_number || null,
            item_status: item.item_status,
            item_start_date: item.item_start_date,
            item_completed_date: item.item_completed_date,
          });
          acc[supervisorId].equipment_count++;
        }
      }

      return acc;
    }, {});

    // Convert to array and calculate unique equipment count per supervisor
    const supervisorGroupsArray = Object.values(supervisorGroups).map((group: any) => {
      // Count unique equipment (by equipment_id, not by rental item)
      const uniqueEquipmentIds = new Set(
        group.equipment.map((eq: any) => eq.equipment_id).filter((id: any) => id)
      );
      
      return {
        supervisor_id: group.supervisor_id,
        supervisor_name: group.supervisor_name,
        supervisor_file_number: group.supervisor_file_number,
        equipment_count: uniqueEquipmentIds.size,
        total_items: group.equipment.length,
        equipment: group.equipment.map((eq: any) => ({
          ...eq,
          display_name: eq.equipment_istimara 
            ? `${eq.equipment_name} (${eq.equipment_istimara})`
            : eq.equipment_name,
        })),
      };
    });

    // Sort by supervisor name
    supervisorGroupsArray.sort((a: any, b: any) => 
      a.supervisor_name.localeCompare(b.supervisor_name)
    );

    // Calculate summary statistics
    const summaryStats = {
      total_supervisors: supervisorGroupsArray.length,
      total_equipment: supervisorGroupsArray.reduce((sum: number, group: any) => 
        sum + group.equipment_count, 0
      ),
      total_items: supervisorGroupsArray.reduce((sum: number, group: any) => 
        sum + group.total_items, 0
      ),
      average_equipment_per_supervisor: supervisorGroupsArray.length > 0
        ? (supervisorGroupsArray.reduce((sum: number, group: any) => 
            sum + group.equipment_count, 0
          ) / supervisorGroupsArray.length).toFixed(2)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        supervisor_groups: supervisorGroupsArray,
        summary_stats: summaryStats,
      },
      generated_at: new Date().toISOString(),
      report_type: 'supervisor_equipment',
      parameters: {
        status,
        supervisorId: supervisorId || 'all',
      },
    });
  } catch (error) {
    console.error('Error generating supervisor equipment report:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate supervisor equipment report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

