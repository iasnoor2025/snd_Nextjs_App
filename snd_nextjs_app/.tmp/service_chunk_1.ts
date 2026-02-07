import { RentalService } from './rental-service';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || process.env.ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || process.env.ERPNEXT_API_SECRET;

interface ERPNextInvoiceItem {
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
  income_account?: string;
}

interface ERPNextInvoiceData {
  customer: string;
  customer_name?: string;
  posting_date: string;
  due_date: string;
  set_posting_time?: number; // Enable "Edit Posting Date and Time"
  custom_from?: string; // ERPNext custom From date field
  custom_to?: string; // ERPNext custom To date field
  from_date?: string; // ERPNext from_date field
  to_date?: string; // ERPNext to_date field
  custom_subject?: string; // ERPNext custom subject field
  items: ERPNextInvoiceItem[];
  taxes_and_charges?: string;
  taxes_and_charges_table?: any[];
  taxes?: any[]; // Add taxes field as alternative
  tax_amount?: number;
  total?: number;
  grand_total?: number;
  outstanding_amount?: number;
  currency: string;
  conversion_rate?: number;
  selling_price_list?: string;
  price_list_currency?: string;
  plc_conversion_rate?: number;
  company: string;
  doctype: string;
  base_total?: number;
  base_grand_total?: number;
  base_total_taxes_and_charges?: number;
  total_taxes_and_charges?: number;
  base_rounded_total?: number;
  rounded_total?: number;
}

export interface ERPNextDoc {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
}

export interface ERPNextInvoice extends ERPNextInvoiceData, ERPNextDoc {
  status: string;
}

export class ERPNextInvoiceService {
  private static async makeERPNextRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Enhanced configuration validation

    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      const missingVars: string[] = [];
      if (!ERPNEXT_URL) missingVars.push('NEXT_PUBLIC_ERPNEXT_URL');
      if (!ERPNEXT_API_KEY) missingVars.push('NEXT_PUBLIC_ERPNEXT_API_KEY');
      if (!ERPNEXT_API_SECRET) missingVars.push('NEXT_PUBLIC_ERPNEXT_API_SECRET');

