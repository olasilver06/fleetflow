import type { OrderStatus } from "@prisma/client";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["RIDER_ACCEPTED", "REJECTED_BY_RIDER", "CANCELLED"],
  RIDER_ACCEPTED: ["PICKED_UP", "CANCELLED"],
  REJECTED_BY_RIDER: ["ASSIGNED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERED: ["COMPLETED"],
  DELIVERY_FAILED: ["RETURNED_TO_SENDER", "ASSIGNED"],
  COMPLETED: [],
  RETURNED_TO_SENDER: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot transition order from ${from} to ${to}`);
  }
}
