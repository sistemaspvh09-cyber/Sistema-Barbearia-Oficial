/**
 * InfinitePay InfiniteTap — Deep Link Integration
 *
 * Documentação oficial: https://www.infinitepay.io/checkout-tap
 *
 * Scheme real (iOS + Android): infinitepaydash://infinitetap-app
 *
 * Parâmetros obrigatórios:
 *   amount              — valor em centavos (inteiro, mínimo 100 = R$1,00)
 *   payment_method      — "credit" | "debit"
 *   installments        — "1" a "12" (crédito); sempre "1" para débito
 *   order_id            — identificador único da cobrança
 *   result_url          — URL de callback (HTTPS) que o iOS abre após pagamento
 *   app_client_referrer — identificador do seu aplicativo
 *
 * Parâmetros opcionais:
 *   handle              — handle da conta InfinitePay do lojista
 *   af_force_deeplink   — "true" (necessário no iOS)
 *
 * Fluxo completo:
 *   1. Salva transação pendente no localStorage
 *   2. Redireciona para o deep link do InfinitePay
 *   3. InfinitePay processa → redireciona para result_url com params de resultado
 *   4. Página /payment-result lê localStorage + params → salva no Supabase
 */

const RESULT_URL = `${window.location.origin}/payment-result`;
const APP_REFERRER = 'BarberPro';
const PENDING_PREFIX = 'ipay_pending_';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InfinitePayParams {
  orderId: string;
  amountCents: number;          // Valor em centavos
  paymentMethod: 'credit' | 'debit';
  installments: number;         // 1–12
  handle?: string;              // Handle da conta InfinitePay do lojista
}

export interface PendingTransaction {
  orderId: string;
  amountCents: number;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD';
  installments: number;
  description: string;
  clientId: string | null;
  barbershopId: string | null;
  createdAt: string;
}

export interface InfinitePayResult {
  orderId: string;
  nsu: string;
  aut: string;
  cardBrand: string;
  handle: string;
  merchantDocument: string;
  warning?: string;             // Presente apenas em caso de erro
}

// ─── Deep link builder ────────────────────────────────────────────────────────

export function buildInfinitePayLink(params: InfinitePayParams): string {
  const p = new URLSearchParams({
    amount:              String(params.amountCents),
    payment_method:      params.paymentMethod,
    installments:        String(params.installments),
    order_id:            params.orderId,
    result_url:          RESULT_URL,
    app_client_referrer: APP_REFERRER,
    af_force_deeplink:   'true',
  });

  if (params.handle) p.set('handle', params.handle);

  return `infinitepaydash://infinitetap-app?${p.toString()}`;
}

// ─── Pending transaction (localStorage) ──────────────────────────────────────

export function savePendingTransaction(tx: PendingTransaction): void {
  localStorage.setItem(PENDING_PREFIX + tx.orderId, JSON.stringify(tx));
}

export function getPendingTransaction(orderId: string): PendingTransaction | null {
  const raw = localStorage.getItem(PENDING_PREFIX + orderId);
  if (!raw) return null;
  try { return JSON.parse(raw) as PendingTransaction; }
  catch { return null; }
}

export function clearPendingTransaction(orderId: string): void {
  localStorage.removeItem(PENDING_PREFIX + orderId);
}

// ─── Result URL parser ────────────────────────────────────────────────────────

export function parseInfinitePayResult(search: string): InfinitePayResult | null {
  const p = new URLSearchParams(search);
  const orderId = p.get('order_id');
  if (!orderId) return null;

  return {
    orderId,
    nsu:              p.get('nsu') ?? '',
    aut:              p.get('aut') ?? '',
    cardBrand:        p.get('card_brand') ?? '',
    handle:           p.get('handle') ?? '',
    merchantDocument: p.get('merchant_document') ?? '',
    warning:          p.get('warning') ?? undefined,
  };
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * Salva a transação pendente e abre o app InfinitePay via deep link.
 * O iOS redirecionará de volta para /payment-result após o pagamento.
 */
export function openInfinitePay(
  params: InfinitePayParams,
  pendingData: Omit<PendingTransaction, 'orderId' | 'createdAt'>,
): void {
  savePendingTransaction({
    orderId:    params.orderId,
    createdAt:  new Date().toISOString(),
    ...pendingData,
  });

  const link = buildInfinitePayLink(params);
  window.location.href = link;
}

// ─── Handle storage (Barbershop.settings.infinitePayHandle) ──────────────────

const HANDLE_KEY = 'ipay_handle_cache';

export function getCachedHandle(): string {
  return localStorage.getItem(HANDLE_KEY) ?? '';
}

export function setCachedHandle(handle: string): void {
  localStorage.setItem(HANDLE_KEY, handle);
}
