'use server';

import { type Order, type Payment } from './data';

type ShopInfo = {
    name: string;
    address: string;
    phone?: string;
    website?: string;
};

const defaultShopInfo: ShopInfo = {
    name: "HUGEPOS",
    address: "123 Demo Street, Suite 456, BizTown, USA",
    phone: "555-123-4567",
    website: "www.hugepos.com"
};

export function buildReceiptHTML(order: Order, payments: Payment[], shop: ShopInfo = defaultShopInfo): string {
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const d = new Date(order.ts);

    const linesHtml = order.lines.map(line => `
        <tr>
            <td class="qty">${line.qty}</td>
            <td class="desc">
                ${line.name}
                ${line.mods && line.mods.length > 0 ? `<br><small>&nbsp;&nbsp;${line.mods.map(m => m.name).join(', ')}</small>` : ''}
            </td>
            <td class="price">${f.format(line.lineTotal)}</td>
        </tr>
    `).join('');

    const paymentsHtml = payments.map(p => `
        <tr>
            <td>${p.type === 'card' ? `Card (${p.last4 ? `**${p.last4}` : '****'})` : 'Cash'}</td>
            <td class="price">${f.format(p.amount)}</td>
        </tr>
        ${p.change ? `<tr><td>Change</td><td class="price">${f.format(p.change)}</td></tr>` : ''}
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt #${order.number}</title>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 10pt; color: #000; }
                .receipt { width: 300px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; }
                .header h1 { font-size: 16pt; margin: 0; }
                .header p { margin: 2px 0; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { padding: 5px 0; }
                .lines th { text-align: left; border-bottom: 1px dashed #000; }
                .lines .qty { width: 15%; vertical-align: top; }
                .lines .desc { width: 65%; }
                .lines .price { width: 20%; text-align: right; vertical-align: top; }
                .totals-table td { text-align: right; padding-top: 5px; }
                .totals-table tr.total td { font-weight: bold; border-top: 1px dashed #000; padding-top: 8px;}
                .payments-table { margin-top: 20px; }
                .payments-table td { padding-top: 2px; }
                .payments-table .price { text-align: right; }
                .footer { text-align: center; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <h1>${shop.name}</h1>
                    <p>${shop.address}</p>
                    ${shop.phone ? `<p>${shop.phone}</p>` : ''}
                    <p>Order: ${order.number} &nbsp; Date: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}</p>
                </div>
                
                <table class="lines">
                    <thead><tr><th>Qty</th><th>Item</th><th class="price">Total</th></tr></thead>
                    <tbody>${linesHtml}</tbody>
                </table>

                <table class="totals-table">
                    <tbody>
                        <tr><td>Subtotal:</td><td class="price">${f.format(order.totals.subtotal)}</td></tr>
                        <tr><td>Tax:</td><td class="price">${f.format(order.totals.tax)}</td></tr>
                        <tr class="total"><td>Total:</td><td class="price">${f.format(order.totals.total)}</td></tr>
                    </tbody>
                </table>
                
                <table class="payments-table">
                    <tbody>
                        ${paymentsHtml}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
