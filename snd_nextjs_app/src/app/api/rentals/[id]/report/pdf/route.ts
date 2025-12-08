import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { format } from 'date-fns';
import puppeteer from 'puppeteer';
import { db } from '@/lib/drizzle';
import { rentalEquipmentTimesheets, rentalTimesheetReceived } from '@/lib/drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rentalId = parseInt(id);
    
    // Get rental data
    const rental = await RentalService.getRental(rentalId);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month');

    // Fetch timesheet data for all items and months
    const timesheetData = await fetchTimesheetData(rentalId, rental.rentalItems || []);

    // Generate HTML report
    const html = generateReportHTML(rental, rental.rentalItems || [], selectedMonth, timesheetData);

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

      // Return PDF
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Monthly_Items_Report_${rental.rentalNumber}_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Helper function to get first two words of a name
function getShortName(fullName: string): string {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/);
  return words.slice(0, 2).join(' ');
}

// Fetch timesheet hours and status for all rental items
async function fetchTimesheetData(rentalId: number, rentalItems: any[]): Promise<{
  hours: Record<string, number>; // key: `${itemId}-${monthKey}`, value: total hours
  status: Record<string, boolean>; // key: `${monthKey}-${itemId}`, value: received status
}> {
  const hoursMap: Record<string, number> = {};
  const statusMap: Record<string, boolean> = {};

  if (!rentalItems || rentalItems.length === 0) {
    return { hours: hoursMap, status: statusMap };
  }

  // Get all unique months from rental items
  const months = new Set<string>();
  rentalItems.forEach((item: any) => {
    const itemStartDate = item.startDate;
    if (itemStartDate) {
      const startDate = new Date(itemStartDate);
      let endDate = new Date();
      const itemCompletedDate = item.completedDate || (item as any).completed_date;
      if (itemCompletedDate) {
        endDate = new Date(itemCompletedDate);
      }
      
      const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      
      while (currentMonth <= endMonth) {
        const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    }
  });

  // Fetch timesheet hours for each item and month
  await Promise.all(
    rentalItems.map(async (item) => {
      await Promise.all(
        Array.from(months).map(async (monthKey) => {
          try {
            // Fetch timesheet hours
            const [year, monthNum] = monthKey.split('-').map(Number);
            const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
            const lastDay = new Date(year, monthNum, 0).getDate();
            const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            
            const timesheets = await db
              .select()
              .from(rentalEquipmentTimesheets)
              .where(
                and(
                  eq(rentalEquipmentTimesheets.rentalId, rentalId),
                  eq(rentalEquipmentTimesheets.rentalItemId, item.id),
                  gte(rentalEquipmentTimesheets.date, startDateStr),
                  lte(rentalEquipmentTimesheets.date, endDateStr)
                )
              )
              .orderBy(rentalEquipmentTimesheets.date);

            if (timesheets.length > 0) {
              const totalHours = timesheets.reduce((sum, ts) => {
                const regular = parseFloat(ts.regularHours?.toString() || '0') || 0;
                const overtime = parseFloat(ts.overtimeHours?.toString() || '0') || 0;
                return sum + regular + overtime;
              }, 0);
              
              if (totalHours > 0) {
                hoursMap[`${item.id}-${monthKey}`] = totalHours;
              }
            }
          } catch (error) {
            console.error(`Error fetching timesheet hours for item ${item.id} month ${monthKey}:`, error);
          }
        })
      );
    })
  );

  // Fetch timesheet status for each month
  await Promise.all(
    Array.from(months).map(async (monthKey) => {
      try {
        const statusRecords = await db
          .select()
          .from(rentalTimesheetReceived)
          .where(
            and(
              eq(rentalTimesheetReceived.rentalId, rentalId),
              eq(rentalTimesheetReceived.month, monthKey)
            )
          );

        statusRecords.forEach((record) => {
          if (record.rentalItemId) {
            const itemKey = `${monthKey}-${record.rentalItemId}`;
            statusMap[itemKey] = record.received || false;
          }
        });
      } catch (error) {
        console.error(`Error fetching timesheet status for ${monthKey}:`, error);
      }
    })
  );

  return { hours: hoursMap, status: statusMap };
}

function generateReportHTML(rental: any, rentalItems: any[], selectedMonth: string | null, timesheetData?: { hours: Record<string, number>; status: Record<string, boolean> }): string {
  const itemTimesheetHours = timesheetData?.hours || {};
  const timesheetStatus = timesheetData?.status || {};

  const monthlyData = rentalItems.reduce((acc: any, item: any) => {
    const itemStartDate = item.startDate || rental.startDate;
    if (!itemStartDate) return acc;
    
    const startDate = new Date(itemStartDate);
    
    // Determine end date for this item
    let endDate = new Date();
    const itemCompletedDate = item.completedDate || (item as any).completed_date;
    if (itemCompletedDate) {
      endDate = new Date(itemCompletedDate);
    } else if (rental.status === 'completed' && rental.actualEndDate) {
      endDate = new Date(rental.actualEndDate);
    }
    
    // Generate entries for each month the item was active
    const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = format(currentMonth, 'MMMM yyyy');
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthLabel,
          items: [],
          totalItems: 0,
          totalAmount: 0,
          activeItems: 0,
        };
      }
      
      // Calculate monthly amount for this item
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Determine the item's overall end date (already computed via itemCompletedDate/rental end/today)
      const overallItemEnd = endDate;

      // If the item ended before this month starts, skip this month entirely
      if (overallItemEnd < monthStart) {
        // Move to next month
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        continue;
      }
      
      // If the item starts after this month ends, nothing to add for this month
      if (startDate > monthEnd) {
        // Move to next month
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        continue;
      }

      const startInMonth = startDate > monthStart ? startDate : monthStart;
      let endInMonth = monthEnd;
      
      // Prefer per-item completed date when available
      if (itemCompletedDate) {
        const completed = new Date(itemCompletedDate);
        if (completed < monthEnd && completed >= monthStart) {
          endInMonth = completed;
        } else if (completed < monthStart) {
          // Completed before this month – it shouldn't add value this month
          endInMonth = monthStart;
        }
      } else if (rental.status === 'completed' && rental.actualEndDate) {
        const actualEnd = new Date(rental.actualEndDate);
        if (actualEnd < monthEnd && actualEnd >= monthStart) {
          endInMonth = actualEnd;
        }
      } else {
        const today = new Date();
        if (today >= monthStart && today <= monthEnd) {
          endInMonth = today;
        }
      }
      
      if (startInMonth <= endInMonth) {
        // Check if we have timesheet hours for this item and month
        const timesheetHours = itemTimesheetHours[`${item.id}-${monthKey}`];
        const timesheetReceived = timesheetStatus[`${monthKey}-${item.id}`] === true;
        
        let itemAmount = 0;
        
        // If timesheet was received and we have hours, use timesheet-based calculation
        if (timesheetReceived && timesheetHours && timesheetHours > 0) {
          const unitPrice = parseFloat(item.unitPrice || 0) || 0;
          const rateType = item.rateType || 'daily';
          
          // Convert rate to hourly equivalent
          let hourlyRate = unitPrice;
          if (rateType === 'daily') {
            hourlyRate = unitPrice / 10; // 10 hours per day
          } else if (rateType === 'weekly') {
            hourlyRate = unitPrice / (7 * 10); // 7 days * 10 hours
          } else if (rateType === 'monthly') {
            hourlyRate = unitPrice / (30 * 10); // 30 days * 10 hours
          }
          
          itemAmount = hourlyRate * timesheetHours;
        } else {
          // Fallback to date-based calculation
          const startDay = startInMonth.getDate();
          const endDay = endInMonth.getDate();
          const days = endDay - startDay + 1; // +1 inclusive
          itemAmount = (parseFloat(item.unitPrice || 0) || 0) * Math.max(days, 0);
        }
        
        acc[monthKey].totalAmount += itemAmount;
      } else {
        // No valid overlap within this month; skip adding the item
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        continue;
      }
      
      acc[monthKey].items.push(item);
      acc[monthKey].totalItems += 1;
      
      if (item.status === 'active') {
        acc[monthKey].activeItems += 1;
      }
      
      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return acc;
  }, {});

  let sortedMonths = Object.keys(monthlyData).sort().reverse();
  
  // Filter by selected month if not "all"
  if (selectedMonth && selectedMonth !== 'all') {
    sortedMonths = sortedMonths.filter(key => key === selectedMonth);
  }

  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Monthly Items Report - ${rental.rentalNumber}</title>
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
          @media print {
            body { padding: 6px; font-size: 11px; }
            .no-print { display: none; }
            table { font-size: 11px; }
            th, td { padding: 2px 4px; font-size: 11px; }
          }
        </style>
      </head>
      <body>
        <h1>Monthly Items Report</h1>
        <div class="summary">
          <strong>Rental Number:</strong> ${rental.rentalNumber}<br/>
          <strong>Customer:</strong> ${rental.customer?.name || 'N/A'}<br/>
          <strong>Report Date:</strong> ${format(new Date(), 'MMM dd, yyyy')}
        </div>
  `;

  sortedMonths.forEach(monthKey => {
    const monthData = monthlyData[monthKey];
    html += `
      <div class="month-section">
        <h2>${monthData.monthLabel}</h2>
        <div class="summary">
          <strong>Total Items:</strong> ${monthData.totalItems} | 
          <strong>Active:</strong> ${monthData.activeItems} | 
          <strong>Total Value:</strong> SAR ${monthData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </div>
        <table>
          <thead>
            <tr>
              <th class="sl-col">Sl#</th>
              <th class="equipment-col">Equipment</th>
              <th class="price-col">Unit Price</th>
              <th class="rate-col">Rate</th>
              <th class="date-col">Start Date</th>
              <th class="operator-col">Operator</th>
              <th class="operator-col">Supervisor</th>
              <th class="duration-col">Duration</th>
              <th class="total-col">Total</th>
              <th class="completed-col">Completed Date</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Group items by equipment to show handover continuity
    const groupedByEquipment = monthData.items.reduce((acc: any, item: any) => {
      const equipmentName = item.equipmentName || 'Unknown Equipment';
      if (!acc[equipmentName]) {
        acc[equipmentName] = [];
      }
      acc[equipmentName].push(item);
      return acc;
    }, {});
    
    // Sort items within each equipment group by start date
    Object.keys(groupedByEquipment).forEach(key => {
      groupedByEquipment[key].sort((a: any, b: any) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      });
    });
    
    // Flatten and sort equipment groups
    const equipmentKeys = Object.keys(groupedByEquipment).sort();
    const allItems: any[] = [];
    equipmentKeys.forEach(key => {
      allItems.push(...groupedByEquipment[key]);
    });
    
    let globalIndex = 0;
    
    allItems.forEach((item: any, itemIndex: number) => {
      const equipmentName = item.equipmentName || 'N/A';
      const equipmentPlate = item.equipmentIstimara || (item as any).equipment?.istimara || null;
      const displayEquipmentName = equipmentPlate 
        ? `${equipmentName} (${equipmentPlate})`
        : equipmentName;
      const operatorName = (item?.operatorFirstName && item?.operatorLastName) 
        ? `${item.operatorFirstName} ${item.operatorLastName}` 
        : (item?.operatorId ? `Employee ${item.operatorId}` : 'N/A');
      
      // Get supervisor name
      const supervisorName = (item?.supervisorFirstName && item?.supervisorLastName)
        ? getShortName(`${item.supervisorFirstName} ${item.supervisorLastName}`)
        : (item?.supervisorId ? `Employee ${item.supervisorId}` : 'N/A');
      
      // Check if this is a handover (previous item was completed and this is a new operator for same equipment)
      const isHandover = itemIndex > 0 && (() => {
        const prevItem = allItems[itemIndex - 1];
        const prevEquipmentName = prevItem.equipmentName || 'Unknown';
        
        if (equipmentName !== prevEquipmentName) return false;
        
        const prevOperatorId = prevItem?.operatorId;
        const currentOperatorId = item?.operatorId;
        
        if (prevOperatorId === currentOperatorId) return false;
        
        const prevCompletedDate = prevItem.completedDate || (prevItem as any).completed_date;
        const currentStartDate = item.startDate;
        
        if (!prevCompletedDate || !currentStartDate) return false;
        
        const completed = new Date(prevCompletedDate);
        const started = new Date(currentStartDate);
        
        // Check if new item started on or after previous item completed
        return started >= completed && prevItem.status === 'completed';
      })();
      
      // Calculate duration and determine start date for this specific month
      let durationText = 'N/A';
      let displayStartDate = 'N/A';
      let monthlyTotal = 0;
      
      if (item.startDate) {
        const itemStartDate = new Date(item.startDate);
        itemStartDate.setHours(0, 0, 0, 0);
        
        // Parse month and year from monthData.monthLabel (e.g., "October 2025")
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthParts = monthData.monthLabel.split(' ');
        const monthName = monthParts[0];
        const year = parseInt(monthParts[1]);
        const monthNum = monthNames.indexOf(monthName);
        
        // Get first and last day of the month
        const monthStart = new Date(year, monthNum, 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(year, monthNum + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        // Determine what start date to show for this month
        // For handover items, always show the actual start date if it's in this month
        if (isHandover && itemStartDate >= monthStart && itemStartDate < new Date(year, monthNum + 1, 1)) {
          displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
        } else if (itemStartDate.getTime() === monthStart.getTime()) {
          // Started on 1st of this month
          displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
        } else if (itemStartDate >= monthStart && itemStartDate < new Date(year, monthNum + 1, 1)) {
          // Started mid-month in this month
          displayStartDate = format(itemStartDate, 'MMM dd, yyyy');
        } else {
          // This is a month after the start - show first of month
          displayStartDate = format(monthStart, 'MMM dd, yyyy');
        }
        
        // Determine the start date in this month for duration calculation
        const startInMonth = itemStartDate > monthStart ? itemStartDate : monthStart;
        
        // Determine the end date in this month
        let endInMonth = monthEnd;
        
        // Check if item has a completed date and use it for duration calculation
        const itemCompletedDate = item.completedDate || (item as any).completed_date;
        if (itemCompletedDate && item.status === 'completed') {
          const completedDate = new Date(itemCompletedDate);
          completedDate.setHours(23, 59, 59, 999);
          // If completed date is within this month, use it as end date
          if (completedDate >= monthStart && completedDate <= monthEnd) {
            endInMonth = completedDate;
          } else if (completedDate < monthStart) {
            // If completed before this month, item wasn't active this month
            endInMonth = monthStart;
          }
          // If completed after this month, use month end (item was active all month)
        } else if (rental.status === 'completed' && rental.actualEndDate) {
          // Fallback to rental end date if item doesn't have completed date
          const actualEnd = new Date(rental.actualEndDate);
          actualEnd.setHours(23, 59, 59, 999);
          if (actualEnd >= monthStart && actualEnd <= monthEnd) {
            endInMonth = actualEnd;
          }
        } else {
          // For active rentals, use today if within the month
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (today >= monthStart && today <= monthEnd) {
            endInMonth = today;
          }
        }
        
        // Check if we have timesheet hours for this item and month
        const timesheetHours = itemTimesheetHours[`${item.id}-${monthKey}`];
        const timesheetReceived = timesheetStatus[`${monthKey}-${item.id}`] === true;
        
        // If timesheet was received and we have hours, use timesheet-based calculation
        if (timesheetReceived && timesheetHours && timesheetHours > 0) {
          // Show duration in hours
          durationText = timesheetHours % 1 === 0 ? `${timesheetHours} hours` : `${timesheetHours.toFixed(1)} hours`;
          
          // Calculate monthly total based on timesheet hours
          const unitPrice = parseFloat(item.unitPrice || 0) || 0;
          const rateType = item.rateType || 'daily';
          
          // Convert rate to hourly equivalent
          let hourlyRate = unitPrice;
          if (rateType === 'daily') {
            hourlyRate = unitPrice / 10; // 10 hours per day
          } else if (rateType === 'weekly') {
            hourlyRate = unitPrice / (7 * 10); // 7 days * 10 hours
          } else if (rateType === 'monthly') {
            hourlyRate = unitPrice / (30 * 10); // 30 days * 10 hours
          }
          
          monthlyTotal = hourlyRate * timesheetHours;
        } else {
          // Fallback to date-based calculation
          if (itemStartDate <= monthEnd) {
            const startDay = startInMonth.getDate();
            const endDay = endInMonth.getDate();
            const days = endDay - startDay + 1; // +1 for inclusive counting
            durationText = days >= 1 ? `${days} days` : '1 day';
            
            // Calculate monthly total
            monthlyTotal = (parseFloat(item.unitPrice || 0) || 0) * Math.max(days, 1);
          } else {
            durationText = '0 days';
            monthlyTotal = 0;
          }
        }
      }
      
      // Determine completed date display - only show in the month when completed
      let completedDateDisplay = '-';
      if (item.status === 'completed' && item.completedDate) {
        const completedDate = new Date(item.completedDate);
        completedDate.setHours(0, 0, 0, 0);
        
        // Check if completed date falls within the current report month
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthParts = monthData.monthLabel.split(' ');
        const monthName = monthParts[0];
        const year = parseInt(monthParts[1]);
        const monthNum = monthNames.indexOf(monthName);
        
        const reportMonthStart = new Date(year, monthNum, 1);
        reportMonthStart.setHours(0, 0, 0, 0);
        const reportMonthEnd = new Date(year, monthNum + 1, 0);
        reportMonthEnd.setHours(23, 59, 59, 999);
        
        // Only show completed date if it's in this month
        if (completedDate >= reportMonthStart && completedDate <= reportMonthEnd) {
          completedDateDisplay = format(completedDate, 'MMM dd, yyyy');
        }
      }

      globalIndex++;
      html += `
        <tr${isHandover ? ' style="background-color: #e3f2fd;"' : ''}>
          <td class="sl-col">${globalIndex}</td>
          <td class="equipment-col">${displayEquipmentName}</td>
          <td class="price-col">SAR ${parseFloat(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
          <td class="rate-col">${item.rateType || 'daily'}</td>
          <td class="date-col">${displayStartDate}</td>
          <td class="operator-col">${operatorName}</td>
          <td class="operator-col">${supervisorName}</td>
          <td class="duration-col">${durationText}</td>
          <td class="total-col">SAR ${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
          <td class="completed-col">${completedDateDisplay}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  html += `
      </body>
    </html>
  `;

  return html;
}

