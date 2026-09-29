"use client";

import { create } from "zustand";
import type { DemoData, ID, Order, OrderStatus, Payment, Role, PaymentType } from "@/lib/types";
import { createSeedData, DEMO_VERSION } from "@/lib/mock/seed";
import { isSameDay } from "@/lib/format";
import { createOrder, updateOrderStatus, type CreateOrderInput } from "@/lib/services/orders";
import { registerPayment, type RegisterPaymentInput } from "@/lib/services/payments";
import { adjustInventory, type AdjustInventoryInput } from "@/lib/services/inventory";
import { createCustomer, updateCustomer, type CustomerInput } from "@/lib/services/customers";

const DATA_KEY = "pedidolisto:demo-data";
const ROLE_KEY = "pedidolisto:role";

/** Order being prepared outside the order form (e.g. from the WhatsApp assistant). */
export interface OrderDraft {
  customerId: ID;
  items: { productId: ID; quantity: number }[];
  paymentType: PaymentType;
  channel: CreateOrderInput["channel"];
  notes?: string;
}

interface DemoState {
  data: DemoData | null;
  role: Role;
  hydrated: boolean;
  /** Set when the stored data belonged to a previous day and was refreshed. */
  refreshedForToday: boolean;
  draft: OrderDraft | null;

  hydrate: () => void;
  setRole: (role: Role) => void;
  resetDemo: () => void;
  setDraft: (draft: OrderDraft | null) => void;

  createOrder: (input: CreateOrderInput) => Order;
  updateOrderStatus: (orderId: ID, status: OrderStatus) => void;
  registerPayment: (input: RegisterPaymentInput) => Payment;
  adjustInventory: (input: AdjustInventoryInput) => void;
  createCustomer: (input: CustomerInput) => ID;
  updateCustomer: (id: ID, input: CustomerInput) => void;
  markNotificationRead: (id: ID) => void;
  markAllNotificationsRead: () => void;
}

function readStoredData(): DemoData | null {
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoData;
    if (parsed.version !== DEMO_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readStoredRole(): Role {
  try {
    const role = window.localStorage.getItem(ROLE_KEY);
    return role === "seller" || role === "warehouse" ? role : "owner";
  } catch {
    return "owner";
  }
}

/** Saved synchronously so a reload right after an action never loses it. */
function persist(data: DemoData | null) {
  if (typeof window === "undefined" || !data) return;
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked (private mode): the demo keeps working in memory.
  }
}

export const useDemoStore = create<DemoState>((set, get) => {
  /** Apply a pure service function to the data and persist the result. */
  const mutate = (fn: (data: DemoData) => DemoData) => {
    const current = get().data;
    if (!current) throw new Error("Los datos de la demo todavía no se cargaron.");
    const next = fn(current);
    set({ data: next });
    persist(next);
  };

  return {
    data: null,
    role: "owner",
    hydrated: false,
    refreshedForToday: false,
    draft: null,

    hydrate: () => {
      if (get().hydrated) return;
      const stored = readStoredData();
      const now = new Date();
      // The demo always shows "today": data from a previous day is regenerated.
      const stale = stored ? !isSameDay(stored.seededAt, now) : false;
      const data = stored && !stale ? stored : createSeedData(now);
      set({ data, role: readStoredRole(), hydrated: true, refreshedForToday: stale });
      if (!stored || stale) persist(data);
    },

    setRole: (role) => {
      set({ role });
      try {
        window.localStorage.setItem(ROLE_KEY, role);
      } catch {
        /* ignore */
      }
    },

    resetDemo: () => {
      const data = createSeedData(new Date());
      set({ data, draft: null });
      persist(data);
    },

    setDraft: (draft) => set({ draft }),

    createOrder: (input) => {
      let created: Order | undefined;
      mutate((data) => {
        const result = createOrder(data, input);
        created = result.order;
        return result.data;
      });
      return created!;
    },

    updateOrderStatus: (orderId, status) => mutate((data) => updateOrderStatus(data, orderId, status)),

    registerPayment: (input) => {
      let created: Payment | undefined;
      mutate((data) => {
        const result = registerPayment(data, input);
        created = result.payment;
        return result.data;
      });
      return created!;
    },

    adjustInventory: (input) => mutate((data) => adjustInventory(data, input)),

    createCustomer: (input) => {
      let id = "";
      mutate((data) => {
        const result = createCustomer(data, input);
        id = result.customer.id;
        return result.data;
      });
      return id;
    },

    updateCustomer: (id, input) => mutate((data) => updateCustomer(data, id, input)),

    markNotificationRead: (id) =>
      mutate((data) => ({ ...data, notifications: data.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

    markAllNotificationsRead: () =>
      mutate((data) => ({ ...data, notifications: data.notifications.map((n) => ({ ...n, read: true })) })),
  };
});
