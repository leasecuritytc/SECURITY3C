import { and, count, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { catalogItems, contracts, customers, financeEntries, quotes, servicePhotos, workOrders } from "../../../../../db/schema";
import { buildDocumentPdf, buildSummaryReportPdf } from "../../../../../lib/pdf-documents";
import { getAuthorizedAdminUser } from "../../../../chatgpt-auth";

export async function GET(request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  const user = await getAuthorizedAdminUser(); if (!user) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const { entity, id } = await context.params;
  if (!["quotes", "contracts", "orders", "reports"].includes(entity)) return Response.json({ error: "Documento inválido" }, { status: 400 });
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
      db.select({ id: financeEntries.id, amountCents: financeEntries.amountCents, status: financeEntries.status }).from(financeEntries).where(isNull(financeEntries.deletedAt)),
    ]);
    const modes = [...quoteRows, ...contractRows, ...orderRows];
    const bytes = await buildSummaryReportPdf({
      generatedBy: user.fullName || user.email,
      customers: customerRows.length, quotes: quoteRows.length, contracts: contractRows.length, orders: orderRows.length, catalog: catalogRows.length, finance: financeRows.length,
      installation: modes.filter((row) => row.serviceMode === "Instalação").length,
      maintenance: modes.filter((row) => row.serviceMode === "Manutenção").length,
      receivedCents: financeRows.filter((row) => row.status === "Pago").reduce((sum, row) => sum + row.amountCents, 0),
      openCents: financeRows.filter((row) => row.status === "Pendente" || row.status === "Vencido").reduce((sum, row) => sum + row.amountCents, 0),
    }, logoBytes);
    return new Response(bytes as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="relatorio-gerencial-security3c.pdf"`, "Cache-Control": "private, no-store" } });
  }
  if (entity === "quotes") [record] = await db.select().from(quotes).where(and(eq(quotes.id, id), isNull(quotes.deletedAt))).limit(1);
  else if (entity === "contracts") [record] = await db.select().from(contracts).where(and(eq(contracts.id, id), isNull(contracts.deletedAt))).limit(1);
  else {
    [record] = await db.select().from(workOrders).where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt))).limit(1);
    [{ value: photoCount }] = await db.select({ value: count() }).from(servicePhotos).where(eq(servicePhotos.orderId, id));
  }
  if (!record) return Response.json({ error: "Registro não encontrado" }, { status: 404 });
  const bytes = await buildDocumentPdf(entity as "quotes" | "contracts" | "orders", record, photoCount, logoBytes);
  const number = text(record.number).replace(/[^a-zA-Z0-9_-]/g, "-");
  return new Response(bytes as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${number}.pdf"`, "Cache-Control": "private, no-store" } });
}
function text(value: unknown) { return String(value ?? "documento"); }
