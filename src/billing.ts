import { calculateSubtotal } from "./cart.js";
import { BillResult, CartItem, CustomerType, Payment } from "./types.js";

export function calculateMembershipDiscount(
  subtotal: number,
  customer: CustomerType,
): number {
  if (customer.type === "member") {
    return Number(((subtotal * customer.discountPercentage) / 100).toFixed(2));
  }
  return 0;
}

export function calculateAdditionalDiscount(subtotal: number): number {
  if (subtotal > 2000) {
    return Number((subtotal * 0.05).toFixed(2));
  }
  return 0;
}

export function calculateDiscount(
  subtotal: number,
  customer: CustomerType,
): number {
  const membershipDiscount = calculateMembershipDiscount(subtotal, customer);
  const additionalDiscount = calculateAdditionalDiscount(subtotal);
  return Number((membershipDiscount + additionalDiscount).toFixed(2));
}

export function calculateTax(amountAfterDiscount: number): number {
  return Number((amountAfterDiscount * 0.05).toFixed(2));
}

export function calculateFinalAmount(
  subtotal: number,
  discount: number,
): number {
  const afterDiscount = subtotal - discount;
  const tax = calculateTax(afterDiscount);
  return Number((afterDiscount + tax).toFixed(2));
}

export function generateBill(
  orderId: number,
  customer: CustomerType | null | undefined,
  cart: CartItem[],
  payment: Payment | null | undefined,
): BillResult {
  if (!customer) {
    return {
      status: "error",
      message: "Cannot generate bill without customer details.",
    };
  }

  if (cart.length === 0) {
    return {
      status: "error",
      message: "Cannot generate bill for an empty cart.",
    };
  }

  if (!payment) {
    return {
      status: "error",
      message: "Cannot generate bill without payment information.",
    };
  }

  const subtotal = calculateSubtotal(cart);
  const discount = calculateDiscount(subtotal, customer);
  const finalAmount = calculateFinalAmount(subtotal, discount);
  const tax = calculateTax(subtotal - discount);

  return {
    status: "success",
    bill: {
      orderId,
      customer,
      cartItems: [...cart],
      subtotal,
      discount,
      tax,
      finalAmount,
      payment,
    },
  };
}
