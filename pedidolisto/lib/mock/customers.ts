import type { Customer, CustomerType, PriceList } from "@/lib/types";
import type { Random } from "./random";
import { ZONES, salespersonForZone } from "./salespeople";

/**
 * Credit behaviour used only by the seed generator to produce realistic balances:
 * - none: always pays cash
 * - prompt: buys on credit and pays within a few days
 * - regular: pays before the due date (carries current, non-overdue debt)
 * - late: pays after the due date (carries overdue debt)
 */
export type CreditProfile = "none" | "prompt" | "regular" | "late";

export interface CustomerSeed extends Customer {
  creditProfile: CreditProfile;
  /** Relative order frequency for the generator. */
  weight: number;
  /** Opening balance carried from before the system (days ago, amount). */
  opening?: { daysAgo: number; amount: number };
}

type FeaturedInput = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  zone: string;
  address: string;
  customerType: CustomerType;
  priceList: PriceList;
  creditLimit: number;
  creditDays?: number;
  creditProfile: CreditProfile;
  notes: string;
  weight?: number;
  opening?: { daysAgo: number; amount: number };
  status?: Customer["status"];
};

/** Hand-written customers that appear in the demo script and top lists. */
const FEATURED: FeaturedInput[] = [
  { id: "c001", businessName: "Tienda Don José", ownerName: "José Mamani", phone: "71534820", zone: "Villa Fátima", address: "Av. Las Américas #1452, a media cuadra del mercado", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 5000, creditProfile: "regular", notes: "Prefiere entregas por la mañana antes de las 10:00. Paga los viernes. Cliente desde 2019.", weight: 0 },
  { id: "c002", businessName: "Minimarket Lucía", ownerName: "Lucía Choque", phone: "72015633", zone: "Sopocachi", address: "Calle Belisario Salinas #480", customerType: "Minimarket", priceList: "Mayorista A", creditLimit: 8000, creditProfile: "regular", notes: "Pide factura con NIT. Recibe mercadería por la puerta lateral.", weight: 3 },
  { id: "c003", businessName: "Abarrotes San Martín", ownerName: "Martín Condori", phone: "76543210", zone: "El Alto", address: "Av. Juan Pablo II #2210, Zona 16 de Julio", customerType: "Mayorista", priceList: "Mayorista A", creditLimit: 15000, creditProfile: "late", notes: "Compra por volumen los jueves. Negociar descuento en pedidos mayores a Bs 5.000.", weight: 4, opening: { daysAgo: 48, amount: 3200 } },
  { id: "c004", businessName: "Tienda El Carmen", ownerName: "Carmen Quispe", phone: "73318842", zone: "Miraflores", address: "Av. Busch #1180", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 4000, creditProfile: "late", notes: "Llamar antes de entregar. Tiene saldo pendiente desde el mes pasado.", weight: 2, opening: { daysAgo: 41, amount: 1400 } },
  { id: "c005", businessName: "Supermercado Familiar", ownerName: "Roberto Gutiérrez", phone: "70611298", zone: "Calacoto", address: "Calle 21 de Calacoto #8120", customerType: "Supermercado", priceList: "Mayorista A", creditLimit: 20000, creditDays: 30, creditProfile: "regular", notes: "Recepción de 8:00 a 12:00. Exigen orden de compra firmada.", weight: 4 },
  { id: "c006", businessName: "Abarrotes Rodríguez", ownerName: "Silvia Rodríguez", phone: "71988450", zone: "Max Paredes", address: "Calle Max Paredes #945", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 3500, creditProfile: "late", notes: "Paga en efectivo al vendedor.", weight: 2, opening: { daysAgo: 36, amount: 950 } },
  { id: "c007", businessName: "Tienda La Esquina", ownerName: "Felipe Apaza", phone: "72455019", zone: "San Pedro", address: "Calle Colombia esq. Almirante Grau", customerType: "Tienda de barrio", priceList: "Minorista", creditLimit: 1500, creditProfile: "prompt", notes: "", weight: 2 },
  { id: "c008", businessName: "Mercado Express", ownerName: "Gabriela Torrez", phone: "77012345", zone: "Achumani", address: "Calle 12 de Achumani #310", customerType: "Minimarket", priceList: "Mayorista A", creditLimit: 9000, creditProfile: "regular", notes: "Atención 24 horas. Pedidos grandes a fin de mes.", weight: 3 },
  { id: "c009", businessName: "Comercial Mendoza", ownerName: "Ramiro Mendoza", phone: "70145566", zone: "El Alto", address: "Av. 6 de Marzo #3321, Zona Villa Dolores", customerType: "Mayorista", priceList: "Mayorista A", creditLimit: 12000, creditProfile: "late", notes: "Revende en ferias. Buen volumen, paga con retraso.", weight: 4, opening: { daysAgo: 52, amount: 2600 } },
  { id: "c010", businessName: "Tienda Doña Rosa", ownerName: "Rosa Ticona", phone: "73690021", zone: "Villa Copacabana", address: "Calle Circunvalación #77", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 3000, creditProfile: "regular", notes: "Cliente puntual. Le gusta que le avisen de promociones.", weight: 2 },
  { id: "c011", businessName: "Micromercado Santa Cruz", ownerName: "Hugo Vargas", phone: "76021477", zone: "Obrajes", address: "Calle 5 de Obrajes #520", customerType: "Minimarket", priceList: "Mayorista A", creditLimit: 7000, creditProfile: "prompt", notes: "", weight: 3 },
  { id: "c012", businessName: "Abarrotes Los Andes", ownerName: "Julia Huanca", phone: "71150987", zone: "El Alto", address: "Av. Bolivia #1540, Ciudad Satélite", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 4500, creditProfile: "late", notes: "Solo recibe de 14:00 a 18:00.", weight: 2, opening: { daysAgo: 33, amount: 780 } },
  { id: "c013", businessName: "Kiosco El Estudiante", ownerName: "Pablo Limachi", phone: "72299310", zone: "Miraflores", address: "Av. Saavedra frente a la UMSA", customerType: "Kiosco", priceList: "Minorista", creditLimit: 0, creditProfile: "none", notes: "Solo contado.", weight: 2 },
  { id: "c014", businessName: "Tienda Virgen de Copacabana", ownerName: "Marcela Poma", phone: "75023344", zone: "Villa Fátima", address: "Calle Tumusla #612", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 2500, creditProfile: "regular", notes: "", weight: 2 },
  { id: "c015", businessName: "Pensión Sabor Paceño", ownerName: "Teresa Callisaya", phone: "70433218", zone: "San Pedro", address: "Calle Otero de la Vega #255", customerType: "Restaurante", priceList: "Minorista", creditLimit: 2000, creditProfile: "prompt", notes: "Pedidos de aceite y arroz cada semana.", weight: 2 },
  { id: "c016", businessName: "Minimarket El Prado", ownerName: "Álvaro Salinas", phone: "77790123", zone: "Sopocachi", address: "Av. 6 de Agosto #2040", customerType: "Minimarket", priceList: "Mayorista A", creditLimit: 6000, creditProfile: "late", notes: "Cambiaron de administrador en agosto.", weight: 3, opening: { daysAgo: 39, amount: 1850 } },
  { id: "c017", businessName: "Abarrotes Doña Juanita", ownerName: "Juana Laura", phone: "73145588", zone: "Max Paredes", address: "Calle Buenos Aires #1320", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 3000, creditProfile: "regular", notes: "", weight: 2 },
  { id: "c018", businessName: "Comercial Huanca e Hijos", ownerName: "Óscar Huanca", phone: "71602233", zone: "El Alto", address: "Av. Tiahuanacu #880, Zona Ballivián", customerType: "Mayorista", priceList: "Mayorista A", creditLimit: 10000, creditProfile: "regular", notes: "Recoge en almacén los sábados.", weight: 3 },
  { id: "c019", businessName: "Tienda San Antonio", ownerName: "Antonio Flores", phone: "72877410", zone: "Villa Copacabana", address: "Av. Josefa Mujía #410", customerType: "Tienda de barrio", priceList: "Minorista", creditLimit: 1500, creditProfile: "late", notes: "", weight: 1, opening: { daysAgo: 30, amount: 620 } },
  { id: "c020", businessName: "Micromercado Achumani", ownerName: "Patricia Arce", phone: "76655120", zone: "Achumani", address: "Calle 16 de Achumani #45", customerType: "Minimarket", priceList: "Mayorista A", creditLimit: 7500, creditProfile: "prompt", notes: "", weight: 3 },
  { id: "c021", businessName: "Tienda Mi Barrio", ownerName: "Wilson Chambi", phone: "70288765", zone: "Villa Fátima", address: "Calle Sucre #1012", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 2500, creditProfile: "regular", notes: "", weight: 2 },
  { id: "c022", businessName: "Abarrotes El Progreso", ownerName: "Nancy Mamani", phone: "75510932", zone: "El Alto", address: "Calle 3 #2011, Zona Senkata", customerType: "Tienda de barrio", priceList: "Mayorista B", creditLimit: 3000, creditProfile: "late", notes: "Pagos parciales frecuentes.", weight: 2, opening: { daysAgo: 44, amount: 1100 } },
  { id: "c023", businessName: "Hotel Calacoto Suites", ownerName: "Fernando Ibáñez", phone: "77544001", zone: "Calacoto", address: "Av. Ballivián #1050", customerType: "Restaurante", priceList: "Minorista", creditLimit: 6000, creditDays: 30, creditProfile: "regular", notes: "Facturación mensual. Contacto de compras: Sra. Elena.", weight: 1 },
  { id: "c024", businessName: "Tienda Los Pinos", ownerName: "Ruth Chávez", phone: "73201456", zone: "Obrajes", address: "Calle 14 de Obrajes #230", customerType: "Tienda de barrio", priceList: "Minorista", creditLimit: 0, creditProfile: "none", notes: "Cerrada por remodelación hasta octubre.", weight: 0, status: "inactive" },
];

