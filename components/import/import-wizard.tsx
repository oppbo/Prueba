"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { importInvoices, type ImportSummary } from "@/lib/actions/import";
import { IMPORT_FIELDS, applyMapping, detectMapping, validateRows, type ColumnMapping } from "@/lib/csv/import";
import { formatBs, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Step = "upload" | "map" | "review" | "done";
const MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Decodes UTF-8, falling back to Windows-1252 (Excel "CSV" on Windows in Spanish). */
async function readText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const mappedRows = useMemo(() => applyMapping(records, mapping), [records, mapping]);
  const results = useMemo(() => (step === "review" ? validateRows(mappedRows) : []), [step, mappedRows]);
  const validCount = results.filter((r) => r.ok).length;
  const invalid = results.filter((r) => !r.ok);
  const validTotal = results.reduce((acc, r) => acc + (r.ok ? r.value.amount : 0), 0);
  const missingRequired = IMPORT_FIELDS.filter((f) => f.required && !mapping[f.key]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      toast.error("Sube un archivo .csv. En Excel: Archivo → Guardar como → CSV.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("El archivo supera 2 MB. Divide la cartera en varios archivos.");
      return;
    }
    const text = await readText(file);
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim() });
    const cols = (parsed.meta.fields ?? []).filter(Boolean);
    const rows = parsed.data.filter((r) => Object.values(r).some((v) => String(v ?? "").trim()));
    if (!cols.length || !rows.length) {
      toast.error("No encontramos filas con datos. Revisa que la primera fila tenga los nombres de las columnas.");
      return;
    }
    if (rows.length > 2000) {
      toast.error("Máximo 2000 filas por importación.");
      return;
    }
    setFileName(file.name);
    setHeaders(cols);
    setRecords(rows);
    setMapping(detectMapping(cols));
    setStep("map");
  }

  function runImport() {
    startTransition(async () => {
      const result = await importInvoices(mappedRows);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSummary(result.data);
      setStep("done");
      toast.success(`${result.data.invoicesCreated} facturas importadas`);
    });
  }

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRecords([]);
    setMapping({});
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" aria-label="Pasos">
        {(["upload", "map", "review", "done"] as Step[]).map((s, i) => {
          const labels = { upload: "Subir archivo", map: "Columnas", review: "Revisión", done: "Resultado" };
          const idx = ["upload", "map", "review", "done"].indexOf(step);
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  i < idx ? "bg-primary text-primary-foreground" : i === idx ? "bg-primary-soft text-primary-soft-foreground ring-1 ring-primary/30" : "bg-muted text-muted-foreground",
                )}
                aria-current={i === idx ? "step" : undefined}
              >
                {i + 1}
              </span>
              <span className={cn(i === idx ? "font-medium text-foreground" : "text-muted-foreground")}>{labels[s]}</span>
              {i < 3 && <span className="mx-1 h-px w-6 bg-border" aria-hidden />}
            </li>
          );
        })}
      </ol>

      {step === "upload" && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardContent className="pt-5">
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" id="csv-file" onChange={(e) => handleFile(e.target.files?.[0])} />
              <label
                htmlFor="csv-file"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors",
                  dragging ? "border-primary bg-primary-soft/50" : "border-input hover:border-primary/60 hover:bg-muted/50",
                )}
              >
                <UploadCloud className="size-9 text-primary" aria-hidden />
                <span className="mt-3 font-medium">Arrastra tu archivo CSV aquí</span>
                <span className="mt-1 text-sm text-muted-foreground">o haz clic para buscarlo · máx. 2 MB, 2000 filas</span>
              </label>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>¿Cómo preparo el archivo?</CardTitle>
                <CardDescription>Exporta tu Excel de cuentas por cobrar como CSV.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <ul className="grid gap-1.5 text-muted-foreground">
                <li>• Una fila por factura pendiente.</li>
                <li>• Columnas: Cliente, Teléfono, NIT, Factura, Fecha emisión, Fecha vencimiento, Monto.</li>
                <li>• Fechas en formato DD/MM/AAAA. Montos como 2.450,00 o 2450.00.</li>
                <li>• Los nombres de columna pueden variar: los detectamos automáticamente.</li>
              </ul>
              <a href="/plantilla-cobraya.csv" download className={buttonVariants({ variant: "secondary" })}>
                <Download /> Descargar plantilla CSV
              </a>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "map" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-primary" aria-hidden /> {fileName}
              </CardTitle>
              <CardDescription>
                {records.length} filas encontradas. Confirma qué columna corresponde a cada dato.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {IMPORT_FIELDS.map((f) => (
                <div key={f.key} className="grid gap-1.5">
                  <Label htmlFor={`map-${f.key}`}>
                    {f.label}
                    {f.required ? <span className="ml-0.5 text-destructive">*</span> : <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
                  </Label>
                  <NativeSelect
                    id={`map-${f.key}`}
                    value={mapping[f.key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))}
                    aria-invalid={f.required && !mapping[f.key] ? true : undefined}
                  >
                    <option value="">— No importar —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Vista previa</p>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      {IMPORT_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <TH key={f.key}>{f.label}</TH>
                      ))}
                    </TR>
                  </THead>
                  <TBody>
                    {mappedRows.slice(0, 5).map((r) => (
                      <TR key={r.row}>
                        {IMPORT_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                          <TD key={f.key} className="max-w-48 truncate whitespace-nowrap">
                            {r[f.key] || <span className="text-muted-foreground">—</span>}
                          </TD>
                        ))}
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </div>
            {missingRequired.length > 0 && (
              <p role="alert" className="flex items-center gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning-soft-foreground">
                <AlertCircle className="size-4 shrink-0" aria-hidden /> Asigna una columna para: {missingRequired.map((f) => f.label).join(", ")}.
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="ghost" onClick={reset}>
                <ArrowLeft /> Elegir otro archivo
              </Button>
              <Button onClick={() => setStep("review")} disabled={missingRequired.length > 0}>
                Validar filas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Revisión</CardTitle>
              <CardDescription>
                Validamos cada fila antes de importar. Las filas con errores no se importan.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-[13px] text-muted-foreground">Filas válidas</p>
                <p className="tabular mt-1 text-xl font-semibold text-primary">{validCount}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[13px] text-muted-foreground">Filas con errores</p>
                <p className={cn("tabular mt-1 text-xl font-semibold", invalid.length && "text-destructive")}>{invalid.length}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-[13px] text-muted-foreground">Monto a importar</p>
                <p className="tabular mt-1 text-xl font-semibold">{formatBs(validTotal)}</p>
              </div>
            </div>

            {invalid.length > 0 && (
              <div className="rounded-lg border border-destructive/25">
                <p className="flex items-center gap-2 border-b border-destructive/20 bg-destructive-soft px-4 py-2.5 text-sm font-medium text-destructive-soft-foreground">
                  <AlertCircle className="size-4" aria-hidden /> Filas que no se importarán
                </p>
                <ul className="max-h-64 divide-y divide-border overflow-y-auto text-sm">
                  {invalid.map((r) =>
                    r.ok ? null : (
                      <li key={r.row} className="flex gap-3 px-4 py-2">
                        <span className="tabular w-16 shrink-0 font-medium">Fila {r.row}</span>
                        <span className="text-muted-foreground">{r.errors.join(" · ")}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {validCount > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>Fila</TH>
                      <TH>Cliente</TH>
                      <TH>Factura</TH>
                      <TH>Vencimiento</TH>
                      <TH className="text-right">Monto</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {results
                      .filter((r) => r.ok)
                      .slice(0, 8)
                      .map((r) =>
                        r.ok ? (
                          <TR key={r.value.row}>
                            <TD className="tabular text-muted-foreground">{r.value.row}</TD>
                            <TD className="max-w-48 truncate">{r.value.customer}</TD>
                            <TD>{r.value.invoice_number}</TD>
                            <TD className="whitespace-nowrap">{formatDate(r.value.due_date)}</TD>
                            <TD className="tabular text-right">{formatBs(r.value.amount)}</TD>
                          </TR>
                        ) : null,
                      )}
                  </TBody>
                </Table>
                {validCount > 8 && <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">y {validCount - 8} filas más…</p>}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="ghost" onClick={() => setStep("map")}>
                <ArrowLeft /> Ajustar columnas
              </Button>
              <Button onClick={runImport} loading={pending} disabled={validCount === 0}>
                Importar {validCount} {validCount === 1 ? "factura" : "facturas"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && summary && (
        <Card>
          <CardContent className="grid gap-5 pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-semibold">Importación completada</p>
                <p className="text-sm text-muted-foreground">Tus facturas ya aparecen en Cobranza y en el panel de inicio.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">{summary.invoicesCreated} facturas creadas</Badge>
              <Badge tone="info">{summary.customersCreated} clientes nuevos</Badge>
              <Badge tone="neutral">{summary.customersMatched} clientes existentes</Badge>
              {summary.skipped.length > 0 && <Badge tone="danger">{summary.skipped.length} filas omitidas</Badge>}
            </div>
            {summary.skipped.length > 0 && (
              <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border text-sm">
                {summary.skipped.map((s) => (
                  <li key={s.row} className="flex gap-3 px-4 py-2">
                    <span className="tabular w-16 shrink-0 font-medium">Fila {s.row}</span>
                    <span className="text-muted-foreground">{s.errors.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/collections" className={buttonVariants()}>
                Ir a cobranza
              </Link>
              <Link href="/dashboard/invoices" className={buttonVariants({ variant: "secondary" })}>
                Ver facturas
              </Link>
              <Button variant="ghost" onClick={reset}>
                Importar otro archivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
