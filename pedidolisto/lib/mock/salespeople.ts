import type { Salesperson } from "@/lib/types";

export const SALESPEOPLE: Salesperson[] = [
  { id: "s1", name: "Carlos Mendoza", phone: "71234501", zones: ["Villa Fátima", "Miraflores", "Villa Copacabana"], color: "#3350d6", extraVisitsToday: 6, dailyTarget: 11000 },
  { id: "s2", name: "Andrea Flores", phone: "72234502", zones: ["Sopocachi", "Obrajes", "Calacoto", "Achumani"], color: "#13805b", extraVisitsToday: 4, dailyTarget: 10000 },
  { id: "s3", name: "Miguel Quispe", phone: "73234503", zones: ["El Alto"], color: "#b45d09", extraVisitsToday: 7, dailyTarget: 9500 },
  { id: "s4", name: "Daniela Rojas", phone: "74234504", zones: ["Max Paredes", "San Pedro"], color: "#8b3fc9", extraVisitsToday: 3, dailyTarget: 8500 },
];

export const ZONES = [
  "El Alto", "Villa Fátima", "Miraflores", "Sopocachi", "Achumani",
  "San Pedro", "Max Paredes", "Calacoto", "Obrajes", "Villa Copacabana",
];

export function salespersonForZone(zone: string): string {
  return SALESPEOPLE.find((s) => s.zones.includes(zone))?.id ?? "s1";
}
