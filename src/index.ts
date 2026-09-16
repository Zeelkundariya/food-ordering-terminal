import { input, select, confirm } from "@inquirer/prompts";

import {
  calculateDiscount,
  calculateFinalAmount,
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
  CartItem,
  CustomerType,
  FoodItem,
  MembershipLevel,
  OrderStatus,
  Payment,
} from "./types.js";


// ---------------- HEADER ----------------

function showHeader() {
  console.log("\n=================================");
  console.log("       🍔 FOOD ORDERING APP");
  console.log("=================================\n");
}


// ---------------- FOOD MENU ----------------

function showMenu(items: FoodItem[]) {
  console.log("\n------------- FOOD MENU -------------");

  items.forEach((item) => {
    console.log(
      `${item.id}. ${item.name} - ₹${item.price} ${
        item.isAvailable ? "Available" : "Sold Out"
      }`
    );
  });

  console.log("-------------------------------------\n");
}


// ---------------- CART ----------------

function showCart(cart: CartItem[], customer: CustomerType | null) {
  if (cart.length === 0) {
    console.log("\n🛒 Cart is empty.\n");
    return;
  }

  console.log("\n------------- CART -------------");

  cart.forEach((item) => {
    console.log(
      `${item.name} x${item.quantity} = ₹${calculateItemTotal(item)}`
    );
  });

  const subtotal = calculateSubtotal(cart);

  console.log("--------------------------------");
  console.log(`Subtotal: ₹${subtotal}`);

  if (customer) {
    const discount = calculateDiscount(subtotal, customer);
    const tax = calculateTax(subtotal - discount);
    const total = calculateFinalAmount(subtotal, discount);

    console.log(`Discount: ₹${discount.toFixed(2)}`);
    console.log(`GST: ₹${tax.toFixed(2)}`);
    console.log(`Final Amount: ₹${total.toFixed(2)}`);
  }

  console.log("--------------------------------\n");
}


// ---------------- CUSTOMER ----------------

async function selectCustomer(): Promise<CustomerType> {
  const choice = await select({
    message: "Select Customer:",
    choices: [
      ...sampleCustomers.map((customer) => ({
        name: customer.name,
        value: customer.id.toString(),
      })),

      {
        name: "Create New Guest",
        value: "guest",
      },

      {
        name: "Create New Member",
        value: "member",
      },
    ],
  });

  // Existing customer
  if (choice !== "guest" && choice !== "member") {
    const customer = sampleCustomers.find(
      (c) => c.id === Number(choice)
    );

    if (customer) {
      console.log(`\n✓ Customer selected: ${customer.name}\n`);
      return customer;
    }
  }

  // New customer
  const name = await input({
    message: "Customer Name:",
  });

  const city = await input({
    message: "City:",
  });

  const street = await input({
    message: "Street:",
  });

  const pincode = await input({
    message: "Pincode:",
  });

  const phone = await input({
    message: "Phone (optional):",
  });

  const address: Address = {
    city,
    street,
    pincode,
  };

  const id = Math.floor(Math.random() * 9000) + 1000;

  // Guest
  if (choice === "guest") {
    const guest = createGuest(
      id,
      name,
      address,
      phone || undefined
    );

    console.log(`\n✓ Guest created: ${guest.name}\n`);

    return guest;
  }

  // Member
  const level = await select({
    message: "Membership Level:",
    choices: [
      {
        name: "Silver - 5%",
        value: "silver",
      },
      {
        name: "Gold - 10%",
        value: "gold",
      },
      {
        name: "Platinum - 15%",
        value: "platinum",
      },
    ],
  });

  const membershipId = await input({
    message: "Membership ID:",
  });

  const member = createMember(
    id,
    name,
    address,
    level as MembershipLevel,
    membershipId,
    phone || undefined
  );

  console.log(`\n✓ Member created: ${member.name}\n`);

  return member;
}


// ---------------- ADD TO CART ----------------

