import { ERPNextService } from './erpnext-service';

export class ERPNextPaymentService {
  private static baseUrl = process.env.ERP_NEXT_URL;
  private static apiKey = process.env.ERP_NEXT_API_KEY;
  private static apiSecret = process.env.ERP_NEXT_API_SECRET;

  private static async makeERPNextRequest(endpoint: string, method: string = 'GET', data?: any) {
    if (!this.baseUrl || !this.apiKey || !this.apiSecret) {
      throw new Error('ERPNext configuration is missing');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ERPNext API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Get payment by ID
  static async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Payment Entry/${encodeURIComponent(paymentId)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch ERPNext payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Check if payment exists in ERPNext without throwing error
  static async checkPaymentExists(paymentId: string): Promise<boolean> {
    try {
      await this.getPayment(paymentId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get payments for a specific customer
  static async getPaymentsByCustomer(customerId: string): Promise<any[]> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Payment Entry?filters=[["party","=","${customerId}"]]&limit_page_length=100`
      );
      return response.data || [];
    } catch (error) {
      throw new Error(
        `Failed to fetch ERPNext payments for customer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get payments for a specific invoice
  static async getPaymentsByInvoice(invoiceId: string): Promise<any[]> {
    try {
      const response = await this.makeERPNextRequest(
        `/api/resource/Payment Entry?filters=[["references","like","%${invoiceId}%"]]&limit_page_length=100`
      );
      return response.data || [];
    } catch (error) {
      throw new Error(
        `Failed to fetch ERPNext payments for invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
