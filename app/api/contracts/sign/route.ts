import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { auditLogs, contracts } from "../../../../db/schema";
import { getAuthorizedAdminUser } from "../../../chatgpt-auth";

const clean = (value: unknown) => String(value ?? "").trim();
export async function POST(request: Request) {
  const user = await getAuthorizedAdminUser(); if (!user) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  const payload = await request.json() as Record<string, unknown>;
  const contractId = clean(payload.contractId); const signerName = clean(payload.signerName); const signerDocument = clean(payload.signerDocument); const signerEmail = clean(payload.signerEmail);
  if (!contractId || !signerName || !signerDocument || !signerEmail || payload.consent !== true) return Response.json({ error: "Informe os dados do signatário e confirme o consentimento" }, { status: 400 });
  const db = getDb(); const [before] = await db.select().from(contracts).where(and(eq(contracts.id, contractId), isNull(contracts.deletedAt))).limit(1);
  if (!before) return Response.json({ error: "Contrato não encontrado" }, { status: 404 });
  if (!before.clauses) return Response.json({ error: "Revise e salve as cláusulas antes de assinar" }, { status: 400 });
  const signedAt = new Date().toISOString();
  const canonical = JSON.stringify({ contractId, number: before.number, customerName: before.customerName, serviceMode: before.serviceMode, serviceType: before.serviceType, totalCents: before.totalCents, clauses: before.clauses, paymentTerms: before.paymentTerms, warrantyTerms: before.warrantyTerms, terminationPenaltyPercent: before.terminationPenaltyPercent, signerName, signerDocument, signerEmail, signedAt, authenticatedUserId: user.userId, authenticatedUserEmail: user.email });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const signatureHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const [record] = await db.update(contracts).set({ signerName, signerDocument, signerEmail, signedAt, signatureHash, status: "Assinado", updatedAt: signedAt }).where(eq(contracts.id, contractId)).returning();
  await db.insert(auditLogs).values({ id: crypto.randomUUID(), entityType: "contracts", entityId: contractId, action: "Assinatura eletrônica simples", description: `Aceite eletrônico simples registrado para o contrato ${before.number}`, actorName: user.fullName || user.email, beforeJson: JSON.stringify(before), afterJson: JSON.stringify(record) });
  return Response.json({ ok: true, signedAt, signatureHash });
}
