import { and, count, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { catalogItems, contracts, customers, financeEntries, quotes, servicePhotos, workOrders } from "../../../../../db/schema";
import { buildDocumentDocx, buildFinanceReceiptDocx, buildSummaryReportDocx, type DocumentSummaryReport } from "../../../../../lib/docx-documents";
import { buildDocumentPdf, buildFinanceReceiptPdf, buildSummaryReportPdf } from "../../../../../lib/pdf-documents";
import { getAuthorizedAdminUser } from "../../../../chatgpt-auth";

export async function GET(request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  const user = await getAuthorizedAdminUser(); if (!user) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const { entity, id } = await context.params;
  const format = new URL(request.url).searchParams.get("format") === "docx" ? "docx" : "pdf";
  if (!["quotes", "contracts", "orders", "finance", "reports"].includes(entity)) return Response.json({ error: "Documento inválido" }, { status: 400 });
  let logoBytes: Uint8Array | undefined;
  try { const logoResponse = await fetch(new URL("/securitytc-logo.png", request.url)); if (logoResponse.ok) logoBytes = new Uint8Array(await logoResponse.arrayBuffer()); } catch { logoBytes = undefined; }
  const db = getDb(); let record: Record<string, unknown> | undefined; let photoCount = 0;
  if (entity === "reports") {
    if (id !== "summary") return Response.json({ error: "Relatório inválido" }, { status: 400 });
    const [customerRows, quoteRows, contractRows, orderRows, catalogRows, financeRows] = await Promise.all([
      db.select({ id: customers.id }).from(customers).where(isNull(customers.deletedAt)),
      db.select({ id: quotes.id, serviceMode: quotes.serviceMode }).from(quotes).where(isNull(quotes.deletedAt)),
      db.select({ id: contracts.id, serviceMode: contracts.serviceMode }).from(contracts).where(isNull(contracts.deletedAt)),
      db.select({ id: workOrders.id, serviceMode: workOrders.serviceMode }).from(workOrders).where(isNull(workOrders.deletedAt)),
      db.select({ id: catalogItems.id }).from(catalogItems).where(isNull(catalogItems.deletedAt)),
      db.select({ id: financeEntries.id, amountCents: financeEntries.amountCents, status: financeEntries.status, entryType: financeEntries.entryType }).from(financeEntries).where(isNull(financeEntries.deletedAt)),
    ]);
    const modes = [...quoteRows, ...contractRows, ...orderRows];
    const report: DocumentSummaryReport = {
      generatedBy: user.fullName || user.email,
      customers: customerRows.length, quotes: quoteRows.length, contracts: contractRows.length, orders: orderRows.length, catalog: catalogRows.length, finance: financeRows.length,
      installation: modes.filter((row) => row.serviceMode === "Instalação").length,
      maintenance: modes.filter((row) => row.serviceMode === "Manutenção").length,
      receivedCents: financeRows.filter((row) => row.entryType === "Receita" && row.status === "Pago").reduce((sum, row) => sum + row.amountCents, 0),
      openCents: financeRows.filter((row) => row.entryType === "Receita" && (row.status === "Pendente" || row.status === "Vencido" || row.status === "Parcial")).reduce((sum, row) => sum + row.amountCents, 0),
    };
    const bytes = format === "docx" ? buildSummaryReportDocx(report, logoBytes) : await buildSummaryReportPdf(report, logoBytes);
    return download(bytes, `relatorio-gerencial-security3c.${format}`, format);
  }
  if (entity === "quotes") [record] = await db.select().from(quotes).where(and(eq(quotes.id, id), isNull(quotes.deletedAt))).limit(1);
  else if (entity === "contracts") [record] = await db.select().from(contracts).where(and(eq(contracts.id, id), isNull(contracts.deletedAt))).limit(1);
  else if (entity === "finance") {
    [record] = await db.select().from(financeEntries).where(and(eq(financeEntries.id, id), isNull(financeEntries.deletedAt))).limit(1);
    if (!record?.receiptNumber || record.entryType !== "Receita") return Response.json({ error: "Este lançamento não possui recibo emitido" }, { status: 400 });
  }
  else {
    [record] = await db.select().from(workOrders).where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt))).limit(1);
    [{ value: photoCount }] = await db.select({ value: count() }).from(servicePhotos).where(eq(servicePhotos.orderId, id));
  }
  if (!record) return Response.json({ error: "Registro não encontrado" }, { status: 404 });
  if (entity === "finance") {
    const bytes = format === "docx" ? buildFinanceReceiptDocx(record, logoBytes) : await buildFinanceReceiptPdf(record, logoBytes);
    const receiptNumber = text(record.receiptNumber).replace(/[^a-zA-Z0-9_-]/g, "-");
    return download(bytes, `${receiptNumber}.${format}`, format);
  }
  const kind = entity as "quotes" | "contracts" | "orders";
  const bytes = format === "docx" ? buildDocumentDocx(kind, record, photoCount, logoBytes) : await buildDocumentPdf(kind, record, photoCount, logoBytes);
  const number = text(record.number).replace(/[^a-zA-Z0-9_-]/g, "-");
  return download(bytes, `${number}.${format}`, format);
}
function text(value: unknown) { return String(value ?? "documento"); }
function download(bytes: Uint8Array, filename: string, format: "pdf" | "docx") {
  const contentType = format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
  return new Response(bytes as BodyInit, { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
