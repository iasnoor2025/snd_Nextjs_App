import { ERPNextInvoiceService } from './erpnext-invoice-service';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

interface FinancialMetrics {
  totalMoneyReceived: number;
  totalMoneyLost: number;
  monthlyMoneyReceived: number;
  monthlyMoneyLost: number;
  netProfit: number;
  currency: string;
  lastUpdated: string;
}

interface InvoiceSummary {
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  count: number;
}

export class ERPNextFinancialService {
  private static async makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      throw new Error('ERPNext configuration is missing. Please check your environment variables.');
    }

    const url = `${ERPNEXT_URL}${endpoint}`;
    console.log('🌐 Making ERPNext financial request to:', endpoint);

    const defaultHeaders = {
      'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
        console.error('❌ ERPNext Financial API error:', errorText);
        throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('❌ Error in ERPNext financial request:', error);
      throw error;
    }
  }

  static async getFinancialMetrics(): Promise<FinancialMetrics> {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Get all sales invoices
      const salesInvoicesEndpoint = '/api/resource/Sales Invoice?limit_page_length=1000&fields=["name","grand_total","outstanding_amount","status","posting_date","paid_amount"]';
      const salesInvoices = await this.makeERPNextRequest(salesInvoicesEndpoint);

      // Get all purchase invoices (money going out)
      const purchaseInvoicesEndpoint = '/api/resource/Purchase Invoice?limit_page_length=1000&fields=["name","grand_total","outstanding_amount","status","posting_date","paid_amount"]';
      const purchaseInvoices = await this.makeERPNextRequest(purchaseInvoicesEndpoint);

      // Calculate money received (from sales invoices)
      let totalMoneyReceived = 0;
      let monthlyMoneyReceived = 0;

      if (salesInvoices.data) {
        salesInvoices.data.forEach((invoice: any) => {
          const invoiceDate = new Date(invoice.posting_date);
          const amount = parseFloat(invoice.grand_total) || 0;
          
          // Total money received (all time)
          if (invoice.status === 'Paid' || parseFloat(invoice.outstanding_amount) === 0) {
            totalMoneyReceived += amount;
          }
          
          // Monthly money received
          if (invoiceDate >= firstDayOfMonth && invoiceDate <= lastDayOfMonth) {
            if (invoice.status === 'Paid' || parseFloat(invoice.outstanding_amount) === 0) {
              monthlyMoneyReceived += amount;
            }
          }
        });
      }

      // Calculate money lost (from purchase invoices)
      let totalMoneyLost = 0;
      let monthlyMoneyLost = 0;

      if (purchaseInvoices.data) {
        purchaseInvoices.data.forEach((invoice: any) => {
          const invoiceDate = new Date(invoice.posting_date);
          const amount = parseFloat(invoice.grand_total) || 0;
          
          // Total money lost (all time)
          if (invoice.status === 'Paid' || parseFloat(invoice.outstanding_amount) === 0) {
            totalMoneyLost += amount;
          }
          
          // Monthly money lost
          if (invoiceDate >= firstDayOfMonth && invoiceDate <= lastDayOfMonth) {
            if (invoice.status === 'Paid' || parseFloat(invoice.outstanding_amount) === 0) {
              monthlyMoneyLost += amount;
            }
          }
        });
      }

      const netProfit = totalMoneyReceived - totalMoneyLost;
      
      return {
        totalMoneyReceived: Math.round(totalMoneyReceived * 100) / 100,
        totalMoneyLost: Math.round(totalMoneyLost * 100) / 100,
        monthlyMoneyReceived: Math.round(monthlyMoneyReceived * 100) / 100,
        monthlyMoneyLost: Math.round(monthlyMoneyLost * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        currency: 'SAR', // Default to Saudi Riyal
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error fetching financial metrics:', error);
      // Return default values if ERPNext is not available
      return {
        totalMoneyReceived: 0,
        totalMoneyLost: 0,
        monthlyMoneyReceived: 0,
        monthlyMoneyLost: 0,
        netProfit: 0,
        currency: 'SAR',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  static async getInvoiceSummary(): Promise<InvoiceSummary> {
    try {
      const salesInvoicesEndpoint = '/api/resource/Sales Invoice?limit_page_length=1000&fields=["grand_total","outstanding_amount","due_date"]';
      const salesInvoices = await this.makeERPNextRequest(salesInvoicesEndpoint);

      let totalAmount = 0;
      let paidAmount = 0;
      let outstandingAmount = 0;
      let overdueAmount = 0;
      let count = 0;

      if (salesInvoices.data) {
        count = salesInvoices.data.length;
        
        salesInvoices.data.forEach((invoice: any) => {
          const amount = parseFloat(invoice.grand_total) || 0;
          const outstanding = parseFloat(invoice.outstanding_amount) || 0;
          const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
          
          totalAmount += amount;
          
          if (outstanding === 0) {
            paidAmount += amount;
          } else {
            outstandingAmount += outstanding;
            
            // Check if overdue
            if (dueDate && dueDate < new Date()) {
              overdueAmount += outstanding;
            }
          }
        });
      }

      return {
        totalAmount: Math.round(totalAmount * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        count
      };
    } catch (error) {
      console.error('❌ Error fetching invoice summary:', error);
      return {
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        count: 0
      };
    }
  }

  static async getMonthlyTrends(months: number = 6): Promise<any[]> {
    try {
      const trends = [];
      const today = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        
        const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        // Get sales for this month
        const salesEndpoint = `/api/resource/Sales Invoice?filters=[["posting_date","between",["${firstDay.toISOString().split('T')[0]}","${lastDay.toISOString().split('T')[0]}"]]]&fields=["grand_total","outstanding_amount","status"]`;
        const salesData = await this.makeERPNextRequest(salesEndpoint);
        
        let monthRevenue = 0;
        if (salesData.data) {
          salesData.data.forEach((invoice: any) => {
            const amount = parseFloat(invoice.grand_total) || 0;
            if (invoice.status === 'Paid' || parseFloat(invoice.outstanding_amount) === 0) {
              monthRevenue += amount;
            }
          });
        }
        
        trends.push({
          month: monthName,
          revenue: Math.round(monthRevenue * 100) / 100,
          date: monthDate.toISOString()
        });
      }
      
      return trends;
    } catch (error) {
      console.error('❌ Error fetching monthly trends:', error);
      return [];
    }
  }
}