async function addItem(cart: CartItem[]) {
  showMenu(foodItems);

  const id = Number(
    await input({
      message: "Enter Food ID:",
    })
  );

  const food = foodItems.find((item) => item.id === id);

  if (!food) {
    console.log("\n❌ Food not found.\n");
    return cart;
  }

  if (!food.isAvailable) {
    console.log("\n❌ Food is sold out.\n");
    return cart;
  }

  const quantity = Number(
    await input({
      message: "Enter Quantity:",
      default: "1",
    })
  );

  const note = await input({
    message: "Special Instruction (optional):",
  });

  cart = addToCart(
    cart,
    food,
    quantity,
    note || undefined
  );

  console.log(`\n✓ ${food.name} added to cart.\n`);

  return cart;
}


// ---------------- UPDATE CART ----------------

async function updateCart(cart: CartItem[]) {
  if (cart.length === 0) {
    console.log("\n❌ Cart is empty.\n");
    return cart;
  }

  const itemId = await select({
    message: "Select item:",
    choices: cart.map((item) => ({
      name: `${item.name} (Qty: ${item.quantity})`,
      value: item.id.toString(),
    })),
  });

  const quantity = Number(
    await input({
      message: "New Quantity:",
    })
  );

  return updateQuantity(
    cart,
    Number(itemId),
    quantity
  );
}


// ---------------- REMOVE ITEM ----------------

async function removeItem(cart: CartItem[]) {
  if (cart.length === 0) {
    console.log("\n❌ Cart is empty.\n");
    return cart;
  }

  const itemId = await select({
    message: "Select item to remove:",
    choices: cart.map((item) => ({
      name: item.name,
      value: item.id.toString(),
    })),
  });

  return removeFromCart(
    cart,
    Number(itemId)
  );
}


// ---------------- CHECKOUT ----------------

async function checkout(
  cart: CartItem[],
  customer: CustomerType | null,
  orderId: number,
  status: OrderStatus
) {
  if (!customer) {
    console.log("\n❌ Please select a customer first.\n");

    return {
      cart,
      orderId,
      status,
    };
  }

  if (cart.length === 0) {
    console.log("\n❌ Cart is empty.\n");

    return {
      cart,
      orderId,
      status,
    };
  }

  // Calculate bill
  const subtotal = calculateSubtotal(cart);

  const discount = calculateDiscount(
    subtotal,
    customer
  );

  const afterDiscount = subtotal - discount;

  const tax = calculateTax(afterDiscount);

  const total = calculateFinalAmount(
    subtotal,
    discount
  );

  console.log("\n============= CHECKOUT =============");
  console.log(`Customer: ${customer.name}`);
  console.log(`Subtotal: ₹${subtotal}`);
  console.log(`Discount: ₹${discount.toFixed(2)}`);
  console.log(`GST: ₹${tax.toFixed(2)}`);
  console.log(`Total: ₹${total.toFixed(2)}`);
  console.log("====================================\n");

  const proceed = await confirm({
    message: "Proceed to payment?",
    default: true,
  });

  if (!proceed) {
    console.log("\nPayment cancelled.\n");

    return {
      cart,
      orderId,
      status,
    };
  }


  // Payment
  const method = await select({
    message: "Payment Method:",
    choices: [
      {
        name: "Cash",
        value: "cash",
      },
      {
        name: "Card",
        value: "card",
      },
      {
        name: "UPI",
        value: "upi",
      },
    ],
  });


  let payment: Payment;


  // CASH
  if (method === "cash") {
    const amount = Number(
      await input({
        message: `Cash Received (₹${total}):`,
      })
    );

    payment = {
      method: "cash",
      receivedAmount: amount,
    };
  }


  // CARD
  else if (method === "card") {
    const last4 = await input({
      message: "Last 4 Card Digits:",
    });

    payment = {
      method: "card",
      last4Digits: last4,
    };
  }


  // UPI
  else {
    const transactionId = await input({
      message: "UPI Transaction ID:",
    });

    payment = {
      method: "upi",
      transactionId,
    };
  }


  // Process payment
  const success = processPayment(
    payment,
    total
  );

  if (!success) {
    console.log("\n❌ Payment failed.\n");

    return {
      cart,
      orderId,
      status,
    };
  }


  // Update order
  const newStatus = updateOrderStatus(
    status,
    "confirmed"
  );


  // Generate bill
  const result = generateBill(
    orderId,
    customer,
    cart,
    payment
  );


  if (result.status === "error") {
    console.log("\n❌ Bill generation failed.\n");

    return {
      cart,
      orderId,
      status,
    };
  }


  console.log("✅ ORDER CONFIRMED");
  console.log(`Order ID: #${orderId}`);
  console.log(`Customer: ${customer.name}`);
  console.log(`Amount: ₹${total.toFixed(2)}`);
  console.log(`Payment: ${payment.method}`);
  console.log(`Status: ${newStatus}`);


  return {
    cart: [],
    orderId: orderId + 1,
    status: newStatus,
  };
}


