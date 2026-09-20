import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, catalogItems, contracts, customers, financeEntries, quotes, workOrders } from "../../../db/schema";
import { getAuthorizedAdminUser } from "../../chatgpt-auth";

type Entity = "customers" | "quotes" | "contracts" | "orders" | "catalog" | "finance";
type Payload = Record<string, unknown> & { entity?: Entity; id?: string };
const clean = (value: unknown) => String(value ?? "").trim();
const cents = (value: unknown) => Math.round(Number(value) * 100);
const now = () => new Date().toISOString();
const makeNumber = (prefix: string) => `${prefix}-${new Date().getUTCFullYear()}-${Date.now().toString().slice(-6)}`;
const labels: Record<Entity, string> = { customers: "Clientes", quotes: "Orçamentos", contracts: "Contratos", orders: "Ordens de serviço", catalog: "Catálogo", finance: "Financeiro" };

async function authorize() {
  const user = await getAuthorizedAdminUser();
  return user ? { user, actor: user.fullName || user.email } : { response: Response.json({ error: "Acesso não autorizado" }, { status: 403 }) };
}
function fail(error: unknown) { return Response.json({ error: error instanceof Error ? error.message : "Falha inesperada" }, { status: 500 }); }
function expose(entity: Entity, record: Record<string, unknown>) {
  if (entity === "quotes" || entity === "contracts") return { ...record, total: Number(record.totalCents) / 100 };
  if (entity === "catalog") return { ...record, price: Number(record.priceCents) / 100 };
  if (entity === "finance") return { ...record, amount: Number(record.amountCents) / 100 };
  return record;
}
async function log(db: ReturnType<typeof getDb>, data: { entity: Entity; entityId: string; action: string; description: string; actor: string; before?: unknown; after?: unknown }) {
  await db.insert(auditLogs).values({ id: crypto.randomUUID(), entityType: data.entity, entityId: data.entityId, action: data.action, description: data.description, actorName: data.actor, beforeJson: data.before ? JSON.stringify(data.before) : "", afterJson: data.after ? JSON.stringify(data.after) : "" });
}

