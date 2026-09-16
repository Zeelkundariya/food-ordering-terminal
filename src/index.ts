import { confirm, input, select } from "@inquirer/prompts";
import {
  calculateAdditionalDiscount,
  calculateDiscount,
  calculateFinalAmount,
  calculateMembershipDiscount,
  calculateTax,
  generateBill,
} from "./billing.js";
import {
  addToCart,
  calculateItemTotal,
  calculateSubtotal,
  removeFromCart,
  updateQuantity,
} from "./cart.js";
import { createGuest, createMember, sampleCustomers } from "./customer.js";
import { foodItems, searchFood } from "./data.js";
import { ORDER_STATUSES, updateOrderStatus } from "./order.js";
import { processPayment } from "./payment.js";
import {
  Address,
  Bill,
  CardPayment,
  CartItem,
  CashPayment,
  CustomerType,
  FoodItem,
  MembershipLevel,
  OrderStatus,
  Payment,
  UpiPayment,
  assertNever,
} from "./types.js";

export function displayHeader(): void {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║       🍔 FOOD ORDERING SYSTEM        ║");
  console.log("╚══════════════════════════════════════╝\n");
}

export function displayMenu(items: FoodItem[]): void {
  console.log("\n================ FOOD MENU ================");
  console.log("ID  Name                  Category   Price   Status");
  console.log("--------------------------------------------------");
  items.forEach((item) => {
    const idStr = `#${item.id}`.padEnd(4, " ");
    const nameStr = item.name.padEnd(22, " ");
    const catStr = item.category.padEnd(11, " ");
    const priceStr = `₹${item.price}`.padEnd(8, " ");
    const statusStr = item.isAvailable ? "Available" : "Sold Out";
    console.log(`${idStr}${nameStr}${catStr}${priceStr}${statusStr}`);
  });
  console.log("--------------------------------------------------\n");
}

export function displayCart(
  cart: CartItem[],
  customer: CustomerType | null,
): void {
  if (cart.length === 0) {
    console.log("\n🛒 Your cart is empty.\n");
    return;
  }

  console.log("\n================ CURRENT CART ================");
  cart.forEach((item) => {
    const total = calculateItemTotal(item);
    const nameStr = item.name.padEnd(22, " ");
    const qtyStr = `x${item.quantity}`.padEnd(8, " ");
    console.log(`[#${item.id}] ${nameStr} ${qtyStr} ₹${total}`);
    if (item.specialInstruction) {
      console.log(`     Note: ${item.specialInstruction}`);
    }
  });
  console.log("----------------------------------------------");

  const subtotal = calculateSubtotal(cart);
  console.log(`Subtotal:                        ₹${subtotal}`);

  if (customer) {
    const memDisc = calculateMembershipDiscount(subtotal, customer);
    const addDisc = calculateAdditionalDiscount(subtotal);
    const totalDisc = calculateDiscount(subtotal, customer);
    const taxable = subtotal - totalDisc;
    const tax = calculateTax(taxable);
    const finalAmount = calculateFinalAmount(subtotal, totalDisc);

    const levelName =
      customer.type === "member"
        ? `${customer.membershipLevel.toUpperCase()} Member (${customer.discountPercentage}%)`
        : "Guest (0%)";

    console.log(
      `Customer:                        ${customer.name} [${levelName}]`,
    );
    console.log(`Membership Discount:             -₹${memDisc.toFixed(2)}`);
    console.log(`Subtotal > ₹2000 Discount (5%):  -₹${addDisc.toFixed(2)}`);
    console.log(`GST (5%):                        +₹${tax.toFixed(2)}`);
    console.log("----------------------------------------------");
    console.log(`Estimated Final:                 ₹${finalAmount.toFixed(2)}`);
  } else {
    console.log("Customer:                        (None selected)");
  }
  console.log("==============================================\n");
}

