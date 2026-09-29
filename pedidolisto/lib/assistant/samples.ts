import type { ID } from "@/lib/types";

export interface SampleMessage {
  id: string;
  customerId: ID;
  text: string;
  /** Minutes ago the message "arrived". */
  minutesAgo: number;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: "m1",
    customerId: "c001",
    text: "Buenas Carlos, para mañana mandame 12 cocas de 2 litros, 6 cajas de agua y 4 powers. Lo ponemos a cuenta nomás.",
    minutesAgo: 3,
  },
  { id: "m2", customerId: "c001", text: "Mandame lo mismo de la anterior pero aumentale 2 fantas.", minutesAgo: 6 },
  { id: "m3", customerId: "c015", text: "Necesito 10 aceites, 5 arroces y 3 azúcares para mañana.", minutesAgo: 11 },
  { id: "m4", customerId: "c010", text: "6 coca grandes, 4 sprites y una caja de agua, pago contado.", minutesAgo: 14 },
  { id: "m5", customerId: "c001", text: "Lo mismo que la semana pasada sin Power.", minutesAgo: 20 },
];
