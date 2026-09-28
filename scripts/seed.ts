/**
 * Seeds (or resets) the demo organization "Distribuidora Andina SRL".
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_EMAIL and
 * DEMO_USER_PASSWORD (read from .env.local or the environment). Safe to re-run: it
 * only deletes and recreates data belonging to the demo user's organization.
 * All businesses, people and phone numbers are fictional.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import type { Database, PaymentMethod } from "../types/database";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEMO_USER_EMAIL;
const password = process.env.DEMO_USER_PASSWORD;

if (!url || !serviceKey || !email || !password) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_EMAIL, DEMO_USER_PASSWORD");
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------- date helpers (La Paz)
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" }).format(new Date());
const day = (offset: number) => {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10);
};
/** Timestamp at a given La Paz hour, `offset` days from today. */
const at = (offset: number, hour = 10, minute = 0) => new Date(`${day(offset)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-04:00`).toISOString();

async function must<T>(label: string, p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data as T;
}

// ---------------------------------------------------------------- demo dataset
const CUSTOMERS = [
  { key: "illimani", name: "Ferretería Illimani", business_name: "Ferretería Illimani S.R.L.", nit: "1023456027", phone: "70000101", city: "La Paz", address: "Calle Max Paredes #845" },
  { key: "sanmiguel", name: "Comercial San Miguel", business_name: "Comercial San Miguel Ltda.", nit: "4567890011", phone: "70000102", city: "La Paz", address: "Av. Montenegro #1120, San Miguel" },
  { key: "altiplano", name: "Repuestos Altiplano", business_name: "Repuestos Automotrices Altiplano", nit: "3344556012", phone: "70000103", city: "El Alto", address: "Av. 6 de Marzo #2231" },
  { key: "horizonte", name: "Constructora Horizonte", business_name: "Constructora Horizonte S.A.", nit: "1122334455", phone: "70000104", city: "La Paz", address: "Calle 21 de Calacoto #560" },
  { key: "mercado", name: "Mercado Central Sur", business_name: null, nit: "7788990013", phone: "70000105", city: "La Paz", address: "Mercado Rodríguez, puesto 42" },
  { key: "nuevaera", name: "Importadora Nueva Era", business_name: "Importadora Nueva Era S.R.L.", nit: "2233445566", phone: "70000106", city: "Cochabamba", address: "Av. Blanco Galindo km 3" },
  { key: "tupac", name: "Distribuidora Túpac", business_name: "Distribuidora Túpac Katari", nit: "5566778814", phone: "70000107", city: "El Alto", address: "Zona 16 de Julio, Calle 3" },
  { key: "grafica", name: "Gráfica Mariscal", business_name: "Imprenta Gráfica Mariscal", nit: "6677889915", phone: "70000108", city: "La Paz", address: "Calle Yungas #310" },
  { key: "sopocachi", name: "Minimarket Sopocachi", business_name: null, nit: null, phone: "70000109", city: "La Paz", address: "Plaza Abaroa, local 7" },
  { key: "oriente", name: "Agroinsumos del Oriente", business_name: "Agroinsumos del Oriente S.A.", nit: "8899001116", phone: "70000110", city: "Santa Cruz", address: "4to anillo, Av. Banzer" },
  { key: "aguayo", name: "Agencia Aguayo Creativo", business_name: "Aguayo Creativo SRL", nit: "9900112217", phone: "70000111", city: "La Paz", address: "Av. 20 de Octubre #2020" },
  { key: "chacaltaya", name: "Hotel Chacaltaya", business_name: "Hotelera Chacaltaya S.A.", nit: "1231231218", phone: "70000112", city: "La Paz", address: "Calle Sagárnaga #190", status: "inactive" as const },
];

type InvoiceSeed = {
  customer: string;
  number: string;
  issue: number; // days from today
  due: number;
  amount: number;
  description: string;
  payments?: { amount: number; on: number; method: PaymentMethod; reference?: string }[];
};