export function displayBill(bill: Bill, status: OrderStatus): void {
  const { customer, cartItems, subtotal, tax, finalAmount, payment } = bill;
  const membershipName =
    customer.type === "member"
      ? customer.membershipLevel.charAt(0).toUpperCase() +
        customer.membershipLevel.slice(1)
      : "Guest";

  const membershipDiscount = calculateMembershipDiscount(subtotal, customer);
  const additionalDiscount = calculateAdditionalDiscount(subtotal);

  console.log("\n========================================");
  console.log("             ORDER SUMMARY              ");
  console.log("========================================\n");
  console.log(`Order ID: #${bill.orderId}\n`);
  console.log(`Customer: ${customer.name}`);
  console.log(`Membership: ${membershipName}\n`);

  console.log("Items:");
  console.log("----------------------------------------");
  cartItems.forEach((item) => {
    const itemTotal = calculateItemTotal(item);
    const nameCol = item.name.padEnd(23, " ");
    const qtyCol = `x${item.quantity}`.padEnd(9, " ");
    console.log(`${nameCol}${qtyCol}₹${itemTotal}`);
    if (item.specialInstruction) {
      console.log(`  Note: ${item.specialInstruction}`);
    }
  });
  console.log("----------------------------------------\n");

  console.log(`Subtotal:                       ₹${subtotal}`);
  console.log(
    `Membership Discount:             ₹${membershipDiscount.toFixed(2)}`,
  );
  console.log(
    `Additional Discount:              ₹${additionalDiscount.toFixed(2)}`,
  );
  console.log(`GST (5%):                         ₹${tax.toFixed(2)}`);
  console.log("----------------------------------------");
  console.log(`Final Amount:                   ₹${finalAmount.toFixed(2)}\n`);

  switch (payment.method) {
    case "cash": {
      console.log("Payment Method: Cash");
      console.log(`Received Amount: ₹${payment.receivedAmount}`);
      const change = payment.receivedAmount - finalAmount;
      if (change > 0) {
        console.log(`Change Returned: ₹${change.toFixed(2)}`);
      }
      break;
    }
    case "card": {
      console.log("Payment Method: Card");
      console.log(`Last 4 Digits: ${payment.last4Digits}`);
      break;
    }
    case "upi": {
      console.log("Payment Method: UPI");
      console.log(`Transaction ID: ${payment.transactionId}`);
      break;
    }
    default:
      return assertNever(payment);
  }

  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
  console.log(`\nOrder Status: ${capitalizedStatus}`);
  console.log("\n========================================");
  console.log("        Thank you for ordering!         ");
  console.log("========================================\n");
}

async function handleSelectOrCreateCustomer(
  current: CustomerType | null,
): Promise<CustomerType> {
  console.log("\n--- Customer Selection ---");
  const options = [
    ...sampleCustomers.map((c) => {
      const typeDesc =
        c.type === "member"
          ? `${c.membershipLevel.toUpperCase()} Member (${c.discountPercentage}% off)`
          : "Guest (0% off)";
      return {
        name: `Select: ${c.name} [${typeDesc}]`,
        value: `sample_${c.id}`,
      };
    }),
    { name: "+ Create New Guest Customer", value: "new_guest" },
    { name: "+ Create New Member Customer", value: "new_member" },
  ];

  if (current) {
    options.unshift({
      name: `Keep current: ${current.name} (${current.type})`,
      value: "keep_current",
    });
  }

  const choice = await select({
    message: "Choose customer option:",
    choices: options,
  });

  if (choice === "keep_current" && current) {
    return current;
  }

  if (choice.startsWith("sample_")) {
    const id = Number(choice.replace("sample_", ""));
    const selected = sampleCustomers.find((c) => c.id === id);
    if (selected) {
      console.log(`✓ Selected customer: ${selected.name}`);
      return selected;
    }
  }

  const name = await input({
    message: "Enter customer name:",
    validate: (val) => (val.trim().length > 0 ? true : "Name cannot be empty"),
  });

  const phoneInput = await input({
    message: "Enter phone number (optional, press Enter to skip):",
  });
  const phone = phoneInput.trim().length > 0 ? phoneInput.trim() : undefined;

  const city = await input({
    message: "Enter city:",
    validate: (val) => (val.trim().length > 0 ? true : "City cannot be empty"),
  });

  const street = await input({
    message: "Enter street address:",
    validate: (val) =>
      val.trim().length > 0 ? true : "Street cannot be empty",
  });

  const pincode = await input({
    message: "Enter pincode:",
    validate: (val) =>
      val.trim().length > 0 ? true : "Pincode cannot be empty",
  });

  const address: Address = {
    city: city.trim(),
    street: street.trim(),
    pincode: pincode.trim(),
  };
  const newId = Math.floor(Math.random() * 9000) + 1000;

  if (choice === "new_guest") {
    const guest = createGuest(newId, name.trim(), address, phone);
    console.log(`✓ Guest customer created: ${guest.name}`);
    return guest;
  }

  const membershipLevel = (await select({
    message: "Select membership level:",
    choices: [
      { name: "Silver (5% discount)", value: "silver" },
      { name: "Gold (10% discount)", value: "gold" },
      { name: "Platinum (15% discount)", value: "platinum" },
    ],
  })) as MembershipLevel;

  const membershipId = await input({
    message: "Enter membership ID:",
    validate: (val) =>
      val.trim().length > 0 ? true : "Membership ID cannot be empty",
  });

  const member = createMember(
    newId,
    name.trim(),
    address,
    membershipLevel,
    membershipId.trim(),
    phone,
  );
  console.log(
    `✓ ${membershipLevel.toUpperCase()} Member created: ${member.name}`,
  );
  return member;
}

