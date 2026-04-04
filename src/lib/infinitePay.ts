/**
 * Módulo de Integração com InfinitePay (InfiniteTap)
 *
 * O InfiniteTap permite que você use o celular como maquininha via NFC.
 * No ambiente web/mobile, geramos um Deep Link que abre o aplicativo
 * da InfinitePay já instalado no dispositivo, processa a venda e 
 * retorna para a nossa URL com o resultado.
 */

export interface InfiniteTapParams {
  amount: number; // Valor em reais (R$). O sistema converte para centavos.
  referenceId: string; // ID interno da venda
}

export const generateInfiniteTapDeepLink = ({ amount, referenceId }: InfiniteTapParams): string => {
  // O valor cobrado na API normalmente precisa estar em centavos.
  const amountInCents = Math.round(amount * 100);
  
  // URL de callback para onde o aplicativo vai retornar
  const returnUrl = encodeURIComponent(`${window.location.origin}/financeiro?ref=${referenceId}`);
  
  // Formato padrão de Deep Link da InfinitePay (Padrão CloudWalk)
  // Obs: Ajuste o scheme conforme a documentação oficial atualizada (ex: infinitepay://pay ou cloudwalk://)
  const deepLink = `infinitepay://pay?amount=${amountInCents}&reference=${referenceId}&return_url=${returnUrl}`;
  
  return deepLink;
};

/**
 * Tenta abrir o InfiniteTap no dispositivo móvel.
 */
export const triggerTapToPay = (params: InfiniteTapParams) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (!isMobile) {
    alert("O Tap to Pay (NFC) só pode ser iniciado a partir de um celular (Android/iOS) com o aplicativo da InfinitePay instalado.");
    return false;
  }
  
  const link = generateInfiniteTapDeepLink(params);
  console.log("Acionando InfiniteTap:", link);
  
  // Redireciona forçadamente a aba atual para o Deep Link do aplicativo
  window.location.href = link;
  return true;
};
