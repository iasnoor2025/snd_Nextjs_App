const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedReports() {
  try {
    console.log('🌱 Seeding reports...');

    // Create sample reports
    const reports = [
      {
        name: 'Monthly Employee Summary',
        type: 'employee_summary',
        description: 'Monthly report showing employee statistics and department breakdown',
        status: 'active',
        created_by: 'admin@ias.com',
        schedule: 'monthly',
        parameters: JSON.stringify({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        }),
        is_active: true,
      },
      {
        name: 'Payroll Summary Report',
        type: 'payroll_summary',
        description: 'Quarterly payroll summary with total amounts and averages',
        status: 'active',
        created_by: 'admin@ias.com',
        schedule: 'quarterly',
        parameters: JSON.stringify({
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        }),
        is_active: true,
      },
      {
        name: 'Equipment Utilization Report',
        type: 'equipment_utilization',
        description: 'Weekly equipment usage and rental statistics',
        status: 'active',
        created_by: 'admin@ias.com',
        schedule: 'weekly',
        parameters: JSON.stringify({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        }),
        is_active: true,
      },
      {
        name: 'Project Progress Report',
        type: 'project_progress',
        description: 'Monthly project status and resource allocation',
        status: 'active',
        created_by: 'admin@ias.com',
        schedule: 'monthly',
        parameters: JSON.stringify({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        }),
        is_active: true,
      },
      {
        name: 'Rental Summary Report',
        type: 'rental_summary',
        description: 'Monthly rental revenue and customer statistics',
        status: 'active',
        created_by: 'admin@ias.com',
        schedule: 'monthly',
        parameters: JSON.stringify({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        }),
        is_active: true,
      },
      {
        name: 'Timesheet Summary Report',
        type: 'timesheet_summary',
        description: 'Weekly timesheet hours and employee productivity',
        status: 'active',
        created_by: 'admin@ias.com',
        schedule: 'weekly',
        parameters: JSON.stringify({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        }),
        is_active: true,
      },
    ];

    for (const report of reports) {
      await prisma.analyticsReport.create({
        data: report,
      });
      console.log(`✅ Created report: ${report.name}`);
    }

    console.log('🎉 Reports seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReports();