async function handleAddToCart(cart: CartItem[]): Promise<CartItem[]> {
  displayMenu(foodItems);

  const idStr = await input({
    message: "Enter Food Item ID to add:",
    validate: (val) => {
      const num = Number(val);
      if (isNaN(num) || num <= 0) return "Please enter a valid numeric ID";
      return true;
    },
  });

  const foodId = Number(idStr);
  const food = foodItems.find((f) => f.id === foodId);

  if (!food) {
    console.log("❌ Invalid Food Item ID! Item not found.");
    return cart;
  }

  if (!food.isAvailable) {
    console.log(`❌ "${food.name}" is currently unavailable/sold out.`);
    return cart;
  }

  const qtyStr = await input({
    message: `Enter quantity for "${food.name}":`,
    default: "1",
    validate: (val) => {
      const num = Number(val);
      if (isNaN(num) || num <= 0) return "Quantity must be greater than 0";
      return true;
    },
  });

  const quantity = Number(qtyStr);
  const specialInstruction = await input({
    message: "Special instruction (optional, press Enter to skip):",
  });

  const note =
    specialInstruction.trim().length > 0
      ? specialInstruction.trim()
      : undefined;

  const updatedCart = addToCart(cart, food, quantity, note);
  console.log(`✓ Added ${quantity}x "${food.name}" to cart.`);
  return updatedCart;
}

async function handleUpdateQuantity(cart: CartItem[]): Promise<CartItem[]> {
  if (cart.length === 0) {
    console.log("\n🛒 Cart is empty. Nothing to update.\n");
    return cart;
  }

  const choices = cart.map((item) => ({
    name: `${item.name} (Current Qty: ${item.quantity})`,
    value: item.id.toString(),
  }));

  const selectedIdStr = await select({
    message: "Select item to update quantity:",
    choices,
  });

  const foodId = Number(selectedIdStr);
  const newQtyStr = await input({
    message: "Enter new quantity (0 to remove):",
    validate: (val) => {
      const num = Number(val);
      if (isNaN(num) || num < 0) return "Quantity cannot be negative";
      return true;
    },
  });

  const newQty = Number(newQtyStr);
  const updatedCart = updateQuantity(cart, foodId, newQty);
  if (newQty === 0) {
    console.log("✓ Item removed from cart.");
  } else {
    console.log(`✓ Quantity updated to ${newQty}.`);
  }
  return updatedCart;
}

async function handleRemoveFromCart(cart: CartItem[]): Promise<CartItem[]> {
  if (cart.length === 0) {
    console.log("\n🛒 Cart is empty. Nothing to remove.\n");
    return cart;
  }

  const choices = cart.map((item) => ({
    name: `${item.name} (Qty: ${item.quantity})`,
    value: item.id.toString(),
  }));

  const selectedIdStr = await select({
    message: "Select item to remove from cart:",
    choices,
  });

  const foodId = Number(selectedIdStr);
  const updatedCart = removeFromCart(cart, foodId);
  console.log("✓ Item removed from cart.");
  return updatedCart;
}

