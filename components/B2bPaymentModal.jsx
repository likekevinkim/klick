// components/B2bPaymentModal.jsx
'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  DollarSign, 
  Loader2, 
  ArrowRight,
  Copy,
  Check,
  PieChart
} from 'lucide-react';

export default function B2bPaymentModal({ isOpen, onClose, quoteData }) {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const itemAmount = quoteData?.amount || '150.00';
  const itemTitle = quoteData?.title || 'B2B Wholesale Sample Order';
  const sellerCompany = quoteData?.sellerCompany || 'Hankook Precision Co., Ltd.';

  // 3가지 통합 결제 및 자동 수수료 정산 요청 핸들러
  const handlePaymentSubmit = async () => {
    setLoading(true);
    setPaymentResult(null);

    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          amount: itemAmount,
          currency: 'USD',
          orderTitle: itemTitle,
          sellerCompany: sellerCompany,
          buyerEmail: 'buyer@globaltrading.com',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentResult(data);
      } else {
        alert(`Payment Initialization Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Payment submit error:', error);
      alert('Network error during payment process.');
    } finally {
      setLoading(false);
    }
  };

  const copyBankInfo = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* 모달 상단 헤더 */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              KLICK Secure Automated Escrow & Settlement
            </span>
            <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              B2B Order Checkout & Payout
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* 주문 상품 요약 및 금액 카드 */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Order</span>
              <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{itemTitle}</h4>
              <p className="text-[11px] text-slate-500">Supplier: {sellerCompany}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] font-bold text-slate-400 block">Total Amount</span>
              <span className="text-base font-extrabold text-blue-600">${itemAmount} USD</span>
            </div>
          </div>

          {/* 결제 완료 시 수수료 차감 내역 및 결과 안내 */}
          {paymentResult ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* 공통 정산 분개 내역 안내 바 */}
              {paymentResult.feeDetails && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                      <PieChart className="w-4 h-4" /> KLICK Fee & Seller Settlement Split
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold">Auto Payout</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">KLICK Platform Fee (5%)</span>
                      <span className="font-bold text-rose-400">{paymentResult.feeDetails.platformFee}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Net Payout to Seller (95%)</span>
                      <span className="font-bold text-emerald-400">{paymentResult.feeDetails.sellerPayoutAmount}</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentResult.type === 'card' && (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-extrabold text-slate-900">Stripe Card Payment Initialized</h4>
                  <p className="text-xs text-slate-600">The buyer payment will be deposited into KLICK Master Account and 95% will be transferred automatically to the seller after deducting 5% fee.</p>
                  <a
                    href={paymentResult.redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                  >
                    <span>Proceed to Stripe Gateway</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {paymentResult.type === 'wire_transfer' && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3 text-xs text-slate-800">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <span className="font-extrabold text-blue-700 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> KLICK Master Virtual Account (For T/T Wire)
                    </span>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md font-bold">Auto Split</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">Bank Name:</span> <span className="font-bold">{paymentResult.bankDetails.bankName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Account No:</span> <span className="font-bold text-blue-700">{paymentResult.bankDetails.accountNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Routing No:</span> <span className="font-bold">{paymentResult.bankDetails.routingNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Beneficiary:</span> <span className="font-bold">{paymentResult.bankDetails.beneficiaryName}</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyBankInfo(`${paymentResult.bankDetails.bankName} / Acc: ${paymentResult.bankDetails.accountNumber}`)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy KLICK Master Account Details'}</span>
                  </button>
                </div>
              )}

              {paymentResult.type === 'escrow' && (
                <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3 text-center border border-slate-800">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-extrabold">Trade Assurance Partner Escrow Active</h4>
                  <p className="text-xs text-slate-300">Transaction Ref: <span className="font-bold text-emerald-400">{paymentResult.escrowTransactionId}</span></p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{paymentResult.terms}</p>
                </div>
              )}
            </div>
          ) : (
            /* 결제 수단 선택 UI */
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-slate-700 block">Select Preferred B2B Payment Method:</span>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    selectedMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">Instant Card / Sample Payment</h5>
                      <p className="text-[10px] text-slate-500">Via Stripe Connect (Automatic 5% Platform Fee Deduction)</p>
                    </div>
                  </div>
                  {selectedMethod === 'card' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('wire_transfer')}
                  className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    selectedMethod === 'wire_transfer'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">B2B Local Virtual Wire Transfer (T/T)</h5>
                      <p className="text-[10px] text-slate-500">Deposit into KLICK Master Account (Net 95% Remitted to Seller)</p>
                    </div>
                  </div>
                  {selectedMethod === 'wire_transfer' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('escrow')}
                  className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    selectedMethod === 'escrow'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">Trade Assurance Partner Escrow</h5>
                      <p className="text-[10px] text-slate-500">Secured via Escrow.com API (Fee split on shipment delivery)</p>
                    </div>
                  </div>
                  {selectedMethod === 'escrow' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Calculating Fee & Initializing Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Order Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}