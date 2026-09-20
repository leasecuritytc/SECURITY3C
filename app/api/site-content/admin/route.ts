import { env } from "cloudflare:workers";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { auditLogs, portfolioItems, siteContent } from "../../../../db/schema";
import { defaultLandingContent, parseLandingContent } from "../../../../lib/site-content-shared";
import { getAuthorizedAdminUser } from "../../../chatgpt-auth";

const allowedImages = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;
const clean = (value: unknown, max = 3000) => String(value ?? "").trim().slice(0, max);
const now = () => new Date().toISOString();

async function authorize() {
  const user = await getAuthorizedAdminUser();
  return user ? { user, actor: user.fullName || user.email } : { response: Response.json({ error: "Acesso não autorizado" }, { status: 403 }) };
}
function bucket() { if (!env.FILES) throw new Error("Armazenamento de imagens indisponível"); return env.FILES; }
function publicItem(item: typeof portfolioItems.$inferSelect) {
  const { imageObjectKey: _hidden, deletedAt: _deleted, ...safe } = item;
  return { ...safe, imageUrl: `/api/site-content/media?id=${encodeURIComponent(item.id)}` };
}
async function audit(entityId: string, action: string, description: string, actor: string, before?: unknown, after?: unknown) {
  await getDb().insert(auditLogs).values({ id: crypto.randomUUID(), entityType: "site-content", entityId, action, description, actorName: actor, beforeJson: before ? JSON.stringify(before) : "", afterJson: after ? JSON.stringify(after) : "" });
}

export async function GET() {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const db = getDb();
    const [contentRows, items] = await Promise.all([
      db.select().from(siteContent).where(eq(siteContent.id, "landing")).limit(1),
      db.select().from(portfolioItems).where(isNull(portfolioItems.deletedAt)).orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.updatedAt)),
    ]);
    let content = defaultLandingContent;
    if (contentRows[0]?.contentJson) {
      try { content = parseLandingContent(JSON.parse(contentRows[0].contentJson)); } catch { content = defaultLandingContent; }
    }
    return Response.json({ content, portfolio: items.map(publicItem) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar o conteúdo" }, { status: 500 }); }
}

export async function PUT(request: Request) {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const body = await request.json() as { content?: unknown };
    const content = parseLandingContent(body.content);
    const invalid = Object.values(content).some((value) => value.length > 700);
    if (invalid) return Response.json({ error: "Revise os textos: cada campo aceita até 700 caracteres" }, { status: 400 });
    const db = getDb();
    const [before] = await db.select().from(siteContent).where(eq(siteContent.id, "landing")).limit(1);
    const updatedAt = now();
    await db.insert(siteContent).values({ id: "landing", contentJson: JSON.stringify(content), updatedBy: auth.actor!, updatedAt }).onConflictDoUpdate({ target: siteContent.id, set: { contentJson: JSON.stringify(content), updatedBy: auth.actor!, updatedAt } });
    await audit("landing", before ? "Edição" : "Criação", "Textos da página pública atualizados", auth.actor!, before ? JSON.parse(before.contentJson) : undefined, content);
    return Response.json({ content, updatedAt });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao salvar o conteúdo" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const form = await request.formData();
    const id = clean(form.get("id"), 80);
    const title = clean(form.get("title"), 120);
    const serviceType = clean(form.get("serviceType"), 120);
    const serviceMode = clean(form.get("serviceMode"), 20);
    const city = clean(form.get("city"), 100);
    const completedAt = clean(form.get("completedAt"), 10);
    const summary = clean(form.get("summary"), 500);
    const altText = clean(form.get("altText"), 180);
    const status = clean(form.get("status"), 20);
    const sortOrder = Math.max(0, Math.min(9999, Number.parseInt(clean(form.get("sortOrder"), 8), 10) || 0));
    const featured = clean(form.get("featured"), 10) === "true";
    const fileValue = form.get("image");
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    if (!title || !serviceType || !["Instalação", "Manutenção"].includes(serviceMode) || !summary || !altText || !["Rascunho", "Publicado"].includes(status)) return Response.json({ error: "Preencha título, serviço, modalidade, descrição, texto alternativo e situação" }, { status: 400 });
    if (file && (!allowedImages.has(file.type) || file.size > maxImageBytes)) return Response.json({ error: "Use imagem JPG, PNG ou WEBP com até 8 MB" }, { status: 400 });
    const db = getDb();
    const [before] = id ? await db.select().from(portfolioItems).where(and(eq(portfolioItems.id, id), isNull(portfolioItems.deletedAt))).limit(1) : [];
    if (id && !before) return Response.json({ error: "Serviço realizado não encontrado" }, { status: 404 });
    if (!id && !file) return Response.json({ error: "Selecione uma foto real do serviço" }, { status: 400 });
    const itemId = id || crypto.randomUUID();
    let imageObjectKey = before?.imageObjectKey || "";
    let imageName = before?.imageName || "";
    let imageType = before?.imageType || "";
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const nextKey = `landing/portfolio/${itemId}/${crypto.randomUUID()}-${safeName}`;
      await bucket().put(nextKey, file.stream(), { httpMetadata: { contentType: file.type } });
      if (before?.imageObjectKey) await bucket().delete(before.imageObjectKey);
      imageObjectKey = nextKey; imageName = file.name; imageType = file.type;
    }
    const updatedAt = now();
    let saved: typeof portfolioItems.$inferSelect;
    if (before) {
      [saved] = await db.update(portfolioItems).set({ title, serviceType, serviceMode, city, completedAt, summary, imageObjectKey, imageName, imageType, altText, status, sortOrder, featured, updatedBy: auth.actor!, updatedAt }).where(eq(portfolioItems.id, itemId)).returning();
    } else {
      [saved] = await db.insert(portfolioItems).values({ id: itemId, title, serviceType, serviceMode, city, completedAt, summary, imageObjectKey, imageName, imageType, altText, status, sortOrder, featured, createdBy: auth.actor!, updatedBy: auth.actor!, updatedAt }).returning();
    }
    const safeSaved = publicItem(saved);
    await audit(itemId, before ? "Edição" : "Criação", `${before ? "Serviço realizado atualizado" : "Serviço realizado cadastrado"}: ${title}`, auth.actor!, before ? publicItem(before) : undefined, safeSaved);
    return Response.json({ item: safeSaved }, { status: before ? 200 : 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao salvar o serviço realizado" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const auth = await authorize(); if ("response" in auth) return auth.response;
  try {
    const { id } = await request.json() as { id?: string };
    if (!id) return Response.json({ error: "Registro não identificado" }, { status: 400 });
    const db = getDb();
    const [before] = await db.select().from(portfolioItems).where(and(eq(portfolioItems.id, id), isNull(portfolioItems.deletedAt))).limit(1);
    if (!before) return Response.json({ error: "Serviço realizado não encontrado" }, { status: 404 });
    await db.update(portfolioItems).set({ deletedAt: now(), updatedBy: auth.actor!, updatedAt: now() }).where(eq(portfolioItems.id, id));
    await bucket().delete(before.imageObjectKey);
    await audit(id, "Exclusão", `Serviço realizado removido: ${before.title}`, auth.actor!, publicItem(before));
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao excluir o serviço realizado" }, { status: 500 }); }
}
