import { CartItem, FoodItem } from "./types.js";

export function addToCart(
  cart: CartItem[],
  food: FoodItem,
  quantity: number,
  specialInstruction?: string,
): CartItem[] {
  if (quantity <= 0 || !food.isAvailable) {
    return cart;
  }

  const existingItem = cart.find((item) => item.id === food.id);

  if (existingItem) {
    return cart.map((item) =>
      item.id === food.id
        ? {
            ...item,
            quantity: item.quantity + quantity,
            specialInstruction: specialInstruction ?? item.specialInstruction,
          }
        : item,
    );
  }

  return [
    ...cart,
    {
      ...food,
      quantity,
      specialInstruction,
    },
  ];
}

export function removeFromCart(cart: CartItem[], foodId: number): CartItem[] {
  return cart.filter((item) => item.id !== foodId);
}

export function updateQuantity(
  cart: CartItem[],
  foodId: number,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(cart, foodId);
  }

  const index = cart.findIndex((item) => item.id === foodId);
  if (index === -1) {
    return cart;
  }

  return cart.map((item) =>
    item.id === foodId ? { ...item, quantity } : item,
  );
}

export function isItemInCart(cart: CartItem[], foodId: number): boolean {
  return cart.some((item) => item.id === foodId);
}

export function calculateItemTotal(item: CartItem): number {
  return item.price * item.quantity;
}

export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
}
