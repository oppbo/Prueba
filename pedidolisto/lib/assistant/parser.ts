/**
 * Deterministic "AI-like" parser for WhatsApp order messages (demo only).
 * It recognizes product aliases used in Bolivian stores, quantities written as
 * digits or words, payment terms and references to a previous order.
 * The interface is designed so a real LLM/NLP service can replace it later.
 */
import type { ID, Order, PaymentType } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

interface Alias {
  productId: ID;
  pattern: RegExp;
}

/** Most specific first: "coca de 3 litros" must win over "coca". */
const ALIASES: Alias[] = [
  { productId: "p02", pattern: /cocas? (?:cola )?(?:de )?3 ?(?:l|lts?|litros?)\b|cocas? (?:cola )?grandes?|cocas? familiar(?:es)?/ },
  { productId: "p03", pattern: /cocas? (?:cola )?(?:de )?600|cocas? (?:cola )?(?:chicas?|personal(?:es)?)/ },
  { productId: "p01", pattern: /cocas? (?:cola )?(?:de )?2 ?(?:l|lts?|litros?)\b|coca ?colas?|cocas?\b/ },
  { productId: "p04", pattern: /sprites?/ },
  { productId: "p05", pattern: /fantas?/ },
  { productId: "p06", pattern: /aguas? (?:vital )?(?:de )?2 ?(?:l|lts?|litros?)\b/ },
  { productId: "p07", pattern: /(?:cajas?|paquetes?|packs?) de aguas?|aguas?(?: vital)?(?: chicas?)?|vital/ },
  { productId: "p08", pattern: /powerades?|powers?\b/ },
  { productId: "p09", pattern: /pilfrut/ },
  { productId: "p11", pattern: /aceites? (?:fino )?(?:de )?5 ?(?:l|litros?)|bidon(?:es)? de aceite/ },
  { productId: "p10", pattern: /aceites?/ },
  { productId: "p12", pattern: /arroz(?:es)?|arroces/ },
  { productId: "p13", pattern: /azucar(?:es)?/ },
  { productId: "p14", pattern: /fideos?|tallarin(?:es)?/ },
  { productId: "p15", pattern: /harinas?/ },
  { productId: "p16", pattern: /atun(?:es)?/ },
  { productId: "p17", pattern: /galletas?/ },
  { productId: "p18", pattern: /\bsal\b/ },
  { productId: "p22", pattern: /leches? en polvo/ },
  { productId: "p19", pattern: /leches?/ },
  { productId: "p20", pattern: /yogures?|yogurts?/ },
  { productId: "p21", pattern: /mantequillas?/ },
  { productId: "p23", pattern: /detergentes?|\bomo\b/ },
  { productId: "p24", pattern: /lavandinas?|clorox/ },
  { productId: "p25", pattern: /jabon(?:es)?/ },
  { productId: "p26", pattern: /papel(?:es)?(?: higienico)?/ },
  { productId: "p27", pattern: /servilletas?/ },
  { productId: "p28", pattern: /esponjas?/ },
];

const NUMBER_WORDS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, quince: 15, veinte: 20, veinticuatro: 24, treinta: 30,
};

const CREDIT = /(a cuenta|a credito|al credito|credito|fiado|fiamelo|anotalo|a fin de mes|le pago (?:el|la) proxim)/;
const CASH = /(contado|efectivo|pago al recibir|pago al toque|pago cuando llegue|cash)/;
const PREVIOUS = /(lo mismo|el mismo|la anterior|el anterior|semana pasada|como siempre|lo de siempre|mismo pedido)/;

export interface ParsedLine {
  productId: ID;
  quantity: number;
  /** Words from the message that produced this line. */
  source: string;
  origin: "message" | "previous" | "added";
}

export interface ParsedOrder {
  lines: ParsedLine[];
  paymentType?: PaymentType;
  paymentSource?: string;
  delivery?: "today" | "tomorrow";
  usedPrevious: boolean;
  previousOrderNumber?: string;
  removed: { productId: ID; source: string }[];
  /** Fragments that looked like products but were not recognized. */
  unknown: string[];
}

