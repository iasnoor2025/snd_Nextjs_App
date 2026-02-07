import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkSpecificInvoice() {
    const baseUrl = process.env.NEXT_PUBLIC_ERPNEXT_URL?.replace(/\/$/, '') || '';
    const apiKey = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    const headers = {
        'Authorization': `token ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const invName = 'ACC-SINV-2026-00045';
    console.log(`--- Fetching details for ${invName} ---`);

    try {
        const resp = await fetch(`${baseUrl}/api/resource/Sales Invoice/${invName}`, { headers });
        const result: any = await resp.json();

        if (result.data) {
            const d = result.data;
            console.log(`Invoice: ${d.name}`);
            console.log(`Customer: ${d.customer}`);
            console.log(`Company: ${d.company}`);
            console.log(`Posting Date: ${d.posting_date}`);
            console.log(`Status: ${d.status}`);
            console.log(`Items (${d.items.length}):`);
            d.items.forEach((it: any, i: number) => {
                console.log(`  Item ${i + 1}:`);
                console.log(`    Code: ${it.item_code}`);
                console.log(`    Qty: ${it.qty}`);
                console.log(`    UOM: ${it.uom}`);
                console.log(`    Rate: ${it.rate}`);
                console.log(`    Amount: ${it.amount}`);
                console.log(`    Income Account: ${it.income_account}`);
                console.log(`    Cost Center: ${it.cost_center}`);
            });
        } else {
            console.log('Invoice data not found.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkSpecificInvoice();
