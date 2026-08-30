// app/api/pdf/trade-documents/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      docType = 'PI', // 'PI' (Proforma Invoice), 'CI' (Commercial Invoice), 'PL' (Packing List)
      docNumber = `KLICK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate = new Date().toISOString().split('T')[0],
      sellerCompany = '',
      sellerAddress = '',
      sellerContact = '',
      buyerCompany = '',
      buyerAddress = '',
      buyerContact = '',
      itemTitle = 'High-Precision Hydraulic Control Valve HV-300',
      itemModel = 'HV-300-KR',
      quantity = 500,
      unitPrice = 145.00,
      shippingTerms = 'FOB Incheon Port',
      paymentTerms = 'T/T 30% Deposit, 70% before shipment',
      grossWeight = '1,250 kg',
      netWeight = '1,100 kg',
      totalPackages = '10 Wooden Crates',
    } = body;

    const subTotal = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);
    const shippingFee = 250.00;
    const grandTotal = (parseFloat(subTotal) + shippingFee).toFixed(2);

    const docTitleMap = {
      PI: 'PROFORMA INVOICE',
      CI: 'COMMERCIAL INVOICE',
      PL: 'PACKING LIST',
    };

    const docTitle = docTitleMap[docType] || 'PROFORMA INVOICE';

    // 표준 B2B 무역 서류 HTML 문서
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${docTitle} - ${docNumber}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1e293b;
      background-color: #ffffff;
    }
    .invoice-card {
      max-w: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #1e293b;
    }
    .logo span {
      color: #2563eb;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 800;
      color: #2563eb;
      text-align: right;
    }
    .doc-number {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }
    .info-box h3 {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-box p {
      margin: 2px 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .info-box .company-name {
      font-weight: 700;
      font-size: 14px;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 11px;
      text-transform: uppercase;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .total-table {
      width: 300px;
    }
    .total-table td {
      padding: 8px 12px;
    }
    .total-table .grand-total {
      font-weight: 800;
      font-size: 16px;
      color: #059669;
      border-top: 2px solid #0f172a;
    }
    .terms-box {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .terms-box h4 {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #1e40af;
    }
    .terms-box p {
      margin: 4px 0;
      font-size: 11px;
      color: #1e3a8a;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      font-size: 11px;
      color: #94a3b8;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-bottom: 1px solid #0f172a;
      margin-top: 40px;
      margin-bottom: 6px;
    }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; box-shadow: none; width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 16px auto; text-align: right;">
    <button onclick="window.print()" style="background-color: #2563eb; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="logo">KLICK <span>B2B</span></div>
        <div style="font-size: 10px; color: #64748b;">Global Trade Verified Official Document</div>
      </div>
      <div>
        <div class="doc-title">${docTitle}</div>
        <div class="doc-number">Doc No: <strong>${docNumber}</strong></div>
        <div class="doc-number">Date: ${issueDate}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Exporter / Shipper (Seller)</h3>
        <p class="company-name">${sellerCompany}</p>
        <p>${sellerAddress}</p>
        <p>Tel/Email: ${sellerContact}</p>
      </div>

      <div class="info-box">
        <h3>Importer / Consignee (Buyer)</h3>
        <p class="company-name">${buyerCompany}</p>
        <p>${buyerAddress}</p>
        <p>Tel/Email: ${buyerContact}</p>
      </div>
    </div>

    ${docType === 'PL' ? `
    <!-- Packing List 전용 스펙 테이블 -->
    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Model No.</th>
          <th>Quantity</th>
          <th>Packages</th>
          <th>Gross Weight</th>
          <th>Net Weight</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${itemTitle}</strong></td>
          <td>${itemModel}</td>
          <td>${quantity} Units</td>
          <td>${totalPackages}</td>
          <td>${grossWeight}</td>
          <td>${netWeight}</td>
        </tr>
      </tbody>
    </table>
    ` : `
    <!-- PI / CI 전용 가격 계산 테이블 -->
    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Model No.</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${itemTitle}</strong><br/><span style="font-size: 10px; color: #64748b;">${shippingTerms}</span></td>
          <td>${itemModel}</td>
          <td class="text-right">${quantity} Units</td>
          <td class="text-right">$${parseFloat(unitPrice).toFixed(2)}</td>
          <td class="text-right">$${subTotal}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <table class="total-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">$${subTotal}</td>
        </tr>
        <tr>
          <td>Estimated Freight Fee:</td>
          <td class="text-right">$${shippingFee.toFixed(2)}</td>
        </tr>
        <tr class="grand-total">
          <td>Grand Total (${docType}):</td>
          <td class="text-right">$${grandTotal} USD</td>
        </tr>
      </table>
    </div>
    `}

    <div class="terms-box">
      <h4>Official Export Terms & Conditions</h4>
      <p>• <strong>Trade Term:</strong> ${shippingTerms}</p>
      <p>• <strong>Payment Term:</strong> ${paymentTerms}</p>
      <p>• <strong>Issuing Platform:</strong> KLICK Global B2B Export Network (Verified Korean Manufacturer)</p>
    </div>

    <div class="footer">
      <div>
        <p>This is a computer-generated trade document issued via KLICK B2B Network.</p>
      </div>
      <div class="signature-box">
        <div style="font-weight: bold; color: #0f172a;">${sellerCompany}</div>
        <div class="signature-line"></div>
        <div>Authorized Authorized Signature</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to generate trade document:', error);
    return NextResponse.json({ error: 'Failed to generate trade document HTML' }, { status: 500 });
  }
}