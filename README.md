# 🍔 Food Ordering & Billing System

Terminal-based Food Ordering and Billing application written in TypeScript.

## 🚀 Features

- Interactive terminal UI using `@inquirer/prompts`
- Full menu browsing, food search, and category filtering
- Customer support with Guest and tiered Memberships (Silver, Gold, Platinum)
- Cart management (add, update quantities, remove items)
- Automatic discount calculation (membership + ₹2000 order discount)
- Tax (5% GST) and final billing calculations
- Flexible payment methods: Cash, Card, UPI
- Order status tracking (Pending, Confirmed, Preparing, Delivered, Cancelled)
- Discriminated union bill generation and exhaustive checking

## 🛠️ Tech Stack

- **TypeScript** (strict mode, zero `any`, zero classes, zero generics)
- **Node.js** with ES Modules
- **@inquirer/prompts** for terminal menus
- **pnpm** package manager

## 📦 Getting Started

### Installation

```bash
pnpm install
```

### Run Application

```bash
pnpm start
```

### Typecheck

```bash
pnpm run typecheck
```

### Build

```bash
pnpm run build
```