import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage, type PDFFont } from "pdf-lib";

type PdfRecord = Record<string, unknown>;
export type SummaryReport = {
  generatedBy: string;
  customers: number; quotes: number; contracts: number; orders: number; catalog: number; finance: number;
  installation: number; maintenance: number; receivedCents: number; openCents: number;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const olive = rgb(0.20, 0.27, 0.11);
const deepGreen = rgb(0.04, 0.13, 0.09);
const gold = rgb(0.82, 0.64, 0.22);
const paleGold = rgb(0.97, 0.94, 0.84);
const ink = rgb(0.10, 0.12, 0.08);
const muted = rgb(0.38, 0.42, 0.35);
const border = rgb(0.84, 0.86, 0.80);
const text = (value: unknown, fallback = "Não informado") => String(value ?? "").trim() || fallback;
const money = (cents: unknown) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
const date = (value: unknown) => {
  const raw = String(value ?? ""); if (!raw) return "Não informado";
  const parsed = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw);
  return Number.isNaN(parsed.getTime()) ? raw : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", ...(raw.includes("T") ? { timeStyle: "short" } : {}) }).format(parsed);
};
const issuedAt = () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());

function wrapByWidth(value: string, font: PDFFont, size: number, maxWidth: number) {
  const output: string[] = [];
  for (const paragraph of value.replace(/\r/g, "").split("\n")) {
    if (!paragraph.trim()) { output.push(""); continue; }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) > maxWidth) { output.push(line); line = word; }
      else line = next;
    }
    if (line) output.push(line);
  }
  return output;
}

