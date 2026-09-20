import { and, count, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { contracts, quotes, servicePhotos, workOrders } from "../../../../../db/schema";
import { buildDocumentPdf } from "../../../../../lib/pdf-documents";
import { getAuthorizedAdminUser } from "../../../../chatgpt-auth";

export async function GET(_request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  const user = await getAuthorizedAdminUser(); if (!user) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const { entity, id } = await context.params;
  if (!["quotes", "contracts", "orders"].includes(entity)) return Response.json({ error: "Documento inválido" }, { status: 400 });
  const db = getDb(); let record: Record<string, unknown> | undefined; let photoCount = 0;
  if (entity === "quotes") [record] = await db.select().from(quotes).where(and(eq(quotes.id, id), isNull(quotes.deletedAt))).limit(1);
  else if (entity === "contracts") [record] = await db.select().from(contracts).where(and(eq(contracts.id, id), isNull(contracts.deletedAt))).limit(1);
  else {
    [record] = await db.select().from(workOrders).where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt))).limit(1);
    [{ value: photoCount }] = await db.select({ value: count() }).from(servicePhotos).where(eq(servicePhotos.orderId, id));
  }
  if (!record) return Response.json({ error: "Registro não encontrado" }, { status: 404 });
  const bytes = await buildDocumentPdf(entity as "quotes" | "contracts" | "orders", record, photoCount);
  const number = text(record.number).replace(/[^a-zA-Z0-9_-]/g, "-");
  return new Response(bytes as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${number}.pdf"`, "Cache-Control": "private, no-store" } });
}
function text(value: unknown) { return String(value ?? "documento"); }