      throw new Error(
        `ERPNext configuration is missing. Please check your environment variables: ${missingVars.join(', ')}`
      );
    }

    // Normalize URL - ensure it doesn't have trailing slash, endpoint should start with /
    const baseUrl = ERPNEXT_URL.endsWith('/') ? ERPNEXT_URL.slice(0, -1) : ERPNEXT_URL;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${normalizedEndpoint}`;

    const defaultHeaders = {
      Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `ERPNext API error: ${response.status} ${response.statusText}`;

        // Log full error for debugging
        console.error('=== ERPNext API Error ===');
        console.error('URL:', url);
        console.error('Status:', response.status, response.statusText);
        console.error('Error Response:', errorText);

        // For 404 errors, provide more specific guidance
        if (response.status === 404) {
          errorMessage += ` - Endpoint not found: ${url}. `;
          errorMessage += `This usually means: 1) The doctype 'Sales Invoice' doesn't exist or has a different name, `;
          errorMessage += `2) Your API key doesn't have permissions to access this resource, `;
          errorMessage += `3) The ERPNext API endpoint structure is different. `;
          errorMessage += `Please check your ERPNext instance and API key permissions.`;
        }

        // For 417 errors, provide guidance about data validation
        if (response.status === 417) {
          errorMessage += ` - Expectation Failed. `;
          errorMessage += `This usually means: 1) Required fields are missing or invalid, `;
          errorMessage += `2) Data validation failed on ERPNext side, `;
          errorMessage += `3) The invoice data structure doesn't match ERPNext requirements. `;
          errorMessage += `Please check the invoice data and ensure all required fields are present and valid.`;
        }

        // Try to parse error details if available
        try {
          const errorJson = JSON.parse(errorText);
          console.error('=== Full ERPNext Error Response ===');
          console.error(JSON.stringify(errorJson, null, 2));

          // Extract the full exception traceback if available
          if (errorJson.exc) {
            const excMessage = errorJson.exc;
            console.error('=== Full Exception Traceback ===');
            console.error(excMessage);

            // Try to extract the specific field that's causing the issue
            if (typeof excMessage === 'string') {
              // Look for field names in the error
              const fieldMatch = excMessage.match(/Field\s+['"]([^'"]+)['"]/i) ||
                excMessage.match(/['"]([^'"]+)['"]\s+is\s+required/i) ||
                excMessage.match(/['"]([^'"]+)['"]\s+is\s+invalid/i);
              if (fieldMatch) {
                console.error(`=== Problematic Field: ${fieldMatch[1]} ===`);
              }

              // Look for item-related errors
              if (excMessage.includes('Item') || excMessage.includes('item')) {
                console.error('=== Item-related error detected ===');
                const itemMatch = excMessage.match(/Item[^@]*@node\s*\((\d+)-(\d+)\)/i);
                if (itemMatch) {
                  console.error(`Item node range: ${itemMatch[1]}-${itemMatch[2]}`);
                  console.error('This suggests an issue with a specific item in the items array');
                }
              }

              errorMessage += ` Details: ${excMessage.substring(0, 1500)}`;
            }
          }

          // Special handling for 417 Expectation Failed
          if (response.status === 417) {
            console.error('*** 417 EXPECTATION FAILED DETAILS ***');
            console.error(JSON.stringify(errorJson, null, 2));

            // Extract more specific field errors if present
            const firstError = errorJson.exc_messages ? JSON.parse(errorJson.exc_messages[0]) : null;
            const specificMsg = firstError?.message || errorJson.message || 'Validation failed';
            errorMessage += ` 417 Specifics: ${specificMsg}`;
          }

          if (errorJson.message) {
            console.error('=== Error Message ===');
            console.error(errorJson.message);
            errorMessage += ` Details: ${errorJson.message.substring(0, 500)}`;
          } else if (errorJson.error) {
            errorMessage += ` Details: ${errorJson.error}`;
          } else {
            errorMessage += ` Response: ${errorText.substring(0, 500)}`;
          }
        } catch {
          console.error('=== Raw Error Response (not JSON) ===');
          console.error(errorText);
          errorMessage += ` Response: ${errorText.substring(0, 500)}`;
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      return responseData;
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        // Check if it's a network/connection error
        if (fetchError.message.includes('fetch failed') ||
          fetchError.message.includes('ECONNREFUSED') ||
          fetchError.message.includes('ENOTFOUND') ||
          fetchError.message.includes('timeout')) {
          throw new Error(
            `Network error connecting to ERPNext at ${baseUrl}: ${fetchError.message}. Please check your ERPNext server and network connection.`
          );
        }
        // Re-throw if it's already a formatted error
        throw fetchError;
      } else {
        throw new Error('Unknown network error connecting to ERPNext');
      }
    }
  }

  static async createInvoice(invoiceData: ERPNextInvoiceData): Promise<ERPNextInvoice> {
    try {
      // Enhanced configuration validation
      if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
        throw new Error('ERPNext configuration is missing');
      }

      // 1. Data Validation
      if (!invoiceData.customer) throw new Error('Customer is required');
      if (!invoiceData.items || invoiceData.items.length === 0) throw new Error('Items are required');

      // 2. KSA VAT Compliance
      // Check if taxes are present, if not add them
      if (!invoiceData.taxes || invoiceData.taxes.length === 0) {
        try {
          const companyName = invoiceData.company || 'Samhan Naser Al-Dosri Est';
          const taxAccount = await this.findSuitableTaxAccount(companyName);
          invoiceData.taxes = [{
            charge_type: 'On Net Total',
            account_head: taxAccount,
            description: 'VAT 15%',
            rate: 15
          }];
          console.log(`Added KSA compliance tax table (VAT 15%) with account: ${taxAccount}`);
        } catch (error) {
          console.warn('Failed to add default tax table:', error);
          // Continue without taxes if we can't find the account, ERPNext might handle it or reject it
        }
      }

      // 3. Send to ERPNext
      console.log('=== Creating Generic Invoice in ERPNext ===');
      console.log('Customer:', invoiceData.customer);
      console.log('Items Count:', invoiceData.items.length);

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
            throw new Error(
              `Failed to create invoice in ERPNext using both Resource and Method APIs. ` +
              `Original error: ${firstError instanceof Error ? firstError.message : String(firstError)}. ` +
              `Secondary error: ${secondError instanceof Error ? secondError.message : String(secondError)}`
            );
          }
        } else {
          throw firstError;
        }
      }

      return response.data || response;

    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Safe date formatting that stays in local time to avoid timezone shifts
   */
  private static formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static async createRentalInvoice(rental: any, invoiceNumber: string, billingMonth?: string): Promise<ERPNextInvoice> {
    try {
      // Get the actual company name from ERPNext to ensure it matches
      let companyName = 'Samhan Naser Al-Dosri Est';
      try {
        const companyResponse = await this.makeERPNextRequest('/api/resource/Company?limit_page_length=1');
        if (companyResponse.data && companyResponse.data.length > 0) {
          companyName = companyResponse.data[0].name;
          console.log(`Using company name from ERPNext: ${companyName}`);
        } else {
          console.warn('Could not fetch company from ERPNext, using default:', companyName);
        }
      } catch (companyError) {
        console.warn('Could not fetch company name from ERPNext, using default:', companyName, companyError);
      }

      // Get a suitable income account for the company
      const incomeAccount = await this.findSuitableIncomeAccount();

      // Enhanced rental data validation

      if (!rental.customer?.name && !rental.customerName && !rental.customerId) {
        throw new Error('Customer information is required for invoice generation');
      }

      // Always use the rental's calculated amounts (subtotal, taxAmount, totalAmount)
      // These should be pre-calculated and accurate
      const subtotal = parseFloat(rental.subtotal?.toString() || '0') || 0;
      const taxAmount = parseFloat(rental.taxAmount?.toString() || '0') || 0;
      const totalAmount = parseFloat(rental.totalAmount?.toString() || '0') || 0;
      if (totalAmount <= 0) {
        throw new Error('Rental must have a valid total amount');
      }

      // Validate customer exists in ERPNext
      // First, try to get the customer's ERPNext ID from the database
      let validatedCustomerName: string;
      let customerName = rental.customer?.name || rental.customerName || `CUST-${rental.customerId}`;

      // Fetch customer's erpnextId from database if available
      try {
        const { db } = await import('@/lib/db');
        const { customers } = await import('@/lib/drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const customerRecord = await db
          .select({ erpnextId: customers.erpnextId, name: customers.name })
          .from(customers)
          .where(eq(customers.id, rental.customerId || rental.customer?.id || 0))
          .limit(1);

        if (customerRecord.length > 0 && customerRecord[0].erpnextId) {
          validatedCustomerName = customerRecord[0].erpnextId;
          console.log(`Using ERPNext ID for customer: ${validatedCustomerName} (from database)`);

          // CRITICAL: Even if we have an ID, we should verify it exists and is linked
          // Many old records might be unlinked and cause 417 errors
          const verifyDetail = await this.makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(validatedCustomerName)}`);
          const targetCoTrim = companyName.trim();
          const isLinked = verifyDetail.data?.accounts?.some((a: any) => a.company?.trim() === targetCoTrim) ||
            verifyDetail.data?.companies?.some((c: any) => c.company?.trim() === targetCoTrim) ||
            verifyDetail.data?.default_company?.trim() === targetCoTrim;

          if (!isLinked) {
            console.warn(`Customer ID ${validatedCustomerName} from DB is NOT linked to ${targetCoTrim}. Falling back to search.`);
            validatedCustomerName = customerName;
          }
        } else {
          // If no erpnextId, try to find customer in ERPNext by name
          validatedCustomerName = customerName;
          console.log(`No ERPNext ID found, will search by name: ${customerName}`);
        }
      } catch (dbError) {
        console.warn('Could not fetch customer ERPNext ID from database:', dbError);
        validatedCustomerName = customerName;
      }

      // If we don't have an ERPNext ID, try to find customer in ERPNext by name
      if (!validatedCustomerName || validatedCustomerName === customerName) {
        // Try to find customer in ERPNext
        try {
          // 1. Try search first to find ALL potential variations (e.g. ones with/without spaces)
          const searchFilters = encodeURIComponent(JSON.stringify([
            ['customer_name', 'like', `%${customerName.replace(/&/g, '%').trim()}%`]
          ]));
          const searchResult = await this.makeERPNextRequest(`/api/resource/Customer?filters=${searchFilters}&fields=["name","customer_name"]&limit_page_length=10`);

          if (searchResult.data && searchResult.data.length > 0) {
            console.log(`Found ${searchResult.data.length} potential customer variations in ERPNext.`);

            // 2. Iterate through variations and find the one LINKED to our company
            let linkedCustomerName = null;
            const targetCompany = companyName.trim();

            for (const cand of searchResult.data) {
              try {
                const detail = await this.makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(cand.name)}`);
                const isLinked = detail.data?.accounts?.some((a: any) => a.company?.trim() === targetCompany) ||
                  detail.data?.companies?.some((c: any) => c.company?.trim() === targetCompany) ||
                  detail.data?.default_company?.trim() === targetCompany;

                if (isLinked) {
                  linkedCustomerName = cand.name;
                  console.log(`✓ Validated customer with company linkage: ${linkedCustomerName}`);
                  break;
                }
              } catch (e) {
                console.warn(`Failed to fetch details for candidate customer ${cand.name}:`, e);
              }
            }

            if (linkedCustomerName) {
              validatedCustomerName = linkedCustomerName;
            } else {
              // 3. Fallback: If no linked record, use exact match if it exists, or the first variation
              const exactMatch = searchResult.data.find((c: any) => c.name === customerName || c.customer_name === customerName);
              validatedCustomerName = exactMatch ? exactMatch.name : searchResult.data[0].name;
              console.warn(`No customer variation found with explicit linkage to "${companyName}". Using fallback: ${validatedCustomerName}`);
            }
          } else {
            // No search results, use original name as last resort
            console.warn(`Customer "${customerName}" not found in ERPNext via search. Using original name.`);
            validatedCustomerName = customerName;
          }
        } catch (customerError) {
          console.warn('Could not validate customer in ERPNext, proceeding anyway:', customerError);
          validatedCustomerName = customerName;
        }
      }

      // Get rental items from the rental service
      const rentalItems = await RentalService.getRentalItems(rental.id);

      // Don't set taxes manually - let ERPNext handle tax calculation
      // If you need specific taxes, use a tax template name instead
      // const taxTemplateName = 'VAT 15%'; // Use if you have a tax template in ERPNext

      // Calculate dates based on billing month if provided
      let postingDate: string;
      let dueDate: string;
      let fromDate: string;
      let toDate: string;
      let invoiceSubject: string;

      if (billingMonth) {
        // Parse the billing month (format: YYYY-MM)
        const [year, month] = billingMonth.split('-');
        const billingYear = parseInt(year);
        const billingMonthNum = parseInt(month);

        // Calculate dates for the billing month - use UTC to avoid timezone issues
        const monthStart = new Date(Date.UTC(billingYear, billingMonthNum - 1, 1, 0, 0, 0, 0)); // First day of billing month
        const monthEnd = new Date(Date.UTC(billingYear, billingMonthNum, 0, 23, 59, 59, 999)); // Last day of billing month

        // For monthly invoices, From date should ALWAYS be the first day of the billing month
        // This ensures consistency and matches the report period
        const calculatedFromDate = monthStart;

        // To date: End of billing month
        const calculatedToDate = monthEnd;

        // Invoice date (posting date): End of billing month
        postingDate = this.formatDate(monthEnd);

        // Payment due date: 30 days after end of billing month
        const calculatedDueDate = new Date(monthEnd);
        calculatedDueDate.setUTCDate(calculatedDueDate.getUTCDate() + 30);
        dueDate = this.formatDate(calculatedDueDate);

        // From/To dates for the billing period - format as YYYY-MM-DD
        fromDate = this.formatDate(monthStart);
        toDate = this.formatDate(monthEnd);

        // Invoice subject - use full month name and year
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[billingMonthNum - 1];
        invoiceSubject = `Invoice for ${rental.rentalNumber} - ${monthName} ${billingYear}`;
      } else {
        // For non-monthly billing, use provided dates or defaults
        postingDate = rental.invoiceDate || this.formatDate(new Date());
        dueDate = rental.paymentDueDate || this.formatDate(new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000));
        fromDate = rental.customFrom || rental.invoiceDate || this.formatDate(new Date());
        toDate = rental.customTo || rental.paymentDueDate || this.formatDate(new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000));
        invoiceSubject = rental.customSubject || `Invoice for ${rental.rentalNumber} - ${rental.invoiceMonth || 'Monthly Billing'}`;
      }

      // Fetch mandatory accounts and cost center before initializing invoiceData
      const defaultIncomeAccount = await this.findSuitableIncomeAccount();
      const defaultCostCenter = await this.findSuitableCostCenter();
      const receivableAccount = await this.findSuitableReceivableAccount();
      console.log(`ERPNext Defaults: Income=${defaultIncomeAccount}, CostCenter=${defaultCostCenter}, Receivable=${receivableAccount}`);

      // Prepare invoice data - use only standard ERPNext fields
      // Use the validated customer name and company name
      const invoiceData: any = {
        doctype: 'Sales Invoice',
        naming_series: 'ACC-SINV-.YYYY.-', // Use standard naming series found in diagnostics
        customer: validatedCustomerName, // Use validated customer name (ERPNext ID)
        posting_date: postingDate,
        due_date: dueDate,
        company: companyName, // Use company name from ERPNext
        custom_subject: invoiceSubject, // Add invoice subject (custom field in ERPNext)
        debit_to: receivableAccount, // MANDATORY: Receivable account (Debtors - SND)
        custom_from: fromDate, // MANDATORY in their setup
        custom_to: toDate, // MANDATORY in their setup
        currency: 'SAR',
        conversion_rate: 1,
        selling_price_list: 'Standard Selling',
        price_list_currency: 'SAR',
        plc_conversion_rate: 1,
        items: [],
      };

      console.log('=== Invoice Data Prepared ===');
      console.log('Customer:', validatedCustomerName);
      console.log('Posting Date:', postingDate);
      console.log('Due Date:', dueDate);
      console.log('Company:', invoiceData.company);

      // KSA Compliance: MUST include tax rate in Sales Taxes and Charges Table
      // This is REQUIRED - ERPNext will reject invoices without taxes
      // Find the correct tax account for the company
      const taxAccount = await this.findSuitableTaxAccount(companyName);
      console.log(`Using tax account: ${taxAccount} for company: ${companyName}`);

      // Add VAT 15% tax table (required by KSA compliance)
      // Structure matches ERPNext UI: Type="On Net Total", Account Head="Output VAT 15% - SND", Rate=15
      invoiceData.taxes = [
        {
          charge_type: 'On Net Total',
          account_head: taxAccount,
          description: 'VAT 15%',
          rate: 15,
        }
      ];
      console.log('Added KSA compliance tax table (VAT 15%)');

      // Add rental items to invoice
      if (rentalItems.length > 0) {
        // Filter items to only include those active in the billing month (if specified)
        // This matches the report logic - include ALL items that appear in the report (no deduplication)
        let filteredItems = rentalItems;

        if (billingMonth) {
          const [year, month] = billingMonth.split('-');
          const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
          const monthEnd = new Date(parseInt(year), parseInt(month), 0);
          monthEnd.setHours(23, 59, 59, 999);

          filteredItems = rentalItems.filter((item: any) => {
            const itemStartDate = item.startDate ? new Date(item.startDate) : null;
            if (!itemStartDate) return false;

            const itemCompletedDate = item.completedDate || (item as any).completed_date;
            let itemEndDate: Date;

            if (itemCompletedDate) {
              itemEndDate = new Date(itemCompletedDate);
            } else if (rental.status === 'completed' && rental.actualEndDate) {
              itemEndDate = new Date(rental.actualEndDate);
            } else {
              itemEndDate = new Date(); // Current date for active items
            }

            // Item must start before or during the month, and end after or during the month
            // This matches the report logic exactly - no deduplication
            return itemStartDate <= monthEnd && itemEndDate >= monthStart;
          });
        }

        // No deduplication - include all items as they appear in the report
        // Sort items by equipment name (like the report does)
        // Group by equipment, sort equipment groups alphabetically, then sort items within each group
        const groupedByEquipment = filteredItems.reduce((acc: any, item: any) => {
          const equipmentName = item.equipmentName || `Equipment ${item.equipmentId}`;
          if (!acc[equipmentName]) {
            acc[equipmentName] = [];
          }
          acc[equipmentName].push(item);
          return acc;
        }, {});

        // Sort items within each equipment group by active status first, then by start date
        Object.keys(groupedByEquipment).forEach(key => {
          groupedByEquipment[key].sort((a: any, b: any) => {
            // First sort by active status (active items first, then completed)
            const aIsActive = a.status === 'active';
            const bIsActive = b.status === 'active';

            if (aIsActive && !bIsActive) return -1; // Active comes first
            if (!aIsActive && bIsActive) return 1; // Active comes first

            // If both have same status, sort by start date
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            if (dateA !== dateB) return dateA - dateB;

            return 0;
          });
        });

        // Flatten and sort equipment groups alphabetically
        const equipmentKeys = Object.keys(groupedByEquipment).sort();
        const sortedItems: any[] = [];
        equipmentKeys.forEach(key => {
          sortedItems.push(...groupedByEquipment[key]);
        });

        // Validate that we have items after filtering
        if (sortedItems.length === 0) {
          throw new Error(
            `No rental items found for billing month ${billingMonth}. ` +
            `Please ensure the rental has active items during this period.`
          );
        }

        // Get or create a generic service item from ERPNext
        // Using a single item for all equipment is more reliable than trying to match each equipment name
        let serviceItemCode: string;
        let serviceItemName: string | undefined;

        const STANDARD_SERVICE_ITEM_CODE = 'RENTAL-SERVICE';

        try {
          // First, try to find an existing service/rental item
          serviceItemCode = await this.findSuitableItemCode();
          console.log(`Found existing service item code: ${serviceItemCode}`);

          // Fetch the actual item name from ERPNext to ensure it matches
          try {
            const itemResponse = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(serviceItemCode)}`);
            serviceItemName = itemResponse.data?.item_name || itemResponse.data?.name;
            console.log(`Service item name from ERPNext: ${serviceItemName}`);
          } catch (itemError) {
            console.warn('Could not fetch item name from ERPNext, will omit item_name:', itemError);
          }
        } catch (codeError) {
          // No suitable item found, try to use or create the standard service item
          console.log(`No suitable service item found, checking for standard item: ${STANDARD_SERVICE_ITEM_CODE}`);

          try {
            // Check if the standard item exists
            const checkResponse = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(STANDARD_SERVICE_ITEM_CODE)}`);
            if (checkResponse.data) {
              serviceItemCode = STANDARD_SERVICE_ITEM_CODE;
              serviceItemName = checkResponse.data.item_name || checkResponse.data.name || 'Rental Service';
              console.log(`Standard service item already exists: ${serviceItemCode}`);
            }
          } catch (checkError) {
            // Item doesn't exist, create it
            console.log(`Standard service item doesn't exist, creating: ${STANDARD_SERVICE_ITEM_CODE}`);

            try {
              // Create the item in ERPNext with all required fields
              const newItemData = {
                doctype: 'Item',
                item_code: STANDARD_SERVICE_ITEM_CODE,
                item_name: 'Rental Service',
                item_group: 'Services',
                stock_uom: 'Nos',
                is_stock_item: 0, // Service item, not stock item
                has_variants: 0,
                include_item_in_manufacturing: 0,
                description: 'Equipment rental service',
              };

              const createResponse = await this.makeERPNextRequest('/api/resource/Item', {
                method: 'POST',
                body: JSON.stringify(newItemData),
              });

              serviceItemCode = STANDARD_SERVICE_ITEM_CODE;
              serviceItemName = createResponse.data?.item_name || createResponse.data?.name || 'Rental Service';
              console.log(`Created new rental service item in ERPNext: ${serviceItemCode}`);

              // Verify the item was created by fetching it
              try {
                const verifyResponse = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(serviceItemCode)}`);
                if (verifyResponse.data) {
                  serviceItemName = verifyResponse.data.item_name || verifyResponse.data.name || serviceItemName;
                  console.log(`Verified service item exists: ${serviceItemCode}, name: ${serviceItemName}`);
                }
              } catch (verifyError) {
                console.warn('Could not verify created item, but continuing:', verifyError);
              }
            } catch (createError) {
              console.error('Failed to create service item in ERPNext:', createError);
              throw new Error(`Failed to create service item in ERPNext: ${createError instanceof Error ? createError.message : String(createError)}. Please create an item manually in ERPNext.`);
            }
          }
        }

        // Final validation - ensure we have a valid item code
        if (!serviceItemCode || serviceItemCode.trim() === '') {
          throw new Error('Failed to get or create a service item. Please create at least one Item in ERPNext before creating invoices.');
        }

        // CRITICAL: Verify the item actually exists in ERPNext and get its exact code
        // If verification fails, try to create it, or use ANY available item as fallback
        let itemVerified = false;
        try {
          const verifyItem = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(serviceItemCode)}`);
          if (!verifyItem.data) {
            throw new Error(`Item "${serviceItemCode}" does not exist in ERPNext`);
          }

          // Use the exact item code from ERPNext (might be different due to naming rules)
          const exactItemCode = verifyItem.data.name || verifyItem.data.item_code || serviceItemCode;
          if (exactItemCode !== serviceItemCode) {
            console.log(`Item code adjusted from "${serviceItemCode}" to "${exactItemCode}" (ERPNext naming rules)`);
            serviceItemCode = exactItemCode;
          }

          // Verify item is enabled and can be used
          if (verifyItem.data.disabled === 1) {
            throw new Error(`Item "${serviceItemCode}" is disabled in ERPNext`);
          }

          console.log(`✓ Verified item exists in ERPNext: ${serviceItemCode}`);
          console.log(`Item details:`, {
            name: verifyItem.data.name,
            item_code: verifyItem.data.item_code,
            item_name: verifyItem.data.item_name,
            item_group: verifyItem.data.item_group,
            is_stock_item: verifyItem.data.is_stock_item,
            stock_uom: verifyItem.data.stock_uom,
            disabled: verifyItem.data.disabled,
            company: verifyItem.data.company
          });

          // Verify item belongs to the company (if company is specified)
          if (companyName && verifyItem.data.company && verifyItem.data.company !== companyName) {
            console.warn(`Item "${serviceItemCode}" belongs to company "${verifyItem.data.company}" but invoice is for "${companyName}". This may cause issues.`);
          }

          // Update serviceItemName from verified item
          serviceItemName = verifyItem.data.item_name || verifyItem.data.name;
          itemVerified = true;
        } catch (verifyError) {
          console.error(`✗ Item verification failed for ${serviceItemCode}:`, verifyError);

          // Try to create the item if it doesn't exist
          if (verifyError instanceof Error && verifyError.message.includes('does not exist')) {
            console.log(`Attempting to create missing item: ${serviceItemCode}`);
            try {
              const newItemData = {
                doctype: 'Item',
                item_code: serviceItemCode,
                item_name: serviceItemName || 'Rental Service',
                item_group: 'Services',
                stock_uom: 'Nos',
                is_stock_item: 0,
                has_variants: 0,
                include_item_in_manufacturing: 0,
                description: 'Equipment rental service',
              };

              const createResponse = await this.makeERPNextRequest('/api/resource/Item', {
                method: 'POST',
                body: JSON.stringify(newItemData),
              });

              console.log(`✓ Created missing item: ${serviceItemCode}`);
              itemVerified = true;
            } catch (createError) {
              console.warn(`Failed to create item ${serviceItemCode}, will try fallback:`, createError);
            }
          }

          // If still not verified, use ANY available item as fallback
          if (!itemVerified) {
            try {
              const availableItems = await this.getAvailableItems();
              if (availableItems.length > 0) {
                // Prefer service items, but use any item if needed
                const serviceItem = availableItems.find(item =>
                  item.item_group?.toLowerCase().includes('service') ||
                  item.item_name?.toLowerCase().includes('service') ||
                  item.item_name?.toLowerCase().includes('rental')
                );

                const fallbackItem = serviceItem || availableItems[0];
                serviceItemCode = fallbackItem.item_code || fallbackItem.name;
                serviceItemName = fallbackItem.item_name || fallbackItem.name;
                console.warn(`Using fallback item: ${serviceItemCode} (${serviceItem ? 'service item' : 'first available item'})`);

                // Verify the fallback item exists
                const fallbackVerify = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(serviceItemCode)}`);
                if (fallbackVerify.data && fallbackVerify.data.disabled !== 1) {
                  itemVerified = true;
                  console.log(`✓ Fallback item verified: ${serviceItemCode}`);
                }
              }
            } catch (fallbackError) {
              console.error('Fallback item selection failed:', fallbackError);
            }
          }
        }
