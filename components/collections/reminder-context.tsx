"use client";

import { createContext, useContext } from "react";
import type { ReminderTemplateId } from "@/lib/whatsapp";

type ReminderConfig = { organizationName: string; templates: Record<ReminderTemplateId, string> };

const ReminderContext = createContext<ReminderConfig | null>(null);

export function ReminderProvider({ value, children }: { value: ReminderConfig; children: React.ReactNode }) {
  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminderConfig(): ReminderConfig {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error("useReminderConfig must be used inside ReminderProvider");
  return ctx;
}
