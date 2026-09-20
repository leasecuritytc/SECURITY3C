"use client";

import * as React from "react";
import {
  BarChart3, Bell, Boxes, CircleDollarSign, ClipboardList, FileCheck2, FileText,
  Camera, Download, History, Images, LayoutDashboard, Menu, Pencil, PenLine, Plus, Search, ShieldCheck, Trash2, Upload, Users, Wrench, PanelsTopLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { buildContractClauses } from "@/lib/contract-clauses";
import { SiteContentManager } from "./site-content-manager";

type EntityKey = "customers" | "quotes" | "contracts" | "orders" | "catalog" | "finance";
type NavKey = "overview" | EntityKey | "portfolio" | "site-content" | "reports" | "audit";
type PortfolioFilter = { area?: string; serviceType?: string };
type Row = Record<string, unknown> & { id: string };
type AuditRow = Row & { entityType: string; entityId: string; action: string; description: string; actorName: string; createdAt: string };
type DataBundle = Record<EntityKey, Row[]> & { audit: AuditRow[] };
type FieldType = "text" | "email" | "date" | "datetime-local" | "number" | "textarea" | "select";
type Field = { name: string; label: string; type: FieldType; required?: boolean; span?: boolean; options?: string[]; placeholder?: string };
type Column = { key: string; label: string; kind?: "currency" | "status" | "mode" | "date" };
type ModuleConfig = { key: EntityKey; label: string; singular: string; title: string; description: string; icon: React.ElementType; fields: Field[]; columns: Column[] };

const serviceTypes = [
  "Automação residencial", "Alarmes monitorados", "Câmeras de segurança / CFTV", "Controle de acesso",
  "Concertinas", "Cercas elétricas", "Desenvolvimento de aplicações", "Interfonia e vídeo porteiro",
  "Motores automatizadores de portão", "Imagens de alta resolução com drone",
];
const serviceAreas = ["Residencial", "Condomínios", "Empresarial"];
const portfolioServiceLabels: Array<[string, string]> = [
  ["Automação", "Automação residencial"],
  ["Alarmes", "Alarmes monitorados"],
  ["CFTV", "Câmeras de segurança / CFTV"],
  ["Controle de acesso", "Controle de acesso"],
  ["Concertinas", "Concertinas"],
  ["Cercas elétricas", "Cercas elétricas"],
  ["Aplicações", "Desenvolvimento de aplicações"],
  ["Interfonia", "Interfonia e vídeo porteiro"],
  ["Portões automáticos", "Motores automatizadores de portão"],
  ["Drone", "Imagens de alta resolução com drone"],
];
const modes = ["Instalação", "Manutenção"];
const emptyData: DataBundle = { customers: [], quotes: [], contracts: [], orders: [], catalog: [], finance: [], audit: [] };

const modules: ModuleConfig[] = [
  {
    key: "customers", label: "Clientes", singular: "cliente", title: "Cadastro de clientes",
    description: "Dados cadastrais, contatos, endereços e observações para o histórico comercial e técnico.", icon: Users,
    fields: [
      { name: "name", label: "Nome ou razão social", type: "text", required: true, span: true },
      { name: "personType", label: "Tipo de pessoa", type: "select", required: true, options: ["Não informado", "Pessoa física", "Pessoa jurídica"] },
      { name: "document", label: "CPF ou CNPJ", type: "text" }, { name: "contactName", label: "Pessoa de contato", type: "text" },
      { name: "phone", label: "Telefone", type: "text" }, { name: "email", label: "E-mail", type: "email" },
      { name: "address", label: "Endereço", type: "text", span: true }, { name: "city", label: "Cidade/UF", type: "text" },
      { name: "status", label: "Situação", type: "select", options: ["Lead", "Ativo", "Inativo"] },
      { name: "notes", label: "Observações", type: "textarea", span: true },
    ],
    columns: [{ key: "name", label: "Cliente" }, { key: "personType", label: "Tipo" }, { key: "document", label: "Documento" }, { key: "phone", label: "Contato" }, { key: "city", label: "Cidade" }, { key: "status", label: "Situação", kind: "status" }],
  },
  {
    key: "quotes", label: "Orçamentos", singular: "orçamento", title: "Propostas e orçamentos",
    description: "Propostas separadas por instalação ou manutenção, com escopo, validade, valor e acompanhamento.", icon: FileText,
    fields: [
      { name: "customerName", label: "Cliente", type: "text", required: true, span: true },
      { name: "serviceMode", label: "Tipo de atendimento", type: "select", required: true, options: modes },
      { name: "serviceType", label: "Tipo de serviço", type: "select", required: true, options: serviceTypes },
      { name: "description", label: "Escopo da instalação ou solicitação de manutenção", type: "textarea", required: true, span: true },
      { name: "total", label: "Valor total", type: "number", required: true }, { name: "validUntil", label: "Validade da proposta", type: "date", required: true },
      { name: "status", label: "Situação", type: "select", options: ["Rascunho", "Enviado", "Em negociação", "Aprovado", "Recusado"] },
    ],
    columns: [{ key: "number", label: "Número" }, { key: "customerName", label: "Cliente" }, { key: "serviceMode", label: "Atendimento", kind: "mode" }, { key: "serviceType", label: "Serviço" }, { key: "validUntil", label: "Validade", kind: "date" }, { key: "status", label: "Situação", kind: "status" }, { key: "total", label: "Valor", kind: "currency" }],
  },
  {
    key: "contracts", label: "Contratos", singular: "contrato", title: "Contratos de prestação de serviços",
    description: "Controle contratual por instalação ou manutenção, com vigência, valor, situação e observações.", icon: FileCheck2,
    fields: [
      { name: "customerName", label: "Cliente", type: "text", required: true, span: true },
      { name: "serviceMode", label: "Tipo de atendimento", type: "select", required: true, options: modes },
      { name: "serviceType", label: "Tipo de serviço", type: "select", required: true, options: serviceTypes },
      { name: "startDate", label: "Início da vigência", type: "date", required: true }, { name: "endDate", label: "Fim da vigência", type: "date" },
      { name: "total", label: "Valor contratado", type: "number", required: true },
      { name: "paymentTerms", label: "Condições de pagamento", type: "textarea", required: true, span: true },
      { name: "warrantyTerms", label: "Condições de garantia", type: "textarea", required: true, span: true },
      { name: "terminationPenaltyPercent", label: "Multa por rescisão (%)", type: "number" },
      { name: "status", label: "Situação", type: "select", options: ["Rascunho", "Aguardando assinatura", "Assinado", "Ativo", "Suspenso", "Encerrado"] },
      { name: "clauses", label: "Cláusulas contratuais editáveis", type: "textarea", required: true, span: true },
      { name: "notes", label: "Condições e observações", type: "textarea", span: true },
    ],
    columns: [{ key: "number", label: "Número" }, { key: "customerName", label: "Cliente" }, { key: "serviceMode", label: "Atendimento", kind: "mode" }, { key: "serviceType", label: "Serviço" }, { key: "startDate", label: "Início", kind: "date" }, { key: "status", label: "Situação", kind: "status" }, { key: "total", label: "Valor", kind: "currency" }],
  },
  {
    key: "orders", label: "Ordens de serviço", singular: "ordem de serviço", title: "Ordens de serviço",
    description: "Execução técnica com solicitação, diagnóstico, materiais, garantia, responsável e agenda.", icon: ClipboardList,
    fields: [
      { name: "customerName", label: "Cliente", type: "text", required: true, span: true },
      { name: "serviceMode", label: "Tipo de atendimento", type: "select", required: true, options: modes },
      { name: "serviceType", label: "Tipo de serviço", type: "select", required: true, options: serviceTypes },
      { name: "issue", label: "Problema informado ou serviço solicitado", type: "textarea", required: true, span: true },
      { name: "diagnosis", label: "Problema detectado ou solução executada", type: "textarea", span: true },
      { name: "materials", label: "Materiais e acessórios utilizados/substituídos", type: "textarea", span: true },
      { name: "warranty", label: "Garantia informada", type: "text" }, { name: "scheduledAt", label: "Data e horário", type: "datetime-local" },
      { name: "technician", label: "Técnico responsável", type: "text" },
      { name: "status", label: "Situação", type: "select", options: ["Aberta", "Agendada", "Em atendimento", "Aguardando peça", "Concluída", "Cancelada"] },
    ],
    columns: [{ key: "number", label: "Número" }, { key: "customerName", label: "Cliente" }, { key: "serviceMode", label: "Atendimento", kind: "mode" }, { key: "serviceType", label: "Serviço" }, { key: "scheduledAt", label: "Agenda", kind: "date" }, { key: "technician", label: "Técnico" }, { key: "status", label: "Situação", kind: "status" }],
  },
  {
    key: "catalog", label: "Catálogo", singular: "item", title: "Catálogo de produtos e serviços",
    description: "Base comercial para materiais, equipamentos e mão de obra aplicáveis aos orçamentos.", icon: Boxes,
    fields: [
      { name: "name", label: "Descrição do item", type: "text", required: true, span: true },
      { name: "itemType", label: "Tipo", type: "select", required: true, options: ["Produto", "Serviço"] },
      { name: "serviceMode", label: "Aplicação", type: "select", required: true, options: ["Instalação", "Manutenção", "Ambos"] },
      { name: "category", label: "Categoria", type: "text" }, { name: "unit", label: "Unidade", type: "text" },
      { name: "price", label: "Preço de referência", type: "number", required: true }, { name: "warranty", label: "Garantia informada", type: "text" },
      { name: "status", label: "Situação", type: "select", options: ["Ativo", "Inativo"] },
    ],
    columns: [{ key: "name", label: "Item" }, { key: "itemType", label: "Tipo" }, { key: "serviceMode", label: "Aplicação", kind: "mode" }, { key: "category", label: "Categoria" }, { key: "unit", label: "Unidade" }, { key: "warranty", label: "Garantia" }, { key: "price", label: "Preço", kind: "currency" }, { key: "status", label: "Situação", kind: "status" }],
  },
  {
    key: "finance", label: "Financeiro", singular: "lançamento", title: "Controle financeiro",
    description: "Lançamentos vinculados a propostas, contratos e ordens de serviço, com vencimento e situação.", icon: CircleDollarSign,
    fields: [
      { name: "customerName", label: "Cliente", type: "text", required: true, span: true },
      { name: "reference", label: "Referência", type: "text", required: true }, { name: "dueDate", label: "Vencimento", type: "date", required: true },
      { name: "amount", label: "Valor", type: "number", required: true }, { name: "status", label: "Situação", type: "select", options: ["Pendente", "Pago", "Vencido", "Cancelado"] },
      { name: "notes", label: "Observações", type: "textarea", span: true },
    ],
    columns: [{ key: "customerName", label: "Cliente" }, { key: "reference", label: "Referência" }, { key: "dueDate", label: "Vencimento", kind: "date" }, { key: "status", label: "Situação", kind: "status" }, { key: "amount", label: "Valor", kind: "currency" }],
  },
];

function money(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number) : "—";
}
function statusTone(status: string) {
  if (["Ativo", "Assinado", "Aprovado", "Pago", "Concluída"].includes(status)) return "success";
  if (["Enviado", "Em negociação", "Em atendimento", "Agendada"].includes(status)) return "info";
  if (["Pendente", "Aguardando assinatura", "Aguardando peça", "Vencido"].includes(status)) return "warning";
  return "neutral";
}
function StatusPill({ value }: { value: string }) { return <span className={`status-pill status-${statusTone(value)}`}>{value || "—"}</span>; }
function ModePill({ value }: { value: string }) {
  const tone = value === "Manutenção" ? "maintenance" : value === "Instalação" ? "installation" : "unknown";
  return <span className={`quote-mode quote-mode-${tone}`}>{value || "—"}</span>;
}
function displayDate(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const date = new Date(text.length === 10 ? `${text}T12:00:00` : text);
  const hasTime = text.includes("T") || /\d{2}:\d{2}/.test(text);
  return Number.isNaN(date.getTime()) ? text : new Intl.DateTimeFormat("pt-BR", hasTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(date);
}

export function SecurityDashboardV2({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [active, setActive] = React.useState<NavKey>("overview");
  const [portfolioFilter, setPortfolioFilter] = React.useState<PortfolioFilter>({});
  const [data, setData] = React.useState<DataBundle>(emptyData);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [editor, setEditor] = React.useState<{ entity: EntityKey; record?: Row } | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ entity: EntityKey; record: Row } | null>(null);
  const [signatureTarget, setSignatureTarget] = React.useState<Row | null>(null);
  const [photosTarget, setPhotosTarget] = React.useState<Row | null>(null);
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin");
      if (!response.ok) throw new Error("Não foi possível carregar os dados");
      setData(await response.json() as DataBundle);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar os dados");
    } finally { setLoading(false); }
  }, []);
  React.useEffect(() => { void loadData(); }, [loadData]);

  async function saveRecord(entity: EntityKey, values: Record<string, unknown>, id?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/admin", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity, id, actorName: userName, ...values }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar o registro");
      toast.success(id ? "Registro atualizado e auditado" : "Registro cadastrado e auditado");
      setEditor(null);
      await loadData();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao salvar"); }
    finally { setSaving(false); }
  }
  async function deleteRecord() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity: deleteTarget.entity, id: deleteTarget.record.id, actorName: userName }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir o registro");
      toast.success("Registro excluído e mantido na trilha de auditoria");
      setDeleteTarget(null);
      await loadData();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao excluir"); }
    finally { setSaving(false); }
  }

  const currentModule = modules.find((module) => module.key === active);
  return <SidebarProvider>
    <Sidebar collapsible="icon" className="border-r-0 bg-[#090a08] text-white">
      <SidebarHeader className="border-b border-white/10 px-4 py-4"><div className="brand-lockup"><img className="brand-logo" src="/securitytc-logo.png" alt="SecurityTC Soluções Inteligentes" /><div className="brand-copy"><strong>SECURITYTC</strong><span>Gestão profissional</span></div></div></SidebarHeader>
      <SidebarContent className="px-2 py-4"><SidebarGroup><SidebarGroupLabel className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a79d7e]">Gestão integrada</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
        <NavButton active={active === "overview"} label="Visão geral" icon={LayoutDashboard} onClick={() => setActive("overview")} />
        {modules.map((module) => <NavButton key={module.key} active={active === module.key} label={module.label} icon={module.icon} onClick={() => setActive(module.key)} />)}
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={active === "portfolio"}
            tooltip="Serviços realizados"
            onClick={() => { setActive("portfolio"); setPortfolioFilter({}); }}
            className="h-10 text-stone-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-amber-400/15 data-[active=true]:text-amber-200"
          >
            <Images /><span>Serviços realizados</span>
          </SidebarMenuButton>
          {active === "portfolio" && <SidebarMenuSub className="portfolio-sidebar-sub">
            <PortfolioSubButton active={!portfolioFilter.area && !portfolioFilter.serviceType} label="Todos os serviços" onClick={() => setPortfolioFilter({})} />
            <li className="portfolio-sub-label">Por área</li>
            {serviceAreas.map((area) => <PortfolioSubButton key={area} active={portfolioFilter.area === area} label={area} onClick={() => setPortfolioFilter({ area })} />)}
            <li className="portfolio-sub-label">Por tipo de serviço</li>
            {portfolioServiceLabels.map(([label, serviceType]) => <PortfolioSubButton key={serviceType} active={portfolioFilter.serviceType === serviceType} label={label} onClick={() => setPortfolioFilter({ serviceType })} />)}
          </SidebarMenuSub>}
        </SidebarMenuItem>
        <NavButton active={active === "site-content"} label="Textos da página" icon={PanelsTopLeft} onClick={() => setActive("site-content")} />
        <NavButton active={active === "reports"} label="Relatórios" icon={BarChart3} onClick={() => setActive("reports")} />
        <NavButton active={active === "audit"} label="Auditoria" icon={History} onClick={() => setActive("audit")} />
      </SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-3"><div className="sidebar-profile"><div className="avatar">{userName.charAt(0).toUpperCase()}</div><div className="brand-copy min-w-0"><strong className="truncate">{userName}</strong><span className="truncate">{userEmail}</span></div></div></SidebarFooter>
    </Sidebar>
      <SidebarInset className="min-w-0 bg-[#f4f5f0]"><header className="app-header"><div className="header-left"><SidebarTrigger className="text-[#59604b] hover:bg-[#eef0e8]"><Menu /></SidebarTrigger><div className="global-search"><Search size={18} /><input aria-label="Busca global" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar no módulo atual" /></div></div><div className="header-actions"><Button variant="ghost" size="icon" aria-label="Notificações" className="relative"><Bell size={19} /></Button>{currentModule && <Button className="primary-action" onClick={() => setEditor({ entity: currentModule.key })}><Plus size={17} /> {currentModule.key === "orders" ? "Nova" : "Novo"} {currentModule.singular}</Button>}</div></header>
      <main className="workspace">
        {active === "overview" && <Overview data={data} loading={loading} onOpen={(key) => setActive(key)} />}
        {currentModule && <ModuleView config={currentModule} rows={data[currentModule.key]} query={search} loading={loading} onNew={() => setEditor({ entity: currentModule.key })} onEdit={(record) => setEditor({ entity: currentModule.key, record })} onDelete={(record) => setDeleteTarget({ entity: currentModule.key, record })} onSign={setSignatureTarget} onPhotos={setPhotosTarget} />}
        {active === "portfolio" && <SiteContentManager section="portfolio" areaFilter={portfolioFilter.area} serviceTypeFilter={portfolioFilter.serviceType} onAuditChanged={loadData} />}
        {active === "site-content" && <SiteContentManager section="texts" onAuditChanged={loadData} />}
        {active === "reports" && <Reports data={data} />}
        {active === "audit" && <AuditView rows={data.audit} query={search} loading={loading} />}
      </main>
    </SidebarInset>
    {editor && <RecordDialog key={`${editor.entity}-${editor.record?.id ?? "new"}`} config={modules.find((module) => module.key === editor.entity)!} record={editor.record} saving={saving} onClose={() => setEditor(null)} onSave={(values) => saveRecord(editor.entity, values, editor.record?.id)} />}
    {signatureTarget && <SignatureDialog contract={signatureTarget} onClose={() => setSignatureTarget(null)} onSigned={async () => { setSignatureTarget(null); await loadData(); }} />}
    {photosTarget && <PhotosDialog order={photosTarget} onClose={() => setPhotosTarget(null)} onChanged={loadData} />}
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir este registro?</AlertDialogTitle><AlertDialogDescription>O registro deixará de aparecer no módulo, mas a exclusão e os dados anteriores permanecerão na trilha de auditoria.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void deleteRecord()} disabled={saving}>{saving ? "Excluindo..." : "Excluir registro"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <Toaster richColors position="top-right" />
  </SidebarProvider>;
}

function NavButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: React.ElementType; onClick: () => void }) {
  return <SidebarMenuItem><SidebarMenuButton isActive={active} tooltip={label} onClick={onClick} className="h-10 text-stone-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-amber-400/15 data-[active=true]:text-amber-200"><Icon /><span>{label}</span></SidebarMenuButton></SidebarMenuItem>;
}
function PortfolioSubButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <SidebarMenuSubItem><SidebarMenuSubButton href="#portfolio" isActive={active} onClick={(event) => { event.preventDefault(); onClick(); }} className="text-stone-400 hover:bg-white/8 hover:text-white data-[active=true]:bg-amber-400/10 data-[active=true]:text-amber-200"><span>{label}</span></SidebarMenuSubButton></SidebarMenuSubItem>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function Overview({ data, loading, onOpen }: { data: DataBundle; loading: boolean; onOpen: (key: NavKey) => void }) {
  const pending = data.finance.filter((entry) => entry.status === "Pendente" || entry.status === "Vencido").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const activeOrders = data.orders.filter((order) => !["Concluída", "Cancelada"].includes(String(order.status))).length;
  return <><PageHeading eyebrow="Gestão integrada" title="Visão geral da operação" description="Indicadores calculados exclusivamente a partir dos registros cadastrados na plataforma." />
    <section className="metric-grid"><Metric label="Clientes ativos" value={loading ? "…" : String(data.customers.filter((item) => item.status === "Ativo").length)} icon={Users} /><Metric label="Propostas" value={loading ? "…" : String(data.quotes.length)} icon={FileText} /><Metric label="OS em andamento" value={loading ? "…" : String(activeOrders)} icon={Wrench} /><Metric label="Financeiro em aberto" value={loading ? "…" : money(pending)} icon={CircleDollarSign} /></section>
    <section className="management-grid">{modules.map((module) => <button className="management-card" key={module.key} onClick={() => onOpen(module.key)}><span className="management-icon"><module.icon /></span><span><strong>{module.label}</strong><small>{data[module.key].length} registro(s)</small></span><span className="management-arrow">→</span></button>)}<button className="management-card" onClick={() => onOpen("portfolio")}><span className="management-icon"><Images /></span><span><strong>Serviços realizados</strong><small>Imagens e portfólio real</small></span><span className="management-arrow">→</span></button><button className="management-card" onClick={() => onOpen("site-content")}><span className="management-icon"><PanelsTopLeft /></span><span><strong>Textos da página</strong><small>Conteúdo institucional da landing page</small></span><span className="management-arrow">→</span></button></section>
    <section className="panel page-panel"><div className="panel-head"><div><span className="eyebrow">Atividade recente</span><h2>Últimos registros de auditoria</h2></div><Button variant="outline" onClick={() => onOpen("audit")}>Ver auditoria</Button></div><AuditTable rows={data.audit.slice(0, 5)} /></section>
  </>;
}
function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return <article className="metric-card"><div className="metric-icon green"><Icon /></div><div className="metric-top"><span>{label}</span></div><strong>{value}</strong><div className="metric-bottom"><span>Dados cadastrados</span></div></article>;
}
function ModuleView({ config, rows, query, loading, onNew, onEdit, onDelete, onSign, onPhotos }: { config: ModuleConfig; rows: Row[]; query: string; loading: boolean; onNew: () => void; onEdit: (row: Row) => void; onDelete: (row: Row) => void; onSign: (row: Row) => void; onPhotos: (row: Row) => void }) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = normalized ? rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(normalized))) : rows;
  const newLabel = `${config.key === "orders" ? "Nova" : "Novo"} ${config.singular}`;
  const emptyLabel = `${config.key === "orders" ? "Nenhuma" : "Nenhum"} ${config.singular} cadastrado`;
  return <><PageHeading eyebrow="Cadastro e gestão" title={config.title} description={config.description} action={<Button className="primary-action" onClick={onNew}><Plus size={17} /> {newLabel}</Button>} />
    <div className="panel page-panel"><div className="table-tools"><div><strong>{filtered.length} registro(s)</strong><small>Cadastro, edição, exclusão controlada e auditoria automática</small></div><Badge variant="secondary">{config.label}</Badge></div>
      {loading ? <EmptyState title="Carregando registros..." /> : filtered.length === 0 ? <EmptyState title={query ? "Nenhum resultado encontrado" : emptyLabel} action={!query ? <Button onClick={onNew}><Plus size={16} /> Cadastrar agora</Button> : undefined} /> : <div className="table-scroll"><Table><TableHeader><TableRow>{config.columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}<TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filtered.map((row) => <TableRow key={row.id}>{config.columns.map((column) => <TableCell key={column.key}>{formatCell(row[column.key], column.kind)}</TableCell>)}<TableCell><div className="row-actions">{["quotes", "contracts", "orders"].includes(config.key) && <Button variant="ghost" size="icon" aria-label="Baixar PDF" title="Baixar PDF" asChild><a href={`/api/documents/${config.key}/${row.id}`}><Download size={16} /></a></Button>}{config.key === "contracts" && <Button variant="ghost" size="icon" aria-label="Assinar eletronicamente" title="Assinar eletronicamente" onClick={() => onSign(row)}><PenLine size={16} /></Button>}{config.key === "orders" && <Button variant="ghost" size="icon" aria-label="Gerenciar fotos" title="Gerenciar fotos" onClick={() => onPhotos(row)}><Camera size={16} /></Button>}<Button variant="ghost" size="icon" aria-label="Editar" title="Editar" onClick={() => onEdit(row)}><Pencil size={16} /></Button><Button variant="ghost" size="icon" aria-label="Excluir" title="Excluir" onClick={() => onDelete(row)}><Trash2 size={16} /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>}
    </div></>;
}
function formatCell(value: unknown, kind?: Column["kind"]) {
  if (kind === "currency") return <strong>{money(value)}</strong>;
  if (kind === "status") return <StatusPill value={String(value ?? "")} />;
  if (kind === "mode") return <ModePill value={String(value ?? "")} />;
  if (kind === "date") return displayDate(value);
  return String(value ?? "") || "—";
}
function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="empty-state"><ShieldCheck /><strong>{title}</strong>{action}</div>; }

