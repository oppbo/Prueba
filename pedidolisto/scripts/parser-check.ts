import { parseOrderMessage } from "@/lib/assistant/parser";
import { SAMPLE_MESSAGES } from "@/lib/assistant/samples";
const prev = { number: "PED-1", items: [{ productId: "p01", quantity: 12, unitPrice: 1, subtotal: 1 }, { productId: "p08", quantity: 4, unitPrice: 1, subtotal: 1 }] };
for (const m of SAMPLE_MESSAGES) console.log(m.text, JSON.stringify(parseOrderMessage(m.text, prev)));
