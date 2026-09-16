import { FoodItem } from "./types.js";

export const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Margherita Pizza",
    category: "pizza",
    price: 299,
    isAvailable: true,
  },
  {
    id: 2,
    name: "Farmhouse Pizza",
    category: "pizza",
    price: 399,
    isAvailable: true,
  },
  {
    id: 3,
    name: "Veg Burger",
    category: "burger",
    price: 199,
    isAvailable: true,
  },
  {
    id: 4,
    name: "Cheese Burger",
    category: "burger",
    price: 249,
    isAvailable: true,
  },
  {
    id: 5,
    name: "Cold Coffee",
    category: "drink",
    price: 150,
    isAvailable: true,
  },
  {
    id: 6,
    name: "Mango Shake",
    category: "drink",
    price: 180,
    isAvailable: true,
  },
  {
    id: 7,
    name: "Chocolate Cake",
    category: "dessert",
    price: 220,
    isAvailable: true,
  },
  {
    id: 8,
    name: "Brownie",
    category: "dessert",
    price: 180,
    isAvailable: true,
  },
];

export function searchFood(items: FoodItem[], query: string): FoodItem[] {
  const clean = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(clean));
}
