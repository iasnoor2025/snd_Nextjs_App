import { db } from '@/lib/db';
import { customers, rentalEquipmentTimesheets, rentalTimesheetReceived, rentalItems, rentals } from '@/lib/drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { RentalService } from './rental-service';

// ERPNext configuration
const NEXT_PUBLIC_ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const NEXT_PUBLIC_ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const NEXT_PUBLIC_ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

const ERPNEXT_URL = process.env.ERPNEXT_URL || NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY || NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET || NEXT_PUBLIC_ERPNEXT_API_SECRET;

export interface ERPNextInvoiceItem {
  item_code: string;
  qty: number;
  rate: number;
  amount?: number;
  description?: string;
  uom?: string;
  income_account?: string;
  cost_center?: string;
  warehouse?: string;
}

export interface ERPNextInvoiceData {
  customer: string;
  company: string;
  posting_date: string;
  due_date: string;
  items: ERPNextInvoiceItem[];
  currency?: string;
  taxes_and_charges?: string;
  taxes?: any[];
}

export interface ERPNextInvoice {
  name: string;
  customer: string;
  total: number;
  grand_total: number;
  status: string;
  docstatus: number;
  outstanding_amount?: number;
  taxes?: any[];
  items?: any[];
}

export class ERPNextInvoiceService {
  private static async makeERPNextRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = ERPNEXT_URL?.replace(/\/$/, '');
    if (!baseUrl) {
      throw new Error('ERPNext URL is not configured.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `ERPNext API error: ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.message) errorMessage += ` - ${errorJson.message}`;
          if (response.status === 417) {
            console.error('*** 417 ERR ***', responseText);
          }
        } catch {
          errorMessage += ` - ${responseText.substring(0, 500)}`;
        }
        throw new Error(errorMessage);
      }

