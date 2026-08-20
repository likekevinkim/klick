// components/chat/TradeDocModal.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, X, Printer, ShieldCheck, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Small inline-editable field that still reads cleanly on the printed sheet
function Field({ label, value, onChange, className = '', placeholder = '', disabled = false }) {
  return (
    <div className={className}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-xs font-bold text-slate-900 py-0.5 print:border-none disabled:opacity-100 disabled:cursor-default"
      />
    </div>
  );
}

export default function TradeDocModal({ isOpen, onClose, msg, room, userRole, onSendDocument }) {
  // A message-linked trade doc (msg.file.type === 'trade_doc') is a historical record — read-only
  const isViewingSent = msg?.file?.type === 'trade_doc';
  const [docType, setDocType] = useState('PI'); // PI, CI, PL, BL
  const sealInputRef = useRef(null);
  const [sealUrl, setSealUrl] = useState('');
  const [uploadingSeal, setUploadingSeal] = useState(false);

  const [items, setItems] = useState([{ id: 1, productName: '', hsCode: '', quantity: '', unitPrice: '' }]);

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

    // Reopening a previously sent document — restore its exact snapshot, read-only
    if (isViewingSent) {
      const doc = msg.file;
      setDocType(doc.docType || 'PI');
      setItems(
        Array.isArray(doc.items) && doc.items.length > 0
          ? doc.items.map((it, idx) => ({ id: Date.now() + idx, ...it }))
          : [{ id: Date.now(), productName: '', hsCode: '', quantity: '', unitPrice: '' }]
      );
      setSellerCompany(doc.sellerCompany || '');
      setSellerAddress(doc.sellerAddress || '');
      setBuyerCompany(doc.buyerCompany || '');
      setBuyerAddress(doc.buyerAddress || '');
      setInvoiceNo(doc.invoiceNo || '');
      setIssueDate(doc.issueDate || '');
      setPaymentTerms(doc.paymentTerms || '');
      setIncoterm(doc.incoterm || '');
      setPortOfLoading(doc.portOfLoading || '');
      setPortOfDischarge(doc.portOfDischarge || '');
      setCountryOfOrigin(doc.countryOfOrigin || '');
      setPackageCount(doc.packageCount || '');
      setGrossWeight(doc.grossWeight || '');
      setNetWeight(doc.netWeight || '');
      setMeasurement(doc.measurement || '');
      setVesselVoyage(doc.vesselVoyage || '');
      setContainerSealNo(doc.containerSealNo || '');
      setMarksNumbers(doc.marksNumbers || '');
      setFreightTerm(doc.freightTerm || '');
      return;
    }

    const parseLeadingNumber = (str) => {
      if (!str) return '';
      const match = str.toString().match(/[\d.]+/);
      return match ? match[0] : '';
    };

    setItems([{
      id: Date.now(),
      productName: msg?.product_name || room?.product_title || room?.title || '',
      hsCode: '',
      quantity: parseLeadingNumber(msg?.quote_moq),
      unitPrice: parseLeadingNumber(msg?.quote_price),
    }]);

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
  }, [isOpen, msg, room, isViewingSent]);

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

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: Date.now(), productName: '', hsCode: '', quantity: '', unitPrice: '' }]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const getItemTotal = (item) => {
    const qty = parseFloat(item.quantity);
    const price = parseFloat(item.unitPrice);
    if (!qty || !price) return 0;
    return qty * price;
  };

  const grandTotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const docTitles = {
    PI: 'PROFORMA INVOICE',
    CI: 'COMMERCIAL INVOICE',
    PL: 'PACKING LIST',
    BL: 'BILL OF LADING (DRAFT)',
  };

  const handleSendDoc = () => {
    if (!onSendDocument) return;

    const docSnapshot = {
      docTitle: docTitles[docType],
      docType,
      invoiceNo,
      issueDate,
      paymentTerms,
      incoterm,
      portOfLoading,
      portOfDischarge,
      countryOfOrigin,
      sellerCompany,
      sellerAddress,
      buyerCompany,
      buyerAddress,
      items: items.map(({ productName, hsCode, quantity, unitPrice }) => ({ productName, hsCode, quantity, unitPrice })),
      grandTotal,
      packageCount,
      grossWeight,
      netWeight,
      measurement,
      vesselVoyage,
      containerSealNo,
      marksNumbers,
      freightTerm,
    };

    const summaryText = `[Trade Document Sent] ${docTitles[docType]} — ${invoiceNo}`;
    onSendDocument(room, docSnapshot, summaryText);
    onClose();
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
              <p className="text-xs text-slate-400">
                {isViewingSent ? 'Sent document — view only.' : 'Fields default from this chat — edit anything before printing.'}
              </p>
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
                disabled={isViewingSent}
                onClick={() => setDocType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${isViewingSent ? 'cursor-default' : 'cursor-pointer'} ${
                  docType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-200'
                } ${isViewingSent && docType !== type ? 'opacity-40' : ''}`}
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
              <Field label="Document No." value={invoiceNo} onChange={setInvoiceNo} disabled={isViewingSent} />
              <Field label="Date" value={issueDate} onChange={setIssueDate} disabled={isViewingSent} />
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exporter / Seller</span>
              <Field label="Company Name" value={sellerCompany} onChange={setSellerCompany} disabled={isViewingSent} />
              <Field label="Address" value={sellerAddress} onChange={setSellerAddress} disabled={isViewingSent} />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Importer / Buyer</span>
              <Field label="Company Name" value={buyerCompany} onChange={setBuyerCompany} disabled={isViewingSent} />
              <Field label="Address" value={buyerAddress} onChange={setBuyerAddress} disabled={isViewingSent} />
            </div>
          </div>

          {/* Shipment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs border-b border-slate-200 pb-6">
            <Field label="Payment Terms" value={paymentTerms} onChange={setPaymentTerms} disabled={isViewingSent} />
            <Field label="Incoterm" value={incoterm} onChange={setIncoterm} disabled={isViewingSent} />
            <Field label="Country of Origin" value={countryOfOrigin} onChange={setCountryOfOrigin} disabled={isViewingSent} />
            <Field label="Port of Loading" value={portOfLoading} onChange={setPortOfLoading} disabled={isViewingSent} />
            <Field label="Port of Discharge" value={portOfDischarge} onChange={setPortOfDischarge} disabled={isViewingSent} />
            {docType === 'BL' && (
              <Field label="Freight" value={freightTerm} onChange={setFreightTerm} disabled={isViewingSent} />
            )}
          </div>

          {/* BL-specific shipping details */}
          {docType === 'BL' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-b border-slate-200 pb-6">
              <Field label="Vessel / Voyage No." value={vesselVoyage} onChange={setVesselVoyage} disabled={isViewingSent} />
              <Field label="Container / Seal No." value={containerSealNo} onChange={setContainerSealNo} disabled={isViewingSent} />
              <Field label="Marks & Numbers" value={marksNumbers} onChange={setMarksNumbers} disabled={isViewingSent} />
            </div>
          )}

          {/* Item Specs Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Item Specifications</h3>
              {!isViewingSent && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[11px] font-extrabold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              )}
            </div>

            <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[560px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold">
                  <th className="p-3 rounded-l-xl">Description of Goods</th>
                  <th className="p-3">HS Code</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Unit Price (USD)</th>
                  <th className="p-3 text-right">Total (USD)</th>
                  {!isViewingSent && <th className="p-3 rounded-r-xl w-8 print:hidden"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3"><Field label="" value={item.productName} onChange={(v) => handleItemChange(item.id, 'productName', v)} disabled={isViewingSent} /></td>
                    <td className="p-3"><Field label="" value={item.hsCode} onChange={(v) => handleItemChange(item.id, 'hsCode', v)} disabled={isViewingSent} /></td>
                    <td className="p-3 w-24">
                      <input
                        type="number"
                        value={item.quantity}
                        disabled={isViewingSent}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-xs font-bold text-slate-900 py-0.5 print:border-none disabled:opacity-100"
                      />
                    </td>
                    <td className="p-3 w-28">
                      <input
                        type="number"
                        value={item.unitPrice}
                        disabled={isViewingSent}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-xs font-bold text-slate-900 py-0.5 print:border-none disabled:opacity-100"
                      />
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      {getItemTotal(item).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {!isViewingSent && (
                      <td className="p-3 print:hidden">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={4} className="p-3 text-right font-extrabold text-slate-900">Grand Total</td>
                  <td className="p-3 text-right font-black text-blue-600">
                    {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {!isViewingSent && <td className="print:hidden"></td>}
                </tr>
              </tfoot>
            </table>
            </div>
          </div>

          {/* Packing List-specific package details */}
          {docType === 'PL' && (
            <div className="space-y-3 border-t border-slate-200 pt-6">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Package Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <Field label="No. of Packages" value={packageCount} onChange={setPackageCount} disabled={isViewingSent} />
                <Field label="Gross Weight" value={grossWeight} onChange={setGrossWeight} disabled={isViewingSent} />
                <Field label="Net Weight" value={netWeight} onChange={setNetWeight} disabled={isViewingSent} />
                <Field label="Measurement" value={measurement} onChange={setMeasurement} disabled={isViewingSent} />
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
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>

          {!isViewingSent && userRole === 'seller' && onSendDocument && (
            <button
              type="button"
              onClick={handleSendDoc}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Send to Chat</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