const INVOICES: InvoiceSeed[] = [
  // Paid, spread over the last months (feeds the chart)
  { customer: "illimani", number: "F-001178", issue: -168, due: -138, amount: 14300, description: "Cemento IP-30, 200 bolsas", payments: [{ amount: 14300, on: -140, method: "bank_transfer", reference: "TRX-889120" }] },
  { customer: "sanmiguel", number: "F-001183", issue: -150, due: -120, amount: 7800, description: "Abarrotes, pedido mensual", payments: [{ amount: 7800, on: -118, method: "qr", reference: "QR-551203" }] },
  { customer: "nuevaera", number: "F-001190", issue: -131, due: -101, amount: 21500, description: "Pintura látex y esmaltes", payments: [{ amount: 21500, on: -97, method: "bank_transfer", reference: "TRX-900233" }] },
  { customer: "horizonte", number: "F-001196", issue: -112, due: -82, amount: 18650, description: "Fierro corrugado 12 mm", payments: [{ amount: 10000, on: -85, method: "bank_transfer" }, { amount: 8650, on: -70, method: "bank_transfer", reference: "TRX-912874" }] },
  { customer: "grafica", number: "F-001201", issue: -95, due: -65, amount: 2450, description: "Papel bond y tintas", payments: [{ amount: 2450, on: -60, method: "cash" }] },
  { customer: "tupac", number: "F-001207", issue: -70, due: -40, amount: 9870, description: "Bebidas y snacks, lote 12", payments: [{ amount: 9870, on: -38, method: "qr", reference: "QR-601998" }] },
  { customer: "illimani", number: "F-001214", issue: -52, due: -22, amount: 6320, description: "Herramientas eléctricas", payments: [{ amount: 6320, on: -20, method: "bank_transfer", reference: "TRX-930041" }] },
  { customer: "aguayo", number: "F-001220", issue: -34, due: -4, amount: 4200, description: "Impresión de banners y roll-ups", payments: [{ amount: 4200, on: -6, method: "qr", reference: "QR-622014" }] },

  // Partially paid
  { customer: "oriente", number: "F-001209", issue: -60, due: -30, amount: 32400, description: "Fertilizante NPK, 90 sacos", payments: [{ amount: 15000, on: -28, method: "bank_transfer", reference: "TRX-925560" }] },
  { customer: "horizonte", number: "F-001222", issue: -31, due: -1, amount: 12780, description: "Cerámica y porcelanato", payments: [{ amount: 5000, on: -12, method: "bank_transfer" }] },
  { customer: "sanmiguel", number: "F-001228", issue: -20, due: 10, amount: 5640, description: "Aceite y azúcar, pedido quincenal", payments: [{ amount: 2000, on: -3, method: "cash" }] },

  // Overdue
  { customer: "altiplano", number: "F-001203", issue: -94, due: -64, amount: 11250, description: "Kits de embrague y filtros" },
  { customer: "mercado", number: "F-001211", issue: -77, due: -47, amount: 3480, description: "Productos de limpieza" },
  { customer: "nuevaera", number: "F-001215", issue: -68, due: -38, amount: 16900, description: "Grifería y accesorios de baño" },
  { customer: "tupac", number: "F-001218", issue: -52, due: -22, amount: 7350, description: "Bebidas, lote 15" },
  { customer: "grafica", number: "F-001221", issue: -45, due: -15, amount: 1890, description: "Cartulinas y acetatos" },
  { customer: "sopocachi", number: "F-001223", issue: -39, due: -9, amount: 850, description: "Abarrotes surtidos" },
  { customer: "altiplano", number: "F-001226", issue: -33, due: -3, amount: 4960, description: "Pastillas de freno y aceite" },

  // Due in the next 7 days
  { customer: "illimani", number: "F-001230", issue: -25, due: 0, amount: 8740, description: "Calaminas y clavos" },
  { customer: "mercado", number: "F-001231", issue: -23, due: 2, amount: 2150, description: "Productos de limpieza" },
  { customer: "aguayo", number: "F-001232", issue: -21, due: 4, amount: 3600, description: "Diseño e impresión de catálogos" },
  { customer: "oriente", number: "F-001233", issue: -18, due: 6, amount: 27300, description: "Semillas certificadas de soya" },

  // Due later
  { customer: "nuevaera", number: "F-001235", issue: -8, due: 22, amount: 13450, description: "Luminarias LED" },
  { customer: "tupac", number: "F-001236", issue: -5, due: 25, amount: 6280, description: "Bebidas, lote 16" },
  { customer: "horizonte", number: "F-001237", issue: -2, due: 28, amount: 19900, description: "Cemento IP-40, 250 bolsas" },
];