async function makeComposer(logoBytes?: Uint8Array) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let logo: PDFImage | undefined;
  if (logoBytes?.length) { try { logo = await pdf.embedPng(logoBytes); } catch { logo = undefined; } }
  let page: PDFPage;
  let y = 0;
  const pages: PDFPage[] = [];

  function header(documentTitle: string, documentNumber: string) {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 98, width: PAGE_WIDTH, height: 98, color: deepGreen });
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 103, width: PAGE_WIDTH, height: 5, color: gold });
    if (logo) {
      const scale = Math.min(58 / logo.height, 46 / logo.width);
      page.drawImage(logo, { x: MARGIN, y: PAGE_HEIGHT - 82, width: logo.width * scale, height: logo.height * scale });
    }
    const brandX = logo ? 108 : MARGIN;
    page.drawText("SECURITY3C", { x: brandX, y: PAGE_HEIGHT - 38, size: 17, font: bold, color: rgb(1, 1, 1) });
    page.drawText("SOLUÇÕES INTELIGENTES", { x: brandX, y: PAGE_HEIGHT - 56, size: 8, font: bold, color: gold });
    page.drawText("Segurança eletrônica • Automação • Tecnologia", { x: brandX, y: PAGE_HEIGHT - 73, size: 7, font: regular, color: rgb(.84, .87, .80) });
    page.drawText("WWW.SECURITY3C.COM.BR", { x: 414, y: PAGE_HEIGHT - 40, size: 6.8, font: bold, color: gold });
    page.drawText("@SECURITY3C", { x: 466, y: PAGE_HEIGHT - 57, size: 6.8, font: regular, color: rgb(.84, .87, .80) });
    page.drawText(documentTitle, { x: MARGIN, y: PAGE_HEIGHT - 139, size: 16, font: bold, color: ink });
    page.drawText(documentNumber, { x: MARGIN, y: PAGE_HEIGHT - 157, size: 8.5, font: regular, color: muted });
    page.drawText(`EMISSÃO  ${issuedAt()}`, { x: 405, y: PAGE_HEIGHT - 154, size: 7.5, font: bold, color: olive });
    page.drawLine({ start: { x: MARGIN, y: PAGE_HEIGHT - 169 }, end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 169 }, thickness: 0.8, color: border });
    y = PAGE_HEIGHT - 193;
  }
  function addPage(documentTitle: string, documentNumber: string) { page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]); pages.push(page); header(documentTitle, documentNumber); }
  function ensure(height: number, documentTitle: string, documentNumber: string) { if (y - height < 56) addPage(documentTitle, documentNumber); }
  function paragraph(value: string, size: number, font: PDFFont, color = ink, indent = 0, documentTitle = "", documentNumber = "") {
    const lines = wrapByWidth(value, font, size, PAGE_WIDTH - MARGIN * 2 - indent);
    for (const line of lines) { ensure(size + 6, documentTitle, documentNumber); if (line) page.drawText(line, { x: MARGIN + indent, y, size, font, color }); y -= size + 5; }
  }
  function section(label: string, value: unknown, documentTitle: string, documentNumber: string) {
    ensure(55, documentTitle, documentNumber); y -= 7;
    page.drawText(label.toUpperCase(), { x: MARGIN, y, size: 7.5, font: bold, color: olive }); y -= 15;
    paragraph(text(value), 9.5, regular, ink, 0, documentTitle, documentNumber); y -= 6;
  }
  function infoGrid(items: Array<[string, string]>, documentTitle: string, documentNumber: string) {
    const columns = 2; const gap = 12; const width = (PAGE_WIDTH - MARGIN * 2 - gap) / columns; const rowHeight = 54;
    for (let index = 0; index < items.length; index += columns) {
      ensure(rowHeight + 8, documentTitle, documentNumber);
      items.slice(index, index + columns).forEach(([label, value], offset) => {
        const x = MARGIN + offset * (width + gap);
        page.drawRectangle({ x, y: y - rowHeight + 10, width, height: rowHeight, color: rgb(0.975, 0.978, 0.96), borderColor: border, borderWidth: 0.6 });
        page.drawText(label.toUpperCase(), { x: x + 12, y: y - 8, size: 7, font: bold, color: olive });
        const display = wrapByWidth(value, regular, 9.2, width - 24).slice(0, 2);
        display.forEach((line, lineIndex) => page.drawText(line, { x: x + 12, y: y - 25 - lineIndex * 12, size: 9.2, font: regular, color: ink }));
      });
      y -= rowHeight + 8;
    }
  }
  function callout(label: string, value: string, documentTitle: string, documentNumber: string) {
    ensure(70, documentTitle, documentNumber);
    page.drawRectangle({ x: MARGIN, y: y - 52, width: PAGE_WIDTH - MARGIN * 2, height: 58, color: paleGold, borderColor: gold, borderWidth: 0.7 });
    page.drawText(label.toUpperCase(), { x: MARGIN + 14, y: y - 12, size: 7.5, font: bold, color: olive });
    const lines = wrapByWidth(value, bold, 12, PAGE_WIDTH - MARGIN * 2 - 28).slice(0, 2);
    lines.forEach((line, index) => page.drawText(line, { x: MARGIN + 14, y: y - 31 - index * 14, size: 12, font: bold, color: ink }));
    y -= 70;
  }
  function finish() {
    pages.forEach((current, index) => {
      current.drawLine({ start: { x: MARGIN, y: 36 }, end: { x: PAGE_WIDTH - MARGIN, y: 36 }, thickness: 0.6, color: border });
      current.drawText("Security3C Soluções Inteligentes • www.security3c.com.br • @Security3C", { x: MARGIN, y: 21, size: 6.8, font: regular, color: muted });
      current.drawText(`Página ${index + 1} de ${pages.length}`, { x: 495, y: 21, size: 6.8, font: bold, color: muted });
    });
    return pdf.save();
  }
  return { addPage, section, infoGrid, callout, finish };
}