      return JSON.parse(responseText);
    } catch (fetchError) {
      if (fetchError instanceof Error) throw fetchError;
      throw new Error('Network error connecting to ERPNext');
    }
  }

  private static formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static async createInvoice(invoiceData: ERPNextInvoiceData): Promise<ERPNextInvoice> {
    const response = await this.makeERPNextRequest('/api/resource/Sales Invoice', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
    return response.data || response;
  }

  static async createRentalInvoice(rental: any, invoiceNumber: string, billingMonth?: string): Promise<any> {
    try {
      console.log(`=== Creating ERPNext Rental Invoice for Rental #${rental.id} ===`);

      const incomeAccount = await this.findSuitableIncomeAccount();
      const costCenter = await this.findSuitableCostCenter();
      const receivableAccount = await this.findSuitableReceivableAccount();
      const targetCo = rental.company || 'Samhan Naser Al-Dosri Est';

      const customerRecord = await db.select().from(customers).where(eq(customers.id, rental.customerId)).limit(1);
      let validatedCustomer = rental.customerName || rental.customer?.name || 'Unknown Customer';
      if (customerRecord.length > 0 && customerRecord[0].erpnextId) {
        validatedCustomer = customerRecord[0].erpnextId;
      }

      const invoiceData: any = {
        doctype: 'Sales Invoice',
        customer: validatedCustomer,
        company: targetCo,
        posting_date: rental.invoiceDate || this.formatDate(new Date()),
        due_date: rental.paymentDueDate || this.formatDate(new Date()),
        set_posting_time: 1, // Allow backdating invoices
        currency: 'SAR',
        selling_price_list: 'Standard Selling',
        debit_to: receivableAccount,
        items: []
      };


      const fromDateStr = rental.customFrom || rental.startDate;
      const toDateStr = rental.customTo || rental.expectedEndDate || rental.invoiceDate;

      // Add custom From/To dates for billing period (ERPNext custom fields)
      if (fromDateStr) {
        invoiceData.custom_from = fromDateStr;
      }
      if (toDateStr) {
        invoiceData.custom_to = toDateStr;
      }

      // Add subject line
      if (rental.customSubject) {
        invoiceData.custom_subject = rental.customSubject;
      } else if (rental.invoiceMonth) {
        invoiceData.custom_subject = `Invoice for ${rental.invoiceMonth}`;
      }

      const rentalItemsList = rental.rentalItems || rental.rental_items || rental.items || [];

      if (rentalItemsList.length > 0) {
        const serviceItemCode = await this.findSuitableItemCode();


        invoiceData.items = await Promise.all(
          rentalItemsList.map(async (item: any) => {
            const name = item.equipmentName || item.item_name || 'Equipment';
            // Include Istimara in item code for better identification
            const itemNameWithIstimara = item.equipmentIstimara ? `${name} (${item.equipmentIstimara})` : name;
            let itemCode;
            try {
              itemCode = await this.syncEquipmentToERPNext(itemNameWithIstimara, item.equipmentId);
            } catch {
              itemCode = serviceItemCode;
            }


            const rateType = item.rateType || 'daily';
            let duration = 1;
            let uom = 'Nos';
            let timesheetReceived = false;
            let totalHours = 0;

            if (billingMonth) {
              const status = await db.select().from(rentalTimesheetReceived).where(
                and(
                  eq(rentalTimesheetReceived.rentalId, rental.id),
                  eq(rentalTimesheetReceived.rentalItemId, item.id),
                  eq(rentalTimesheetReceived.month, billingMonth)
                )
              ).limit(1);
              timesheetReceived = status[0]?.received || false;
            }

            const timesheets = await db.select().from(rentalEquipmentTimesheets).where(
              and(
                eq(rentalEquipmentTimesheets.rentalItemId, item.id),
                gte(rentalEquipmentTimesheets.date, fromDateStr),
                lte(rentalEquipmentTimesheets.date, toDateStr)
              )
            );

            totalHours = timesheets.reduce((sum, ts) => {
              const reg = parseFloat(ts.regularHours?.toString() || '0') || 0;
              const ot = parseFloat(ts.overtimeHours?.toString() || '0') || 0;
              return sum + reg + ot;
            }, 0);

            if (timesheetReceived && totalHours > 0) {
              duration = totalHours;
              uom = 'Hour';
            } else {
              const start = new Date(item.startDate || fromDateStr);
              const end = new Date(toDateStr);
              const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
              if (rateType === 'daily') { duration = days; uom = 'Day'; }
              else if (rateType === 'hourly') { duration = days * 10; uom = 'Hour'; }
            }

            const unitPrice = parseFloat(item.unitPrice?.toString() || '0') || 0;
            let rate = unitPrice;
            if (uom === 'Hour' && totalHours > 0) {
              if (rateType === 'daily') rate = unitPrice / 10;
              else if (rateType === 'weekly') rate = unitPrice / 70;
              else if (rateType === 'monthly') rate = unitPrice / 300;
            }

            const invoiceItem: any = {
              item_code: itemCode,
              qty: duration,
              rate: rate,
              amount: rate * duration,
              uom: uom,
              income_account: incomeAccount,
              description: itemNameWithIstimara
            };

            // Only include cost_center if it has a value
            if (costCenter) {
              invoiceItem.cost_center = costCenter;
            }

            return invoiceItem;
          })
        );
      } else {
        const itemCode = await this.findSuitableItemCode();
        const fallbackItem: any = {
          item_code: itemCode,
          qty: 1,
          rate: parseFloat(rental.totalAmount?.toString() || '0'),
          amount: parseFloat(rental.totalAmount?.toString() || '0'),
          uom: 'Nos',
          income_account: incomeAccount
        };

        // Only include cost_center if it has a value
        if (costCenter) {
          fallbackItem.cost_center = costCenter;
        }

        invoiceData.items = [fallbackItem];
      }

      try {
        const taxAccount = await this.findSuitableTaxAccount(targetCo);
        invoiceData.taxes = [{
          charge_type: 'On Net Total',
          account_head: taxAccount,
          description: 'VAT 15%',
          rate: 15
        }];
      } catch { }

      console.log(`Final ERPNext Payload:`, JSON.stringify(invoiceData, null, 2));

      let response;
      try {
        response = await this.makeERPNextRequest('/api/resource/Sales Invoice', {
          method: 'POST',
          body: JSON.stringify(invoiceData),
        });
      } catch (err) {
        response = await this.makeERPNextRequest('/api/method/frappe.client.insert', {
          method: 'POST',
          body: JSON.stringify({ doc: invoiceData }),
        });
      }
      return response.data || response;
    } catch (error) {
      console.error('createRentalInvoice failed:', error);
      throw error;
    }
  }


  static async testConnection(): Promise<boolean> {
    try {
      await this.makeERPNextRequest('/api/method/frappe.auth.get_logged_user');
      return true;
    } catch {
      return false;
    }
  }

  static async getAvailableItems(): Promise<any[]> {
    try {
      const res = await this.makeERPNextRequest('/api/resource/Item?limit_page_length=100');
      return res.data || [];
    } catch {
      return [];
    }
  }

  static async findSuitableTaxAccount(company: string): Promise<string> {
    try {
      const res = await this.makeERPNextRequest('/api/resource/Account?filters=[["account_type","=","Tax"]]&limit_page_length=100');
      const accounts = res.data || [];
      // Specifically look for OUTPUT VAT (for sales), not INPUT VAT (for purchases)
      const match = accounts.find((a: any) => a.name.includes('Output') && a.name.includes('VAT') && a.name.includes('15'));
      return match ? match.name : 'Output VAT 15% - SND';
    } catch {
      return 'Output VAT 15% - SND';
    }
  }

  static async findSuitableIncomeAccount(): Promise<string> {
    return 'Sales - SND';
  }

  static async findSuitableCostCenter(): Promise<string> {
    // Company has no default cost center - make it optional
    // ERPNext will use item defaults or leave blank
    return '';
  }

  static async findSuitableReceivableAccount(): Promise<string> {
    return 'Debtors - SND';
  }

  static async findSuitableItemCode(): Promise<string> {
    try {
      const items = await this.getAvailableItems();
      const match = items.find((i: any) => i.name.toLowerCase().includes('service') || i.name.toLowerCase().includes('rental'));
      return match ? match.name : (items[0]?.name || 'Service');
    } catch {
      return 'Service';
    }
  }

  static async syncEquipmentToERPNext(name: string, id?: string): Promise<string> {
    const normalized = name.toUpperCase().trim();
    try {
      const res = await this.makeERPNextRequest(`/api/resource/Item/${encodeURIComponent(normalized)}`);
      if (res.data) return res.data.name;
    } catch { }

    try {
      const newItem = {
        doctype: 'Item',
        item_code: normalized,
        item_name: normalized,
        item_group: 'Equipment',
        stock_uom: 'Nos',
        is_stock_item: 0
      };
      const res = await this.makeERPNextRequest('/api/resource/Item', { method: 'POST', body: JSON.stringify(newItem) });
      return res.data.name;
    } catch {
      return normalized;
    }
  }

  static async submitInvoice(id: string): Promise<any> {
    return this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ docstatus: 1 })
    });
  }

  static async cancelInvoice(id: string): Promise<any> {
    return this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ docstatus: 2 })
    });
  }

  static async deleteInvoice(id: string): Promise<any> {
    return this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  static async getInvoice(id: string): Promise<any> {
    return this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(id)}`);
  }
}