export async function GET() {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const db = getDb();
    const [customerRows, quoteRows, contractRows, orderRows, catalogRows, financeRows, auditRows] = await Promise.all([
      db.select().from(customers).where(isNull(customers.deletedAt)).orderBy(desc(customers.createdAt)).limit(100),
      db.select().from(quotes).where(isNull(quotes.deletedAt)).orderBy(desc(quotes.createdAt)).limit(100),
      db.select().from(contracts).where(isNull(contracts.deletedAt)).orderBy(desc(contracts.createdAt)).limit(100),
      db.select().from(workOrders).where(isNull(workOrders.deletedAt)).orderBy(desc(workOrders.createdAt)).limit(100),
      db.select().from(catalogItems).where(isNull(catalogItems.deletedAt)).orderBy(desc(catalogItems.createdAt)).limit(100),
      db.select().from(financeEntries).where(isNull(financeEntries.deletedAt)).orderBy(desc(financeEntries.createdAt)).limit(100),
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200),
    ]);
    return Response.json({ customers: customerRows, quotes: quoteRows.map((row) => expose("quotes", row)), contracts: contractRows.map((row) => expose("contracts", row)), orders: orderRows, catalog: catalogRows.map((row) => expose("catalog", row)), finance: financeRows.map((row) => expose("finance", row)), audit: auditRows });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const p = await request.json() as Payload; const entity = p.entity;
    if (!entity) return Response.json({ error: "Módulo não informado" }, { status: 400 });
    const db = getDb(); const id = crypto.randomUUID(); const updatedAt = now(); let record: Record<string, unknown>;
    if (entity === "customers") {
      if (!clean(p.name) || !clean(p.personType)) return Response.json({ error: "Nome e tipo de pessoa são obrigatórios" }, { status: 400 });
      [record] = await db.insert(customers).values({ id, name: clean(p.name), personType: clean(p.personType), document: clean(p.document), contactName: clean(p.contactName), phone: clean(p.phone), email: clean(p.email), address: clean(p.address), city: clean(p.city), notes: clean(p.notes), status: clean(p.status) || "Ativo", updatedAt }).returning();
    } else if (entity === "quotes") {
      if (!clean(p.customerName) || !clean(p.serviceType) || !["Instalação", "Manutenção"].includes(clean(p.serviceMode)) || !clean(p.description) || !Number.isFinite(Number(p.total))) return Response.json({ error: "Preencha cliente, modalidade, serviço, escopo e valor" }, { status: 400 });
      [record] = await db.insert(quotes).values({ id, number: makeNumber("ORC"), customerName: clean(p.customerName), serviceType: clean(p.serviceType), serviceMode: clean(p.serviceMode), description: clean(p.description), totalCents: cents(p.total), status: clean(p.status) || "Rascunho", validUntil: clean(p.validUntil), updatedAt }).returning();
    } else if (entity === "contracts") {
      if (!clean(p.customerName) || !clean(p.serviceType) || !["Instalação", "Manutenção"].includes(clean(p.serviceMode)) || !clean(p.startDate) || !Number.isFinite(Number(p.total)) || !clean(p.clauses)) return Response.json({ error: "Preencha os dados obrigatórios e revise as cláusulas" }, { status: 400 });
      [record] = await db.insert(contracts).values({ id, number: makeNumber("CTR"), customerName: clean(p.customerName), serviceMode: clean(p.serviceMode), serviceType: clean(p.serviceType), startDate: clean(p.startDate), endDate: clean(p.endDate), totalCents: cents(p.total), status: clean(p.status) || "Rascunho", notes: clean(p.notes), paymentTerms: clean(p.paymentTerms), warrantyTerms: clean(p.warrantyTerms), terminationPenaltyPercent: Math.max(0, Math.min(100, Math.round(Number(p.terminationPenaltyPercent) || 0))), clauses: clean(p.clauses), updatedAt }).returning();
    } else if (entity === "orders") {
      if (!clean(p.customerName) || !clean(p.serviceType) || !["Instalação", "Manutenção"].includes(clean(p.serviceMode)) || !clean(p.issue)) return Response.json({ error: "Preencha cliente, modalidade, serviço e solicitação" }, { status: 400 });
      [record] = await db.insert(workOrders).values({ id, number: makeNumber("OS"), customerName: clean(p.customerName), serviceMode: clean(p.serviceMode), serviceType: clean(p.serviceType), status: clean(p.status) || "Aberta", scheduledAt: clean(p.scheduledAt), technician: clean(p.technician), issue: clean(p.issue), diagnosis: clean(p.diagnosis), materials: clean(p.materials), warranty: clean(p.warranty), updatedAt }).returning();
    } else if (entity === "catalog") {
      if (!clean(p.name) || !clean(p.itemType) || !clean(p.serviceMode) || !Number.isFinite(Number(p.price))) return Response.json({ error: "Preencha nome, tipo, aplicação e preço" }, { status: 400 });
      [record] = await db.insert(catalogItems).values({ id, name: clean(p.name), itemType: clean(p.itemType), serviceMode: clean(p.serviceMode), category: clean(p.category), unit: clean(p.unit) || "un", priceCents: cents(p.price), warranty: clean(p.warranty), status: clean(p.status) || "Ativo", updatedAt }).returning();
    } else {
      if (!clean(p.customerName) || !clean(p.reference) || !clean(p.dueDate) || !Number.isFinite(Number(p.amount))) return Response.json({ error: "Preencha cliente, referência, vencimento e valor" }, { status: 400 });
      [record] = await db.insert(financeEntries).values({ id, customerName: clean(p.customerName), reference: clean(p.reference), dueDate: clean(p.dueDate), amountCents: cents(p.amount), status: clean(p.status) || "Pendente", notes: clean(p.notes), updatedAt }).returning();
    }
    await log(db, { entity, entityId: id, action: "Criação", description: `Registro criado em ${labels[entity]}`, actor: auth.actor!, after: record });
    return Response.json({ record: expose(entity, record) }, { status: 201 });
  } catch (error) { return fail(error); }
}