export async function buildDocumentPdf(kind: "quotes" | "contracts" | "orders", record: PdfRecord, photoCount = 0, logoBytes?: Uint8Array) {
  const title = kind === "quotes" ? "PROPOSTA COMERCIAL / ORÇAMENTO" : kind === "contracts" ? "CONTRATO DE PRESTAÇÃO DE SERVIÇOS" : "ORDEM DE SERVIÇO";
  const number = text(record.number);
  const doc = await makeComposer(logoBytes); doc.addPage(title, number);
  doc.infoGrid([["Cliente", text(record.customerName)], ["Atendimento", `${text(record.serviceMode)} • ${text(record.serviceType)}`]], title, number);
  if (kind === "quotes") {
    doc.section("Escopo da proposta", record.description, title, number);
    doc.infoGrid([["Validade", date(record.validUntil)], ["Situação", text(record.status)]], title, number);
    doc.callout("Investimento total", money(record.totalCents), title, number);
    doc.section("Nota documental", "Este documento reproduz os dados cadastrados na plataforma. Materiais, prazos e condições adicionais devem ser formalizados antes da aprovação.", title, number);
  } else if (kind === "contracts") {
    doc.infoGrid([["Início da vigência", date(record.startDate)], ["Fim da vigência", date(record.endDate)], ["Situação", text(record.status)], ["Multa de rescisão cadastrada", `${Number(record.terminationPenaltyPercent || 0)}%`]], title, number);
    doc.callout("Valor contratado", money(record.totalCents), title, number);
    doc.section("Condições de pagamento", record.paymentTerms, title, number); doc.section("Garantias", record.warrantyTerms, title, number);
    doc.section("Cláusulas contratuais", record.clauses, title, number); doc.section("Observações", record.notes, title, number);
    if (text(record.signedAt, "")) {
      doc.section("Aceite eletrônico", `Aceito por ${text(record.signerName)}, documento ${text(record.signerDocument)}, e-mail ${text(record.signerEmail)}, em ${date(record.signedAt)}.`, title, number);
      doc.section("Hash de integridade", record.signatureHash, title, number);
    } else doc.section("Assinatura", "Contrato ainda não assinado eletronicamente na plataforma.", title, number);
  } else {
    doc.infoGrid([["Agendamento", date(record.scheduledAt)], ["Técnico responsável", text(record.technician)], ["Situação", text(record.status)], ["Fotos anexadas", `${photoCount} de 10`]], title, number);
    doc.section("Problema informado / serviço solicitado", record.issue, title, number); doc.section("Problema detectado / serviço executado", record.diagnosis, title, number);
    doc.section("Materiais e acessórios utilizados ou substituídos", record.materials, title, number); doc.section("Garantia informada", record.warranty, title, number);
  }
  return doc.finish();
}

export async function buildFinanceReceiptPdf(record: PdfRecord, logoBytes?: Uint8Array) {
  const title = "RECIBO DE PAGAMENTO";
  const number = text(record.receiptNumber);
  const doc = await makeComposer(logoBytes); doc.addPage(title, number);
  doc.infoGrid([
    ["Cliente", text(record.customerName)],
    ["CPF / CNPJ", text(record.customerDocument)],
    ["Data do recebimento", date(record.paidAt || record.dueDate)],
    ["Forma de pagamento", text(record.paymentMethod)],
  ], title, number);
  doc.callout("Valor recebido", money(record.amountCents), title, number);
  doc.section("Referente a", record.reference, title, number);
  doc.section("Categoria", record.category, title, number);
  doc.section("Observações", record.notes, title, number);
  doc.section("Informação documental", "Este recibo comprova o recebimento registrado na plataforma e não substitui documento fiscal quando sua emissão for exigida pela legislação aplicável.", title, number);
  return doc.finish();
}

export async function buildSummaryReportPdf(report: SummaryReport, logoBytes?: Uint8Array) {
  const title = "RELATÓRIO GERENCIAL"; const number = `Consolidado • ${issuedAt()}`;
  const doc = await makeComposer(logoBytes); doc.addPage(title, number);
  doc.infoGrid([["Clientes", String(report.customers)], ["Orçamentos", String(report.quotes)], ["Contratos", String(report.contracts)], ["Ordens de serviço", String(report.orders)], ["Itens de catálogo", String(report.catalog)], ["Lançamentos financeiros", String(report.finance)]], title, number);
  doc.section("Classificação dos atendimentos", `Instalação: ${report.installation}\nManutenção: ${report.maintenance}`, title, number);
  doc.callout("Valores recebidos", money(report.receivedCents), title, number);
  doc.callout("Valores em aberto", money(report.openCents), title, number);
  doc.section("Critério", "Indicadores calculados exclusivamente a partir dos registros ativos cadastrados na plataforma, sem projeções ou valores fictícios.", title, number);
  doc.section("Gerado por", report.generatedBy, title, number);
  return doc.finish();
}
