
import { ERPNextInvoiceService } from './src/lib/services/erpnext-invoice-service';

async function checkInvoice() {
    try {
        // Get the latest invoice for this customer
        const response = await fetch('https://erp.snd-ksa.online/api/resource/Sales Invoice/ACC-SINV-2026-00045', {
            headers: {
                'Authorization': `token 4f15149f23e29b8:0be547162a5a45e`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Invoice ACC-SINV-2026-00045 details:');
        console.log('Posting Date:', data.data.posting_date);
        console.log('Due Date:', data.data.due_date);
        console.log('Items:', data.data.items.map((i: any) => ({
            item_code: i.item_code,
            description: i.description,
            qty: i.qty,
            uom: i.uom
        })));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkInvoice();
