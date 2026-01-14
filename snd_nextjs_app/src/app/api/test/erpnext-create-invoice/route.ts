import { NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || process.env.ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || process.env.ERPNEXT_API_SECRET;

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test invoice creation',
    usage: 'POST /api/test/erpnext-create-invoice'
  });
}

export async function POST(request: Request) {
  try {
    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        error: 'ERPNext configuration missing'
      }, { status: 400 });
    }

    // Get request body to optionally specify rental ID
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, use default rental
    }

    const rentalId = body.rentalId || 35; // Default to rental 35 (from your terminal logs)

    // Fetch actual rental with items from your database
    let rental;
    try {
      rental = await RentalService.getRental(rentalId);
      if (!rental) {
        return NextResponse.json({
          error: `Rental ${rentalId} not found`
        }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to fetch rental',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Get rental items (actual equipment from your database)
    let rentalItems;
    try {
      rentalItems = await RentalService.getRentalItems(rentalId);
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to fetch rental items',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    if (!rentalItems || rentalItems.length === 0) {
      return NextResponse.json({
        error: `No rental items found for rental ${rentalId}`,
        rental: {
          id: rental.id,
          rentalNumber: rental.rentalNumber,
          customerName: rental.customer?.name
        }
      }, { status: 400 });
    }

    const url = `${ERPNEXT_URL}/api/resource/Sales Invoice`;
    const headers = {
      Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // First, get a sample invoice to see the structure
    let sampleInvoice = null;
    let sampleInvoiceFull = null;
    try {
      const sampleResponse = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice?limit_page_length=1&order_by=creation desc`, {
        headers
      });
      
      if (sampleResponse.ok) {
        const sampleData = await sampleResponse.json();
        sampleInvoice = sampleData.data?.[0] || null;
        
        // Get full invoice details if we found one
        if (sampleInvoice && sampleInvoice.name) {
          try {
            const fullResponse = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice/${sampleInvoice.name}`, {
              headers
            });
            if (fullResponse.ok) {
              const fullData = await fullResponse.json();
              sampleInvoiceFull = fullData.data;
            }
          } catch (error) {
            console.error('Error fetching full invoice:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching sample invoice:', error);
    }

    // Get available customers
    let customers = [];
    try {
      const customerResponse = await fetch(`${ERPNEXT_URL}/api/resource/Customer?limit_page_length=5`, {
        headers
      });
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customers = customerData.data || [];
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }

    // Get available items
    let items = [];
    try {
      const itemResponse = await fetch(`${ERPNEXT_URL}/api/resource/Item?limit_page_length=10`, {
        headers
      });
      if (itemResponse.ok) {
        const itemData = await itemResponse.json();
        items = itemData.data || [];
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }

    // Get available companies
    let companies = [];
    try {
      const companyResponse = await fetch(`${ERPNEXT_URL}/api/resource/Company?limit_page_length=5`, {
        headers
      });
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        companies = companyData.data || [];
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }

    // Get available accounts (for tax account head)
    // Priority: "Output VAT 15%" accounts (as used in existing invoices)
    let accounts = [];
    try {
      const accountResponse = await fetch(`${ERPNEXT_URL}/api/resource/Account?limit_page_length=50&filters=[["account_type","=","Tax"]]`, {
        headers
      });
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        accounts = accountData.data || [];
        
        // Prioritize "Output VAT 15%" accounts
        accounts.sort((a, b) => {
          const aName = (a.account_name || a.name || '').toLowerCase();
          const bName = (b.account_name || b.name || '').toLowerCase();
          const aHasOutputVAT = aName.includes('output vat 15') || aName.includes('output vat');
          const bHasOutputVAT = bName.includes('output vat 15') || bName.includes('output vat');
          
          if (aHasOutputVAT && !bHasOutputVAT) return -1;
          if (!aHasOutputVAT && bHasOutputVAT) return 1;
          return 0;
        });
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }

    // Use actual rental customer and company
    const testCustomer = rental.customer?.erpnextId || rental.customer?.name || rental.customerName;
    const testCompany = companies.length > 0 ? companies[0].name : null;
    
    // Find tax account (same logic as invoice service)
    let testTaxAccount = null;
    try {
      testTaxAccount = await ERPNextInvoiceService.findSuitableTaxAccount(testCompany || 'Samhan Naser Al-Dosri Est');
    } catch (error) {
      console.warn('Failed to find tax account, using fallback');
    }
    
    if (!testTaxAccount && accounts.length > 0) {
      // Prioritize "Output VAT 15%" accounts
      const outputVAT = accounts.find((a: any) => 
        (a.account_name || a.name || '').toLowerCase().includes('output vat 15')
      );
      testTaxAccount = outputVAT?.name || accounts[0].name;
    }

    if (!testCustomer || !testCompany) {
      return NextResponse.json({
        error: 'Missing required data',
        details: {
          customer: testCustomer || 'No customer found',
          company: testCompany || 'No company found',
          taxAccount: testTaxAccount || 'No tax account found',
          rentalItems: rentalItems.length
        },
        rental: {
          id: rental.id,
          rentalNumber: rental.rentalNumber,
          customer: rental.customer
        }
      }, { status: 400 });
    }

    // Sync equipment to ERPNext and build invoice items from actual rental items
    console.log(`=== Syncing ALL ${rentalItems.length} rental items to ERPNext ===`);
    const invoiceItems: any[] = [];
    
    for (let i = 0; i < rentalItems.length; i++) { // Test with ALL items
      const rentalItem = rentalItems[i];
      const equipmentName = rentalItem.equipmentName || `Equipment ${rentalItem.equipmentId || rentalItem.id}`;
      
      try {
        // Sync equipment to ERPNext (finds existing or creates new)
        const itemCode = await ERPNextInvoiceService.syncEquipmentToERPNext(
          equipmentName,
          rentalItem.equipmentId || undefined
        );
        
        // Use actual rental item data
        const qty = parseFloat(rentalItem.totalPrice?.toString() || '0') / parseFloat(rentalItem.unitPrice?.toString() || '1');
        const rate = parseFloat(rentalItem.unitPrice?.toString() || '0');
        const amount = parseFloat(rentalItem.totalPrice?.toString() || '0');
        
        invoiceItems.push({
          item_code: itemCode,
          qty: Math.max(1, Math.round(qty * 100) / 100),
          rate: Math.round(rate * 100) / 100,
          amount: Math.round(amount * 100) / 100,
        });
        
        console.log(`✓ Synced item ${i + 1}: ${equipmentName} -> ${itemCode}`);
      } catch (error) {
        console.error(`✗ Failed to sync item ${i + 1}: ${equipmentName}`, error);
        // Continue with other items
      }
    }

    if (invoiceItems.length === 0) {
      return NextResponse.json({
        error: 'Failed to sync any rental items to ERPNext',
        rentalItems: rentalItems.map((ri: any) => ({
          id: ri.id,
          equipmentName: ri.equipmentName,
          equipmentId: ri.equipmentId
        }))
      }, { status: 400 });
    }

    // Create test invoice with actual rental items
    // KSA Compliance: MUST include tax rate in Sales Taxes and Charges Table
    const testInvoiceData = {
      doctype: 'Sales Invoice',
      customer: testCustomer,
      posting_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: invoiceItems, // Use actual rental items
      currency: 'SAR',
      company: testCompany,
      // KSA Compliance: Required tax table
      taxes: [
        {
          charge_type: 'On Net Total',
          account_head: testTaxAccount || 'Output VAT 15% - SND',
          description: 'VAT 15%',
          rate: 15,
        }
      ]
    };

    console.log('=== Attempting to create test invoice with ACTUAL RENTAL ITEMS ===');
    console.log(`Rental: ${rental.rentalNumber} (ID: ${rental.id})`);
    console.log(`Customer: ${testCustomer}`);
    console.log(`Company: ${testCompany}`);
    console.log(`Tax Account: ${testTaxAccount}`);
    console.log(`Items Count: ${invoiceItems.length}`);
    console.log('Invoice data:', JSON.stringify(testInvoiceData, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testInvoiceData),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      console.error('=== Invoice Creation Failed ===');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
      
      return NextResponse.json({
        success: false,
        status: response.status,
        error: responseData,
        testData: {
          rentalId: rental.id,
          rentalNumber: rental.rentalNumber,
          customer: testCustomer,
          company: testCompany,
          taxAccount: testTaxAccount,
          itemsCount: invoiceItems.length,
          rentalItems: rentalItems.slice(0, 5).map((ri: any) => ({
            id: ri.id,
            equipmentName: ri.equipmentName,
            equipmentId: ri.equipmentId,
            unitPrice: ri.unitPrice,
            totalPrice: ri.totalPrice
          })),
          invoiceData: testInvoiceData
        },
        availableTaxAccounts: accounts.map((a: any) => ({ name: a.name, account_name: a.account_name, account_type: a.account_type, company: a.company })),
        sampleInvoice: sampleInvoice ? {
          name: sampleInvoice.name,
          customer: sampleInvoice.customer,
          company: sampleInvoice.company,
          posting_date: sampleInvoice.posting_date,
          due_date: sampleInvoice.due_date,
          items: sampleInvoice.items?.map((item: any) => ({
            item_code: item.item_code,
            item_name: item.item_name,
            qty: item.qty,
            rate: item.rate,
            amount: item.amount,
            uom: item.uom
          })) || []
        } : null,
        sampleInvoiceFull: sampleInvoiceFull ? {
          // Show all fields from existing invoice
          allFields: Object.keys(sampleInvoiceFull),
          items: sampleInvoiceFull.items?.map((item: any) => {
            // Show all item fields
            return {
              allFields: Object.keys(item),
              ...item
            };
          }) || []
        } : null
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Test invoice created successfully',
      invoice: responseData.data || responseData,
      testData: {
        rentalId: rental.id,
        rentalNumber: rental.rentalNumber,
        customer: testCustomer,
        company: testCompany,
        taxAccount: testTaxAccount,
        itemsCount: invoiceItems.length,
        rentalItems: rentalItems.slice(0, 5).map((ri: any) => ({
          id: ri.id,
          equipmentName: ri.equipmentName,
          equipmentId: ri.equipmentId,
          unitPrice: ri.unitPrice,
          totalPrice: ri.totalPrice
        })),
        invoiceData: testInvoiceData
      },
      sampleInvoice: sampleInvoice ? {
        name: sampleInvoice.name,
        customer: sampleInvoice.customer,
        company: sampleInvoice.company,
        posting_date: sampleInvoice.posting_date,
        due_date: sampleInvoice.due_date,
        items: sampleInvoice.items?.map((item: any) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
          uom: item.uom
        })) || []
      } : null,
      sampleInvoiceFull: sampleInvoiceFull ? {
        // Show all fields from existing invoice
        allFields: Object.keys(sampleInvoiceFull),
        items: sampleInvoiceFull.items?.map((item: any) => {
          // Show all item fields
          return {
            allFields: Object.keys(item),
            ...item
          };
        }) || []
      } : null
    });

  } catch (error) {
    console.error('Test invoice creation error:', error);
    return NextResponse.json({
      error: 'Failed to test invoice creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