function quantityIn(text: string): number | null {
  if (/media docena/.test(text)) return 6;
  if (/\bdocenas?\b/.test(text)) {
    const n = text.match(/(\d+)\s*docenas?/);
    return n ? Number(n[1]) * 12 : 12;
  }
  const digit = text.match(/\b(\d{1,4})\b/);
  if (digit) return Number(digit[1]);
  for (const word of text.split(/\s+/)) {
    if (NUMBER_WORDS[word] != null) return NUMBER_WORDS[word];
  }
  return null;
}

/** The shortest phrase covering the quantity and product words, for highlighting. */
function phraseFor(segment: string, match: string): string {
  const start = segment.indexOf(match);
  const before = segment.slice(0, start);
  const qty = before.match(/(\d{1,4}|media docena|docenas?|\b(?:un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte)\b)(?!.*(\d|\b(?:un|una|dos|tres)\b))/);
  const qtyStart = qty?.index ?? start;
  const verb = before.slice(0, qtyStart).match(/(aumenta\w*|agrega\w*|sin|quita\w*)\s*$/);
  const from = verb?.index ?? qtyStart;
  return segment.slice(from, start + match.length).trim();
}

function findProduct(segment: string): { productId: ID; match: string } | null {
  for (const alias of ALIASES) {
    const m = segment.match(alias.pattern);
    if (m) return { productId: alias.productId, match: m[0] };
  }
  return null;
}

export function parseOrderMessage(message: string, previousOrder?: Pick<Order, "items" | "number">): ParsedOrder {
  const text = normalizeText(message).replace(/[¡!¿?.;:]/g, " ").replace(/\s+/g, " ");
  const result: ParsedOrder = { lines: [], usedPrevious: false, removed: [], unknown: [] };

  const credit = text.match(CREDIT);
  const cash = text.match(CASH);
  if (cash) {
    result.paymentType = "cash";
    result.paymentSource = cash[0];
  } else if (credit) {
    result.paymentType = "credit";
    result.paymentSource = credit[0];
  }
  if (/pasado manana/.test(text)) result.delivery = undefined;
  else if (/manana/.test(text)) result.delivery = "tomorrow";
  else if (/\bhoy\b|ahorita|urgente/.test(text)) result.delivery = "today";

  const lines = new Map<ID, ParsedLine>();
  if (PREVIOUS.test(text) && previousOrder) {
    result.usedPrevious = true;
    result.previousOrderNumber = previousOrder.number;
    for (const item of previousOrder.items) {
      lines.set(item.productId, { productId: item.productId, quantity: item.quantity, source: "pedido anterior", origin: "previous" });
    }
  }

  // Split into fragments: "12 cocas de 2 litros, 6 cajas de agua y 4 powers".
  const segments = text.split(/,|\by\b|\be\b|\bmas\b(?= \d)|\bpero\b|\bademas\b|\n/);
  for (const raw of segments) {
    const segment = raw.trim();
    if (!segment) continue;
    const found = findProduct(segment);
    const isRemoval = /\bsin\b|\bquita(?:le)?\b|\bno (?:me )?mandes?\b/.test(segment);
    if (!found) {
      if (/\d/.test(segment) && !/litros?|dias?|horas?|bs\b/.test(segment)) result.unknown.push(segment);
      continue;
    }
    if (isRemoval) {
      lines.delete(found.productId);
      result.removed.push({ productId: found.productId, source: `sin ${found.match}` });
      continue;
    }
    const rest = segment.replace(found.match, " ");
    const quantity = quantityIn(rest) ?? 1;
    const isAddition = /aumenta|agrega|anade|suma|\bmas\b|extra/.test(segment);
    const existing = lines.get(found.productId);
    const source = phraseFor(segment, found.match);
    if (isAddition && existing) {
      lines.set(found.productId, { ...existing, quantity: existing.quantity + quantity, source, origin: "added" });
    } else {
      lines.set(found.productId, { productId: found.productId, quantity, source, origin: isAddition ? "added" : "message" });
    }
  }
  result.lines = [...lines.values()];
  return result;
}
