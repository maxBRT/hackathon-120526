/** DB stores `entryFee` in major units; Stripe uses minor units for CAD, USD, EUR. */
export function tournamentEntryFeeToStripeUnitAmount(entryFee: number, currency: string): number {
  const c = currency.toUpperCase();
  if (c === "CAD" || c === "USD" || c === "EUR") {
    return entryFee * 100;
  }
  throw new Error(`Unsupported currency for Stripe Checkout: ${currency}`);
}
