import { supabase } from '../lib/supabase';

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'TRANSFER'
  | 'PREFERENCIA_CLIENTE';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'COMMISSION';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface CreateTransactionInput {
  barbershopId: string;
  appointmentId?: string | null;
  clientId?: string | null;
  barberId?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string | null;
  paymentMethod?: PaymentMethod | null;
  status?: TransactionStatus;
  gateway?: string | null;
  gatewayReference?: string | null;
  externalOrderId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface Transaction {
  id: string;
  barbershopId: string;
  appointmentId: string | null;
  clientId: string | null;
  barberId: string | null;
  type: TransactionType;
  amount: number;
  category: string | null;
  description: string | null;
  paymentMethod: PaymentMethod | null;
  status: TransactionStatus;
  gateway: string | null;
  gatewayReference: string | null;
  externalOrderId: string | null;
  metadata: Record<string, unknown> | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  TRANSFER: 'Transferência',
  PREFERENCIA_CLIENTE: 'Preferência do cliente',
};

function sanitizeMetadata(metadata?: Record<string, unknown> | null) {
  return metadata && Object.keys(metadata).length > 0 ? metadata : null;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const payload = {
    barbershopId: input.barbershopId,
    appointmentId: input.appointmentId ?? null,
    clientId: input.clientId ?? null,
    barberId: input.barberId ?? null,
    type: input.type,
    amount: input.amount,
    description: input.description,
    category: input.category ?? 'servico',
    paymentMethod: input.paymentMethod ?? null,
    status: input.status ?? 'COMPLETED',
    gateway: input.gateway ?? null,
    gatewayReference: input.gatewayReference ?? null,
    externalOrderId: input.externalOrderId ?? null,
    metadata: sanitizeMetadata(input.metadata),
    date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('Transaction')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Transaction;
}

export async function updateTransaction(
  transactionId: string,
  updates: Partial<CreateTransactionInput>,
): Promise<Transaction> {
  const payload = {
    appointmentId: updates.appointmentId,
    clientId: updates.clientId,
    barberId: updates.barberId,
    type: updates.type,
    amount: updates.amount,
    description: updates.description,
    category: updates.category,
    paymentMethod: updates.paymentMethod,
    status: updates.status,
    gateway: updates.gateway,
    gatewayReference: updates.gatewayReference,
    externalOrderId: updates.externalOrderId,
    metadata: updates.metadata === undefined ? undefined : sanitizeMetadata(updates.metadata),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('Transaction')
    .update(payload)
    .eq('id', transactionId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Transaction;
}

export async function getTransactions(barbershopId: string, limit = 100): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('Transaction')
    .select('*')
    .eq('barbershopId', barbershopId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as Transaction[];
}

export async function findTransactionByExternalOrderId(externalOrderId: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('Transaction')
    .select('*')
    .eq('externalOrderId', externalOrderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Transaction;
}

export async function upsertTransactionByExternalOrderId(
  input: CreateTransactionInput,
): Promise<Transaction> {
  if (!input.externalOrderId) {
    throw new Error('externalOrderId é obrigatório para upsert.');
  }

  const existing = await findTransactionByExternalOrderId(input.externalOrderId);
  if (existing) {
    return updateTransaction(existing.id, input);
  }

  return createTransaction(input);
}
