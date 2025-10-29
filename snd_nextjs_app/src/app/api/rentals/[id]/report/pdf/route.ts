import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { format } from 'date-fns';
import puppeteer from 'puppeteer';

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

    // Generate HTML report
    const html = generateReportHTML(rental, rental.rentalItems || [], selectedMonth);

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

function generateReportHTML(rental: any, rentalItems: any[], selectedMonth: string | null): string {
  const monthlyData = rentalItems.reduce((acc: any, item: any) => {
    const itemStartDate = item.startDate || rental.startDate;
    if (!itemStartDate) return acc;
    
    const startDate = new Date(itemStartDate);
    
    // Determine end date
    let endDate = new Date();
    if (rental.status === 'completed' && rental.actualEndDate) {
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
      
      const startInMonth = startDate > monthStart ? startDate : monthStart;
      let endInMonth = monthEnd;
      
      if (rental.status === 'completed' && rental.actualEndDate) {
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
      
      if (startDate <= monthEnd) {
        const startDay = startInMonth.getDate();
        const endDay = endInMonth.getDate();
        const days = endDay - startDay + 1; // +1 for inclusive counting
        const monthlyAmount = (parseFloat(item.unitPrice || 0) || 0) * Math.max(days, 1);
        acc[monthKey].totalAmount += monthlyAmount;
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
              <th class="duration-col">Duration</th>
              <th class="total-col">Total</th>
              <th class="completed-col">Completed Date</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    monthData.items.forEach((item: any, index: number) => {
      const equipmentName = item.equipmentName || 'N/A';
      const operatorName = (item?.operatorFirstName && item?.operatorLastName) 
        ? `${item.operatorFirstName} ${item.operatorLastName}` 
        : (item?.operatorId ? `Employee ${item.operatorId}` : 'N/A');
      
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
        if (itemStartDate.getTime() === monthStart.getTime()) {
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
        
        // If rental ended, check if it was within this month
        if (rental.status === 'completed' && rental.actualEndDate) {
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
        
        // Calculate days - ensure we don't go outside the month
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

      html += `
        <tr>
          <td class="sl-col">${index + 1}</td>
          <td class="equipment-col">${equipmentName}</td>
          <td class="price-col">SAR ${parseFloat(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
          <td class="rate-col">${item.rateType || 'daily'}</td>
          <td class="date-col">${displayStartDate}</td>
          <td class="operator-col">${operatorName}</td>
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

