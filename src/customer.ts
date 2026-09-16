import {
  Address,
  CustomerType,
  Guest,
  Member,
  MembershipLevel,
} from "./types.js";

export function getMembershipDiscountPercentage(
  level: MembershipLevel,
): number {
  switch (level) {
    case "silver":
      return 5;
    case "gold":
      return 10;
    case "platinum":
      return 15;
    default:
      return 0;
  }
}

export function createGuest(
  id: number,
  name: string,
  address: Address,
  phone?: string,
): Guest {
  return {
    id,
    name,
    address,
    phone,
    type: "guest",
  };
}

export function createMember(
  id: number,
  name: string,
  address: Address,
  membershipLevel: MembershipLevel,
  membershipId: string,
  phone?: string,
): Member {
  return {
    id,
    name,
    address,
    phone,
    type: "member",
    membershipId,
    membershipLevel,
    discountPercentage: getMembershipDiscountPercentage(membershipLevel),
  };
}

export const sampleCustomers: CustomerType[] = [
  createGuest(
    101,
    "Rahul Sharma",
    {
      city: "Mumbai",
      street: "12 Marine Drive",
      pincode: "400020",
    },
    "9876543210",
  ),
  createMember(
    102,
    "Priya Patel",
    {
      city: "Ahmedabad",
      street: "45 SG Highway",
      pincode: "380015",
    },
    "silver",
    "MEM-SILVER-01",
    "9876543211",
  ),
  createMember(
    103,
    "Amit Verma",
    {
      city: "Delhi",
      street: "7 Connaught Place",
      pincode: "110001",
    },
    "gold",
    "MEM-GOLD-01",
    "9876543212",
  ),
  createMember(
    104,
    "Sneha Reddy",
    {
      city: "Bangalore",
      street: "88 Indiranagar",
      pincode: "560038",
    },
    "platinum",
    "MEM-PLAT-01",
  ),
];
