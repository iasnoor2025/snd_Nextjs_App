
// Final validation - ensure item_code is set
if (!itemCode || itemCode.trim() === '') {
    console.error(`Item validation failed - missing item_code:`, { item, equipmentName, itemCode });
    throw new Error(`Missing item_code for equipment: ${equipmentName || 'Unknown'}`);
}

// equipmentName is guaranteed to be set from initialization above, so no need to check it again
console.log(`Item ${index + 1} validated: item_code=${itemCode}, item_name=${equipmentName}`);

// Build description based on rate type
let description = item.notes;
if (!description) {
    if (rateType === 'monthly') {
        description = `Monthly rental for ${equipmentName} (Asset #${item.equipmentId}) (${duration} month${duration !== 1 ? 's' : ''})`;
    } else {
        description = `Rental of ${equipmentName} (Asset #${item.equipmentId}) (${duration} ${uom}${duration !== 1 ? 's' : ''})`;
    }
}

// Ensure qty, rate, and amount are valid numbers
const finalQty = Math.max(0, duration || 1);
const finalRate = Math.max(0, rate || 0);
const finalAmount = Math.max(0, amount || (finalRate * finalQty));

// Build the item object - use absolute minimal structure
// ERPNext requires: item_code, qty, rate
// Validate all values are valid numbers
if (isNaN(finalQty) || finalQty <= 0) {
    throw new Error(`Invalid quantity for item ${equipmentName}: ${finalQty}`);
}
if (isNaN(finalRate) || finalRate < 0) {
    throw new Error(`Invalid rate for item ${equipmentName}: ${finalRate}`);
}
if (isNaN(finalAmount) || finalAmount < 0) {
    throw new Error(`Invalid amount for item ${equipmentName}: ${finalAmount}`);
}

// Use minimal structure - only required fields
// IMPORTANT: Don't use toFixed() as it returns a string - use Math.round for precision
const mappedItem: any = {
    item_code: itemCode.trim(), // String
    qty: Math.round(finalQty * 100) / 100, // Round to 2 decimals, keep as number
    rate: Math.round(finalRate * 100) / 100, // Round to 2 decimals, keep as number
    amount: Math.round(finalAmount * 100) / 100, // Round to 2 decimals, keep as number
    income_account: defaultIncomeAccount, // Add income account (Sales - SND)
    cost_center: defaultCostCenter, // Add mandatory cost center (Main - SND)
    uom: uom || 'Nos', // Use the calculated UOM (e.g. 'Hour', 'Day', 'Week', or 'Nos')
    conversion_factor: 1, // Standard conversion factor
    base_rate: Math.round(finalRate * 100) / 100, // Matching rate for SAR
    base_amount: Math.round(finalAmount * 100) / 100, // Matching amount for SAR
    _originalEquipmentName: equipmentName, // Store original equipment name for final check
};

// Final validation - ensure all values are valid
if (!mappedItem.item_code || mappedItem.item_code.trim() === '') {
    throw new Error(`Empty item_code for item ${equipmentName}`);
}
if (mappedItem.qty <= 0 || isNaN(mappedItem.qty) || !isFinite(mappedItem.qty)) {
    throw new Error(`Invalid qty for item ${equipmentName}: ${mappedItem.qty}`);
}
if (mappedItem.rate < 0 || isNaN(mappedItem.rate) || !isFinite(mappedItem.rate)) {
    throw new Error(`Invalid rate for item ${equipmentName}: ${mappedItem.rate}`);
}
if (mappedItem.amount < 0 || isNaN(mappedItem.amount) || !isFinite(mappedItem.amount)) {
    throw new Error(`Invalid amount for item ${equipmentName}: ${mappedItem.amount}`);
}

console.log(`Item ${index + 1} structure:`, JSON.stringify(mappedItem));
console.log(`Item ${index + 1} validation:`, {
    item_code: mappedItem.item_code,
    item_code_length: mappedItem.item_code.length,
    qty: mappedItem.qty,
    qty_type: typeof mappedItem.qty,
    rate: mappedItem.rate,
    rate_type: typeof mappedItem.rate,
    amount: mappedItem.amount,
    amount_type: typeof mappedItem.amount
});

return mappedItem;
          })
        );


// Validate that all items were created successfully
if (!invoiceData.items || invoiceData.items.length === 0) {
    throw new Error('Failed to create invoice items. No valid items were generated.');
}

// CRITICAL: Verify ALL items exist in ERPNext before sending
// Match the exact structure that works in the test endpoint
console.log(`=== Verifying ${invoiceData.items.length} items exist in ERPNext ===`);
const verifiedItems: any[] = [];

