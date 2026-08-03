// app/api/payments/process/route.js
import { NextResponse } from 'next/server';

// KLICK B2B 플랫폼 기본 수수료율 (5%)
const PLATFORM_FEE_PERCENTAGE = 0.05;

export async function POST(req) {
  try {
    const body = await req.json();
    const { paymentMethod, amount, currency, orderTitle, buyerEmail, sellerCompany, sellerAccountId } = body;

    const totalAmount = parseFloat(amount || '150.00');
    
    // 1. 플랫폼 수수료 및 셀러 실제 정산액 자동 계산
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENTAGE * 100) / 100; // 수수료 (5%)
    const sellerPayoutAmount = Math.round((totalAmount - platformFee) * 100) / 100; // 셀러 지급액 (95%)

    // -------------------------------------------------------------
    // [방식 1] 소액 해외 카드 결제 (Stripe Connect 연동)
    // -------------------------------------------------------------
    if (paymentMethod === 'card') {
      return NextResponse.json({
        success: true,
        type: 'card',
        redirectUrl: `https://checkout.stripe.com/pay/mock_session_${Date.now()}`,
        feeDetails: {
          totalAmount: `${totalAmount} USD`,
          platformFee: `${platformFee} USD (5% Platform Fee)`,
          sellerPayoutAmount: `${sellerPayoutAmount} USD (Net to Seller)`,
        },
        message: 'Stripe Connect payment session initialized with automatic 5% platform fee deduction.',
      });
    }

    // -------------------------------------------------------------
    // [방식 2] B2B 대형 주문 현지 가상계좌 송금 (Payoneer Auto Split)
    // -------------------------------------------------------------
    if (paymentMethod === 'wire_transfer') {
      return NextResponse.json({
        success: true,
        type: 'wire_transfer',
        bankDetails: {
          bankName: 'JPMorgan Chase Bank (KLICK Master Escrow Account)',
          accountNumber: '9876-5432-1098-7654',
          routingNumber: '021000021',
          beneficiaryName: `KLICK Trade Escrow (${sellerCompany})`,
          swiftCode: 'CHASUS33',
        },
        feeDetails: {
          totalAmount: `${totalAmount} USD`,
          platformFee: `${platformFee} USD (5% KLICK Commission)`,
          sellerPayoutAmount: `${sellerPayoutAmount} USD (To be remitted to Seller Bank)`,
        },
        message: 'KLICK B2B master account generated. Platform fee will be automatically deducted before payout.',
      });
    }

    // -------------------------------------------------------------
    // [방식 3] 무역 보증 에스크로 결제 (Escrow.com Partner Fee API)
    // -------------------------------------------------------------
    if (paymentMethod === 'escrow') {
      return NextResponse.json({
        success: true,
        type: 'escrow',
        escrowTransactionId: `ESC-GLOBAL-${Math.floor(100000 + Math.random() * 900000)}`,
        feeDetails: {
          totalAmount: `${totalAmount} USD`,
          platformFee: `${platformFee} USD (5% Partner Fee)`,
          sellerPayoutAmount: `${sellerPayoutAmount} USD (Released after inspection)`,
        },
        terms: `Funds held in KLICK Escrow. Upon buyer inspection approval, $${sellerPayoutAmount} USD will be disbursed to seller after deducting $${platformFee} USD platform fee.`,
        message: 'Escrow agreement initialized with partner fee split.',
      });
    }

    return NextResponse.json({ error: 'Invalid payment method selected.' }, { status: 400 });
  } catch (error) {
    console.error('Payment Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}