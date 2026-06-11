import { PaymentResult } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function initializePayment(): Promise<{ success: boolean; reference: string }> {
  await delay(300);
  return { success: true, reference: `razorpay-${Math.floor(100000 + Math.random() * 900000)}` };
}

export async function confirmPayment(success: boolean): Promise<PaymentResult> {
  await delay(300);
  return {
    success,
    status: success ? 'captured' : 'failed',
    message: success ? 'Payment successful.' : 'Payment failed. Please try again.',
  };
}
