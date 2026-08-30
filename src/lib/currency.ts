/** Format integer centavos as Brazilian Real currency string, e.g. 4500 → "R$\u00a045,00" */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

/** Format installment message, e.g. "3x de R$ 15,00 sem juros" */
export function formatInstallments(cents: number, installments: number): string {
  const installmentValue = Math.floor(cents / installments)
  return `${installments}x de ${formatCurrency(installmentValue)} sem juros`
}
