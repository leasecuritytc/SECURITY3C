type DocumentRecord = Record<string, unknown>;

export type DocumentSummaryReport = {
  generatedBy: string;
  customers: number; quotes: number; contracts: number; orders: number; catalog: number; finance: number;
  installation: number; maintenance: number; receivedCents: number; openCents: number;
};

type Block =
  | { type: "info"; items: Array<[string, string]> }
  | { type: "section"; label: string; value: string }
  | { type: "callout"; label: string; value: string };

const encoder = new TextEncoder();
const text = (value: unknown, fallback = "Não informado") => String(value ?? "").trim() || fallback;
const money = (cents: unknown) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
const date = (value: unknown) => {
  const raw = String(value ?? ""); if (!raw) return "Não informado";
  const parsed = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw);
  return Number.isNaN(parsed.getTime()) ? raw : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", ...(raw.includes("T") ? { timeStyle: "short" } : {}) }).format(parsed);
};
const issuedAt = () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
const xml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function paragraph(value: string, options: { bold?: boolean; color?: string; size?: number; spacingBefore?: number; spacingAfter?: number; align?: string } = {}) {
  const { bold = false, color = "1A2115", size = 20, spacingBefore = 0, spacingAfter = 120, align = "left" } = options;
  const lines = value.replace(/\r/g, "").split("\n");
  return lines.map((line) => `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xml(line || " ")}</w:t></w:r></w:p>`).join("");
}

function infoTable(items: Array<[string, string]>) {
  const rows: string[] = [];
  for (let index = 0; index < items.length; index += 2) {
    const pair = items.slice(index, index + 2);
    while (pair.length < 2) pair.push(["", ""]);
    rows.push(`<w:tr>${pair.map(([label, value]) => `<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:shd w:fill="F7F8F3"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="150" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="150" w:type="dxa"/></w:tcMar></w:tcPr>${paragraph(label.toUpperCase(), { bold: true, color: "536127", size: 14, spacingAfter: 45 })}${paragraph(value, { size: 19, spacingAfter: 0 })}</w:tc>`).join("")}</w:tr>`);
  }
  return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="5" w:color="D9DDD1"/><w:left w:val="single" w:sz="5" w:color="D9DDD1"/><w:bottom w:val="single" w:sz="5" w:color="D9DDD1"/><w:right w:val="single" w:sz="5" w:color="D9DDD1"/><w:insideH w:val="single" w:sz="5" w:color="D9DDD1"/><w:insideV w:val="single" w:sz="5" w:color="D9DDD1"/></w:tblBorders><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>${rows.join("")}</w:tbl>${paragraph("", { spacingAfter: 80 })}`;
}

function section(label: string, value: string) {
  return `${paragraph(label.toUpperCase(), { bold: true, color: "536127", size: 15, spacingBefore: 150, spacingAfter: 60 })}${paragraph(value, { size: 20, spacingAfter: 120 })}`;
}

function callout(label: string, value: string) {
  return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" w:color="D2A536"/><w:left w:val="single" w:sz="8" w:color="D2A536"/><w:bottom w:val="single" w:sz="8" w:color="D2A536"/><w:right w:val="single" w:sz="8" w:color="D2A536"/></w:tblBorders></w:tblPr><w:tr><w:tc><w:tcPr><w:shd w:fill="F8F0DA"/><w:tcMar><w:top w:w="160" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="160" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>${paragraph(label.toUpperCase(), { bold: true, color: "536127", size: 15, spacingAfter: 55 })}${paragraph(value, { bold: true, color: "1A2115", size: 27, spacingAfter: 0 })}</w:tc></w:tr></w:tbl>${paragraph("", { spacingAfter: 80 })}`;
}

function buildBody(title: string, number: string, blocks: Block[]) {
  return `${paragraph(title, { bold: true, color: "11180D", size: 32, spacingBefore: 130, spacingAfter: 45 })}${paragraph(`${number}  •  EMISSÃO ${issuedAt()}`, { bold: true, color: "65702F", size: 15, spacingAfter: 180 })}${blocks.map((block) => block.type === "info" ? infoTable(block.items) : block.type === "callout" ? callout(block.label, block.value) : section(block.label, block.value)).join("")}`;
}

