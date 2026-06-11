export interface PaymentResult {
  success: boolean;
  status: 'captured' | 'failed';
  message: string;
}