/** Minimal valid one-page PDF used as a fictional payment proof. */
function proofPdf(lines: string[]): Buffer {
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 50 ${760 - i * 22} Td (${l.replace(/[()\\]/g, "")}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 820] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text, "latin1")} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

async function getOrCreateDemoUser(): Promise<string> {
  const metadata = { full_name: "María Quispe", organization_name: "Distribuidora Andina SRL" };
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email!.toLowerCase());
    if (found) {
      await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true, user_metadata: metadata });
      return found.id;
    }
    if (data.users.length < 200) break;
  }
  const { data, error } = await admin.auth.admin.createUser({ email: email!, password: password!, email_confirm: true, user_metadata: metadata });
  if (error || !data.user) throw error ?? new Error("could not create demo user");
  return data.user.id;
}

async function main() {
  console.log(`Seeding demo data for ${email} (today in La Paz: ${today})`);
  const userId = await getOrCreateDemoUser();
  await admin.from("profiles").upsert({ id: userId, full_name: "María Quispe", phone: "+591 70000100" });

  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("demo user has no organization (did the migrations run?)");
  const orgId = membership.organization_id;

  // ---- reset previous demo data (only this organization)
  for (const table of ["collection_events", "public_payment_links", "payments", "invoices", "customers"] as const) {
    await must(`reset ${table}`, admin.from(table).delete().eq("organization_id", orgId));
  }
  for (const bucket of ["org-assets", "payment-proofs"]) {
    const { data: top } = await admin.storage.from(bucket).list(orgId, { limit: 1000 });
    const paths: string[] = [];
    for (const item of top ?? []) {
      if (item.id) paths.push(`${orgId}/${item.name}`);
      else {
        const { data: nested } = await admin.storage.from(bucket).list(`${orgId}/${item.name}`, { limit: 1000 });
        for (const n of nested ?? []) paths.push(`${orgId}/${item.name}/${n.name}`);
      }
    }
    if (paths.length) await admin.storage.from(bucket).remove(paths);
  }

  // ---- organization + demo QR
  const qr = await QRCode.toBuffer("CobraYa DEMO - QR de ejemplo. No realizar pagos.", { type: "png", width: 480, margin: 2, errorCorrectionLevel: "M" });
  const qrPath = `${orgId}/bank-qr-demo.png`;
  const { error: qrError } = await admin.storage.from("org-assets").upload(qrPath, qr, { contentType: "image/png", upsert: true });
  if (qrError) console.warn("QR upload failed:", qrError.message);

  await must(
    "organization",
    admin
      .from("organizations")
      .update({
        name: "Distribuidora Andina SRL",
        legal_name: "Distribuidora Andina S.R.L.",
        nit: "1020304025",
        phone: "+591 70000100",
        address: "Av. Buenos Aires #1234, Zona Max Paredes",
        city: "La Paz",
        bank_name: "Banco Unión (demo)",
        bank_account_name: "Distribuidora Andina S.R.L.",
        bank_account_number: "1000000000000",
        bank_qr_path: qrError ? null : qrPath,
        reminder_templates: {},
      })
      .eq("id", orgId),
  );

  // ---- customers
  const customers = await must(
    "customers",
    admin
      .from("customers")
      .insert(
        CUSTOMERS.map(({ key: _key, status, ...c }) => ({
          ...c,
          organization_id: orgId,
          status: status ?? "active",
          email: null,
          notes: _key === "oriente" ? "Paga en dos cuotas. Contacto de cobranza: Lic. Rojas." : null,
          created_at: at(-190),
        })),
      )
      .select("id, name"),
  );
  const customerId = (key: string) => {
    const name = CUSTOMERS.find((c) => c.key === key)!.name;
    return customers.find((c) => c.name === name)!.id;
  };

  // ---- invoices
  const invoices = await must(
    "invoices",
    admin
      .from("invoices")
      .insert(
        INVOICES.map((inv) => ({
          organization_id: orgId,
          customer_id: customerId(inv.customer),
          invoice_number: inv.number,
          description: inv.description,
          issue_date: day(inv.issue),
          due_date: day(inv.due),
          original_amount: inv.amount,
          created_at: at(inv.issue, 9, 15),
        })),
      )
      .select("id, invoice_number, customer_id"),
  );
  const invoiceBy = (n: string) => invoices.find((i) => i.invoice_number === n)!;

  const events: Database["public"]["Tables"]["collection_events"]["Insert"][] = [];
  for (const inv of INVOICES) {
    const row = invoiceBy(inv.number);
    events.push({ organization_id: orgId, customer_id: row.customer_id, invoice_id: row.id, event_type: "invoice_created", message: `Factura ${inv.number}`, created_by: userId, created_at: at(inv.issue, 9, 15) });
  }

  // ---- verified payments
  const payments: Database["public"]["Tables"]["payments"]["Insert"][] = [];
  for (const inv of INVOICES) {
    const row = invoiceBy(inv.number);
    for (const p of inv.payments ?? []) {
      payments.push({
        organization_id: orgId,
        customer_id: row.customer_id,
        invoice_id: row.id,
        amount: p.amount,
        payment_date: day(p.on),
        payment_method: p.method,
        reference: p.reference ?? null,
        status: "verified",
        verified_at: at(p.on, 16),
        verified_by: userId,
        created_at: at(p.on, 15, 30),
      });
      events.push({
        organization_id: orgId,
        customer_id: row.customer_id,
        invoice_id: row.id,
        event_type: "payment_verified",
        message: `Pago verificado por Bs ${p.amount.toFixed(2)}`,
        created_by: userId,
        created_at: at(p.on, 16),
      });
    }
  }
  await must("payments", admin.from("payments").insert(payments));

  // ---- customer-submitted proofs: 3 pending, 1 rejected
  const proofs = [
    { number: "F-001226", amount: 4960, reference: "TRX-944120", daysAgo: 0, hour: 9, status: "pending_verification" as const, note: "Pago total de la factura" },
    { number: "F-001223", amount: 850, reference: "QR-640551", daysAgo: -1, hour: 18, status: "pending_verification" as const, note: null },
    { number: "F-001209", amount: 10000, reference: "TRX-943002", daysAgo: -1, hour: 11, status: "pending_verification" as const, note: "Segunda cuota, la tercera la próxima semana" },
    { number: "F-001211", amount: 3480, reference: "TRX-938811", daysAgo: -6, hour: 12, status: "rejected" as const, note: "Comprobante ilegible" },
  ];
  for (const proof of proofs) {
    const row = invoiceBy(proof.number);
    const customerName = customers.find((c) => c.id === row.customer_id)!.name;
    const path = `${orgId}/${row.id}/demo-${proof.reference}.pdf`;
    const pdf = proofPdf([
      "Comprobante de transferencia (DEMO)",
      `Ordenante: ${customerName}`,
      "Beneficiario: Distribuidora Andina S.R.L.",
      `Monto: Bs ${proof.amount.toFixed(2)}`,
      `Referencia: ${proof.reference}`,
      `Fecha: ${day(proof.daysAgo)}`,
      "Documento ficticio generado para la demo de CobraYa.",
    ]);
    const { error } = await admin.storage.from("payment-proofs").upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (error) console.warn("proof upload failed:", error.message);
    await must(
      "proof payment",
      admin.from("payments").insert({
        organization_id: orgId,
        customer_id: row.customer_id,
        invoice_id: row.id,
        amount: proof.amount,
        payment_date: day(proof.daysAgo),
        payment_method: "qr",
        reference: proof.reference,
        proof_path: error ? null : path,
        notes: proof.note,
        status: proof.status,
        submitted_by_customer: true,
        verified_at: proof.status === "rejected" ? at(proof.daysAgo + 1, 10) : null,
        verified_by: proof.status === "rejected" ? userId : null,
        created_at: at(proof.daysAgo, proof.hour),
      }),
    );
    events.push({
      organization_id: orgId,
      customer_id: row.customer_id,
      invoice_id: row.id,
      event_type: "payment_proof_received",
      message: `Comprobante recibido por Bs ${proof.amount.toFixed(2)}`,
      created_by: null,
      created_at: at(proof.daysAgo, proof.hour),
    });
    if (proof.status === "rejected") {
      events.push({ organization_id: orgId, customer_id: row.customer_id, invoice_id: row.id, event_type: "payment_rejected", message: "Comprobante rechazado: ilegible, se pidió uno nuevo", created_by: userId, created_at: at(proof.daysAgo + 1, 10) });
    }
  }

  // ---- collection history: reminders and notes
  const contacts: { number: string; daysAgo: number; type: "whatsapp_opened" | "note_added"; message: string }[] = [
    { number: "F-001203", daysAgo: -20, type: "whatsapp_opened", message: "Recordatorio de factura vencida F-001203 por Bs 11.250,00." },
    { number: "F-001203", daysAgo: -12, type: "note_added", message: "Llamé al encargado, promete pagar a fin de mes." },
    { number: "F-001215", daysAgo: -9, type: "whatsapp_opened", message: "Recordatorio de factura vencida F-001215 por Bs 16.900,00." },
    { number: "F-001209", daysAgo: -5, type: "note_added", message: "Acordamos pago en dos cuotas adicionales." },
    { number: "F-001218", daysAgo: -3, type: "whatsapp_opened", message: "Recordatorio de factura vencida F-001218 por Bs 7.350,00." },
    { number: "F-001221", daysAgo: -2, type: "whatsapp_opened", message: "Recordatorio de factura vencida F-001221 por Bs 1.890,00." },
    { number: "F-001230", daysAgo: -1, type: "whatsapp_opened", message: "Recordatorio: la factura F-001230 vence hoy." },
  ];
  for (const c of contacts) {
    const row = invoiceBy(c.number);
    events.push({ organization_id: orgId, customer_id: row.customer_id, invoice_id: row.id, event_type: c.type, message: c.message, created_by: userId, created_at: at(c.daysAgo, 11, 20) });
  }
  await must("events", admin.from("collection_events").insert(events));

  // ---- payment links for open invoices
  const { data: open } = await admin
    .from("invoices")
    .select("id, customer_id")
    .eq("organization_id", orgId)
    .in("status", ["pending", "partially_paid"]);
  if (open?.length) {
    await must("links", admin.from("public_payment_links").insert(open.map((i) => ({ organization_id: orgId, customer_id: i.customer_id, invoice_id: i.id }))));
  }

  const { data: sample } = await admin.from("public_payment_links").select("token").eq("organization_id", orgId).limit(1).maybeSingle();
  console.log(`✔ ${customers.length} customers, ${invoices.length} invoices, ${payments.length + proofs.length} payments, ${events.length} events`);
  console.log(`✔ Demo login: ${email}`);
  if (sample) console.log(`✔ Sample payment page: /p/${sample.token}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
