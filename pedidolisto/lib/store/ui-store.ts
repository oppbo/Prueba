"use client";

import { create } from "zustand";
import type { ID } from "@/lib/types";

/** Global UI state for dialogs that can be opened from anywhere in the app. */
interface UiState {
  commandOpen: boolean;
  /** undefined = closed; null = open without a preselected customer. */
  paymentFor: ID | null | undefined;
  reminderFor: ID | undefined;
  setCommandOpen: (open: boolean) => void;
  openPayment: (customerId?: ID) => void;
  closePayment: () => void;
  openReminder: (customerId: ID) => void;
  closeReminder: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  paymentFor: undefined,
  reminderFor: undefined,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  openPayment: (customerId) => set({ paymentFor: customerId ?? null }),
  closePayment: () => set({ paymentFor: undefined }),
  openReminder: (reminderFor) => set({ reminderFor }),
  closeReminder: () => set({ reminderFor: undefined }),
}));