function RecordDialog({ config, record, saving, onClose, onSave }: { config: ModuleConfig; record?: Row; saving: boolean; onClose: () => void; onSave: (values: Record<string, unknown>) => Promise<void> }) {
  const initial = Object.fromEntries(config.fields.map((field) => [field.name, record?.[field.name] ?? field.options?.[0] ?? ""]));
  if (config.key === "contracts" && !record) initial.clauses = buildContractClauses(String(initial.serviceMode), String(initial.serviceType));
  const [values, setValues] = React.useState<Record<string, unknown>>(initial);
  function change(name: string, value: unknown) { setValues((current) => { const next = { ...current, [name]: value }; if (config.key === "contracts" && !record && (name === "serviceMode" || name === "serviceType")) next.clauses = buildContractClauses(String(next.serviceMode), String(next.serviceType)); return next; }); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = { ...values };
    config.fields.filter((field) => field.type === "number").forEach((field) => { normalized[field.name] = Number(values[field.name]); });
    await onSave(normalized);
  }
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto"><form onSubmit={submit}><DialogHeader><DialogTitle>{record ? `Editar ${config.singular}` : `Cadastrar ${config.singular}`}</DialogTitle><DialogDescription>Campos marcados como obrigatórios devem refletir os dados reais do atendimento.{config.key === "contracts" ? " As cláusulas são uma base editável e devem ser revisadas antes do uso." : ""}</DialogDescription></DialogHeader><div className="form-grid">{config.fields.map((field) => <div key={field.name} className={field.span ? "field-span" : undefined}><Label htmlFor={`field-${field.name}`}>{field.label}{field.required ? " *" : ""}</Label>{field.type === "textarea" ? <Textarea id={`field-${field.name}`} value={String(values[field.name] ?? "")} onChange={(event) => change(field.name, event.target.value)} placeholder={field.placeholder} rows={field.name === "clauses" ? 16 : 3} required={field.required} /> : field.type === "select" ? <Select value={String(values[field.name] ?? field.options?.[0] ?? "")} onValueChange={(value) => change(field.name, value)}><SelectTrigger id={`field-${field.name}`}><SelectValue /></SelectTrigger><SelectContent>{field.options?.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select> : <Input id={`field-${field.name}`} type={field.type} value={String(values[field.name] ?? "")} onChange={(event) => change(field.name, event.target.value)} placeholder={field.placeholder} step={field.type === "number" ? "0.01" : undefined} min={field.type === "number" ? "0" : undefined} max={field.name === "terminationPenaltyPercent" ? "100" : undefined} required={field.required} />}</div>)}</div><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" className="primary-action" disabled={saving}>{saving ? "Salvando..." : record ? "Salvar alterações" : "Cadastrar"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function SignatureDialog({ contract, onClose, onSigned }: { contract: Row; onClose: () => void; onSigned: () => Promise<void> }) {
  const [values, setValues] = React.useState({ signerName: "", signerDocument: "", signerEmail: "", consent: false }); const [saving, setSaving] = React.useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch("/api/contracts/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contractId: contract.id, ...values }) }); const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível registrar a assinatura"); toast.success("Aceite eletrônico simples registrado e auditado"); await onSigned();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao assinar"); } finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="sm:max-w-[620px]"><form onSubmit={submit}><DialogHeader><DialogTitle>Assinatura eletrônica simples</DialogTitle><DialogDescription>Contrato {String(contract.number)} — {String(contract.customerName)}. Este aceite registra identidade declarada, data, usuário autenticado e hash de integridade; não é assinatura qualificada ICP-Brasil.</DialogDescription></DialogHeader><div className="signature-notice"><PenLine /><div><strong>Leia o contrato antes de confirmar</strong><span>Baixe o PDF, confira cláusulas, valores, garantias e multa cadastrada.</span></div></div><div className="form-grid compact"><div className="field-span"><Label htmlFor="signer-name">Nome completo do signatário *</Label><Input id="signer-name" required value={values.signerName} onChange={(event) => setValues({ ...values, signerName: event.target.value })} /></div><div><Label htmlFor="signer-document">CPF/CNPJ ou documento *</Label><Input id="signer-document" required value={values.signerDocument} onChange={(event) => setValues({ ...values, signerDocument: event.target.value })} /></div><div><Label htmlFor="signer-email">E-mail *</Label><Input id="signer-email" type="email" required value={values.signerEmail} onChange={(event) => setValues({ ...values, signerEmail: event.target.value })} /></div><label className="consent-row field-span"><input type="checkbox" checked={values.consent} onChange={(event) => setValues({ ...values, consent: event.target.checked })} /><span>Declaro que li e aceito o conteúdo deste contrato e autorizo o registro eletrônico deste aceite.</span></label></div><DialogFooter><Button type="button" variant="outline" asChild><a href={`/api/documents/contracts/${contract.id}`}><Download size={16} /> Baixar contrato</a></Button><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" className="primary-action" disabled={saving || !values.consent}>{saving ? "Registrando..." : "Confirmar assinatura"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

type PhotoRow = { id: string; fileName: string; sizeBytes: number; caption: string; uploadedBy: string; createdAt: string };
function PhotosDialog({ order, onClose, onChanged }: { order: Row; onClose: () => void; onChanged: () => Promise<void> }) {
  const [photos, setPhotos] = React.useState<PhotoRow[]>([]); const [files, setFiles] = React.useState<File[]>([]); const [caption, setCaption] = React.useState(""); const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => { const response = await fetch(`/api/photos?orderId=${encodeURIComponent(order.id)}`); const result = await response.json() as { photos?: PhotoRow[]; error?: string }; if (!response.ok) throw new Error(result.error || "Falha ao carregar fotos"); setPhotos(result.photos || []); }, [order.id]);
  React.useEffect(() => { void load().catch((error: Error) => toast.error(error.message)); }, [load]);
  async function upload() {
    if (!files.length) return toast.error("Selecione ao menos uma foto"); setBusy(true);
    try { const form = new FormData(); form.append("orderId", order.id); form.append("caption", caption); files.forEach((file) => form.append("files", file)); const response = await fetch("/api/photos", { method: "POST", body: form }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Falha no upload"); toast.success("Fotos anexadas e auditadas"); setFiles([]); setCaption(""); await load(); await onChanged(); } catch (error) { toast.error(error instanceof Error ? error.message : "Falha no upload"); } finally { setBusy(false); }
  }
  async function remove(photoId: string) { setBusy(true); try { const response = await fetch("/api/photos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoId }) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Falha ao remover"); toast.success("Foto removida e auditada"); await load(); await onChanged(); } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao remover"); } finally { setBusy(false); } }
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Fotos da ordem de serviço</DialogTitle><DialogDescription>{String(order.number)} — até 10 imagens JPG, PNG ou WEBP, com no máximo 8 MB cada.</DialogDescription></DialogHeader><div className="photo-uploader"><div><Label htmlFor="service-photos">Selecionar fotos ({photos.length}/10)</Label><Input id="service-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} /></div><div><Label htmlFor="photo-caption">Legenda do lote</Label><Input id="photo-caption" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Ex.: antes da manutenção" /></div><Button type="button" className="primary-action" disabled={busy || !files.length || photos.length + files.length > 10} onClick={() => void upload()}><Upload size={16} /> {busy ? "Enviando..." : `Enviar ${files.length || ""} foto(s)`}</Button></div>{photos.length ? <div className="photo-grid">{photos.map((photo) => <article key={photo.id} className="photo-card"><img src={`/api/photos?photoId=${encodeURIComponent(photo.id)}`} alt={photo.caption || photo.fileName} /><div><strong>{photo.fileName}</strong><span>{photo.caption || "Sem legenda"}</span><small>{Math.ceil(photo.sizeBytes / 1024)} KB • {displayDate(photo.createdAt)}</small><Button variant="outline" size="sm" disabled={busy} onClick={() => void remove(photo.id)}><Trash2 size={14} /> Remover</Button></div></article>)}</div> : <EmptyState title="Nenhuma foto anexada a esta ordem de serviço" />}<DialogFooter><Button variant="outline" onClick={onClose}>Fechar</Button><Button asChild className="primary-action"><a href={`/api/documents/orders/${order.id}`}><Download size={16} /> Baixar OS em PDF</a></Button></DialogFooter></DialogContent></Dialog>;
}
function AuditView({ rows, query, loading }: { rows: AuditRow[]; query: string; loading: boolean }) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = normalized ? rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(normalized))) : rows;
  return <><PageHeading eyebrow="Governança" title="Trilha de auditoria" description="Histórico imutável das inclusões, alterações e exclusões efetuadas nos módulos administrativos." /><div className="audit-notice"><History /><div><strong>Rastreabilidade ativa</strong><span>A exclusão é lógica: o registro sai da operação, mas a evidência permanece na auditoria.</span></div></div><div className="panel page-panel">{loading ? <EmptyState title="Carregando auditoria..." /> : <AuditTable rows={filtered} />}</div></>;
}
function AuditTable({ rows }: { rows: AuditRow[] }) {
  if (!rows.length) return <EmptyState title="Nenhum evento de auditoria registrado" />;
  return <div className="table-scroll"><Table><TableHeader><TableRow><TableHead>Data e hora</TableHead><TableHead>Ação</TableHead><TableHead>Módulo</TableHead><TableHead>Descrição</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{displayDate(row.createdAt)}</TableCell><TableCell><StatusPill value={row.action} /></TableCell><TableCell>{moduleLabel(row.entityType)}</TableCell><TableCell>{row.description}</TableCell><TableCell>{row.actorName}</TableCell></TableRow>)}</TableBody></Table></div>;
}
function moduleLabel(key: string) { return modules.find((module) => module.key === key)?.label ?? key; }
function Reports({ data }: { data: DataBundle }) {
  const commercial = [...data.quotes, ...data.contracts, ...data.orders];
  const installation = commercial.filter((row) => row.serviceMode === "Instalação").length;
  const maintenance = commercial.filter((row) => row.serviceMode === "Manutenção").length;
  const received = data.finance.filter((row) => row.status === "Pago").reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const open = data.finance.filter((row) => row.status === "Pendente" || row.status === "Vencido").reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return <><PageHeading eyebrow="Indicadores reais" title="Relatórios gerenciais" description="Consolidação calculada a partir dos cadastros existentes, sem projeções ou valores fictícios." action={<Button className="primary-action" asChild><a href="/api/documents/reports/summary"><Download size={17} /> Baixar relatório em PDF</a></Button>} /><section className="metric-grid"><Metric label="Atendimentos de instalação" value={String(installation)} icon={Boxes} /><Metric label="Atendimentos de manutenção" value={String(maintenance)} icon={Wrench} /><Metric label="Valores recebidos" value={money(received)} icon={CircleDollarSign} /><Metric label="Valores em aberto" value={money(open)} icon={CircleDollarSign} /></section><section className="report-summary"><article className="panel"><span className="eyebrow">Base operacional</span><h2>Registros por módulo</h2>{modules.map((module) => <div className="summary-row" key={module.key}><span>{module.label}</span><strong>{data[module.key].length}</strong></div>)}</article><article className="panel"><span className="eyebrow">Classificação</span><h2>Instalação x manutenção</h2><div className="mode-total installation"><Boxes /><span>Instalação</span><strong>{installation}</strong></div><div className="mode-total maintenance"><Wrench /><span>Manutenção</span><strong>{maintenance}</strong></div><p className="report-footnote">São considerados orçamentos, contratos e ordens de serviço cadastrados.</p></article></section></>;
}
