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


    // Build a simpler query - get customers with rentals and equipment
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
      .innerJoin(rentalItems, eq(rentals.id, rentalItems.rentalId)) // Changed to innerJoin to ensure we have equipment
      .leftJoin(employees, eq(rentalItems.operatorId, employees.id));

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


    // Create simple customer groups from raw data using reduce (simpler approach)
    const customerGroups = customerEquipmentData.reduce((acc: any, item: any) => {
      
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
          rentals: [],
          equipment_summary: {
            total_equipment: 0,
            total_operators: 0,
            equipment_with_operators: 0,
            equipment_without_operators: 0
          }
        };
      }
      
      // Add rental if not exists
      const existingRental = acc[customerId].rentals.find((r: any) => r.id === item.rental_id);
      if (!existingRental && item.rental_id) {
        acc[customerId].rentals.push({
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
      if (item.rental_id && item.equipment_id) {
        const rental = acc[customerId].rentals.find((r: any) => r.id === item.rental_id);
        if (rental) {
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
          acc[customerId].equipment_summary.total_equipment++;
          if (item.operator_id) {
            acc[customerId].equipment_summary.total_operators++;
            acc[customerId].equipment_summary.equipment_with_operators++;
          } else {
            acc[customerId].equipment_summary.equipment_without_operators++;
          }
        }
      }
      
      return acc;
    }, {});
    
    let finalCustomerGroups = Object.values(customerGroups);

    // Summary is already calculated inline above

    // Use the customer groups we just created
    if (finalCustomerGroups.length === 0 && customerEquipmentData.length > 0) {
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