function headerXml(withLogo: boolean) {
  const logo = withLogo ? `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="548640" cy="685800"/><wp:docPr id="1" name="Logo Security3C" descr="Logo oficial Security3C"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="securitytc-logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="548640" cy="685800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>` : paragraph("S3C", { bold: true, color: "D2A536", size: 26, align: "center", spacingAfter: 0 });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:bottom w:val="single" w:sz="22" w:color="D2A536"/></w:tblBorders></w:tblPr><w:tr><w:tc><w:tcPr><w:tcW w:w="1250" w:type="dxa"/><w:shd w:fill="07180F"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar></w:tcPr>${logo}</w:tc><w:tc><w:tcPr><w:tcW w:w="7750" w:type="dxa"/><w:shd w:fill="07180F"/><w:tcMar><w:top w:w="150" w:type="dxa"/><w:left w:w="190" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="190" w:type="dxa"/></w:tcMar></w:tcPr>${paragraph("SECURITY3C", { bold: true, color: "FFFFFF", size: 29, spacingAfter: 30 })}${paragraph("SOLUÇÕES INTELIGENTES", { bold: true, color: "D2A536", size: 15, spacingAfter: 20 })}${paragraph("Segurança eletrônica • Automação • Tecnologia", { color: "DDE2D5", size: 14, spacingAfter: 0 })}</w:tc></w:tr></w:tbl></w:hdr>`;
}

function footerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" w:color="D2A536"/></w:tblBorders></w:tblPr><w:tr><w:tc><w:tcPr><w:tcW w:w="7200" w:type="dxa"/></w:tcPr>${paragraph("www.security3c.com.br  •  @Security3C  •  Documento gerado pela plataforma de gestão", { color: "697064", size: 13, spacingBefore: 70, spacingAfter: 0 })}</w:tc><w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="70" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="536127"/><w:sz w:val="13"/></w:rPr><w:t>Página </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:b/><w:color w:val="536127"/><w:sz w:val="13"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:tc></w:tr></w:tbl></w:ftr>`;
}

function documentXml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rId1"/><w:footerReference w:type="default" r:id="rId2"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1680" w:right="1134" w:bottom="1200" w:left="1134" w:header="300" w:footer="420" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Aptos" w:cs="Aptos"/><w:color w:val="1A2115"/><w:sz w:val="20"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
}

function contentTypes(withLogo: boolean) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${withLogo ? '<Default Extension="png" ContentType="image/png"/>' : ""}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
}

function buildDocx(title: string, number: string, blocks: Block[], logoBytes?: Uint8Array) {
  const withLogo = Boolean(logoBytes?.length);
  const files: Array<[string, Uint8Array]> = [
    ["[Content_Types].xml", encoder.encode(contentTypes(withLogo))],
    ["_rels/.rels", encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`)],
    ["word/document.xml", encoder.encode(documentXml(buildBody(title, number, blocks)))],
    ["word/styles.xml", encoder.encode(stylesXml())],
    ["word/_rels/document.xml.rels", encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)],
    ["word/header1.xml", encoder.encode(headerXml(withLogo))],
    ["word/footer1.xml", encoder.encode(footerXml())],
    ["docProps/core.xml", encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(title)}</dc:title><dc:creator>Security3C Soluções Inteligentes</dc:creator><dc:subject>${xml(number)}</dc:subject><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`)],
    ["docProps/app.xml", encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Security3C Gestão</Application><Company>Security3C Soluções Inteligentes</Company></Properties>`)],
  ];
  if (withLogo) {
    files.push(["word/_rels/header1.xml.rels", encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/securitytc-logo.png"/></Relationships>`)]);
    files.push(["word/media/securitytc-logo.png", logoBytes!]);
  }
  return zip(files);
}

export function buildDocumentDocx(kind: "quotes" | "contracts" | "orders", record: DocumentRecord, photoCount = 0, logoBytes?: Uint8Array) {
  const title = kind === "quotes" ? "PROPOSTA COMERCIAL / ORÇAMENTO" : kind === "contracts" ? "CONTRATO DE PRESTAÇÃO DE SERVIÇOS" : "ORDEM DE SERVIÇO";
  const number = text(record.number);
  const blocks: Block[] = [{ type: "info", items: [["Cliente", text(record.customerName)], ["Atendimento", `${text(record.serviceMode)} • ${text(record.serviceType)}`]] }];
  if (kind === "quotes") blocks.push(
    { type: "section", label: "Escopo da proposta", value: text(record.description) },
    { type: "info", items: [["Validade", date(record.validUntil)], ["Situação", text(record.status)]] },
    { type: "callout", label: "Investimento total", value: money(record.totalCents) },
    { type: "section", label: "Nota documental", value: "Este documento reproduz os dados cadastrados na plataforma. Materiais, prazos e condições adicionais devem ser formalizados antes da aprovação." },
  );
  else if (kind === "contracts") {
    blocks.push(
      { type: "info", items: [["Início da vigência", date(record.startDate)], ["Fim da vigência", date(record.endDate)], ["Situação", text(record.status)], ["Multa de rescisão cadastrada", `${Number(record.terminationPenaltyPercent || 0)}%`]] },
      { type: "callout", label: "Valor contratado", value: money(record.totalCents) },
      { type: "section", label: "Condições de pagamento", value: text(record.paymentTerms) },
      { type: "section", label: "Garantias", value: text(record.warrantyTerms) },
      { type: "section", label: "Cláusulas contratuais", value: text(record.clauses) },
      { type: "section", label: "Observações", value: text(record.notes) },
    );
    blocks.push(text(record.signedAt, "") ? { type: "section", label: "Aceite eletrônico", value: `Aceito por ${text(record.signerName)}, documento ${text(record.signerDocument)}, e-mail ${text(record.signerEmail)}, em ${date(record.signedAt)}.\nHash de integridade: ${text(record.signatureHash)}` } : { type: "section", label: "Assinatura", value: "Contrato ainda não assinado eletronicamente na plataforma." });
  } else blocks.push(
    { type: "info", items: [["Agendamento", date(record.scheduledAt)], ["Técnico responsável", text(record.technician)], ["Situação", text(record.status)], ["Fotos anexadas", `${photoCount} de 10`]] },
    { type: "section", label: "Problema informado / serviço solicitado", value: text(record.issue) },
    { type: "section", label: "Problema detectado / serviço executado", value: text(record.diagnosis) },
    { type: "section", label: "Materiais e acessórios utilizados ou substituídos", value: text(record.materials) },
    { type: "section", label: "Garantia informada", value: text(record.warranty) },
  );
  return buildDocx(title, number, blocks, logoBytes);
}

