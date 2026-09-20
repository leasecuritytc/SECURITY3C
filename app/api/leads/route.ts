import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, customers, leadRateLimits } from "../../../db/schema";

const SERVICE_TYPES = new Set([
  "Automação residencial", "Alarmes monitorados", "Câmeras de segurança / CFTV", "Controle de acesso",
  "Concertinas", "Cercas elétricas", "Desenvolvimento de aplicações", "Interfonia e vídeo porteiro",
  "Motores automatizadores de portão", "Imagens de alta resolução com drone",
]);
const SERVICE_MODES = new Set(["Instalação", "Manutenção"]);
const RATE_LIMIT = 8;
const RATE_WINDOW_SECONDS = 60 * 60;
const clean = (value: unknown, limit: number) => String(value ?? "").trim().slice(0, limit);

async function rateLimitKey(request: Request) {
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = request.headers.get("cf-connecting-ip")?.trim() || forwardedIp || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 160) || "unknown";
  const data = new TextEncoder().encode(`security3c-lead-v1|${address}|${userAgent}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function exceedsRateLimit(request: Request) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const key = await rateLimitKey(request);
  const [state] = await db.insert(leadRateLimits).values({
    key,
    windowStartedAt: now,
    requestCount: 1,
  }).onConflictDoUpdate({
    target: leadRateLimits.key,
    set: {
      windowStartedAt: sql`CASE WHEN ${now} - ${leadRateLimits.windowStartedAt} >= ${RATE_WINDOW_SECONDS} THEN ${now} ELSE ${leadRateLimits.windowStartedAt} END`,
      requestCount: sql`CASE WHEN ${now} - ${leadRateLimits.windowStartedAt} >= ${RATE_WINDOW_SECONDS} THEN 1 ELSE ${leadRateLimits.requestCount} + 1 END`,
    },
  }).returning({ requestCount: leadRateLimits.requestCount });

  return (state?.requestCount ?? RATE_LIMIT + 1) > RATE_LIMIT;
}

function sqliteTimestamp(date: Date) {
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    if (clean(payload.website, 200)) return Response.json({ message: "Solicitação recebida." }, { status: 201 });

    if (await exceedsRateLimit(request)) {
      return Response.json(
        { error: "Muitas solicitações foram enviadas deste dispositivo. Aguarde antes de tentar novamente." },
        { status: 429, headers: { "Retry-After": String(RATE_WINDOW_SECONDS) } },
      );
    }

    const name = clean(payload.name, 120);
    const phone = clean(payload.phone, 30);
    const email = clean(payload.email, 160).toLowerCase();
    const city = clean(payload.city, 100);
    const serviceMode = clean(payload.serviceMode, 30);
    const serviceType = clean(payload.serviceType, 100);
    const message = clean(payload.message, 1200);
    const consent = payload.consent === true;

    if (!name || !phone || !consent || !SERVICE_MODES.has(serviceMode) || !SERVICE_TYPES.has(serviceType)) {
      return Response.json({ error: "Preencha nome, telefone, tipo de atendimento, serviço e autorização de contato." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Informe um e-mail válido ou deixe esse campo em branco." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const createdAt = sqliteTimestamp(new Date());
    const notes = [
      `Origem: formulário público do site`,
      `Atendimento: ${serviceMode}`,
      `Serviço: ${serviceType}`,
      message ? `Necessidade informada: ${message}` : "",
    ].filter(Boolean).join("\n");
    const db = getDb();
    const [record] = await db.insert(customers).values({
      id, name, personType: "Não informado", contactName: name, phone, email, city,
      notes, status: "Lead", createdAt, updatedAt: createdAt,
    }).returning();
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(), entityType: "customers", entityId: id, action: "Criação",
      description: "Lead captado pelo formulário público", actorName: "Site público",
      afterJson: JSON.stringify(record), createdAt,
    });

    return Response.json({ message: "Solicitação recebida. A equipe poderá entrar em contato pelos dados informados." }, { status: 201 });
  } catch (error) {
    console.error("Falha ao registrar lead público", error);
    return Response.json({ error: "Não foi possível registrar a solicitação agora. Tente novamente em instantes." }, { status: 500 });
  }
}
