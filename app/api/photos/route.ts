import { env } from "cloudflare:workers";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, servicePhotos, workOrders } from "../../../db/schema";
import { getAuthorizedAdminUser } from "../../chatgpt-auth";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]); const maxBytes = 8 * 1024 * 1024;
async function auth() { const user = await getAuthorizedAdminUser(); return user ? { user } : { response: Response.json({ error: "Acesso não autorizado" }, { status: 403 }) }; }
function bucket() { if (!env.FILES) throw new Error("Armazenamento de fotos indisponível"); return env.FILES; }

export async function GET(request: Request) {
  const session = await auth(); if ("response" in session) return session.response;
  const url = new URL(request.url); const photoId = url.searchParams.get("photoId"); const db = getDb();
  if (photoId) {
    const [photo] = await db.select().from(servicePhotos).where(eq(servicePhotos.id, photoId)).limit(1); if (!photo) return Response.json({ error: "Foto não encontrada" }, { status: 404 });
    const object = await bucket().get(photo.objectKey); if (!object) return Response.json({ error: "Arquivo não encontrado" }, { status: 404 });
    return new Response(object.body, { headers: { "Content-Type": photo.contentType, "Content-Disposition": `inline; filename="${photo.fileName.replace(/[\"\r\n]/g, "-")}"`, "Cache-Control": "private, no-store" } });
  }
  const orderId = url.searchParams.get("orderId"); if (!orderId) return Response.json({ error: "Ordem de serviço não informada" }, { status: 400 });
  const photos = await db.select({ id: servicePhotos.id, orderId: servicePhotos.orderId, fileName: servicePhotos.fileName, contentType: servicePhotos.contentType, sizeBytes: servicePhotos.sizeBytes, caption: servicePhotos.caption, uploadedBy: servicePhotos.uploadedBy, createdAt: servicePhotos.createdAt }).from(servicePhotos).where(eq(servicePhotos.orderId, orderId)).orderBy(desc(servicePhotos.createdAt));
  return Response.json({ photos });
}

export async function POST(request: Request) {
  const session = await auth(); if ("response" in session) return session.response;
  try {
    const form = await request.formData(); const orderId = String(form.get("orderId") ?? ""); const caption = String(form.get("caption") ?? "").trim();
    const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    if (!orderId || !files.length) return Response.json({ error: "Selecione ao menos uma foto" }, { status: 400 });
    if (files.some((file) => !allowed.has(file.type) || file.size > maxBytes)) return Response.json({ error: "Use JPG, PNG ou WEBP, com até 8 MB por foto" }, { status: 400 });
    const db = getDb(); const [order] = await db.select().from(workOrders).where(and(eq(workOrders.id, orderId), isNull(workOrders.deletedAt))).limit(1); if (!order) return Response.json({ error: "Ordem de serviço não encontrada" }, { status: 404 });
    const [{ value: existing }] = await db.select({ value: count() }).from(servicePhotos).where(eq(servicePhotos.orderId, orderId));
    if (existing + files.length > 10) return Response.json({ error: `Limite de 10 fotos. Esta OS já possui ${existing}.` }, { status: 400 });
    const created = [];
    for (const file of files) {
      const id = crypto.randomUUID(); const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-"); const objectKey = `service-orders/${orderId}/${id}-${safeName}`;
      await bucket().put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
      const [photo] = await db.insert(servicePhotos).values({ id, orderId, objectKey, fileName: file.name, contentType: file.type, sizeBytes: file.size, caption, uploadedBy: session.user!.fullName || session.user!.email }).returning(); created.push(photo);
    }
    await db.insert(auditLogs).values({ id: crypto.randomUUID(), entityType: "orders", entityId: orderId, action: "Upload de fotos", description: `${files.length} foto(s) anexada(s) à OS ${order.number}`, actorName: session.user!.fullName || session.user!.email, afterJson: JSON.stringify(created.map(({ objectKey: _hidden, ...photo }) => photo)) });
    return Response.json({ photos: created.map(({ objectKey: _hidden, ...photo }) => photo) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha no upload" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const session = await auth(); if ("response" in session) return session.response;
  const { photoId } = await request.json() as { photoId?: string }; if (!photoId) return Response.json({ error: "Foto não identificada" }, { status: 400 });
  const db = getDb(); const [photo] = await db.select().from(servicePhotos).where(eq(servicePhotos.id, photoId)).limit(1); if (!photo) return Response.json({ error: "Foto não encontrada" }, { status: 404 });
  await bucket().delete(photo.objectKey); await db.delete(servicePhotos).where(eq(servicePhotos.id, photoId));
  await db.insert(auditLogs).values({ id: crypto.randomUUID(), entityType: "orders", entityId: photo.orderId, action: "Exclusão de foto", description: `Foto ${photo.fileName} removida da ordem de serviço`, actorName: session.user!.fullName || session.user!.email, beforeJson: JSON.stringify({ ...photo, objectKey: undefined }) });
  return Response.json({ ok: true });
}
