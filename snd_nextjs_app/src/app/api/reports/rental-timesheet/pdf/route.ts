import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import puppeteer from 'puppeteer';
import { getServerSession } from '@/lib/auth';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { generateRentalTimesheetReport } from '@/app/api/reports/comprehensive/route';
import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Rental')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const customerId = searchParams.get('customerId');
    const hasTimesheet = searchParams.get('hasTimesheet');
    const visibleColumnsParam = searchParams.get('visibleColumns');
    const showOnlyCompanyNameParam = searchParams.get('showOnlyCompanyName');
    const showOnlyCompanyName = showOnlyCompanyNameParam === 'true';
    
    // Parse visible columns
    let visibleColumns: Record<string, boolean> | undefined;
    if (visibleColumnsParam) {
      try {
        visibleColumns = JSON.parse(visibleColumnsParam);
      } catch (error) {
        console.error('Error parsing visibleColumns:', error);
      }
    }
    
    // Get customer name if customerId is provided
    let customerName: string | null = null;
    if (customerId && customerId !== 'all') {
      try {
        const customer = await db
          .select({ name: customers.name })
          .from(customers)
          .where(eq(customers.id, parseInt(customerId)))
          .limit(1);
        
        if (customer.length > 0) {
          customerName = customer[0].name;
        }
      } catch (error) {
        console.error('Error fetching customer name:', error);
      }
    }
    
    // Generate report data using the internal function
    const reportResult = await generateRentalTimesheetReport(
      null, // startDate
      null, // endDate
      month || null,
      customerId && customerId !== 'all' ? customerId : null,
      hasTimesheet && hasTimesheet !== 'all' ? hasTimesheet : null
    );

    // Extract data from the result
    const data = reportResult || {};

    // Generate HTML report
    const html = generateReportHTML(data, month, customerId, hasTimesheet, customerName, visibleColumns, showOnlyCompanyName);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      // Generate filename
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const monthStr = month ? `_${month}` : '';
      const filename = `Rental_Timesheet_Report${monthStr}_${dateStr}.pdf`;

      // Return PDF
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}

// Helper function to get first two words of a name
function getShortName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
  return parts.slice(0, 2).join(' ');
}

