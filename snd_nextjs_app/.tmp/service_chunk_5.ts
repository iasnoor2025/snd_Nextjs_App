


  // Test ERPNext connection
  static async testConnection(): Promise < boolean > {
    try {

        const response = await this.makeERPNextRequest('/api/method/frappe.auth.get_logged_user');

        return true;
    } catch(error) {

        return false;
    }
}

  // Get available items from ERPNext
  static async getAvailableItems(): Promise < any[] > {
    try {

        const response = await this.makeERPNextRequest('/api/resource/Item?limit_page_length=100');

        const items = response.data || [];

        // Normalize item data - ERPNext uses 'name' as item_code
        return items.map((item: any) => ({
            ...item,
            item_code: item.item_code || item.name, // Use name if item_code is not present
            item_name: item.item_name || item.item_name || item.name, // Ensure item_name exists
        }));
    } catch(error) {

        return [];
    }
}

  // Get available accounts from ERPNext
  static async getAvailableAccounts(): Promise < any[] > {
    try {

        const response = await this.makeERPNextRequest('/api/resource/Account?limit_page_length=100');

        return response.data || [];
    } catch(error) {

        return [];
    }
}

  // Find a suitable tax account for the company
  // Priority: "Output VAT 15%" accounts (as used in existing invoices)
  static async findSuitableTaxAccount(companyName: string): Promise < string > {
    try {
        const accounts = await this.getAvailableAccounts();

        // Look for tax accounts - prioritize by company match, then by name
        const taxAccounts = accounts.filter(
            account => account.account_type === 'Tax'
        );

        if(taxAccounts.length > 0) {
    // First, try to find accounts that belong to the company
    const companyTaxAccounts = taxAccounts.filter(
        account => account.company === companyName || !account.company
    );

    if (companyTaxAccounts.length > 0) {
        // HIGHEST PRIORITY: "Output VAT 15%" accounts (as used in existing invoices)
        const outputVATAccount = companyTaxAccounts.find(
            account =>
                account.account_name?.toLowerCase().includes('output vat 15') ||
                account.name?.toLowerCase().includes('output vat 15') ||
                account.account_name?.toLowerCase().includes('output vat') ||
                account.name?.toLowerCase().includes('output vat')
        );
        if (outputVATAccount) {
            console.log(`Found Output VAT 15% account: ${outputVATAccount.name}`);
            return outputVATAccount.name;
        }

        // Second priority: accounts with "VAT" in the name
        const vatAccount = companyTaxAccounts.find(
            account =>
                account.account_name?.toLowerCase().includes('vat') ||
                account.name?.toLowerCase().includes('vat')
        );
        if (vatAccount) {
            console.log(`Found VAT account: ${vatAccount.name}`);
            return vatAccount.name;
        }

        // Third priority: accounts with "Duties" in the name
        const dutiesAccount = companyTaxAccounts.find(
            account =>
                account.account_name?.toLowerCase().includes('duties') ||
                account.name?.toLowerCase().includes('duties')
        );
        if (dutiesAccount) {
            console.log(`Found Duties account: ${dutiesAccount.name}`);
            return dutiesAccount.name;
        }

        // Use first company tax account
        console.log(`Using first company tax account: ${companyTaxAccounts[0].name}`);
        return companyTaxAccounts[0].name;
    }

    // If no company-specific account, search all tax accounts
    // HIGHEST PRIORITY: "Output VAT 15%" accounts
    const outputVATAccount = taxAccounts.find(
        account =>
            account.account_name?.toLowerCase().includes('output vat 15') ||
            account.name?.toLowerCase().includes('output vat 15') ||
            account.account_name?.toLowerCase().includes('output vat') ||
            account.name?.toLowerCase().includes('output vat')
    );
    if (outputVATAccount) {
        console.warn(`Using Output VAT 15% account from different company: ${outputVATAccount.name}`);
        return outputVATAccount.name;
    }

    // Second priority: accounts with "VAT" in the name
    const vatAccount = taxAccounts.find(
        account =>
            account.account_name?.toLowerCase().includes('vat') ||
            account.name?.toLowerCase().includes('vat')
    );
    if (vatAccount) {
        console.warn(`Using VAT account from different company: ${vatAccount.name}`);
        return vatAccount.name;
    }

    // Third priority: accounts with "Duties" in the name
    const dutiesAccount = taxAccounts.find(
        account =>
            account.account_name?.toLowerCase().includes('duties') ||
            account.name?.toLowerCase().includes('duties')
    );
    if (dutiesAccount) {
        console.warn(`Using Duties account from different company: ${dutiesAccount.name}`);
        return dutiesAccount.name;
    }

    // Use first available tax account
    console.warn(`Using first available tax account: ${taxAccounts[0].name}`);
    return taxAccounts[0].name;
}

// Last resort: use "Output VAT 15% - SND" (as used in existing invoices)
console.warn('No tax account found, using fallback: Output VAT 15% - SND');
return 'Output VAT 15% - SND';
    } catch (error) {
    console.error('Error finding tax account:', error);
    return 'Output VAT 15% - SND'; // Fallback - matches existing invoices
}
  }

  // Find a suitable income account for the company
  static async findSuitableIncomeAccount(): Promise < string > {
    try {
        const accounts = await this.getAvailableAccounts();

        // Look for income/sales accounts
        const incomeAccounts = accounts.filter(
            account =>
                !account.is_group && (
                    account.account_type === 'Income' ||
                    account.account_name?.toLowerCase().includes('service') ||
                    account.account_name?.toLowerCase().includes('rental') ||
                    account.name?.toLowerCase().includes('service') ||
                    account.name?.toLowerCase().includes('rental')
                )
        );

        // Priority 1: "Sales - SND" (found in diagnostics as standard)
        const salesSND = incomeAccounts.find(a => a.name === 'Sales - SND');
        if(salesSND) return 'Sales - SND';

        // Priority 2: "Service - SND" (found in diagnostics)
        const serviceSND = incomeAccounts.find(a => a.name === 'Service - SND');
        if(serviceSND) return 'Service - SND';

        if(incomeAccounts.length > 0) {
    return incomeAccounts[0].name;
}

return 'Service - SND'; // Final fallback based on diagnostics
    } catch (error) {
    console.error('Error finding income account:', error);
    return 'Service - SND';
}
  }

  // Find a suitable cost center for the company
  static async findSuitableCostCenter(): Promise < string > {
    try {
        const response = await this.makeERPNextRequest('/api/resource/Cost Center?filters=[["is_group","=",0]]&limit_page_length=100');
        const costCenters = response.data || [];

        // Priority 1: "Main - SND" (found in diagnostics)
        const mainSND = costCenters.find((cc: any) => cc.name === 'Main - SND');
        if(mainSND) return 'Main - SND';

        // Priority 2: Any account with "Main"
        const anyMain = costCenters.find((cc: any) => cc.name.toLowerCase().includes('main'));
        if(anyMain) return anyMain.name;

        if(costCenters.length > 0) {
    return costCenters[0].name;
}

return 'Main - SND'; // Fallback
    } catch (error) {
    console.error('Error finding cost center:', error);
    return 'Main - SND';
}
  }

  // Find a suitable receivable account (debit_to)
  static async findSuitableReceivableAccount(): Promise < string > {
    try {
        const accounts = await this.getAvailableAccounts();

        // Look for receivable accounts
        const receivableAccounts = accounts.filter(
            account =>
                !account.is_group && (
                    account.account_type === 'Receivable' ||
                    account.name.toLowerCase().includes('debtor') ||
                    account.account_name?.toLowerCase().includes('receivable')
                )
        );

        // Priority 1: "Debtors - SND" (found in diagnostics)
        const debtorsSND = receivableAccounts.find(a => a.name === 'Debtors - SND');
        if(debtorsSND) return 'Debtors - SND';

        if(receivableAccounts.length > 0) {
    return receivableAccounts[0].name;
}

return 'Debtors - SND'; // Fallback
    } catch (error) {
    console.error('Error finding receivable account:', error);
    return 'Debtors - SND';
}
  }

  // Find a suitable item code for rental services
  static async findSuitableItemCode(): Promise < string > {
    try {
        const items = await this.getAvailableItems();

        if(items.length === 0) {
    throw new Error('No items found in ERPNext. Please create at least one Item in ERPNext before creating invoices.');
}

// Look for common service-related items
const serviceItems = items.filter(
    item => {
        const itemCode = item.item_code || item.name;
        const itemName = item.item_name || item.item_name;
        return itemName?.toLowerCase().includes('service') ||
            itemName?.toLowerCase().includes('rental') ||
            itemName?.toLowerCase().includes('equipment') ||
            itemCode?.toLowerCase().includes('service') ||
            itemCode?.toLowerCase().includes('rental');
    }
);

if (serviceItems.length > 0) {
    const code = serviceItems[0].item_code || serviceItems[0].name;
    if (code) return code;
}

// If no service items, use the first available item
if (items.length > 0) {
    const code = items[0].item_code || items[0].name;
    if (code) return code;
}

// This should never be reached due to the check above, but just in case
throw new Error('No suitable item code found in ERPNext. Please create items in ERPNext before creating invoices.');
    } catch (error) {
    // Re-throw with better error message
    if (error instanceof Error) {
        if (error.message.includes('No items found') || error.message.includes('No suitable item')) {
            throw error;
        }
        throw new Error(`Failed to find suitable item code: ${error.message}. Please ensure items exist in ERPNext.`);
    }
    throw new Error(`Failed to find suitable item code: ${String(error)}. Please ensure items exist in ERPNext.`);
}
  }
