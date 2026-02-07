import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkInvoices() {
    const baseUrl = process.env.NEXT_PUBLIC_ERPNEXT_URL?.replace(/\/$/, '') || '';
    const apiKey = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    const headers = {
        'Authorization': `token ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    try {
        console.log('--- Fetching invoices from TODAY (Feb 7) ---');
        // Using a simple filter for creation date if possible, or just limit 20
        const resp = await fetch(`${baseUrl}/api/resource/Sales Invoice?limit_page_length=20&order_by=creation desc&fields=["name","customer","posting_date","total","custom_from","custom_to","creation"]`, { headers });
        const result: any = await resp.json();

        if (result.data) {
            console.log(`Found ${result.data.length} recent invoices:`);
            for (const inv of result.data) {
                console.log(`\n- ${inv.name} (Created: ${inv.creation})`);
                console.log(`  Customer: ${inv.customer}`);
                console.log(`  Total: ${inv.total}`);
                console.log(`  PostingDate: ${inv.posting_date}`);
                console.log(`  Period: ${inv.custom_from} to ${inv.custom_to}`);

                // Fetch items
                const detailResp = await fetch(`${baseUrl}/api/resource/Sales Invoice/${inv.name}`, { headers });
                const detail = await detailResp.json();
                if (detail.data && detail.data.items) {
                    console.log(`  Items (${detail.data.items.length}):`);
                    detail.data.items.forEach((it: any, i: number) => {
                        console.log(`    Item ${i + 1}: Code=${it.item_code}, Qty=${it.qty}, UOM=${it.uom}, Rate=${it.rate}, Amount=${it.amount}`);
                    });
                }
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkInvoices();