async function handleCheckout(
  orderId: number,
  cart: CartItem[],
  customer: CustomerType | null,
  orderStatus: OrderStatus,
): Promise<{
  newCart: CartItem[];
  newOrderId: number;
  newOrderStatus: OrderStatus;
}> {
  if (!customer) {
    console.log(
      "\n❌ No customer selected! Please create/select a customer before checkout.\n",
    );
    return { newCart: cart, newOrderId: orderId, newOrderStatus: orderStatus };
  }

  if (cart.length === 0) {
    console.log("\n❌ Cart is empty! Add items to cart before checkout.\n");
    return { newCart: cart, newOrderId: orderId, newOrderStatus: orderStatus };
  }

  const subtotal = calculateSubtotal(cart);
  const memDisc = calculateMembershipDiscount(subtotal, customer);
  const addDisc = calculateAdditionalDiscount(subtotal);
  const totalDisc = calculateDiscount(subtotal, customer);
  const afterDiscount = subtotal - totalDisc;
  const tax = calculateTax(afterDiscount);
  const finalAmount = calculateFinalAmount(subtotal, totalDisc);

  console.log("\n================ CHECKOUT SUMMARY ================");
  console.log(`Customer:                        ${customer.name}`);
  console.log(`Subtotal:                        ₹${subtotal}`);
  console.log(`Membership Discount:             -₹${memDisc.toFixed(2)}`);
  console.log(`Additional Discount (>₹2000):    -₹${addDisc.toFixed(2)}`);
  console.log(`Amount After Discount:           ₹${afterDiscount.toFixed(2)}`);
  console.log(`GST (5%):                        +₹${tax.toFixed(2)}`);
  console.log("--------------------------------------------------");
  console.log(`Final Amount Payable:            ₹${finalAmount.toFixed(2)}`);
  console.log("==================================================\n");

  const shouldProceed = await confirm({
    message: `Proceed to payment of ₹${finalAmount.toFixed(2)}?`,
    default: true,
  });

  if (!shouldProceed) {
    console.log("Payment cancelled.");
    return { newCart: cart, newOrderId: orderId, newOrderStatus: orderStatus };
  }

  const paymentMethod = await select({
    message: "Select payment method:",
    choices: [
      { name: "1. Cash", value: "cash" },
      { name: "2. Card", value: "card" },
      { name: "3. UPI", value: "upi" },
    ],
  });

  let payment: Payment;

  if (paymentMethod === "cash") {
    const receivedStr = await input({
      message: `Enter cash received (minimum ₹${finalAmount.toFixed(2)}):`,
      validate: (val) => {
        const num = Number(val);
        if (isNaN(num) || num <= 0) return "Enter a valid amount";
        if (num < finalAmount)
          return `Amount must be at least ₹${finalAmount.toFixed(2)}`;
        return true;
      },
    });
    const receivedAmount = Number(receivedStr);
    payment = { method: "cash", receivedAmount };
  } else if (paymentMethod === "card") {
    const last4Digits = await input({
      message: "Enter card last 4 digits:",
      validate: (val) => {
        if (!/^\d{4}$/.test(val.trim()))
          return "Must be exactly 4 numeric digits";
        return true;
      },
    });
    payment = { method: "card", last4Digits: last4Digits.trim() };
  } else {
    const transactionId = await input({
      message: "Enter UPI Transaction ID:",
      validate: (val) =>
        val.trim().length > 0 ? true : "Transaction ID cannot be empty",
    });
    payment = { method: "upi", transactionId: transactionId.trim() };
  }

  const paymentSuccess = processPayment(payment, finalAmount);
  if (!paymentSuccess) {
    console.log("\n❌ Payment verification failed. Order not placed.\n");
    return { newCart: cart, newOrderId: orderId, newOrderStatus: orderStatus };
  }

  const confirmedStatus = updateOrderStatus(orderStatus, "confirmed");
  const billResult = generateBill(orderId, customer, cart, payment);

  if (billResult.status === "error") {
    console.log(`\n❌ Bill Generation Error: ${billResult.message}\n`);
    return { newCart: cart, newOrderId: orderId, newOrderStatus: orderStatus };
  }

  displayBill(billResult.bill, confirmedStatus);

  return {
    newCart: [],
    newOrderId: orderId + 1,
    newOrderStatus: confirmedStatus,
  };
}

