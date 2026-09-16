import { OrderStatus, assertNever } from "./types.js";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "delivered",
  "cancelled",
];

export function updateOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): OrderStatus {
  switch (newStatus) {
    case "pending":
      return "pending";

    case "confirmed":
      return "confirmed";

    case "preparing":
      return "preparing";

    case "delivered":
      return "delivered";

    case "cancelled":
      return "cancelled";

    default:
      return assertNever(newStatus);
  }
}
