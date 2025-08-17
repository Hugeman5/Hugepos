
'use server';
import { type PurchaseOrder } from "./repos/purchaseOrdersRepo";
import { formatMoney } from "./money";

export function getPOHTML(po: PurchaseOrder): string {
  const { id, supplierName, createdAt, lines, totals, notes } = po;
  const settings = { currency: "ZAR", locale: "en-ZA" };

  const linesHTML = lines.map(line => `
    <tr>
      <td>${line.name}</td>
      <td>${line.qty}</td>
      <td>${formatMoney(line.priceExVat, settings)}</td>
      <td>${formatMoney(line.lineIncVat, settings)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Purchase Order ${id}</title>
        <style>
            body { font-family: sans-serif; color: #333; }
            .container { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #eee; }
            h1 { color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { float: right; width: 300px; margin-top: 20px; }
            .totals td { border: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Purchase Order: ${id}</h1>
            <p><strong>Date:</strong> ${new Date(createdAt).toLocaleDateString()}</p>
            <p><strong>To:</strong> ${supplierName}</p>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit Price (Ex. VAT)</th>
                        <th>Total (Inc. VAT)</th>
                    </tr>
                </thead>
                <tbody>${linesHTML}</tbody>
            </table>
            <table class="totals">
                <tr><td>Subtotal (Ex. VAT):</td><td>${formatMoney(totals.exVat, settings)}</td></tr>
                <tr><td>VAT:</td><td>${formatMoney(totals.vat, settings)}</td></tr>
                <tr><td><strong>Total (Inc. VAT):</strong></td><td><strong>${formatMoney(totals.incVat, settings)}</strong></td></tr>
            </table>
            ${notes ? `<p><strong>Notes:</strong><br>${notes}</p>` : ''}
        </div>
    </body>
    </html>
  `;
}