function generateReportHTML(data: any, month: string | null, customerId: string | null, hasTimesheet: string | null, customerName?: string | null, visibleColumns?: Record<string, boolean>, showOnlyCompanyName?: boolean): string {
  const monthlyItems = data.monthly_items || [];
  
  // Default to all columns visible if not provided
  const columns = visibleColumns || {
    si: true,
    equipment: true,
    unitPrice: true,
    rate: true,
    startDate: true,
    operator: true,
    supervisor: true,
    duration: true,
    total: true,
    completedDate: true,
  };
  
  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Rental Timesheet Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 10px; margin: 0; font-size: 12px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 20px; }
          h2 { color: #666; margin-top: 15px; margin-bottom: 5px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 3px 5px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; font-size: 12px; }
          td { font-size: 12px; }
          .sl-col { width: 35px; text-align: center; }
          .equipment-col { min-width: 120px; }
          .price-col { width: 80px; text-align: right; }
          .rate-col { width: 60px; text-align: center; }
          .date-col { width: 95px; }
          .operator-col { min-width: 110px; }
          .duration-col { width: 75px; text-align: center; }
          .total-col { width: 100px; text-align: right; font-weight: bold; }
          .completed-col { width: 100px; }
          .summary { background-color: #f9f9f9; padding: 8px; margin: 10px 0; border-radius: 4px; font-size: 12px; }
          .month-section { page-break-after: auto; margin-bottom: 15px; }
          .summary-row { background-color: #f0f0f0; font-weight: bold; }
          @media print {
            body { padding: 6px; font-size: 11px; }
            .no-print { display: none; }
            table { font-size: 11px; }
            th, td { padding: 2px 4px; font-size: 11px; }
          }
        </style>
      </head>
      <body>
        <h1>Rental Timesheet Report</h1>
        <div class="summary">
          <strong>Report Date:</strong> ${format(new Date(), 'MMMM dd, yyyy')}<br/>
          ${customerName ? `<strong>Company:</strong> ${customerName}<br/>` : ''}
          ${month ? `<strong>Month:</strong> ${format(new Date(`${month}-01`), 'MMMM yyyy')}<br/>` : ''}
          ${hasTimesheet && hasTimesheet !== 'all' ? `<strong>Has Timesheet:</strong> ${hasTimesheet === 'yes' ? 'Yes' : 'No'}<br/>` : ''}
        </div>
  `;

  // Handle case when monthlyItems is empty but a specific company is selected with "No Timesheet" filter
  if (monthlyItems.length === 0 && showOnlyCompanyName && hasTimesheet === 'no' && customerId && customerId !== 'all') {
    const monthLabel = month 
      ? format(new Date(`${month}-01`), 'MMMM yyyy')
      : 'All Months';
    html += `
      <div class="month-section">
        <h2>${monthLabel}</h2>
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${customerName || 'Unknown Company'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else {
    monthlyItems.forEach((monthData: any) => {
      html += `
        <div class="month-section">
          <h2>${monthData.monthLabel}</h2>
          <div class="summary">
            <strong>Items:</strong> ${monthData.totalItems} | 
            <strong>Active:</strong> ${monthData.activeItems} | 
            <strong>Value:</strong> SAR ${Number(monthData.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <table>
            <thead>
              <tr>
                ${showOnlyCompanyName ? '<th>Company Name</th>' : `
                  ${columns.si ? '<th class="sl-col">SI#</th>' : ''}
                  ${columns.equipment ? '<th class="equipment-col">Equipment</th>' : ''}
                  ${columns.unitPrice ? '<th class="price-col">Unit Price</th>' : ''}
                  ${columns.rate ? '<th class="rate-col">Rate</th>' : ''}
                  ${columns.startDate ? '<th class="date-col">Start Date</th>' : ''}
                  ${columns.operator ? '<th class="operator-col">Operator</th>' : ''}
                  ${columns.supervisor ? '<th class="operator-col">Supervisor</th>' : ''}
                  ${columns.duration ? '<th class="duration-col">Duration</th>' : ''}
                  ${columns.total ? '<th class="total-col">Total</th>' : ''}
                  ${columns.completedDate ? '<th class="completed-col">Completed Date</th>' : ''}
                `}
              </tr>
            </thead>
            <tbody>
      `;

    // Sort items by equipment name
    const sortedItems = [...monthData.items].sort((a: any, b: any) => {
      const nameA = ((a.equipment_name || '')).toLowerCase();
      const nameB = ((b.equipment_name || '')).toLowerCase();
      
      // Try to extract numeric prefix (e.g., "1404-DOZER" -> "1404")
      const extractNumber = (name: string) => {
        const match = name.match(/^(\d+)/);
        return match ? parseInt(match[1]) : null;
      };
      
      const numA = extractNumber(nameA);
      const numB = extractNumber(nameB);
      
      // If both have numeric prefixes, compare numerically
      if (numA !== null && numB !== null) {
        if (numA !== numB) {
          return numA - numB;
        }
        // If numbers are equal, compare full names
        return nameA.localeCompare(nameB);
      }
      
      // If one has numeric prefix and the other doesn't, numeric comes first
      if (numA !== null && numB === null) return -1;
      if (numA === null && numB !== null) return 1;
      
      // Both are non-numeric, sort alphabetically
      return nameA.localeCompare(nameB);
    });
    
    if (showOnlyCompanyName) {
      // Show only unique company names
      // When "No Timesheet" filter is active, the API already filters to only return items without timesheets
      // So we just need to show all unique company names from the filtered results
      const uniqueCompanies = Array.from(
        new Set(
          sortedItems
            .map((item: any) => item.customer_name)
            .filter((name: string) => name)
        )
      ).sort();
      
      // If no companies found in items but a specific company is selected with "No Timesheet" filter,
      // show that company name
      if (uniqueCompanies.length === 0 && hasTimesheet === 'no' && customerId && customerId !== 'all') {
        html += `
          <tr>
            <td>${customerName || 'Unknown Company'}</td>
          </tr>
        `;
      } else {
        uniqueCompanies.forEach((companyName: string) => {
          html += `
            <tr>
              <td>${companyName}</td>
            </tr>
          `;
        });
      }
    } else {
      let globalIndex = 0;
      sortedItems.forEach((item: any) => {
        globalIndex++;
        const equipmentName = item.equipment_name || 'N/A';
        const unitPrice = parseFloat(item.unit_price || 0) || 0;
        const rateType = item.rate_type || 'daily';
        const startDate = item.start_date ? format(new Date(item.start_date), 'MMM dd, yyyy') : 'N/A';
        const operatorName = item.operator_display || item.operator_name || '-';
        const supervisorName = item.supervisor_display || item.supervisor_name || '-';
        
        // Calculate duration for PDF
        let duration = '-';
        if (item.start_date) {
          const itemStartDate = new Date(item.start_date);
          const itemEndDate = item.completed_date ? new Date(item.completed_date) : new Date();
          
          if (month) {
            // Calculate days within the selected month
            const [year, monthNum] = month.split('-').map(Number);
            const monthStart = new Date(year, monthNum - 1, 1);
            const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
            
            // Find the overlap between item period and selected month
            const effectiveStart = itemStartDate > monthStart ? itemStartDate : monthStart;
            const effectiveEnd = itemEndDate < monthEnd ? itemEndDate : monthEnd;
            
            if (effectiveStart <= effectiveEnd) {
              const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
              const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
              duration = `${diffDays} days`;
            } else {
              duration = '0 days';
            }
          } else {
            // No month filter - calculate total days
            const diffTime = Math.abs(itemEndDate.getTime() - itemStartDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            duration = `${diffDays} days`;
          }
        }
        
        // Calculate total for PDF
        let total = 0;
        const totalHours = parseFloat(item.total_hours?.toString() || '0') || 0;
        
        if (totalHours > 0) {
          // Convert rate to hourly equivalent based on rate type
          let hourlyRate = unitPrice;
          if (rateType === 'daily') {
            hourlyRate = unitPrice / 10; // Daily rate / 10 hours
          } else if (rateType === 'weekly') {
            hourlyRate = unitPrice / (7 * 10); // Weekly rate / (7 days * 10 hours)
          } else if (rateType === 'monthly') {
            hourlyRate = unitPrice / (30 * 10); // Monthly rate / (30 days * 10 hours)
          }
          total = hourlyRate * totalHours;
        } else {
          // If no timesheet hours, calculate based on date duration
          if (item.start_date) {
            const itemStartDate = new Date(item.start_date);
            const itemEndDate = item.completed_date ? new Date(item.completed_date) : new Date();
            
            let diffDays = 0;
            
            if (month) {
              // Calculate days within the selected month
              const [year, monthNum] = month.split('-').map(Number);
              const monthStart = new Date(year, monthNum - 1, 1);
              const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
              
              // Find the overlap between item period and selected month
              const effectiveStart = itemStartDate > monthStart ? itemStartDate : monthStart;
              const effectiveEnd = itemEndDate < monthEnd ? itemEndDate : monthEnd;
              
              if (effectiveStart <= effectiveEnd) {
                const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
                diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
              } else {
                diffDays = 0;
              }
            } else {
              // No month filter - calculate total days
              const diffTime = Math.abs(itemEndDate.getTime() - itemStartDate.getTime());
              diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
            
            if (diffDays > 0) {
              if (rateType === 'daily') {
                total = unitPrice * diffDays;
              } else if (rateType === 'hourly') {
                total = unitPrice * (diffDays * 10); // Assume 10 hours per day
              } else if (rateType === 'weekly') {
                total = unitPrice * Math.ceil(diffDays / 7);
              } else if (rateType === 'monthly') {
                total = unitPrice * Math.ceil(diffDays / 30);
              } else {
                total = unitPrice;
              }
            } else {
              total = 0;
            }
          } else {
            total = unitPrice;
          }
        }
        
        let completedDate = '-';
        
        if (item.completed_date) {
          const completedDateObj = new Date(item.completed_date);
          const [monthName, yearStr] = monthData.monthLabel.split(' ');
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const reportMonth = monthNames.indexOf(monthName);
          const reportYear = parseInt(yearStr);
          
          const reportMonthStart = new Date(reportYear, reportMonth, 1);
          reportMonthStart.setHours(0, 0, 0, 0);
          const reportMonthEnd = new Date(reportYear, reportMonth + 1, 0);
          reportMonthEnd.setHours(23, 59, 59, 999);
          
          if (completedDateObj >= reportMonthStart && completedDateObj <= reportMonthEnd) {
            completedDate = format(completedDateObj, 'MMM dd, yyyy');
          }
        }

        html += `
          <tr>
            ${columns.si ? `<td class="sl-col">${globalIndex}</td>` : ''}
            ${columns.equipment ? `<td class="equipment-col">${equipmentName}</td>` : ''}
            ${columns.unitPrice ? `<td class="price-col">SAR ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}
            ${columns.rate ? `<td class="rate-col">${rateType}</td>` : ''}
            ${columns.startDate ? `<td class="date-col">${startDate}</td>` : ''}
            ${columns.operator ? `<td class="operator-col">${operatorName}</td>` : ''}
            ${columns.supervisor ? `<td class="operator-col">${supervisorName}</td>` : ''}
            ${columns.duration ? `<td class="duration-col">${duration}</td>` : ''}
            ${columns.total ? `<td class="total-col">SAR ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}
            ${columns.completedDate ? `<td class="completed-col">${completedDate}</td>` : ''}
          </tr>
        `;
      });
    }

      html += `
            </tbody>
          </table>
        </div>
      `;
    });
  }

  html += `
      </body>
    </html>
  `;

  return html;
}
