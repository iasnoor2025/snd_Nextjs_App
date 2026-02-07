
  // Sync equipment name to ERPNext item
  static async syncEquipmentToERPNext(equipmentName: string, equipmentId ?: string, plateNumber ?: string): Promise < string > {
    try {
        // Normalize name for comparison
        const normalizedName = equipmentName.toUpperCase().trim();

        // Priority 1: Search by name exactly
        const searchResponse = await this.makeERPNextRequest(`/api/resource/Item?filters=[["item_name","=","${encodeURIComponent(normalizedName)}"]]&limit_page_length=5`);

        if(searchResponse.data && searchResponse.data.length > 0) {
    // Found match(es), prioritize non-fixed assets
    const nonFixedAsset = searchResponse.data.find((it: any) => it.is_fixed_asset === 0 || it.is_fixed_asset === false);

    if (nonFixedAsset) {
        console.log(`✓ Found existing non-fixed asset item in ERPNext: ${nonFixedAsset.name || nonFixedAsset.item_code}`);
        return nonFixedAsset.name || nonFixedAsset.item_code;
    }

    // If only fixed assets found, search for non-fixed asset with same item_name
    console.warn(`⚠ Only fixed asset item found for "${normalizedName}". Attempting to find/create non-fixed asset version...`);
}

// Priority 2: Try to find a non-fixed asset version by searching (in case item_code != item_name)
const nonFixedSearch = await this.makeERPNextRequest(
    `/api/resource/Item?filters=[["item_name","=","${encodeURIComponent(normalizedName)}"],["is_fixed_asset","=",0]]&limit_page_length=5`
);

if (nonFixedSearch.data && nonFixedSearch.data.length > 0) {
    const item = nonFixedSearch.data[0];
    console.log(`✓ Found existing non-fixed asset item (search match): ${item.name || item.item_code}`);
    return item.name || item.item_code;
}

// Item doesn't exist, create it
console.log(`Creating new equipment item in ERPNext with ORIGINAL name: ${normalizedName}`);

// Try multiple code variants to avoid duplicates
const codeVariants = [
    normalizedName, // "1392 DOZER" (original format)
    normalizedName.replace(/\s+/g, '-'), // "1392-DOZER"
    normalizedName.replace(/\s+/g, '_'), // "1392_DOZER"
    normalizedName.replace(/[^a-zA-Z0-9]/g, ''), // "1392DOZER"
];

// Add variant with ID if provided
if (equipmentId) {
    codeVariants.push(`${normalizedName}-${equipmentId}`);
    codeVariants.push(`${equipmentId}-${normalizedName}`);
}

// Remove duplicates
const uniqueVariants = [...new Set(codeVariants)];

for (const variant of uniqueVariants) {
    try {
        // Check if this variant exists first (as a fixed asset or anything else)
        try {
            const check = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(variant)}`);
            if (check.data) {
                // If it exists but is a fixed asset, we can't use this item_code variant directly
                if (check.data.is_fixed_asset === 1 || check.data.is_fixed_asset === true) {
                    console.warn(`Variant "${variant}" is a fixed asset, skipping...`);
                    continue;
                }
                // If it exists and is not fixed asset, return it!
                return check.data.name || check.data.item_code;
            }
        } catch {
            // Not found, proceed with creation
        }

        const newItemData = {
            doctype: 'Item',
            item_code: variant, // Try original format first
            item_name: normalizedName, // Use original equipment name exactly
            item_group: 'Equipment', // Match your ERPNext item group
            stock_uom: 'Nos',
            is_stock_item: 0, // Equipment rental, not stock item
            is_fixed_asset: 0, // CRITICAL: Not a fixed asset (rental equipment, not company asset)
            has_serial_no: 0,
            has_batch_no: 0,
            show_in_website: 0,
            include_item_in_manufacturing: 0,
            valuation_method: 'FIFO',
        };

        const response = await this.makeERPNextRequest('/api/resource/Item', {
            method: 'POST',
            body: JSON.stringify(newItemData),
        });

        console.log(`✓ Successfully created item in ERPNext: ${response.data.name}`);
        return response.data.name;
    } catch (createError) {
        console.error(`Failed to create item variant ${variant}:`, createError instanceof Error ? createError.message : String(createError));
        // Continue to next variant
    }
}

// If all variants fail, try searching one last time for ANY item with that name
const finalSearch = await this.makeERPNextRequest(`/api/resource/Item?filters=[["item_name","like","${encodeURIComponent(`%${normalizedName}%`)}"]]&limit_page_length=5`);
if (finalSearch.data && finalSearch.data.length > 0) {
    // Prefer non-fixed asset
    const item = finalSearch.data.find((it: any) => it.is_fixed_asset === 0 || it.is_fixed_asset === false) || finalSearch.data[0];
    console.warn(`Using existing item after creation failed: ${item.name}`);
    return item.name || item.item_code;
}

throw new Error(`Failed to create or find item for equipment: ${normalizedName}`);
    } catch (error) {
    console.error('Error syncing equipment to ERPNext:', error);
    throw error;
}
  }

  // Update an existing invoice
  static async updateInvoice(invoiceId: string, invoiceData: any): Promise < any > {
    try {
        const response = await this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`, {
            method: 'PUT',
            body: JSON.stringify(invoiceData),
        });

        return response.data || response;
    } catch(error) {
        console.error(`Error updating invoice ${invoiceId}:`, error);
        throw error;
    }
}
