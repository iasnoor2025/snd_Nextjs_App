import { RentalService } from './rental-service';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

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

    const url = `${ERPNEXT_URL}${endpoint}`;

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
        
        throw new Error(
          `ERPNext API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const responseData = await response.json();
      
      return responseData;
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        
        throw new Error(`Network error connecting to ERPNext: ${fetchError.message}`);
      } else {
        
        throw new Error('Unknown network error connecting to ERPNext');
      }
    }
  }

  static async createRentalInvoice(rental: any, invoiceNumber: string): Promise<any> {
    try {

      // Enhanced rental data validation

      if (!rental.customer?.name && !rental.customerName && !rental.customerId) {
        throw new Error('Customer information is required for invoice generation');
      }

      if (!rental.totalAmount || parseFloat(rental.totalAmount.toString()) <= 0) {
        // If stored total is zero, calculate from rental items
        
        const rentalItems = await RentalService.getRentalItems(rental.id);
        const calculatedTotal = rentalItems.reduce((sum, item) => {
          const itemTotal = parseFloat(item.totalPrice?.toString() || '0') || 0;
          return sum + itemTotal;
        }, 0);

        if (calculatedTotal > 0) {
          
          // Update the rental object with calculated total
          rental.totalAmount = calculatedTotal.toString();
        } else {
          throw new Error('Rental must have a valid total amount (calculated from items)');
        }
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
        posting_date:
          new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10),
        due_date:
          new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0] ||
          new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
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
        
        invoiceData.items = rentalItems.map((item, index) => {
          const mappedItem = {
            item_code: item.equipmentName || `EQ-${item.equipmentId}`,
            item_name: item.equipmentName || `Equipment ${item.equipmentId}`,
            description: item.notes || `Rental of ${item.equipmentName}`,
            qty: 1, // Default to 1 for equipment rental
            rate: parseFloat(item.unitPrice?.toString() || '0') || 0,
            amount: parseFloat(item.totalPrice?.toString() || '0') || 0,
            uom: 'Nos',
            income_account: incomeAccount, // Use dynamically found account
          };
          
          return mappedItem;
        });
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

      // Calculate totals
      const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);

      // Calculate VAT using the existing template rate (15%)
      const vatRate = 15;
      const vatAmount = (subtotal * vatRate) / 100;
      const totalWithVAT = subtotal + vatAmount;
      const grandTotalWithVAT =
        totalWithVAT - (parseFloat(rental.discount?.toString() || '0') || 0);

      // ERPNext will use the existing tax template data
      invoiceData.total = totalWithVAT;
      invoiceData.grand_total = grandTotalWithVAT;
      invoiceData.outstanding_amount = grandTotalWithVAT;
      invoiceData.tax_amount = vatAmount;

      // Log the complete invoice data for debugging

      // Create invoice in ERPNext
      const response = await this.makeERPNextRequest('/api/resource/Sales Invoice', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });

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

      // Fallback to a generic code
      
      return 'SERVICE';
    } catch (error) {
      
      return 'SERVICE';
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
}