for (let i = 0; i < invoiceData.items.length; i++) {
    const item = invoiceData.items[i];
    let verifiedItemCode = item.item_code;

    try {
        // Step 1: Try direct lookup with the exact item code
        let verifyItem;
        try {
            verifyItem = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(item.item_code)}`);

            if (verifyItem.data && verifyItem.data.disabled !== 1) {
                // CRITICAL: Check if item is a fixed asset - find or create non-fixed asset version
                if (verifyItem.data.is_fixed_asset === 1 || verifyItem.data.is_fixed_asset === true) {
                    console.warn(`⚠ Item "${item.item_code}" is a fixed asset. Searching for non-fixed asset version...`);

                    // Search for non-fixed asset version with same name
                    // PRIORITIZE item_code (Asset Tag) over item_name (Model Number) to preserve specific asset ID
                    const itemName = verifyItem.data.name || item.item_code;

                    // Double check we aren't using a weird name
                    const searchName = (itemName === verifyItem.data.item_name) ? item.item_code : itemName;

                    const searchResponse = await this.makeERPNextRequest(
                        `/api/resource/Item?filters=[["item_name","=","${encodeURIComponent(searchName)}"],["is_fixed_asset","=",0]]&limit_page_length=5`
                    );

                    if (searchResponse.data && searchResponse.data.length > 0) {
                        // Found non-fixed asset version - use it
                        const nonFixedAsset = searchResponse.data.find((it: any) =>
                            (it.item_name || it.name) === searchName && (it.is_fixed_asset === 0 || it.is_fixed_asset === false)
                        ) || searchResponse.data[0];

                        verifiedItemCode = nonFixedAsset.name || nonFixedAsset.item_code;
                        console.log(`✓ Found non-fixed asset version: "${item.item_code}" -> "${verifiedItemCode}"`);
                    } else {
                        // No non-fixed asset version exists - create new one
                        console.log(`Creating new non-fixed asset item for "${searchName}"...`);
                        const normalizedName = searchName.replace(/_/g, ' ').trim();
                        const newItemCode = await this.syncEquipmentToERPNext(normalizedName);
                        verifiedItemCode = newItemCode;
                        console.log(`✓ Created new non-fixed asset item: "${verifiedItemCode}"`);
                    }
                } else {
                    // Item exists and is enabled and not a fixed asset - use the exact code from ERPNext
                    verifiedItemCode = verifyItem.data.name || verifyItem.data.item_code;
                    console.log(`✓ Item ${i + 1}/${invoiceData.items.length} verified (direct): ${verifiedItemCode}`);
                }
            } else if (verifyItem.data && verifyItem.data.disabled === 1) {
                throw new Error(`Item "${item.item_code}" is disabled in ERPNext`);
            } else {
                throw new Error(`Item "${item.item_code}" not found in ERPNext`);
            }
        } catch {
            // Step 2: Direct lookup failed, try searching by item_name
            console.log(`Direct lookup failed for "${item.item_code}", trying search...`);

            // Normalize the item code for search (remove special chars, normalize spaces)
            const searchTerm = item.item_code.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();

            // Try exact match first
            try {
                const exactSearch = await this.makeERPNextRequest(
                    `/api/resource/Item?filters=[["item_name","=","${encodeURIComponent(item.item_code)}"]]&limit_page_length=5`
                );

                if (exactSearch.data && exactSearch.data.length > 0) {
                    // Prioritize non-fixed asset items
                    const nonFixedMatch = exactSearch.data.find((it: any) =>
                        (it.item_name || it.name || '').trim() === item.item_code.trim() &&
                        (it.is_fixed_asset === 0 || it.is_fixed_asset === false) &&
                        it.disabled !== 1
                    );

                    const match = nonFixedMatch || exactSearch.data.find((it: any) =>
                        (it.item_name || it.name || '').trim() === item.item_code.trim() && it.disabled !== 1
                    ) || exactSearch.data[0];

                    verifiedItemCode = match.name || match.item_code;

                    // Verify it's not a fixed asset
                    const matchDetails = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(verifiedItemCode)}`);
                    if (matchDetails.data && (matchDetails.data.is_fixed_asset === 1 || matchDetails.data.is_fixed_asset === true)) {
                        // It's a fixed asset - search for non-fixed version or create new
                        // PRIORITIZE item_code (Asset Tag) over item_name (Model Number)
                        const itemName = matchDetails.data.name || verifiedItemCode;

                        // Double check we aren't using a weird name
                        const searchName = (itemName === matchDetails.data.item_name) ? verifiedItemCode : itemName;

                        const nonFixedSearch = await this.makeERPNextRequest(
                            `/api/resource/Item?filters=[["item_name","=","${encodeURIComponent(searchName)}"],["is_fixed_asset","=",0]]&limit_page_length=5`
                        );

                        if (nonFixedSearch.data && nonFixedSearch.data.length > 0) {
                            const nonFixedAsset = nonFixedSearch.data.find((it: any) =>
                                (it.item_name || it.name) === searchName && (it.is_fixed_asset === 0 || it.is_fixed_asset === false)
                            ) || nonFixedSearch.data[0];
                            verifiedItemCode = nonFixedAsset.name || nonFixedAsset.item_code;
                            console.log(`✓ Found non-fixed asset version: "${item.item_code}" -> "${verifiedItemCode}"`);
                        } else {
                            // Create new non-fixed asset item
                            console.log(`Creating new non-fixed asset item for "${searchName}"...`);
                            const normalizedName = searchName.replace(/_/g, ' ').trim();
                            verifiedItemCode = await this.syncEquipmentToERPNext(normalizedName);
                            console.log(`✓ Created new non-fixed asset item: "${verifiedItemCode}"`);
                        }
                    } else {
                        console.log(`✓ Item ${i + 1}/${invoiceData.items.length} found by exact name: ${verifiedItemCode}`);
                    }
                } else {
                    throw new Error('No exact match');
                }
            } catch {
                // Step 3: Try like search
                const likeSearch = await this.makeERPNextRequest(
                    `/api/resource/Item?filters=[["item_name","like","${encodeURIComponent(`%${searchTerm}%`)}"]]&limit_page_length=10`
                );

                if (likeSearch.data && likeSearch.data.length > 0) {
                    // Find best match (exact or closest)
                    const normalizedSearch = searchTerm.toUpperCase().replace(/\s+/g, ' ');
                    const bestMatch = likeSearch.data.find((it: any) => {
                        const itName = (it.item_name || it.name || '').toUpperCase().replace(/\s+/g, ' ');
                        return itName === normalizedSearch || itName.includes(normalizedSearch) || normalizedSearch.includes(itName);
                    }) || likeSearch.data[0];

                    verifiedItemCode = bestMatch.name || bestMatch.item_code;

                    // Verify the found item is enabled
                    const finalVerify = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(verifiedItemCode)}`);
                    if (finalVerify.data && finalVerify.data.disabled === 1) {
                        throw new Error(`Found item "${verifiedItemCode}" but it is disabled`);
                    }

                    // CRITICAL: Check if item is a fixed asset - find or create non-fixed asset version
                    if (finalVerify.data && (finalVerify.data.is_fixed_asset === 1 || finalVerify.data.is_fixed_asset === true)) {
                        console.warn(`⚠ Item "${verifiedItemCode}" is a fixed asset. Searching for non-fixed asset version...`);

                        // Search for non-fixed asset version with same name
                        // PRIORITIZE item_code (Asset Tag) over item_name
                        const itemName = finalVerify.data.name || verifiedItemCode;
                        const searchName = (itemName === finalVerify.data.item_name) ? verifiedItemCode : itemName;

                        const searchResponse = await this.makeERPNextRequest(
                            `/api/resource/Item?filters=[["item_name","=","${encodeURIComponent(searchName)}"],["is_fixed_asset","=",0]]&limit_page_length=5`
                        );

                        if (searchResponse.data && searchResponse.data.length > 0) {
                            // Found non-fixed asset version - use it
                            const nonFixedAsset = searchResponse.data.find((it: any) =>
                                (it.item_name || it.name) === searchName && (it.is_fixed_asset === 0 || it.is_fixed_asset === false)
                            ) || searchResponse.data[0];

                            verifiedItemCode = nonFixedAsset.name || nonFixedAsset.item_code;
                            console.log(`✓ Found non-fixed asset version: "${item.item_code}" -> "${verifiedItemCode}"`);
                        } else {
                            // No non-fixed asset version exists - create new one
                            console.log(`Creating new non-fixed asset item for "${searchName}"...`);
                            const normalizedName = searchName.replace(/_/g, ' ').trim();
                            const newItemCode = await this.syncEquipmentToERPNext(normalizedName);
                            verifiedItemCode = newItemCode;
                            console.log(`✓ Created new non-fixed asset item: "${verifiedItemCode}"`);
                        }
                    } else {
                        console.log(`✓ Item ${i + 1}/${invoiceData.items.length} found by search: "${item.item_code}" -> "${verifiedItemCode}"`);
                    }
                } else {
                    throw new Error(`Item "${item.item_code}" not found in ERPNext (searched: "${searchTerm}")`);
                }
            }
        }

        // Create verified item with ONLY the minimal fields (matching test endpoint)
        // Store original equipment name for final check if needed
        verifiedItems.push({
            item_code: verifiedItemCode.trim(),
            qty: Math.round(item.qty * 100) / 100,
            rate: Math.round(item.rate * 100) / 100,
            amount: Math.round(item.amount * 100) / 100,
            uom: item.uom || 'Nos',
            income_account: item.income_account || defaultIncomeAccount,
            cost_center: item.cost_center || defaultCostCenter,
            _originalEquipmentName: item._originalEquipmentName || item.item_code, // Store original name
        });

    } catch (verifyError) {
        console.error(`✗ Item ${i + 1}/${invoiceData.items.length} verification failed: ${item.item_code}`);
        console.error(`Error details:`, verifyError);
        throw new Error(
            `Item "${item.item_code}" does not exist or is invalid in ERPNext. ` +
            `Please ensure the equipment exists in ERPNext or it will be created automatically. ` +
            `Error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
        );
    }
}

// CRITICAL: Ensure we have at least one item
if (verifiedItems.length === 0) {
    throw new Error(
        `No valid items found for invoice. All items were either fixed assets (which require asset selection) or invalid. ` +
        `Please ensure at least one equipment item exists in ERPNext and is not a fixed asset.`
    );
}
