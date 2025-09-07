import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { 
  employees, 
  equipment, 
  customers, 
  rentals, 
  rentalItems,
  employeeAssignments,
  equipmentCategories
} from '@/lib/drizzle/schema';
import { eq, sql, count, and, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Generating customer equipment report...', { customerId, startDate, endDate });

    // Build a much simpler query - get basic rental and equipment data first
    let customerEquipmentQuery = db
      .select({
        customer_id: customers.id,
        customer_name: customers.name,
        customer_type: customers.customerType,
        contact_person: customers.contactPerson,
        phone: customers.phone,
        email: customers.email,
        city: customers.city,
        rental_id: rentals.id,
        rental_number: rentals.rentalNumber,
        rental_status: rentals.status,
        rental_start_date: rentals.startDate,
        rental_end_date: rentals.expectedEndDate,
        rental_amount: rentals.totalAmount,
        equipment_id: rentalItems.equipmentId,
        equipment_name: rentalItems.equipmentName,
        operator_id: rentalItems.operatorId,
        operator_name: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        operator_phone: employees.phone,
        operator_email: employees.email
      })
      .from(customers)
      .innerJoin(rentals, eq(customers.id, rentals.customerId))
      .leftJoin(rentalItems, eq(rentals.id, rentalItems.rentalId))
      .leftJoin(employees, eq(rentalItems.operatorId, employees.id))
      .where(isNotNull(rentalItems.equipmentId)); // Only rentals with equipment

    // Apply customer filter if provided
    if (customerId) {
      customerEquipmentQuery = customerEquipmentQuery.where(eq(customers.id, parseInt(customerId)));
    }

    // Apply date filters if provided
    if (startDate) {
      customerEquipmentQuery = customerEquipmentQuery.where(sql`${rentals.startDate} >= ${startDate}`);
    }
    if (endDate) {
      customerEquipmentQuery = customerEquipmentQuery.where(sql`${rentals.startDate} <= ${endDate}`);
    }

    const customerEquipmentData = await customerEquipmentQuery;

    console.log('Customer equipment data:', customerEquipmentData);

    // Get summary statistics
    const summaryStats = await db
      .select({
        total_customers: count(sql`DISTINCT ${customers.id}`),
        customers_with_rentals: count(sql`DISTINCT CASE WHEN ${rentals.id} IS NOT NULL THEN ${customers.id} END`),
        total_equipment: count(sql`DISTINCT ${rentalItems.equipmentId}`),
        total_operators: count(sql`DISTINCT ${rentalItems.operatorId}`),
        equipment_with_operators: count(sql`DISTINCT CASE WHEN ${rentalItems.operatorId} IS NOT NULL THEN ${rentalItems.equipmentId} END`),
        equipment_without_operators: count(sql`DISTINCT CASE WHEN ${rentalItems.operatorId} IS NULL THEN ${rentalItems.equipmentId} END`),
        total_rentals: count(sql`DISTINCT ${rentals.id}`),
        active_rentals: count(sql`DISTINCT CASE WHEN ${rentals.status} = 'active' THEN ${rentals.id} END`)
      })
      .from(customers)
      .leftJoin(rentals, eq(customers.id, rentals.customerId))
      .leftJoin(rentalItems, eq(rentals.id, rentalItems.rentalId))
      .leftJoin(equipment, eq(rentalItems.equipmentId, equipment.id))
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(employees, eq(rentalItems.operatorId, employees.id));

    console.log('Summary stats:', summaryStats);

    console.log('Raw customer equipment data:', customerEquipmentData);
    console.log('Raw data length:', customerEquipmentData.length);

    // Create simple customer groups from raw data
    const customerGroupsMap = new Map();
    
    customerEquipmentData.forEach((item: any) => {
      console.log('Processing item:', item);
      const customerId = item.customer_id;
      
      if (!customerGroupsMap.has(customerId)) {
        customerGroupsMap.set(customerId, {
          customer_info: {
            id: item.customer_id,
            name: item.customer_name,
            type: item.customer_type,
            contact_person: item.contact_person,
            phone: item.phone,
            email: item.email,
            city: item.city
          },
          rentals: new Map(),
          equipment_summary: {
            total_equipment: 0,
            total_operators: 0,
            equipment_with_operators: 0,
            equipment_without_operators: 0
          }
        });
      }
      
      const customerGroup = customerGroupsMap.get(customerId);
      
      // Add rental if not exists
      if (!customerGroup.rentals.has(item.rental_id)) {
        customerGroup.rentals.set(item.rental_id, {
          id: item.rental_id,
          rental_number: item.rental_number,
          status: item.rental_status,
          start_date: item.rental_start_date,
          end_date: item.rental_end_date,
          amount: item.rental_amount,
          equipment: []
        });
      }
      
      // Add equipment to rental
      const rental = customerGroup.rentals.get(item.rental_id);
      if (rental && item.equipment_id) {
        rental.equipment.push({
          id: item.equipment_id,
          name: item.equipment_name,
          type: 'N/A', // Simplified for now
          model: 'N/A', // Simplified for now
          serial: 'N/A', // Simplified for now
          operator: item.operator_id ? {
            id: item.operator_id,
            name: item.operator_name,
            phone: item.operator_phone,
            email: item.operator_email,
            assignment_status: 'active',
            assignment_start_date: null,
            assignment_end_date: null
          } : null
        });
        
        // Update summary
        customerGroup.equipment_summary.total_equipment++;
        if (item.operator_id) {
          customerGroup.equipment_summary.total_operators++;
          customerGroup.equipment_summary.equipment_with_operators++;
        } else {
          customerGroup.equipment_summary.equipment_without_operators++;
        }
      }
    });
    
    // Convert Map to Array format
    const customerGroups = Array.from(customerGroupsMap.values()).map(group => ({
      ...group,
      rentals: Array.from(group.rentals.values())
    }));
    
    console.log('Customer groups after processing:', customerGroups);
    console.log('Customer groups count:', customerGroups.length);

    // Summary is already calculated inline above

    // If no customer groups were created, create a simple structure from raw data
    let finalCustomerGroups = Object.values(customerGroups);
    if (finalCustomerGroups.length === 0 && customerEquipmentData.length > 0) {
      console.log('No customer groups created, creating simple structure from raw data');
      const simpleGroups = customerEquipmentData.reduce((acc: any, item: any) => {
        const customerId = item.customer_id;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer_info: {
              id: item.customer_id,
              name: item.customer_name,
              type: item.customer_type,
              contact_person: item.contact_person,
              phone: item.phone,
              email: item.email,
              city: item.city
            },
            rentals: [{
              id: item.rental_id,
              rental_number: item.rental_number,
              status: item.rental_status,
              start_date: item.rental_start_date,
              end_date: item.rental_end_date,
              amount: item.rental_amount,
              equipment: [{
                id: item.equipment_id,
                name: item.equipment_name,
                type: item.equipment_type,
                model: item.equipment_model,
                serial: item.equipment_serial,
                operator: item.operator_id ? {
                  id: item.operator_id,
                  name: item.operator_name,
                  phone: item.operator_phone,
                  email: item.operator_email,
                  assignment_status: item.assignment_status,
                  assignment_start_date: item.assignment_start_date,
                  assignment_end_date: item.assignment_end_date
                } : null
              }]
            }],
            equipment_summary: {
              total_equipment: 1,
              total_operators: item.operator_id ? 1 : 0,
              equipment_with_operators: item.operator_id ? 1 : 0,
              equipment_without_operators: item.operator_id ? 0 : 1
            }
          };
        } else {
          // Add equipment to existing customer
          const rental = acc[customerId].rentals[0];
          if (rental && item.equipment_id) {
            const existingEquipment = rental.equipment.find((e: any) => e.id === item.equipment_id);
            if (!existingEquipment) {
              rental.equipment.push({
                id: item.equipment_id,
                name: item.equipment_name,
                type: item.equipment_type,
                model: item.equipment_model,
                serial: item.equipment_serial,
                operator: item.operator_id ? {
                  id: item.operator_id,
                  name: item.operator_name,
                  phone: item.operator_phone,
                  email: item.operator_email,
                  assignment_status: item.assignment_status,
                  assignment_start_date: item.assignment_start_date,
                  assignment_end_date: item.assignment_end_date
                } : null
              });
              acc[customerId].equipment_summary.total_equipment++;
              if (item.operator_id) {
                acc[customerId].equipment_summary.total_operators++;
                acc[customerId].equipment_summary.equipment_with_operators++;
              } else {
                acc[customerId].equipment_summary.equipment_without_operators++;
              }
            }
          }
        }
        return acc;
      }, {});
      finalCustomerGroups = Object.values(simpleGroups);
      console.log('Simple customer groups created:', finalCustomerGroups);
    }

    const reportData = {
      summary_stats: summaryStats[0] || {
        total_customers: 0,
        customers_with_rentals: 0,
        total_equipment: 0,
        total_operators: 0,
        equipment_with_operators: 0,
        equipment_without_operators: 0,
        total_rentals: 0,
        active_rentals: 0
      },
      customer_groups: customerGroups,
      generated_at: new Date().toISOString(),
      parameters: { customerId, startDate, endDate }
    };

    console.log('Customer equipment report generated:', reportData);
    console.log('Customer groups count:', reportData.customer_groups.length);
    console.log('First customer group:', reportData.customer_groups[0]);

    return NextResponse.json({
      success: true,
      data: reportData,
      generated_at: new Date().toISOString(),
      report_type: 'customer_equipment',
      parameters: { customerId, startDate, endDate }
    });

  } catch (error) {
    console.error('Error generating customer equipment report:', error);
    return NextResponse.json({ 
      error: 'Failed to generate customer equipment report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}