import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { portfolioItems } from "../../../../db/schema";
import { getAuthorizedAdminUser } from "../../../chatgpt-auth";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Imagem não identificada" }, { status: 400 });
  const [item] = await getDb().select().from(portfolioItems).where(eq(portfolioItems.id, id)).limit(1);
  if (!item || item.deletedAt) return Response.json({ error: "Imagem não encontrada" }, { status: 404 });
  const isPublic = item.status === "Publicado";
  if (!isPublic && !(await getAuthorizedAdminUser())) return Response.json({ error: "Acesso não autorizado" }, { status: 403 });
  if (!env.FILES) return Response.json({ error: "Armazenamento indisponível" }, { status: 503 });
  const object = await env.FILES.get(item.imageObjectKey);
  if (!object) return Response.json({ error: "Arquivo não encontrado" }, { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": item.imageType, "Content-Disposition": `inline; filename="${item.imageName.replace(/["\r\n]/g, "-")}"`, "Cache-Control": isPublic ? "public, max-age=3600, stale-while-revalidate=86400" : "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