// ---------------- CHANGE STATUS ----------------

async function changeStatus(
  currentStatus: OrderStatus
) {
  const newStatus = await select({
    message: "Select Order Status:",
    choices: ORDER_STATUSES.map((status) => ({
      name: status,
      value: status,
    })),
  });

  return updateOrderStatus(
    currentStatus,
    newStatus as OrderStatus
  );
}


// ---------------- SEARCH ----------------

async function search() {
  const query = await input({
    message: "Search Food:",
  });

  const results = searchFood(
    foodItems,
    query
  );

  console.log("\n------------- RESULTS -------------");

  if (results.length === 0) {
    console.log("No food found.");
  } else {
    results.forEach((item) => {
      console.log(
        `${item.id}. ${item.name} - ₹${item.price}`
      );
    });
  }

}


// ================= MAIN =================

export async function main() {

  showHeader();

  let cart: CartItem[] = [];

  let customer: CustomerType | null = null;

  let orderId = 1001;

  let orderStatus: OrderStatus = "pending";


  while (true) {

    console.log(
      `Customer: ${customer?.name || "None"}`
    );

    console.log(
      `Cart Items: ${cart.length}`
    );

    console.log(
      `Order Status: ${orderStatus}\n`
    );


    const choice = await select({

      message: "Main Menu:",

      choices: [

        {
          name: "1. View Food Menu",
          value: "menu",
        },

        {
          name: "2. Select Customer",
          value: "customer",
        },

        {
          name: "3. Add Item",
          value: "add",
        },

        {
          name: "4. View Cart",
          value: "cart",
        },

        {
          name: "5. Update Quantity",
          value: "update",
        },

        {
          name: "6. Remove Item",
          value: "remove",
        },

        {
          name: "7. Checkout",
          value: "checkout",
        },

        {
          name: "8. Change Order Status",
          value: "status",
        },

        {
          name: "9. Search Food",
          value: "search",
        },

        {
          name: "10. Exit",
          value: "exit",
        },

      ],
    });


    switch (choice) {

      case "menu":
        showMenu(foodItems);
        break;


      case "customer":
        customer = await selectCustomer();
        break;


      case "add":
        cart = await addItem(cart);
        break;


      case "cart":
        showCart(cart, customer);
        break;


      case "update":
        cart = await updateCart(cart);
        break;


      case "remove":
        cart = await removeItem(cart);
        break;


      case "checkout": {
        const result = await checkout(
          cart,
          customer,
          orderId,
          orderStatus
        );

        cart = result.cart;
        orderId = result.orderId;
        orderStatus = result.status;

        break;
      }


      case "status":
        orderStatus = await changeStatus(
          orderStatus
        );
        break;


      case "search":
        await search();
        break;


      case "exit":
        console.log(
          "\n👋 Thank you for using Food Ordering System!\n"
        );
        return;
    }
  }
}


// Start program
main();