export async function PUT(request: Request) {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const p = await request.json() as Payload; const entity = p.entity; const id = clean(p.id);
    if (!entity || !id) return Response.json({ error: "Registro não identificado" }, { status: 400 });
    const db = getDb(); const updatedAt = now(); let before: Record<string, unknown> | undefined; let record: Record<string, unknown> | undefined;
    if (entity === "customers") { [before] = await db.select().from(customers).where(and(eq(customers.id, id), isNull(customers.deletedAt))).limit(1); [record] = await db.update(customers).set({ name: clean(p.name), personType: clean(p.personType), document: clean(p.document), contactName: clean(p.contactName), phone: clean(p.phone), email: clean(p.email), address: clean(p.address), city: clean(p.city), notes: clean(p.notes), status: clean(p.status), updatedAt }).where(eq(customers.id, id)).returning(); }
    else if (entity === "quotes") { [before] = await db.select().from(quotes).where(and(eq(quotes.id, id), isNull(quotes.deletedAt))).limit(1); [record] = await db.update(quotes).set({ customerName: clean(p.customerName), serviceType: clean(p.serviceType), serviceMode: clean(p.serviceMode), description: clean(p.description), totalCents: cents(p.total), status: clean(p.status), validUntil: clean(p.validUntil), updatedAt }).where(eq(quotes.id, id)).returning(); }
    else if (entity === "contracts") {
      [before] = await db.select().from(contracts).where(and(eq(contracts.id, id), isNull(contracts.deletedAt))).limit(1);
      if (before) {
        const next = { customerName: clean(p.customerName), serviceMode: clean(p.serviceMode), serviceType: clean(p.serviceType), startDate: clean(p.startDate), endDate: clean(p.endDate), totalCents: cents(p.total), notes: clean(p.notes), paymentTerms: clean(p.paymentTerms), warrantyTerms: clean(p.warrantyTerms), terminationPenaltyPercent: Math.max(0, Math.min(100, Math.round(Number(p.terminationPenaltyPercent) || 0))), clauses: clean(p.clauses) };
        const signatureContentChanged = Boolean(before.signedAt) && (["customerName", "serviceMode", "serviceType", "startDate", "endDate", "totalCents", "paymentTerms", "warrantyTerms", "terminationPenaltyPercent", "clauses"] as const).some((key) => String(before?.[key] ?? "") !== String(next[key] ?? ""));
        [record] = await db.update(contracts).set({ ...next, status: signatureContentChanged ? "Aguardando assinatura" : clean(p.status), signerName: signatureContentChanged ? "" : clean(before.signerName), signerDocument: signatureContentChanged ? "" : clean(before.signerDocument), signerEmail: signatureContentChanged ? "" : clean(before.signerEmail), signedAt: signatureContentChanged ? "" : clean(before.signedAt), signatureHash: signatureContentChanged ? "" : clean(before.signatureHash), updatedAt }).where(eq(contracts.id, id)).returning();
      }
    }
    else if (entity === "orders") { [before] = await db.select().from(workOrders).where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt))).limit(1); [record] = await db.update(workOrders).set({ customerName: clean(p.customerName), serviceMode: clean(p.serviceMode), serviceType: clean(p.serviceType), status: clean(p.status), scheduledAt: clean(p.scheduledAt), technician: clean(p.technician), issue: clean(p.issue), diagnosis: clean(p.diagnosis), materials: clean(p.materials), warranty: clean(p.warranty), updatedAt }).where(eq(workOrders.id, id)).returning(); }
    else if (entity === "catalog") { [before] = await db.select().from(catalogItems).where(and(eq(catalogItems.id, id), isNull(catalogItems.deletedAt))).limit(1); [record] = await db.update(catalogItems).set({ name: clean(p.name), itemType: clean(p.itemType), serviceMode: clean(p.serviceMode), category: clean(p.category), unit: clean(p.unit), priceCents: cents(p.price), warranty: clean(p.warranty), status: clean(p.status), updatedAt }).where(eq(catalogItems.id, id)).returning(); }
    else { [before] = await db.select().from(financeEntries).where(and(eq(financeEntries.id, id), isNull(financeEntries.deletedAt))).limit(1); [record] = await db.update(financeEntries).set({ customerName: clean(p.customerName), reference: clean(p.reference), dueDate: clean(p.dueDate), amountCents: cents(p.amount), status: clean(p.status), notes: clean(p.notes), updatedAt }).where(eq(financeEntries.id, id)).returning(); }
    if (!before || !record) return Response.json({ error: "Registro não encontrado" }, { status: 404 });
    await log(db, { entity, entityId: id, action: "Edição", description: `Registro atualizado em ${labels[entity]}`, actor: auth.actor!, before, after: record });
    return Response.json({ record: expose(entity, record) });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const p = await request.json() as Payload; const entity = p.entity; const id = clean(p.id);
    if (!entity || !id) return Response.json({ error: "Registro não identificado" }, { status: 400 });
    const db = getDb(); const deletedAt = now(); let before: Record<string, unknown> | undefined;
    if (entity === "customers") { [before] = await db.select().from(customers).where(eq(customers.id, id)).limit(1); await db.update(customers).set({ deletedAt }).where(eq(customers.id, id)); }
    else if (entity === "quotes") { [before] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1); await db.update(quotes).set({ deletedAt }).where(eq(quotes.id, id)); }
    else if (entity === "contracts") { [before] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1); await db.update(contracts).set({ deletedAt }).where(eq(contracts.id, id)); }
    else if (entity === "orders") { [before] = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1); await db.update(workOrders).set({ deletedAt }).where(eq(workOrders.id, id)); }
    else if (entity === "catalog") { [before] = await db.select().from(catalogItems).where(eq(catalogItems.id, id)).limit(1); await db.update(catalogItems).set({ deletedAt }).where(eq(catalogItems.id, id)); }
    else { [before] = await db.select().from(financeEntries).where(eq(financeEntries.id, id)).limit(1); await db.update(financeEntries).set({ deletedAt }).where(eq(financeEntries.id, id)); }
    if (!before) return Response.json({ error: "Registro não encontrado" }, { status: 404 });
    await log(db, { entity, entityId: id, action: "Exclusão", description: `Registro removido de ${labels[entity]}`, actor: auth.actor!, before });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
