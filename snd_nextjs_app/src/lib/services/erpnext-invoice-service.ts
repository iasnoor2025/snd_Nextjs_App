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

export class ERPNextInvoiceService {
  private static async makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
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
        
        // Try to parse error details if available
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed Error JSON:', JSON.stringify(errorJson, null, 2));
          
          if (errorJson.message || errorJson.exc) {
            const excMessage = errorJson.exc || errorJson.message;
            // Extract meaningful error from exception
            if (typeof excMessage === 'string' && excMessage.length > 0) {
              errorMessage += ` Details: ${excMessage.substring(0, 500)}`;
            } else {
              errorMessage += ` Details: ${JSON.stringify(errorJson).substring(0, 200)}`;
            }
          } else if (errorJson.error) {
            errorMessage += ` Details: ${errorJson.error}`;
          } else {
            errorMessage += ` Response: ${errorText.substring(0, 200)}`;
          }
        } catch {
          errorMessage += ` Response: ${errorText.substring(0, 200)}`;
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

  static async createRentalInvoice(rental: any, invoiceNumber: string, billingMonth?: string): Promise<any> {
    try {

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

      // Get rental items from the rental service
      
      const rentalItems = await RentalService.getRentalItems(rental.id);

      // Get a suitable income account for the company
      
      const incomeAccount = await this.findSuitableIncomeAccount();

      // Get tax template data
      // const taxTemplateData = await this.getTaxTemplateData('ضريبة القيمة المضافة 15 % - SND');

      // Create proper tax table structure for KSA compliance based on existing template
      const ksaTaxTable = [
        {
          idx: 1,
          charge_type: 'On Net Total',
          account_head: 'VAT - SND',
          description: 'VAT',
          rate: 15,
          tax_amount: 0, // Will be calculated by ERPNext
          total: 0, // Will be calculated by ERPNext
          doctype: 'Sales Taxes and Charges',
        },
      ];

      // Prepare invoice data
      const invoiceData: ERPNextInvoiceData = {
        doctype: 'Sales Invoice',
        customer: rental.customer?.name || rental.customerName || `CUST-${rental.customerId}`,
        customer_name: rental.customer?.name || rental.customerName,
        posting_date: rental.invoiceDate || new Date().toISOString().split('T')[0],
        due_date: rental.paymentDueDate || new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        set_posting_time: 1, // Enable "Edit Posting Date and Time"
        // Use the correct ERPNext field names for From/To dates
        custom_from: rental.customFrom || rental.invoiceDate || new Date().toISOString().split('T')[0], // ERPNext custom From date
        custom_to: rental.customTo || rental.paymentDueDate || new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // ERPNext custom To date
        from_date: rental.customFrom || rental.invoiceDate || new Date().toISOString().split('T')[0], // ERPNext from_date field
        to_date: rental.customTo || rental.paymentDueDate || new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // ERPNext to_date field
        custom_subject: rental.customSubject || `Invoice for ${rental.rentalNumber} - ${rental.invoiceMonth || 'Monthly Billing'}`, // ERPNext custom subject field
        items: [],
        currency: 'SAR',
        company: 'Samhan Naser Al-Dosri Est',
        selling_price_list: 'Standard Selling',
        price_list_currency: 'SAR',
        plc_conversion_rate: 1,
        conversion_rate: 1,
        taxes: ksaTaxTable, // Use 'taxes' field
        tax_amount: 0, // Include tax amount field
      };

      // Add rental items to invoice
      if (rentalItems.length > 0) {
        // Get available items from ERPNext to match item codes
        const availableItems = await this.getAvailableItems();
        
        invoiceData.items = await Promise.all(
          rentalItems.map(async (item, index) => {
            // Try to find matching item in ERPNext by name or code
            const equipmentName = item.equipmentName || `Equipment ${item.equipmentId}`;
            const potentialItemCode = item.equipmentName || `EQ-${item.equipmentId}`;
            
            // Look for exact match first
            let matchedItem = availableItems.find(
              ai => ai.item_code === potentialItemCode || 
                    ai.item_name === equipmentName ||
                    ai.item_code?.toLowerCase() === equipmentName.toLowerCase() ||
                    ai.item_name?.toLowerCase() === equipmentName.toLowerCase()
            );
            
            // If no exact match, try to find similar item
            if (!matchedItem) {
              matchedItem = availableItems.find(
                ai => ai.item_name?.toLowerCase().includes(equipmentName.toLowerCase().split(' ')[0]) ||
                      ai.item_code?.toLowerCase().includes(equipmentName.toLowerCase().split(' ')[0])
              );
            }
            
            // Use matched item code if found, otherwise use findSuitableItemCode
            const itemCode = matchedItem?.item_code || await this.findSuitableItemCode();
            
            // Calculate duration based on rate type (this will be used as quantity)
            const rateType = item.rateType || 'daily';
            const itemStartDate = item.startDate || rental.startDate;
            const itemCompletedDate = item.completedDate || (item as any).completed_date;
            
            let duration = 1; // Default quantity
            let uom = 'Nos'; // Default UOM
            
            // For hourly rates, try to use actual timesheet hours if available
            if (rateType === 'hourly') {
              try {
                const { db } = await import('@/lib/db');
                const { rentalEquipmentTimesheets } = await import('@/lib/drizzle/schema');
                const { eq, and, gte, lte } = await import('drizzle-orm');
                
                let startDateStr: string;
                let endDateStr: string;
                
                // Determine date range for timesheet query
                if (billingMonth && rental.customFrom && rental.customTo) {
                  // For monthly billing, use billing month period
                  startDateStr = rental.customFrom;
                  endDateStr = rental.customTo;
                } else if (itemStartDate) {
                  // For non-monthly billing, use item date range
                  startDateStr = new Date(itemStartDate).toISOString().split('T')[0];
                  if (itemCompletedDate) {
                    endDateStr = new Date(itemCompletedDate).toISOString().split('T')[0];
                  } else if (rental.status === 'completed' && rental.expectedEndDate) {
                    endDateStr = new Date(rental.expectedEndDate).toISOString().split('T')[0];
                  } else {
                    endDateStr = new Date().toISOString().split('T')[0];
                  }
                } else {
                  startDateStr = new Date().toISOString().split('T')[0];
                  endDateStr = new Date().toISOString().split('T')[0];
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
                
                // If we have timesheet data, use actual hours
                if (timesheets.length > 0) {
                  const totalHours = timesheets.reduce((sum, ts) => {
                    const regular = parseFloat(ts.regularHours?.toString() || '0') || 0;
                    const overtime = parseFloat(ts.overtimeHours?.toString() || '0') || 0;
                    return sum + regular + overtime;
                  }, 0);
                  
                  if (totalHours > 0) {
                    duration = totalHours;
                    uom = 'Hour';
                  }
                }
              } catch (error) {
                // If timesheet fetch fails, fall through to date-based calculation
              }
            }
            
            // For daily rates with timesheet hours, convert hours to days for quantity
            if (rateType === 'daily' && duration > 1 && uom === 'Hour') {
              // Convert hours to days (10 hours = 1 day)
              duration = Math.ceil(duration / 10);
              uom = 'Day';
            }
            
            // If duration is still 1 (default) or not set from timesheet, calculate from dates
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
                uom = 'Month';
              } else {
                // Daily rate - calculate days
                duration = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
                uom = 'Day';
              }
            }
            
            // Calculate amount based on unit price and duration
            const unitPrice = parseFloat(item.unitPrice?.toString() || '0') || 0;
            const amount = unitPrice * duration;
            
            const mappedItem = {
              item_code: itemCode,
              item_name: equipmentName,
              description: item.notes || `Rental of ${equipmentName} (${duration} ${uom}${duration !== 1 ? 's' : ''})`,
              qty: duration, // Use calculated duration as quantity
              rate: unitPrice, // Unit price per day/hour/week/month
              amount: amount, // Total amount = unit price * duration
              uom: uom, // Unit of measure based on rate type
              income_account: incomeAccount, // Use dynamically found account
            };
            
            return mappedItem;
          })
        );
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

      // Use pre-calculated amounts from rental instead of recalculating
      invoiceData.base_total = subtotal;
      invoiceData.total = subtotal;
      invoiceData.base_grand_total = totalAmount;
      invoiceData.grand_total = totalAmount;
      invoiceData.outstanding_amount = totalAmount;
      invoiceData.base_total_taxes_and_charges = taxAmount;
      invoiceData.total_taxes_and_charges = taxAmount;
      invoiceData.base_rounded_total = totalAmount;
      invoiceData.rounded_total = totalAmount;
      // Create invoice in ERPNext
      // The endpoint exists (GET works), so 404 on POST usually means API key lacks create permissions
      // Try resource API first, then fallback to method-based API
      console.log('=== Creating Invoice in ERPNext ===');
      console.log('Invoice Data Keys:', Object.keys(invoiceData));
      console.log('Items Count:', invoiceData.items?.length || 0);
      
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
        
        // If resource API fails with 404, try method-based API (sometimes has different permissions)
        if (firstError instanceof Error && firstError.message.includes('404')) {
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
            // Both methods failed - likely a permissions issue
            throw new Error(
              `Failed to create invoice in ERPNext. ` +
              `The API key can read Sales Invoices but cannot create them. ` +
              `Please check ERPNext API key permissions: Settings → Integrations → API Keys → Your Key → Ensure "Write" permission for Sales Invoice. ` +
              `Original error: ${firstError instanceof Error ? firstError.message : String(firstError)}`
            );
          }
        } else {
          throw firstError;
        }
      }

      return response.data || response;
    } catch (error) {

      // Enhanced error reporting
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
      } else {
        throw new Error(`Unknown error during invoice creation: ${String(error)}`);
      }
    }
  }

  // Test ERPNext connection
  static async testConnection(): Promise<boolean> {
    try {
      
      const response = await this.makeERPNextRequest('/api/method/frappe.auth.get_logged_user');
      
      return true;
    } catch (error) {
      
      return false;
    }
  }

  // Get available items from ERPNext
  static async getAvailableItems(): Promise<any[]> {
    try {
      
      const response = await this.makeERPNextRequest('/api/resource/Item?limit_page_length=100');
      
      return response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  // Get available accounts from ERPNext
  static async getAvailableAccounts(): Promise<any[]> {
    try {
      
      const response = await this.makeERPNextRequest('/api/resource/Account?limit_page_length=100');
      
      return response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  // Find a suitable income account for the company
  static async findSuitableIncomeAccount(): Promise<string> {
    try {
      const accounts = await this.getAvailableAccounts();

      // Look for income/sales accounts - use the actual account names we can see
      const incomeAccounts = accounts.filter(
        account =>
          account.account_type === 'Income' ||
          account.account_name?.toLowerCase().includes('sales') ||
          account.account_name?.toLowerCase().includes('income') ||
          account.account_name?.toLowerCase().includes('revenue') ||
          account.name?.toLowerCase().includes('sales') ||
          account.name?.toLowerCase().includes('income') ||
          account.name?.toLowerCase().includes('revenue')
      );

      if (incomeAccounts.length > 0) {
        
        return incomeAccounts[0].name;
      }

      // If no income accounts found, use a known working account from the list
      // Based on the available accounts we can see, use "Accounts Receivable - SND"
      const fallbackAccount = 'Accounts Receivable - SND';
      
      return fallbackAccount;
    } catch (error) {
      
      return 'Accounts Receivable - SND'; // Use known working account
    }
  }

  // Find a suitable item code for rental services
  static async findSuitableItemCode(): Promise<string> {
    try {
      const items = await this.getAvailableItems();

      if (items.length === 0) {
        throw new Error('No items found in ERPNext. Please create at least one Item in ERPNext before creating invoices.');
      }

      // Look for common service-related items
      const serviceItems = items.filter(
        item =>
          item.item_name?.toLowerCase().includes('service') ||
          item.item_name?.toLowerCase().includes('rental') ||
          item.item_name?.toLowerCase().includes('equipment') ||
          item.item_code?.toLowerCase().includes('service') ||
          item.item_code?.toLowerCase().includes('rental')
      );

      if (serviceItems.length > 0) {
        return serviceItems[0].item_code;
      }

      // If no service items, use the first available item
      if (items.length > 0) {
        return items[0].item_code;
      }

      // This should never be reached due to the check above, but just in case
      throw new Error('No suitable item code found in ERPNext. Please create items in ERPNext before creating invoices.');
    } catch (error) {
      // Re-throw with better error message
      if (error instanceof Error && error.message.includes('No items found') || error.message.includes('No suitable item')) {
        throw error;
      }
      throw new Error(`Failed to find suitable item code: ${error instanceof Error ? error.message : String(error)}. Please ensure items exist in ERPNext.`);
    }
  }

  // Get existing tax template data
  static async getTaxTemplateData(templateName: string): Promise<any[]> {
    try {
      
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Taxes and Charges Template/${encodeURIComponent(templateName)}`
      );

      if (response.data && response.data.taxes) {
        
        return response.data.taxes;
      }

      // Return default VAT structure based on the template name
      return [
        {
          charge_type: 'On Net Total',
          account_head: 'VAT - SND',
          description: 'Value Added Tax (15%)',
          rate: 15,
          tax_amount: 0, // Will be calculated by ERPNext
          total: 0, // Will be calculated by ERPNext
        },
      ];
    } catch (error) {
      
      // Fallback to default VAT structure
      return [
        {
          charge_type: 'On Net Total',
          account_head: 'VAT - SND',
          description: 'Value Added Tax (15%)',
          rate: 15,
          tax_amount: 0,
          total: 0,
        },
      ];
    }
  }

  // Discover existing tax templates and their structures
  static async discoverTaxTemplates(): Promise<any> {
    try {

      // Get all tax templates
      const templatesResponse = await this.makeERPNextRequest(
        '/api/resource/Sales Taxes and Charges Template?limit_page_length=100'
      );
      const templates = templatesResponse.data || [];

      // Get detailed structure of each template
      const detailedTemplates: any[] = [];
      for (const template of templates.slice(0, 5)) {
        // Limit to first 5 for performance
        try {
          
          const detailResponse = await this.makeERPNextRequest(
            `/api/resource/Sales Taxes and Charges Template/${encodeURIComponent(template.name)}`
          );

          if (detailResponse.data) {
            detailedTemplates.push({
              name: template.name,
              template_name: template.template_name,
              company: detailResponse.data.company,
              taxes: detailResponse.data.taxes || [],
              total_taxes_and_charges: detailResponse.data.total_taxes_and_charges,
            });
          }
        } catch (error) {
          
        }
      }

      return {
        totalTemplates: templates.length,
        templates: templates.map((t: any) => ({ name: t.name, template_name: t.template_name })),
        detailedTemplates: detailedTemplates,
      };
    } catch (error) {
      
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Create proper tax table structure for KSA compliance
  static createKSATaxTable(subtotal: number): any[] {
    try {

      // KSA VAT rate is 15%
      const vatRate = 15;
      const vatAmount = (subtotal * vatRate) / 100;

      // This is the exact structure ERPNext expects for the tax table
      const taxTable = [
        {
          charge_type: 'On Net Total',
          account_head: 'VAT - SND',
          description: 'Value Added Tax (15%)',
          rate: vatRate,
          tax_amount: vatAmount,
          total: subtotal + vatAmount,
          row_id: 1,
          idx: 1,
          doctype: 'Sales Taxes and Charges',
        },
      ];

      return taxTable;
    } catch (error) {
      
      return [];
    }
  }

  static async getInvoice(invoiceId: string): Promise<any> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`
      );
      return response.data;
    } catch (error) {
      
      throw new Error(
        `Failed to fetch ERPNext invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Check if invoice exists in ERPNext without throwing error
  static async checkInvoiceExists(invoiceId: string): Promise<boolean> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`
      );
      return response.data && response.data.name === invoiceId;
    } catch (error) {
      
      return false;
    }
  }

  static async updateInvoice(
    invoiceId: string,
    updateData: Partial<ERPNextInvoiceData>
  ): Promise<any> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );
      return response.data;
    } catch (error) {
      
      throw new Error(
        `Failed to update ERPNext invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async submitInvoice(invoiceId: string): Promise<any> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}/submit`,
        {
          method: 'POST',
        }
      );
      return response.data;
    } catch (error) {
      
      throw new Error(
        `Failed to submit ERPNext invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async cancelInvoice(invoiceId: string): Promise<any> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}/cancel`,
        {
          method: 'POST',
        }
      );
      return response.data;
    } catch (error) {
      
      throw new Error(
        `Failed to cancel ERPNext invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get invoices by customer
  static async getInvoicesByCustomer(customerId: string): Promise<any[]> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Invoice?filters=[["customer","=","${customerId}"]]&limit_page_length=100&order_by=posting_date desc`
      );
      return response.data || [];
    } catch (error) {
      throw new Error(
        `Failed to fetch invoices for customer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get invoices by rental number (if stored in ERPNext)
  static async getInvoicesByRentalNumber(rentalNumber: string): Promise<any[]> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Sales Invoice?filters=[["custom_rental_number","=","${rentalNumber}"]]&limit_page_length=100&order_by=posting_date desc`
      );
      return response.data || [];
    } catch (error) {
      throw new Error(
        `Failed to fetch invoices for rental: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
