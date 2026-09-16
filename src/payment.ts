import { Payment, assertNever } from "./types.js";

export function processPayment(payment: Payment, amount: number): boolean {
  switch (payment.method) {
    case "cash":
      return payment.receivedAmount >= amount;

    case "card":
      return (
        payment.last4Digits.length === 4 && /^\d{4}$/.test(payment.last4Digits)
      );

    case "upi":
      return payment.transactionId.trim().length > 0;

    default:
      return assertNever(payment);
  }
}