async function handleChangeOrderStatus(
  currentStatus: OrderStatus,
): Promise<OrderStatus> {
  console.log(`\nCurrent Order Status: "${currentStatus}"`);

  const newStatus = (await select({
    message: "Select new order status:",
    choices: ORDER_STATUSES.map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: status,
    })),
  })) as OrderStatus;

  const updatedStatus = updateOrderStatus(currentStatus, newStatus);
  console.log(`✓ Order status updated to: "${updatedStatus}".\n`);
  return updatedStatus;
}

async function handleSearchFood(): Promise<void> {
  const query = await input({
    message: "Search food by name:",
    validate: (val) =>
      val.trim().length > 0 ? true : "Search term cannot be empty",
  });

  const results = searchFood(foodItems, query);

  console.log(`\nSearch results for "${query}":`);
  console.log("----------------------------------------");
  if (results.length === 0) {
    console.log("No food items found matching your query.");
  } else {
    results.forEach((item, index) => {
      const statusNote = item.isAvailable ? "" : " (Sold Out)";
      console.log(`${index + 1}. ${item.name} - ₹${item.price}${statusNote}`);
    });
  }
  console.log("----------------------------------------\n");
}

export async function main(): Promise<void> {
  displayHeader();

  let cart: CartItem[] = [];
  let currentCustomer: CustomerType | null = null;
  let orderId = 1001;
  let orderStatus: OrderStatus = "pending";

  let isRunning = true;

  while (isRunning) {
    try {
      const customerInfo = currentCustomer
        ? `${currentCustomer.name} (${currentCustomer.type})`
        : "None";
      const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

      console.log(
        `[Customer: ${customerInfo} | Cart Items: ${cartCount} | Order Status: ${orderStatus}]`,
      );

      const choice = await select({
        message: "Main Menu:",
        choices: [
          { name: "1. View Food Menu", value: "1" },
          { name: "2. Create / Select Customer", value: "2" },
          { name: "3. Add Item to Cart", value: "3" },
          { name: "4. View Cart", value: "4" },
          { name: "5. Update Quantity", value: "5" },
          { name: "6. Remove Item", value: "6" },
          { name: "7. Checkout", value: "7" },
          { name: "8. Change Order Status", value: "8" },
          { name: "9. Search Food", value: "9" },
          { name: "10. Exit", value: "10" },
        ],
      });

      switch (choice) {
        case "1":
          displayMenu(foodItems);
          break;

        case "2":
          currentCustomer = await handleSelectOrCreateCustomer(currentCustomer);
          break;

        case "3":
          cart = await handleAddToCart(cart);
          break;

        case "4":
          displayCart(cart, currentCustomer);
          break;

        case "5":
          cart = await handleUpdateQuantity(cart);
          break;

        case "6":
          cart = await handleRemoveFromCart(cart);
          break;

        case "7": {
          const result = await handleCheckout(
            orderId,
            cart,
            currentCustomer,
            orderStatus,
          );
          cart = result.newCart;
          orderId = result.newOrderId;
          orderStatus = result.newOrderStatus;
          break;
        }

        case "8":
          orderStatus = await handleChangeOrderStatus(orderStatus);
          break;

        case "9":
          await handleSearchFood();
          break;

        case "10":
          console.log(
            "\nThank you for using Food Ordering System. Goodbye! 👋\n",
          );
          isRunning = false;
          break;

        default:
          break;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "ExitPromptError") {
        console.log("\nOperation cancelled. Exiting application.\n");
        isRunning = false;
      } else {
        console.error("\nUnexpected error occurred:", err);
      }
    }
  }
}

if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("Fatal error:", err);
  });
}
