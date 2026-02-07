
// Replace items with verified items (using minimal structure)
const originalItemCount = invoiceData.items.length;

// FINAL CHECK: Verify none of the verified items are fixed assets
// Store original equipment names BEFORE cleaning (from sortedItems)
const originalEquipmentNamesMap = new Map<string, string>();
for (let idx = 0; idx < sortedItems.length && idx < invoiceData.items.length; idx++) {
    const origItem = sortedItems[idx];
    const origEquipmentName = (origItem.equipmentName && origItem.equipmentName.trim() !== '')
        ? origItem.equipmentName.trim()
        : `Equipment ${origItem.equipmentId || origItem.id || 'Unknown'}`;
    const itemCode = invoiceData.items[idx]?.item_code;
    if (itemCode) {
        originalEquipmentNamesMap.set(itemCode, origEquipmentName);
    }
}

const finalVerifiedItems: any[] = [];
for (let i = 0; i < verifiedItems.length; i++) {
    const verifiedItem = verifiedItems[i];
    // Get original equipment name from map or fallback to sortedItems
    const originalEquipmentName = originalEquipmentNamesMap.get(verifiedItem.item_code) ||
        sortedItems[i]?.equipmentName?.trim() ||
        verifiedItem.item_code;

    try {
        const finalCheck = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(verifiedItem.item_code)}`);
        if (finalCheck.data && (finalCheck.data.is_fixed_asset === 1 || finalCheck.data.is_fixed_asset === true)) {
            console.warn(`⚠ FINAL CHECK: Item "${verifiedItem.item_code}" is still a fixed asset. Searching for non-fixed asset version...`);

            // Use ORIGINAL equipment name (from rental item, not ERPNext item_name)
            const normalizedName = originalEquipmentName.replace(/_/g, ' ').trim();

            // Search for non-fixed asset version with same name
            const nonFixedSearch = await this.makeERPNextRequest(
                `/api/resource/Item?filters=[["item_name","=","${encodeURIComponent(normalizedName)}"],["is_fixed_asset","=",0]]&limit_page_length=5`
            );

            if (nonFixedSearch.data && nonFixedSearch.data.length > 0) {
                // Found non-fixed asset version - use it
                const nonFixedAsset = nonFixedSearch.data.find((it: any) =>
                    (it.item_name || it.name) === normalizedName && (it.is_fixed_asset === 0 || it.is_fixed_asset === false)
                ) || nonFixedSearch.data[0];

                const nonFixedCode = nonFixedAsset.name || nonFixedAsset.item_code;
                finalVerifiedItems.push({
                    item_code: nonFixedCode.trim(),
                    qty: verifiedItem.qty,
                    rate: verifiedItem.rate,
                    amount: verifiedItem.amount,
                });
                console.log(`✓ FINAL CHECK: Replaced fixed asset "${verifiedItem.item_code}" with non-fixed asset "${nonFixedCode}"`);
            } else {
                // No non-fixed asset version exists - create new one with ORIGINAL equipment name
                console.log(`Creating new non-fixed asset item with ORIGINAL equipment name: "${normalizedName}"...`);
                const newItemCode = await this.syncEquipmentToERPNext(normalizedName);
                finalVerifiedItems.push({
                    item_code: newItemCode.trim(),
                    qty: verifiedItem.qty,
                    rate: verifiedItem.rate,
                    amount: verifiedItem.amount,
                    uom: verifiedItem.uom,
                    income_account: verifiedItem.income_account,
                    cost_center: verifiedItem.cost_center,
                });
                console.log(`✓ FINAL CHECK: Created new non-fixed asset item "${newItemCode}" for ORIGINAL equipment "${normalizedName}"`);
            }
        } else {
            finalVerifiedItems.push(verifiedItem);
        }
    } catch {
        // If check fails, include the item anyway (it was already verified)
        finalVerifiedItems.push(verifiedItem);
    }
}

// CRITICAL: Remove any internal fields before sending to ERPNext
const cleanedItems = finalVerifiedItems.map((item: any) => {
    const cleaned: any = {
        item_code: item.item_code,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount,
        income_account: item.income_account || defaultIncomeAccount,
        cost_center: item.cost_center || defaultCostCenter, // Ensure cost center is present
        uom: item.uom || 'Nos', // TRACE: Final UOM propagation
        conversion_factor: 1,
        base_rate: item.rate,
        base_amount: item.amount,
    };

    console.log(`[Cleaner] Item ${item.item_code} UOM tracing:`, {
        inputUom: item.uom,
        outputUom: cleaned.uom
    });

    // Ensure all values are valid numbers
    if (isNaN(cleaned.qty) || cleaned.qty <= 0) {
        throw new Error(`Invalid qty for item ${item.item_code}: ${cleaned.qty}`);
    }
    if (isNaN(cleaned.rate) || cleaned.rate < 0) {
        throw new Error(`Invalid rate for item ${item.item_code}: ${cleaned.rate}`);
    }
    if (isNaN(cleaned.amount) || cleaned.amount < 0) {
        throw new Error(`Invalid amount for item ${item.item_code}: ${cleaned.amount}`);
    }
    return cleaned;
});

invoiceData.items = cleanedItems;
const skippedCount = originalItemCount - cleanedItems.length;
if (skippedCount > 0) {
    console.log(`=== ${cleanedItems.length} items verified (${skippedCount} items skipped as fixed assets) ===`);
} else {
    console.log(`=== All ${cleanedItems.length} items verified and corrected ===`);
}

// Log final cleaned items structure
console.log('=== FINAL CLEANED ITEMS (before sending to ERPNext) ===');
console.log(`Total items: ${cleanedItems.length}`);
cleanedItems.slice(0, 3).forEach((item: any, idx: number) => {
    console.log(`Item ${idx + 1}:`, {
        item_code: item.item_code,
        item_code_type: typeof item.item_code,
        qty: item.qty,
        qty_type: typeof item.qty,
        rate: item.rate,
        rate_type: typeof item.rate,
        amount: item.amount,
        amount_type: typeof item.amount,
    });
});
if (cleanedItems.length > 3) {
    console.log(`... and ${cleanedItems.length - 3} more items`);
}

// Validate item data
for (const item of invoiceData.items) {
    if (!item.item_code) {
        throw new Error(`Invalid invoice item: missing item_code`);
    }
    if (item.qty <= 0) {
        throw new Error(`Invalid invoice item quantity for item_code ${item.item_code}: ${item.qty}`);
    }
    if (item.rate < 0 || item.amount < 0) {
        throw new Error(`Invalid invoice item rate or amount for item_code ${item.item_code}`);
    }
}
      } else {
    // If no rental items, create a single line item for the rental
    // Dynamically find a suitable item code
    const suitableItemCode = await this.findSuitableItemCode();

    invoiceData.items = [
        {
            item_code: suitableItemCode,
            item_name: `Rental Service - ${rental.rentalNumber}`,
            description: `Equipment rental service for ${rental.rentalNumber}`,
            qty: 1,
            rate: parseFloat(rental.totalAmount?.toString() || '0') || 0,
            amount: parseFloat(rental.totalAmount?.toString() || '0') || 0,
            uom: 'Nos',
            income_account: incomeAccount, // Use dynamically found account
        },
    ];
}

// Don't set calculated amounts - let ERPNext calculate them
// ERPNext will calculate these automatically based on items and taxes
// Setting them manually can cause validation errors (417 Expectation Failed)
// Create invoice in ERPNext
// The endpoint exists (GET works), so 404 on POST usually means API key lacks create permissions
// Try resource API first, then fallback to method-based API
console.log('=== Creating Invoice in ERPNext ===');
console.log('Invoice Data Keys:', Object.keys(invoiceData));
console.log('Items Count:', invoiceData.items?.length || 0);
console.log('Customer:', invoiceData.customer);
console.log('Company:', invoiceData.company);
console.log('Currency:', invoiceData.currency);

// Log each item for debugging
if (invoiceData.items && invoiceData.items.length > 0) {
    console.log('Invoice Items:');
    invoiceData.items.forEach((item: any, index: number) => {
        console.log(`  Item ${index + 1}:`, {
            item_code: item.item_code,
            item_name: item.item_name,
            qty: item.qty,
            rate: item.rate,
            amount: item.amount,
            uom: item.uom
        });
    });
}

// Log full invoice data for debugging - include EVERYTHING
console.log('=== FULL INVOICE DATA BEING SENT TO ERPNEXT ===');
console.log('Items count:', invoiceData.items?.length || 0);
console.log('Taxes count:', invoiceData.taxes?.length || 0);
console.log('Customer:', invoiceData.customer);
console.log('Company:', invoiceData.company);
console.log('Posting Date:', invoiceData.posting_date);
console.log('Due Date:', invoiceData.due_date);

// Log first 3 items in detail (to avoid huge logs)
if (invoiceData.items && invoiceData.items.length > 0) {
    console.log('=== FIRST 3 ITEMS DETAIL ===');
    for (let i = 0; i < Math.min(3, invoiceData.items.length); i++) {
        console.log(`Item ${i + 1}:`, JSON.stringify(invoiceData.items[i], null, 2));
        console.log(`Item ${i + 1} types:`, {
            item_code: typeof invoiceData.items[i].item_code,
            qty: typeof invoiceData.items[i].qty,
            rate: typeof invoiceData.items[i].rate,
            amount: typeof invoiceData.items[i].amount
        });
    }
    if (invoiceData.items.length > 3) {
        console.log(`... and ${invoiceData.items.length - 3} more items`);
    }
}

// Log taxes detail
if (invoiceData.taxes && invoiceData.taxes.length > 0) {
    console.log('=== TAXES DETAIL ===');
    console.log(JSON.stringify(invoiceData.taxes, null, 2));
}

// Full JSON (truncated if too large)
const fullJson = JSON.stringify(invoiceData, null, 2);
if (fullJson.length > 50000) {
    console.log('=== INVOICE DATA (TRUNCATED - too large) ===');
    console.log(fullJson.substring(0, 50000) + '... [truncated]');
} else {
    console.log('=== FULL INVOICE DATA ===');
    console.log(fullJson);
}
console.log('=== END OF INVOICE DATA ===');

let response;
try {
    console.log('Attempting Resource API: /api/resource/Sales Invoice');

    response = await this.makeERPNextRequest('/api/resource/Sales Invoice', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
    });
    console.log('Resource API Success:', response?.data?.name || response?.name || 'No name in response');
} catch (firstError) {
    console.error('Resource API Failed:', firstError instanceof Error ? firstError.message : String(firstError));

    // If resource API fails with 404 or 417, try method-based API
    if (firstError instanceof Error && (firstError.message.includes('404') || firstError.message.includes('417'))) {
        try {
            console.log('Attempting Method API: /api/method/frappe.client.insert');
            response = await this.makeERPNextRequest('/api/method/frappe.client.insert', {
                method: 'POST',
                body: JSON.stringify({
                    doc: invoiceData
                }),
            });
            console.log('Method API Success:', response?.data?.name || response?.name || 'No name in response');
        } catch (secondError) {
            console.error('Method API Also Failed:', secondError instanceof Error ? secondError.message : String(secondError));
            // Provide more specific error message
            if (firstError.message.includes('417')) {
                // Extract detailed error information
                const errorDetails = {
                    customer: invoiceData.customer,
                    company: invoiceData.company,
                    itemsCount: invoiceData.items?.length || 0,
                    itemCodes: invoiceData.items?.map((i: any) => i.item_code) || [],
                    postingDate: invoiceData.posting_date,
                    dueDate: invoiceData.due_date,
                };

                throw new Error(
                    `ERPNext rejected the invoice data (417 Expectation Failed). ` +
                    `Details: Customer="${errorDetails.customer}", Company="${errorDetails.company}", ` +
                    `Items=${errorDetails.itemsCount}, ItemCodes=[${errorDetails.itemCodes.join(', ')}]. ` +
                    `Item details (first item): Qty=${invoiceData.items?.[0]?.qty}, UOM=${invoiceData.items?.[0]?.uom}, Rate=${invoiceData.items?.[0]?.rate}. ` +
                    `Original error from ERPNext: ${firstError.message}`
                );
            }
            throw secondError; // Re-throw the second error if both fail
        }
    } else {
        throw firstError; // Re-throw the first error if not a 404/417
    }
}

// If we reached here, either Resource API or Method API succeeded.
// The actual `makeERPNextRequest` function handles non-2xx responses by throwing errors.
// So, if `response` is available here, it means the request was successful.
return response.data || response;
    } catch (error) {
    // Enhanced error reporting for the entire createInvoice process
    if (error instanceof Error) {
        if (error.message.includes('ERPNext configuration is missing')) {
            throw new Error(`Configuration Error: ${error.message}. Please check your .env file.`);
        } else if (error.message.includes('Network error')) {
            throw new Error(
                `Connection Error: ${error.message}. Please check your ERPNext server and network connection.`
            );
        } else if (error.message.includes('ERPNext API error')) {
            throw new Error(
                `ERPNext API Error: ${error.message}. Please check your ERPNext configuration and API permissions.`
            );
        } else {
            throw new Error(`Invoice Creation Error: ${error.message}`);
        }
    }
}
  }
