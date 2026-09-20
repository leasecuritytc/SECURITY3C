import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PdfRecord = Record<string, unknown>;
const olive = rgb(0.27, 0.34, 0.12);
const gold = rgb(0.82, 0.65, 0.26);
const ink = rgb(0.10, 0.12, 0.07);
const muted = rgb(0.38, 0.40, 0.34);
const text = (value: unknown, fallback = "Não informado") => String(value ?? "").trim() || fallback;
const money = (cents: unknown) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
const date = (value: unknown) => {
  const raw = String(value ?? ""); if (!raw) return "Não informado";
  const parsed = new Date(raw.length === 10 ? `${raw}T12:00:00Z` : raw);
  return Number.isNaN(parsed.getTime()) ? raw : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", ...(raw.includes("T") ? { timeStyle: "short" } : {}) }).format(parsed);
};

function wrap(value: string, max = 88) {
  const paragraphs = value.replace(/\r/g, "").split("\n"); const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > max && current) { lines.push(current); current = word; } else current = next;
    }
    if (current) lines.push(current);
  }
  return lines;
}

export async function buildDocumentPdf(kind: "quotes" | "contracts" | "orders", record: PdfRecord, photoCount = 0) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]); let y = 790;
  const addPage = () => { page = pdf.addPage([595.28, 841.89]); y = 800; };
  const line = (value: string, size = 10, strong = false, color = ink, indent = 0) => {
    for (const part of wrap(value, indent ? 78 : 88)) {
      if (y < 58) addPage();
      if (part) page.drawText(part, { x: 48 + indent, y, size, font: strong ? bold : regular, color });
      y -= size + 4;
    }
  };
  const section = (title: string, value: unknown) => { y -= 5; line(title.toUpperCase(), 8, true, olive); line(text(value), 10); };
  page.drawRectangle({ x: 0, y: 805, width: 595.28, height: 36.89, color: olive });
  page.drawRectangle({ x: 0, y: 800, width: 595.28, height: 5, color: gold });
  page.drawText("SECURITYTC", { x: 48, y: 817, size: 16, font: bold, color: rgb(1,1,1) });
  page.drawText("SOLUÇÕES INTELIGENTES", { x: 165, y: 819, size: 8, font: bold, color: gold });
  const title = kind === "quotes" ? "PROPOSTA / ORÇAMENTO" : kind === "contracts" ? "CONTRATO DE PRESTAÇÃO DE SERVIÇOS" : "ORDEM DE SERVIÇO";
  y = 766; line(title, 17, true, ink); line(`${text(record.number)}  •  Emitido em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date())}`, 9, false, muted);
  section("Cliente", record.customerName); section("Atendimento", `${text(record.serviceMode)} — ${text(record.serviceType)}`);
  if (kind === "quotes") {
    section("Escopo", record.description); section("Validade", date(record.validUntil)); section("Situação", record.status); section("Valor total", money(record.totalCents));
    section("Observação", "Este documento reproduz exclusivamente os dados cadastrados na plataforma. Materiais, prazos e condições não descritos devem ser formalizados antes da aprovação.");
  } else if (kind === "contracts") {
    section("Vigência", `${date(record.startDate)} a ${date(record.endDate)}`); section("Valor contratado", money(record.totalCents)); section("Condições de pagamento", record.paymentTerms); section("Garantia", record.warrantyTerms);
    section("Multa de rescisão cadastrada", `${Number(record.terminationPenaltyPercent || 0)}%`); section("Cláusulas contratuais", record.clauses); section("Observações", record.notes);
    if (text(record.signedAt, "")) {
      section("Aceite eletrônico simples", `Aceito por ${text(record.signerName)}, documento ${text(record.signerDocument)}, e-mail ${text(record.signerEmail)}, em ${date(record.signedAt)}.`);
      section("Hash de integridade", record.signatureHash);
    } else section("Assinatura", "Contrato ainda não assinado eletronicamente na plataforma.");
  } else {
    section("Solicitação / problema informado", record.issue); section("Diagnóstico / serviço executado", record.diagnosis); section("Materiais e acessórios utilizados ou substituídos", record.materials);
    section("Garantia informada", record.warranty); section("Agendamento", date(record.scheduledAt)); section("Técnico responsável", record.technician); section("Situação", record.status); section("Fotos anexadas", `${photoCount} de 10`);
  }
  for (const current of pdf.getPages()) {
    current.drawLine({ start: { x: 48, y: 34 }, end: { x: 547, y: 34 }, thickness: 0.5, color: rgb(.82,.83,.78) });
    current.drawText("Documento gerado automaticamente pela plataforma SecurityTC.", { x: 48, y: 20, size: 7, font: regular, color: muted });
  }
  return pdf.save();
}
