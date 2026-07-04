export type EntityStatus = 'active' | 'archived';

export type Person = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TransactionEffect = 'Spent' | 'Received' | 'Capital Added' | 'Neutral';

export type TransactionType = {
  id: string;
  name: string;
  dashboard_effect: TransactionEffect;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque' | 'Other';

export type Transaction = {
  id: string;
  transaction_date: string;
  person_id: string | null;
  category_id: string | null;
  type: string;
  amount: number;
  reason: string;
  description: string | null;
  payment_mode: PaymentMode;
  important: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  people?: Pick<Person, 'id' | 'name'> | null;
  categories?: Pick<Category, 'id' | 'name'> | null;
};

export type NavKey = 'dashboard' | 'people' | 'categories' | 'transactions';
