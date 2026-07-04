import type { PaymentMode } from '../types';

export const defaultTransactionTypes = ['Spent', 'Received', 'Capital Added', 'Transfer'];

export const paymentModes: PaymentMode[] = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Card',
  'Cheque',
  'Other',
];