const PREFIXES: { prefix: string; type: CustomerType }[] = [
  { prefix: "Tienda", type: "Tienda de barrio" },
  { prefix: "Tienda", type: "Tienda de barrio" },
  { prefix: "Tienda", type: "Tienda de barrio" },
  { prefix: "Abarrotes", type: "Tienda de barrio" },
  { prefix: "Abarrotes", type: "Tienda de barrio" },
  { prefix: "Micromercado", type: "Minimarket" },
  { prefix: "Minimarket", type: "Minimarket" },
  { prefix: "Kiosco", type: "Kiosco" },
  { prefix: "Comercial", type: "Mayorista" },
  { prefix: "Snack", type: "Restaurante" },
];

const NAME_SUFFIXES = [
  "Don Pedro", "Doña Carmen", "San Juan", "El Progreso", "La Económica", "Santa Rosa", "El Sol", "Nueva Esperanza",
  "Don Luis", "Doña Elena", "San Francisco", "La Estrella", "El Buen Precio", "Los Álamos", "Mi Casita", "La Paceña",
  "Don Mario", "Doña Martha", "San Miguel", "El Ahorro", "Las Palmas", "La Familia", "Don Víctor", "Doña Sofía",
  "Santa Ana", "El Cruce", "La Bendición", "Los Hermanos", "Don Ramón", "Doña Betty", "El Paraíso", "La Cumbre",
  "Don Freddy", "Doña Norma", "San Cristóbal", "El Mirador", "La Colina", "Illampu", "Huayna Potosí", "Chacaltaya",
  "Don Simón", "Doña Lidia", "San Luis", "El Porvenir", "La Amistad", "Los Olivos", "Don Germán", "Doña Hilda",
  "Santa Bárbara", "El Triunfo", "La Merced", "Sajama", "Don Eusebio", "Doña Marina", "San Pablo", "El Carmen II",
  "La Fortuna", "Tunari", "Don Grover", "Doña Celia", "San Jorge", "El Faro",
];

