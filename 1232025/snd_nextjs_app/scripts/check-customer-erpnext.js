// Script to check if customer has data in ERPNext
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

const customerName = 'AKFA UNITED COMPANY LTD';

async function makeERPNextRequest(endpoint, options = {}) {
  const url = `${ERPNEXT_URL}${endpoint}`;
  const headers = {
    Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function checkCustomerInERPNext() {
  try {
    console.log(`🔍 Checking customer: ${customerName}`);
    
    // Try to find customer in ERPNext
    const filters = encodeURIComponent(JSON.stringify([['name', 'like', customerName], ['customer_name', 'like', customerName]]));
    const response = await makeERPNextRequest(`/api/resource/Customer?limit_page_length=1000`);
    
    let foundCustomer = null;
    if (response.data) {
      foundCustomer = response.data.find(c => 
        c.name === customerName || 
        c.customer_name === customerName ||
        c.name?.toLowerCase().includes(customerName.toLowerCase()) ||
        c.customer_name?.toLowerCase().includes(customerName.toLowerCase())
      );
    }
    
    if (foundCustomer) {
      console.log(`✅ Found customer in ERPNext: ${foundCustomer.name}`);
      console.log('Customer details:', foundCustomer);
      
      // Fetch detailed information
      const detailResponse = await makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(foundCustomer.name)}`);
      console.log('Detailed customer data:', detailResponse.data);
      
      // Check invoices
      const invoicesResponse = await makeERPNextRequest(`/api/resource/Sales Invoice?filters=[["customer","=","${foundCustomer.name}"]]&limit_page_length=1000`);
      const invoices = invoicesResponse.data || [];
      console.log(`\n📊 Invoice Statistics:`);
      console.log(`Total Invoices: ${invoices.length}`);
      
      if (invoices.length > 0) {
        let totalAmount = 0;
        let outstandingAmount = 0;
        invoices.forEach(invoice => {
          const amount = parseFloat(invoice.grand_total || '0');
          const outstanding = parseFloat(invoice.outstanding_amount || '0');
          totalAmount += amount;
          outstandingAmount += outstanding;
        });
        console.log(`Total Invoiced: ${totalAmount.toFixed(2)} SAR`);
        console.log(`Outstanding: ${outstandingAmount.toFixed(2)} SAR`);
      }
      
    } else {
      console.log(`❌ Customer not found in ERPNext`);
      console.log('Available customers:', response.data?.length || 0);
    }
    
  } catch (error) {
    console.error('Error checking customer:', error);
  }
}

checkCustomerInERPNext();
