
  // Submit an existing invoice
  static async submitInvoice(invoiceId: string): Promise < any > {
    try {
        const response = await this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`, {
            method: 'PUT',
            body: JSON.stringify({ docstatus: 1 }), // 1 = Submitted
        });

        return response.data || response;
    } catch(error) {
        console.error(`Error submitting invoice ${invoiceId}:`, error);
        throw error;
    }
}

  // Cancel an existing invoice
  static async cancelInvoice(invoiceId: string): Promise < any > {
    try {
        const response = await this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`, {
            method: 'PUT',
            body: JSON.stringify({ docstatus: 2 }), // 2 = Cancelled
        });

        return response.data || response;
    } catch(error) {
        console.error(`Error cancelling invoice ${invoiceId}:`, error);
        throw error;
    }
}

  // Delete an existing invoice
  static async deleteInvoice(invoiceId: string): Promise < any > {
    try {
        const response = await this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`, {
            method: 'DELETE',
        });

        return response.data || response;
    } catch(error) {
        console.error(`Error deleting invoice ${invoiceId}:`, error);
        throw error;
    }
}

  // Get invoice details
  static async getInvoice(invoiceId: string): Promise < any > {
    try {
        const response = await this.makeERPNextRequest(`/api/resource/Sales Invoice/${encodeURIComponent(invoiceId)}`);
        return response.data || response;
    } catch(error) {
        console.error(`Error getting invoice ${invoiceId}:`, error);
        throw error;
    }
}
}
