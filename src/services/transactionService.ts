import { supabase } from '../lib/supabase';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'TRANSFER';
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CreateTransactionInput {
  barbershopId: string;
  appointmentId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string;
  paymentMethod: PaymentMethod;
}

export interface Transaction {
  id: string;
  barbershopId: string;
  appointmentId: string | null;
  type: TransactionType;
  amount: number;
  category: string | null;
  description: string | null;
  paymentMethod: PaymentMethod | null;
  date: string;
  createdAt: string;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const { data, error } = await supabase
    .from('Transaction')
    .insert({
      barbershopId: input.barbershopId,
      appointmentId: input.appointmentId ?? null,
      type: input.type,
      amount: input.amount,
      description: input.description,
      category: input.category ?? 'servico',
      paymentMethod: input.paymentMethod,
      date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function getTransactions(barbershopId: string, limit = 50): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('Transaction')
    .select('*')
    .eq('barbershopId', barbershopId)
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Transaction[];
}

/** Maps payment method enum to human-readable label */
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  TRANSFER: 'Transferência',
};