export function buildFinanceReceiptDocx(record: DocumentRecord, logoBytes?: Uint8Array) {
  return buildDocx("RECIBO DE PAGAMENTO", text(record.receiptNumber), [
    { type: "info", items: [["Cliente", text(record.customerName)], ["CPF / CNPJ", text(record.customerDocument)], ["Data do recebimento", date(record.paidAt || record.dueDate)], ["Forma de pagamento", text(record.paymentMethod)]] },
    { type: "callout", label: "Valor recebido", value: money(record.amountCents) },
    { type: "section", label: "Referente a", value: text(record.reference) },
    { type: "section", label: "Categoria", value: text(record.category) },
    { type: "section", label: "Observações", value: text(record.notes) },
    { type: "section", label: "Informação documental", value: "Este recibo comprova o recebimento registrado na plataforma e não substitui documento fiscal quando sua emissão for exigida pela legislação aplicável." },
  ], logoBytes);
}

export function buildSummaryReportDocx(report: DocumentSummaryReport, logoBytes?: Uint8Array) {
  return buildDocx("RELATÓRIO GERENCIAL", `Consolidado • ${issuedAt()}`, [
    { type: "info", items: [["Clientes", String(report.customers)], ["Orçamentos", String(report.quotes)], ["Contratos", String(report.contracts)], ["Ordens de serviço", String(report.orders)], ["Itens de catálogo", String(report.catalog)], ["Lançamentos financeiros", String(report.finance)]] },
    { type: "section", label: "Classificação dos atendimentos", value: `Instalação: ${report.installation}\nManutenção: ${report.maintenance}` },
    { type: "callout", label: "Valores recebidos", value: money(report.receivedCents) },
    { type: "callout", label: "Valores em aberto", value: money(report.openCents) },
    { type: "section", label: "Critério", value: "Indicadores calculados exclusivamente a partir dos registros ativos cadastrados na plataforma, sem projeções ou valores fictícios." },
    { type: "section", label: "Gerado por", value: report.generatedBy },
  ], logoBytes);
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(view: DataView, offset: number, value: number) { view.setUint16(offset, value, true); }
function u32(view: DataView, offset: number, value: number) { view.setUint32(offset, value >>> 0, true); }
function concat(parts: Uint8Array[]) { const size = parts.reduce((sum, part) => sum + part.length, 0); const output = new Uint8Array(size); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; }
function zip(files: Array<[string, Uint8Array]>) {
  const locals: Uint8Array[] = []; const centrals: Uint8Array[] = []; let offset = 0;
  for (const [name, data] of files) {
    const nameBytes = encoder.encode(name); const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length); const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0); u16(lv, 8, 0); u16(lv, 10, 0); u16(lv, 12, 0); u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length); u16(lv, 26, nameBytes.length); u16(lv, 28, 0); local.set(nameBytes, 30);
    locals.push(local, data);
    const central = new Uint8Array(46 + nameBytes.length); const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0); u16(cv, 10, 0); u16(cv, 12, 0); u16(cv, 14, 0); u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length); u16(cv, 28, nameBytes.length); u16(cv, 30, 0); u16(cv, 32, 0); u16(cv, 34, 0); u16(cv, 36, 0); u32(cv, 38, 0); u32(cv, 42, offset); central.set(nameBytes, 46); centrals.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0); const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0); u16(ev, 8, files.length); u16(ev, 10, files.length); u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0);
  return concat([...locals, ...centrals, end]);
}
