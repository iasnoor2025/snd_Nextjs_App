
// Final check - if still not verified, throw error
if (!itemVerified) {
    throw new Error(`Item "${serviceItemCode}" does not exist in ERPNext and could not be created or found. Please create at least one Item in ERPNext manually. Original error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
}
        }


invoiceData.items = await Promise.all(
    sortedItems.map(async (item, index) => {
        // Ensure equipmentName is not empty or undefined from the start
        const equipmentName = (item.equipmentName && item.equipmentName.trim() !== '')
            ? item.equipmentName.trim()
            : `Equipment ${item.equipmentId || item.id || 'Unknown'}`;

        console.log(`Processing item ${index + 1}/${sortedItems.length}: ${equipmentName} (ID: ${item.id || item.equipmentId})`);

        // Sync equipment to ERPNext - this will find existing or create new
        // This ensures all rental equipment has corresponding items in ERPNext
        let itemCode: string;
        try {
            // Pass plateNumber if available (cast item to avoid TS error if property is missing on interface)
            const plateNumber = (item as any).plateNumber || (item as any).plate_number;
            itemCode = await this.syncEquipmentToERPNext(equipmentName, item.equipmentId, plateNumber);
            console.log(`✓ Equipment synced to ERPNext: ${equipmentName} -> ${itemCode}`);
        } catch (syncError) {
            console.warn(`Failed to sync equipment ${equipmentName} to ERPNext, using fallback:`, syncError);
            // Fall back to generic service item
            itemCode = serviceItemCode;
        }

        // Calculate duration based on rate type (this will be used as quantity)
        // IMPORTANT: Quantity should be hours (like the report shows), not days
        const rateType = item.rateType || 'daily';
        const itemStartDate = item.startDate || rental.startDate;
        const itemCompletedDate = item.completedDate || (item as any).completed_date;

        let duration = 1; // Default quantity
        let uom = 'Nos'; // Default UOM

        // For all rate types, try to use actual timesheet hours if available
        // This matches the report which shows hours (e.g., "230 hours")
        // IMPORTANT: Must check timesheet received status first (like the report does)
        let timesheetReceived = false;
        let totalHours = 0;

        try {
            const { db } = await import('@/lib/db');
            const { rentalEquipmentTimesheets, rentalTimesheetReceived } = await import('@/lib/drizzle/schema');
            const { eq, and, gte, lte } = await import('drizzle-orm');

            // Determine date range for timesheet query - MUST match invoice range to prevent 417 logic errors
            const startDateStr = fromDate;
            const endDateStr = toDate;

            // Check timesheet received status (context specific to monthly vs custom range)
            if (billingMonth) {
                const statusRecord = await db
                    .select()
                    .from(rentalTimesheetReceived)
                    .where(
                        and(
                            eq(rentalTimesheetReceived.rentalId, rental.id),
                            eq(rentalTimesheetReceived.rentalItemId, item.id),
                            eq(rentalTimesheetReceived.month, billingMonth)
                        )
                    )
                    .limit(1);

                timesheetReceived = statusRecord[0]?.received || false;
            } else {
                // For custom range, if rental is active and hasTimesheet is set, assume received or check recent
                timesheetReceived = rental.hasTimesheet || false;
            }

            // Fetch timesheet data for this item and period
            const timesheets = await db
                .select()
                .from(rentalEquipmentTimesheets)
                .where(
                    and(
                        eq(rentalEquipmentTimesheets.rentalItemId, item.id),
                        gte(rentalEquipmentTimesheets.date, startDateStr),
                        lte(rentalEquipmentTimesheets.date, endDateStr)
                    )
                );

            // Calculate total hours
            totalHours = timesheets.reduce((sum, ts) => {
                const regular = parseFloat(ts.regularHours?.toString() || '0') || 0;
                const overtime = parseFloat(ts.overtimeHours?.toString() || '0') || 0;
                return sum + regular + overtime;
            }, 0);

            // If timesheet was received and we have hours, use timesheet-based calculation (matches report)
            // This applies to ALL rate types including monthly (report converts monthly to hourly too)
            if (timesheetReceived && totalHours > 0) {
                duration = totalHours; // Use hours directly (e.g., 179 hours) - this becomes qty in invoice
                uom = 'Hour'; // Always use hours when timesheet data is available
            }
        } catch (error) {
            // If timesheet fetch fails, fall through to date-based calculation
            console.error(`Error fetching timesheet for item ${item.id}:`, error);
        }

        // If duration is still 1 (default) or not set from timesheet, calculate from dates
        // Only do this if we didn't get timesheet hours (duration should be > 1 if we have hours)
        if (duration === 1 && uom === 'Nos' && itemStartDate) {
            let startDate = new Date(itemStartDate);
            let endDate: Date;

            // For monthly billing, calculate duration only for the billing month
            if (billingMonth && rental.customFrom && rental.customTo) {
                // Use the billing month period
                startDate = new Date(rental.customFrom);
                endDate = new Date(rental.customTo);

                // Ensure start date is not before item start date
                const itemStart = new Date(itemStartDate);
                if (startDate < itemStart) {
                    startDate = itemStart;
                }

                // Ensure end date is not after item completed date (if exists)
                if (itemCompletedDate) {
                    const itemEnd = new Date(itemCompletedDate);
                    if (endDate > itemEnd) {
                        endDate = itemEnd;
                    }
                }
            } else {
                // For non-monthly billing, use full rental period
                if (itemCompletedDate) {
                    endDate = new Date(itemCompletedDate);
                } else if (rental.status === 'completed' && rental.expectedEndDate) {
                    endDate = new Date(rental.expectedEndDate);
                } else if (rental.customTo) {
                    // Use customTo from invoice if available
                    endDate = new Date(rental.customTo);
                } else {
                    endDate = new Date();
                }
            }

            // Ensure end date is not before start date
            if (endDate < startDate) {
                endDate = startDate;
            }

            const durationMs = endDate.getTime() - startDate.getTime();

            // Calculate duration based on rate type
            if (rateType === 'hourly') {
                duration = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
                uom = 'Hour';
            } else if (rateType === 'weekly') {
                duration = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7)));
                uom = 'Week';
            } else if (rateType === 'monthly') {
                duration = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30)));
                uom = 'Nos'; // Use "Nos" for monthly rates since ERPNext doesn't support "Month" UOM
            } else {
                // Daily rate - calculate days
                // Add 1 day to make it inclusive (start date to end date = 1 day, not 0)
                duration = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1);
                uom = 'Day';
            }
        }

        // Calculate amount based on unit price and duration
        // IMPORTANT: Match report calculation exactly
        const unitPrice = parseFloat(item.unitPrice?.toString() || '0') || 0;
        let amount = 0;
        let rate = unitPrice; // Default rate

        // If timesheet was received and we have hours, use timesheet-based calculation (matches report)
        // This applies to ALL rate types including monthly (report converts monthly to hourly too)
        // IMPORTANT: Use the exact hours we calculated (duration should already be set to totalHours)
        if (timesheetReceived && totalHours > 0 && uom === 'Hour' && duration === totalHours) {
            // Convert rate to hourly equivalent based on rate type (matches report logic)
            if (rateType === 'daily') {
                rate = unitPrice / 10; // Daily rate / 10 hours = hourly rate
            } else if (rateType === 'weekly') {
                rate = unitPrice / (7 * 10); // Weekly rate / (7 days * 10 hours) = hourly rate
            } else if (rateType === 'monthly') {
                rate = unitPrice / (30 * 10); // Monthly rate / (30 days * 10 hours) = hourly rate (matches report)
            }
            // If rateType is already 'hourly', rate stays as unitPrice
            // Use duration (which equals totalHours) as the quantity - this matches report exactly
            amount = rate * duration; // hourly rate * hours (duration = totalHours from timesheet)
        } else {
            // Fallback to date-based calculation (matches report when no timesheet or not received)
            if (rateType === 'monthly') {
                // For monthly rates without timesheet, calculate months from dates
                if (billingMonth && rental.customFrom && rental.customTo && itemStartDate) {
                    let startDate = new Date(rental.customFrom);
                    let endDate = new Date(rental.customTo);

                    const itemStart = new Date(itemStartDate);
                    if (startDate < itemStart) {
                        startDate = itemStart;
                    }

                    if (itemCompletedDate) {
                        const itemEnd = new Date(itemCompletedDate);
                        if (endDate > itemEnd) {
                            endDate = itemEnd;
                        }
                    }

                    if (endDate < startDate) {
                        endDate = startDate;
                    }

                    const durationMs = endDate.getTime() - startDate.getTime();
                    duration = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30)));
                    uom = 'Nos'; // Use "Nos" for monthly rates since ERPNext doesn't support "Month" UOM
                } else {
                    duration = 1;
                    uom = 'Nos';
                }
                amount = unitPrice * duration; // monthly rate * number of months
            } else {
                // For other rate types, use date-based calculation
                // Calculate days for the billing month period
                if (billingMonth && rental.customFrom && rental.customTo && itemStartDate) {
                    let startDate = new Date(rental.customFrom);
                    let endDate = new Date(rental.customTo);

                    const itemStart = new Date(itemStartDate);
                    if (startDate < itemStart) {
                        startDate = itemStart;
                    }

                    if (itemCompletedDate) {
                        const itemEnd = new Date(itemCompletedDate);
                        if (endDate > itemEnd) {
                            endDate = itemEnd;
                        }
                    }

                    if (endDate < startDate) {
                        endDate = startDate;
                    }

                    // Calculate inclusive days using timestamps to avoid timezone/DST issues
                    // Set both dates to noon to ensure full days are counted correctly
                    const s = new Date(startDate); s.setHours(12, 0, 0, 0);
                    const e = new Date(endDate); e.setHours(12, 0, 0, 0);
                    const durationMs = e.getTime() - s.getTime();
                    const oneDay = 1000 * 60 * 60 * 24;
                    const days = Math.round(durationMs / oneDay) + 1; // +1 inclusive

                    duration = Math.max(days, 0);
                } else {
                    // Fallback: Calculate duration if not using billing month logic
                    // Use simple inclusive diff
                    const dEnd = itemCompletedDate ? new Date(itemCompletedDate) : new Date();
                    const dStart = new Date(itemStartDate || new Date());

                    // Set to noon to avoid timezone issues
                    dStart.setHours(12, 0, 0, 0);
                    dEnd.setHours(12, 0, 0, 0);

                    const ms = dEnd.getTime() - dStart.getTime();
                    const oneDay = 1000 * 60 * 60 * 24;
                    const dDays = Math.max(1, Math.round(ms / oneDay) + 1);

                    if (rateType === 'daily') duration = dDays;
                }
                amount = unitPrice * duration; // unit price * days
            }
        }