const SURNAMES = [
  "Mamani", "Quispe", "Choque", "Condori", "Apaza", "Ticona", "Huanca", "Limachi", "Poma", "Callisaya",
  "Flores", "Rojas", "Vargas", "Gutiérrez", "Chávez", "Torrez", "Arce", "Laura", "Chambi", "Alanoca",
  "Mendoza", "Rodríguez", "Pérez", "Guzmán", "Calle", "Cusi", "Yujra", "Colque", "Nina", "Aruquipa",
];

const FIRST_NAMES = [
  "Juan", "María", "Luis", "Rosa", "Pedro", "Ana", "Carlos", "Elena", "Jorge", "Sonia", "Mario", "Martha",
  "Víctor", "Gladys", "Freddy", "Norma", "Ramón", "Betty", "Germán", "Hilda", "Simón", "Lidia", "Grover", "Celia",
  "Eusebio", "Marina", "René", "Jhenny", "Edwin", "Roxana", "Wilma", "Franz", "Delia", "Iván", "Janet", "Rubén",
];

const STREETS = [
  "Calle", "Av.", "Calle", "Pasaje", "Calle",
];

const STREET_NAMES = [
  "Sucre", "Murillo", "Illampu", "Los Andes", "Bolívar", "Ingavi", "Yanacocha", "Tarija", "Potosí", "Oruro",
  "Cochabamba", "Chuquisaca", "Santa Cruz", "Beni", "Pando", "Litoral", "Huyustus", "Garcilazo", "Tumusla", "Figueroa",
];

