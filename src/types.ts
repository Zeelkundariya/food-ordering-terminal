export type FoodCategory = "pizza" | "burger" | "drink" | "dessert";

export interface FoodItem {
  id: number;
  name: string;
  category: FoodCategory;
  price: number;
  isAvailable: boolean;
}

export interface Address {
  city: string;
  street: string;
  pincode: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address: Address;
}

export interface Guest extends Customer {
  type: "guest";
}

export type MembershipLevel = "silver" | "gold" | "platinum";

export interface Member extends Customer {
  type: "member";
  membershipId: string;
  discountPercentage: number;
  membershipLevel: MembershipLevel;
}

export type CustomerType = Guest | Member;

export interface OrderInformation {
  quantity: number;
  specialInstruction?: string;
}

export type CartItem = FoodItem & OrderInformation;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivered"
  | "cancelled";

export interface CashPayment {
  method: "cash";
  receivedAmount: number;
}

export interface CardPayment {
  method: "card";
  last4Digits: string;
}

export interface UpiPayment {
  method: "upi";
  transactionId: string;
}

export type Payment = CashPayment | CardPayment | UpiPayment;

export interface Bill {
  orderId: number;
  customer: CustomerType;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  finalAmount: number;
  payment: Payment;
}

export type BillResult =
  | {
      status: "success";
      bill: Bill;
    }
  | {
      status: "error";
      message: string;
    };

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}
