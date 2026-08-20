// components/chat/TradeDocModal.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, X, Printer, ShieldCheck, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Small inline-editable field that still reads cleanly on the printed sheet
function Field({ label, value, onChange, className = '', placeholder = '' }) {
  return (
    <div className={className}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-xs font-bold text-slate-900 py-0.5 print:border-none"
      />
    </div>
  );
}

export default function TradeDocModal({ isOpen, onClose, msg, room, userRole }) {
  const [docType, setDocType] = useState('PI'); // PI, CI, PL, BL
  const sealInputRef = useRef(null);
  const [sealUrl, setSealUrl] = useState('');
  const [uploadingSeal, setUploadingSeal] = useState(false);

  const [productName, setProductName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const [sellerCompany, setSellerCompany] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  const [invoiceNo, setInvoiceNo] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('T/T (Bank Wire Transfer)');
  const [incoterm, setIncoterm] = useState('FOB');
  const [portOfLoading, setPortOfLoading] = useState('Busan, South Korea');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('Republic of Korea');

  // Packing List only
  const [packageCount, setPackageCount] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [measurement, setMeasurement] = useState('');

  // Bill of Lading only
  const [vesselVoyage, setVesselVoyage] = useState('');
  const [containerSealNo, setContainerSealNo] = useState('');
  const [marksNumbers, setMarksNumbers] = useState('N/M');
  const [freightTerm, setFreightTerm] = useState('Prepaid');

  useEffect(() => {
    if (!isOpen) return;

    setProductName(msg?.product_name || room?.product_title || room?.title || '');
    setHsCode('');
    setQuantity(msg?.quote_moq || '');
    setUnitPrice(msg?.quote_price || '');
    setTotalAmount('');

    setSellerCompany(room?.seller_profile_name || room?.seller_name || room?.company_name || 'Korean Manufacturer Co., Ltd.');
    setSellerAddress('');
    setBuyerCompany(room?.buyer_profile_name || room?.buyer_contact_person || room?.buyer_name || 'Global Buyer');
    setBuyerAddress('');

    setInvoiceNo(`KLICK-${Date.now().toString().substring(6)}`);
    setIssueDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
    setPortOfDischarge('');
    setPackageCount('');
    setGrossWeight('');
    setNetWeight('');
    setMeasurement('');
    setVesselVoyage('');
    setContainerSealNo('');
  }, [isOpen, msg, room]);

  // Load the seller's saved official seal, if any, so it's reused automatically next time
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id?.toString();
      if (!uid) return;
      const { data } = await supabase
        .from('companies')
        .select('seal_url')
        .eq('user_id', uid)
        .maybeSingle();
      if (data?.seal_url) setSealUrl(data.seal_url);
    })();
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSealFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSeal(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setSealUrl(dataUrl);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id?.toString();
        if (uid) {
          await supabase.from('companies').update({ seal_url: dataUrl }).eq('user_id', uid);
        }
      } catch (err) {
        console.error('Failed to save official seal:', err);
      } finally {
        setUploadingSeal(false);
      }
    };
    reader.onerror = () => setUploadingSeal(false);
    reader.readAsDataURL(file);
  };

  const docTitles = {
    PI: 'PROFORMA INVOICE',
    CI: 'COMMERCIAL INVOICE',
    PL: 'PACKING LIST',
    BL: 'BILL OF LADING (DRAFT)',
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-fadeIn">

        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Official B2B Trade Document Generator
              </h3>
              <p className="text-xs text-slate-400">Fields default from this chat — edit anything before printing.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Type Switcher Tabs */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {Object.keys(docTitles).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDocType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  docType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type === 'PI' && 'Proforma Invoice (PI)'}
                {type === 'CI' && 'Commercial Invoice (CI)'}
                {type === 'PL' && 'Packing List (PL)'}
                {type === 'BL' && 'Bill of Lading (BL)'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF Export</span>
          </button>
        </div>

        {/* Trade Document Printable Sheet */}
        <div className="p-8 md:p-12 space-y-6 bg-white text-slate-900 notranslate" id="printable-trade-doc">

          {/* Sheet Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 mb-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> KLICK Export Certified
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {docTitles[docType]}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-x-4 text-right">
              <Field label="Document No." value={invoiceNo} onChange={setInvoiceNo} />
              <Field label="Date" value={issueDate} onChange={setIssueDate} />
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exporter / Seller</span>
              <Field label="Company Name" value={sellerCompany} onChange={setSellerCompany} />
              <Field label="Address" value={sellerAddress} onChange={setSellerAddress} placeholder="Factory / office address" />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Importer / Buyer</span>
              <Field label="Company Name" value={buyerCompany} onChange={setBuyerCompany} />
              <Field label="Address" value={buyerAddress} onChange={setBuyerAddress} placeholder="Delivery / billing address" />
            </div>
          </div>

          {/* Shipment Terms */}
          <div className="grid grid-cols-3 gap-4 text-xs border-b border-slate-200 pb-6">
            <Field label="Payment Terms" value={paymentTerms} onChange={setPaymentTerms} />
            <Field label="Incoterm" value={incoterm} onChange={setIncoterm} />
            <Field label="Country of Origin" value={countryOfOrigin} onChange={setCountryOfOrigin} />
            <Field label="Port of Loading" value={portOfLoading} onChange={setPortOfLoading} />
            <Field label="Port of Discharge" value={portOfDischarge} onChange={setPortOfDischarge} placeholder="e.g. Los Angeles, USA" />
            {docType === 'BL' && (
              <Field label="Freight" value={freightTerm} onChange={setFreightTerm} />
            )}
          </div>

          {/* BL-specific shipping details */}
          {docType === 'BL' && (
            <div className="grid grid-cols-3 gap-4 text-xs border-b border-slate-200 pb-6">
              <Field label="Vessel / Voyage No." value={vesselVoyage} onChange={setVesselVoyage} placeholder="e.g. EVER GIVEN / 0421W" />
              <Field label="Container / Seal No." value={containerSealNo} onChange={setContainerSealNo} placeholder="e.g. TCLU1234567 / SL998877" />
              <Field label="Marks & Numbers" value={marksNumbers} onChange={setMarksNumbers} />
            </div>
          )}

          {/* Item Specs Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Item Specifications</h3>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold">
                  <th className="p-3 rounded-l-xl">Description of Goods</th>
                  <th className="p-3">HS Code</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3 rounded-r-xl text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="p-3"><Field label="" value={productName} onChange={setProductName} placeholder="Product name" /></td>
                  <td className="p-3"><Field label="" value={hsCode} onChange={setHsCode} placeholder="e.g. 8481.80" /></td>
                  <td className="p-3"><Field label="" value={quantity} onChange={setQuantity} placeholder="e.g. 500 Units" /></td>
                  <td className="p-3"><Field label="" value={unitPrice} onChange={setUnitPrice} placeholder="e.g. 145.00 USD" /></td>
                  <td className="p-3 text-right"><Field label="" value={totalAmount} onChange={setTotalAmount} placeholder="Total USD" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Packing List-specific package details */}
          {docType === 'PL' && (
            <div className="space-y-3 border-t border-slate-200 pt-6">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Package Details</h3>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <Field label="No. of Packages" value={packageCount} onChange={setPackageCount} placeholder="e.g. 20 Cartons" />
                <Field label="Gross Weight" value={grossWeight} onChange={setGrossWeight} placeholder="e.g. 480 kg" />
                <Field label="Net Weight" value={netWeight} onChange={setNetWeight} placeholder="e.g. 450 kg" />
                <Field label="Measurement" value={measurement} onChange={setMeasurement} placeholder="e.g. 2.4 CBM" />
              </div>
            </div>
          )}

          {/* Signature Area */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <p className="text-slate-500">Authorized Signature</p>
              <p className="font-extrabold text-slate-900">{sellerCompany}</p>
            </div>

            <input
              type="file"
              ref={sealInputRef}
              accept="image/*"
              onChange={handleSealFileChange}
              className="hidden"
            />

            {sealUrl ? (
              <div
                onClick={() => userRole === 'seller' && sealInputRef.current?.click()}
                className={`w-48 h-16 rounded-xl flex items-center justify-center overflow-hidden bg-white ${userRole === 'seller' ? 'cursor-pointer hover:opacity-80' : ''}`}
                title={userRole === 'seller' ? 'Click to replace your official seal' : ''}
              >
                <img src={sealUrl} alt="Official Seal" className="max-w-full max-h-full object-contain" />
              </div>
            ) : userRole === 'seller' ? (
              <div
                onClick={() => sealInputRef.current?.click()}
                className="w-48 h-16 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 font-bold text-[10px] cursor-pointer transition gap-1"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingSeal ? 'Uploading...' : 'Click to Upload Seal'}</span>
              </div>
            ) : (
              <div className="w-48 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 font-bold text-[10px]">
                [ Official Seal ]
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
          >
            Close Document
          </button>
        </div>

      </div>
    </div>
  );
}