const ZONE_WEIGHTS: Record<string, number> = {
  "El Alto": 5,
  "Villa Fátima": 2,
  Miraflores: 2,
  Sopocachi: 1.5,
  Achumani: 1,
  "San Pedro": 1.5,
  "Max Paredes": 2,
  Calacoto: 1,
  Obrajes: 1,
  "Villa Copacabana": 1.5,
};

function phoneFor(random: Random): string {
  return `${random.pick(["6", "7", "7", "7"])}${random.int(0, 9)}${String(random.int(0, 999999)).padStart(6, "0")}`;
}

export const TOTAL_GENERATED_CUSTOMERS = 336;

export function seedCustomers(random: Random, now: Date): CustomerSeed[] {
  const customers: CustomerSeed[] = FEATURED.map((c) => ({
    id: c.id,
    businessName: c.businessName,
    ownerName: c.ownerName,
    phone: c.phone,
    zone: c.zone,
    address: c.address,
    customerType: c.customerType,
    priceList: c.priceList,
    creditLimit: c.creditLimit,
    creditDays: c.creditDays ?? 15,
    salespersonId: salespersonForZone(c.zone),
    status: c.status ?? "active",
    notes: c.notes,
    createdAt: new Date(now.getTime() - random.int(200, 1400) * 86_400_000).toISOString(),
    creditProfile: c.creditProfile,
    weight: c.weight ?? 2,
    opening: c.opening,
  }));

  const usedNames = new Set(customers.map((c) => c.businessName));
  let index = FEATURED.length + 1;
  let guard = 0;
  while (customers.length < FEATURED.length + TOTAL_GENERATED_CUSTOMERS && guard < 5000) {
    guard++;
    const { prefix, type } = random.pick(PREFIXES);
    const useSurname = random.chance(0.3);
    const businessName = useSurname
      ? `${prefix} ${random.pick(SURNAMES)}`
      : `${prefix} ${random.pick(NAME_SUFFIXES)}`;
    if (usedNames.has(businessName)) continue;
    usedNames.add(businessName);

    const zone = random.weighted(ZONES, (z) => ZONE_WEIGHTS[z] ?? 1);
    const hasCredit = random.chance(type === "Mayorista" ? 0.5 : type === "Kiosco" ? 0.02 : 0.075);
    const creditProfile: CreditProfile = hasCredit
      ? random.weighted<CreditProfile>(["prompt", "regular", "late"], (p) => (p === "prompt" ? 3 : p === "regular" ? 4 : 3))
      : "none";
    const priceList: PriceList =
      type === "Mayorista" ? "Mayorista A" : type === "Minimarket" ? random.pick(["Mayorista A", "Mayorista B"] as const) : random.pick(["Mayorista B", "Minorista", "Minorista"] as const);
    const creditLimit = hasCredit ? random.pick([1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000]) : 0;
    const status: Customer["status"] = random.chance(0.04) ? "inactive" : "active";

    customers.push({
      id: `c${String(index).padStart(3, "0")}`,
      businessName,
      ownerName: `${random.pick(FIRST_NAMES)} ${random.pick(SURNAMES)}`,
      phone: phoneFor(random),
      zone,
      address: `${random.pick(STREETS)} ${random.pick(STREET_NAMES)} #${random.int(10, 2999)}`,
      customerType: type,
      priceList,
      creditLimit,
      creditDays: 15,
      salespersonId: salespersonForZone(zone),
      status,
      notes: "",
      createdAt: new Date(now.getTime() - random.int(30, 1500) * 86_400_000).toISOString(),
      creditProfile,
      weight: status === "inactive" ? 0 : type === "Mayorista" ? 2 : type === "Kiosco" ? 0.6 : 1,
      opening:
        creditProfile === "late" && random.chance(0.6)
          ? { daysAgo: random.int(30, 55), amount: random.int(8, 36) * 50 }
          : undefined,
    });
    index++;
  }
  return customers;
}

export function stripCustomerSeed(seed: CustomerSeed): Customer {
  const { creditProfile: _c, weight: _w, opening: _o, ...customer } = seed;
  return customer;
}
