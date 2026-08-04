// app/api/pdf/pi/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      piNumber = `PI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      sellerCompany = 'Hankook Precision Co., Ltd.',
      sellerAddress = 'Factory Bldg A, 124 Industrial Road, Namdong-gu, Incheon, Republic of Korea',
      sellerTel = '+82-32-555-0192',
      sellerEmail = 'export@hkprecision.co.kr',
      buyerCompany = 'Global Sourcing LLC',
      buyerName = 'John Smith',
      buyerAddress = '750 Trade Tower Ave, Suite 1200, Los Angeles, CA 90017, United States',
      buyerTel = '+1-213-555-8900',
      itemTitle = 'High-Precision Hydraulic Control Valve HV-300',
      itemSpec = 'Max Pressure 350 Bar, Flow Rate 120L/min, ISO 9001 Certified',
      quantity = '500 Units',
      unitPrice = '145.00',
      tradeTerms = 'FOB Incheon Port, South Korea',
      paymentTerms = 'T/T (Wire Transfer) or Escrow',
      leadTime = '14 Days after receipt of Order Confirmation'
    } = body;

    const priceNum = parseFloat(unitPrice.replace(/[^0.0-9.]/g, '')) || 145;
    const qtyNum = parseInt(quantity.replace(/[^0-9]/g, '')) || 500;
    const totalAmount = (priceNum * qtyNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // HTML 기반 Proforma Invoice 템플릿
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
      @page { size: A4; margin: 15mm 12mm; background-color: #ffffff; }
      *, *::before, *::after { box-sizing: border-box; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 10pt; line-height: 1.5; }
      .header-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
      .header-table td { vertical-align: top; }
      .logo-title { font-size: 22pt; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0; }
      .logo-sub { font-size: 8.5pt; color: #2563eb; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
      .pi-badge { text-align: right; }
      .pi-title { font-size: 18pt; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
      .pi-meta { font-size: 8.5pt; color: #64748b; margin-top: 3px; }
      
      .details-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
      .details-table td { width: 50%; vertical-align: top; padding: 0; }
      .details-table td:first-child { padding-right: 10px; }
      .details-table td:last-child { padding-left: 10px; }
      
      .box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
      .box-title { font-size: 8.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 6px; }
      .box-content { font-size: 8.5pt; line-height: 1.5; color: #334155; }
      .box-content strong { color: #0f172a; }

      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      .items-table th { background-color: #0f172a; color: #ffffff; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; text-align: left; }
      .items-table th.right, .items-table td.right { text-align: right; }
      .items-table th.center, .items-table td.center { text-align: center; }
      .items-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 8.5pt; color: #334155; }

      .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      .summary-table td { vertical-align: top; }
      .terms-cell { width: 58%; padding-right: 10px; }
      .total-cell { width: 42%; }

      .total-table { width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
      .total-table td { padding: 8px 10px; font-size: 8.5pt; }
      .total-table tr.grand-total td { background-color: #2563eb; color: #ffffff; font-weight: 800; font-size: 10.5pt; border-bottom-left-radius: 7px; border-bottom-right-radius: 7px; }

      .signature-table { width: 100%; margin-top: 25px; border-collapse: collapse; }
      .signature-table td { width: 50%; vertical-align: top; }
      .sig-box { border-top: 1px solid #0f172a; padding-top: 6px; margin-top: 35px; font-size: 8pt; color: #475569; }

      .footer { text-align: center; font-size: 7.5pt; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
    </style>
    </head>
    <body>

      <table class="header-table">
        <tr>
          <td>
            <div class="logo-title">KLICK B2B</div>
            <div class="logo-sub">Global Trade Marketplace</div>
          </td>
          <td class="pi-badge">
            <div class="pi-title">Proforma Invoice</div>
            <div class="pi-meta">PI Ref: <strong>${piNumber}</strong></div>
            <div class="pi-meta">Date: <strong>${date}</strong></div>
            <div class="pi-meta">Validity: <strong>30 Days</strong></div>
          </td>
        </tr>
      </table>

      <table class="details-table">
        <tr>
          <td>
            <div class="box">
              <div class="box-title">Seller / Exporter Information</div>
              <div class="box-content">
                <strong>${sellerCompany}</strong><br>
                ${sellerAddress}<br>
                Tel: ${sellerTel} | Email: ${sellerEmail}
              </div>
            </div>
          </td>
          <td>
            <div class="box">
              <div class="box-title">Buyer / Importer Information</div>
              <div class="box-content">
                <strong>${buyerCompany}</strong><br>
                Attn: ${buyerName}<br>
                ${buyerAddress}<br>
                Tel: ${buyerTel}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 8%;">No.</th>
            <th style="width: 47%;">Description of Goods & Specifications</th>
            <th class="center" style="width: 15%;">Quantity</th>
            <th class="right" style="width: 15%;">Unit Price</th>
            <th class="right" style="width: 15%;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="center">1</td>
            <td>
              <strong>${itemTitle}</strong><br>
              <span style="font-size: 7.5pt; color: #64748b;">${itemSpec}</span>
            </td>
            <td class="center">${quantity}</td>
            <td class="right">$${priceNum.toFixed(2)}</td>
            <td class="right">$${totalAmount}</td>
          </tr>
        </tbody>
      </table>

      <table class="summary-table">
        <tr>
          <td class="terms-cell">
            <div class="box">
              <div class="box-title">Trade & Shipping Terms</div>
              <div class="box-content">
                • <strong>Price Term:</strong> ${tradeTerms}<br>
                • <strong>Payment Term:</strong> ${paymentTerms}<br>
                • <strong>Lead Time:</strong> ${leadTime}<br>
                • <strong>Origin:</strong> Republic of Korea
              </div>
            </div>
          </td>
          <td class="total-cell">
            <table class="total-table">
              <tr>
                <td>Subtotal:</td>
                <td class="right"><strong>$${totalAmount}</strong></td>
              </tr>
              <tr>
                <td>Freight / Handling:</td>
                <td class="right"><strong>Included (${tradeTerms.split(' ')[0]})</strong></td>
              </tr>
              <tr class="grand-total">
                <td>TOTAL AMOUNT:</td>
                <td class="right">$${totalAmount} USD</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table class="signature-table">
        <tr>
          <td style="padding-right: 15px;">
            <div class="sig-box">
              <strong>Authorized Signature (Seller)</strong><br><br>
              ${sellerCompany}<br>
              Date: ${date}
            </div>
          </td>
          <td style="padding-left: 15px;">
            <div class="sig-box">
              <strong>Accepted & Confirmed By (Buyer)</strong><br><br>
              ${buyerCompany}<br>
              Date: ____________________
            </div>
          </td>
        </tr>
      </table>

      <div class="footer">
        This Proforma Invoice is issued electronically via KLICK B2B Global Trade Platform.
      </div>

    </body>
    </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('PI PDF Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}