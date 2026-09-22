"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Download, FileCheck2, Pencil, Plus, ReceiptText, Search, ShieldCheck, Trash2, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Row = Record<string, unknown> & { id: string };
type EntryMode = "receipt" | "income" | "expense";
type Filter = "all" | "income" | "expense" | "receipt";

const categories = ["Serviço avulso", "Venda de acessório", "Venda de equipamento", "Manutenção", "Instalação", "Outros"];
const paymentMethods = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Transferência bancária", "Boleto", "Não informado"];
const statuses = ["Pendente", "Pago", "Parcial", "Vencido", "Cancelado"];

function money(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number) : "—";
}
function date(value: unknown) {
  const raw = String(value ?? ""); if (!raw) return "—";
  const parsed = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw);
  return Number.isNaN(parsed.getTime()) ? raw : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(parsed);
}
function today() { return new Date().toISOString().slice(0, 10); }

export function FinanceManager({ rows, customers, query, loading, saving, onSave, onDelete }: {
  rows: Row[]; customers: Row[]; query: string; loading: boolean; saving: boolean;
  onSave: (values: Record<string, unknown>, id?: string) => Promise<boolean>;
  onDelete: (row: Row) => void;
}) {
  const [dialog, setDialog] = React.useState<{ mode: EntryMode; record?: Row } | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [status, setStatus] = React.useState("Todos");
  const income = rows.filter((row) => String(row.entryType || "Receita") === "Receita");
  const expense = rows.filter((row) => row.entryType === "Despesa");
  const received = income.filter((row) => row.status === "Pago").reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const payable = income.filter((row) => ["Pendente", "Parcial", "Vencido"].includes(String(row.status))).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const expenses = expense.filter((row) => row.status !== "Cancelado").reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const paidExpenses = expense.filter((row) => row.status === "Pago").reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => {
    if (filter === "income" && String(row.entryType || "Receita") !== "Receita") return false;
    if (filter === "expense" && row.entryType !== "Despesa") return false;
    if (filter === "receipt" && !row.receiptNumber) return false;
    if (status !== "Todos" && row.status !== status) return false;
    return !normalized || Object.values(row).some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(normalized));
  });

  return <>
    <div className="page-heading finance-heading"><div><span className="eyebrow">Financeiro e recibos</span><h1>Gestão financeira</h1><p>Receitas, despesas e recibos rápidos com clientes cadastrados ou ocasionais.</p></div><div className="finance-heading-actions"><Button variant="outline" onClick={() => setDialog({ mode: "income" })}><Plus size={17} /> Novo lançamento</Button><Button className="primary-action" onClick={() => setDialog({ mode: "receipt" })}><ReceiptText size={17} /> Emitir recibo</Button></div></div>

    <section className="finance-kpi-grid">
      <FinanceMetric label="Recebido" value={money(received)} note={`${income.filter((row) => row.status === "Pago").length} receita(s) paga(s)`} icon={ArrowUpRight} tone="positive" />
      <FinanceMetric label="A receber" value={money(payable)} note="Pendente, parcial ou vencido" icon={WalletCards} tone="open" />
      <FinanceMetric label="Despesas lançadas" value={money(expenses)} note={`${expense.length} lançamento(s)`} icon={ArrowDownRight} tone="negative" />
      <FinanceMetric label="Saldo realizado" value={money(received - paidExpenses)} note="Receitas pagas menos despesas pagas" icon={CircleDollarSign} tone="balance" />
    </section>

    <section className="finance-action-grid" aria-label="Ações rápidas">
      <button className="finance-action-card receipt" onClick={() => setDialog({ mode: "receipt" })}><span><ReceiptText /></span><div><strong>Recibo rápido</strong><small>Registre um pagamento e gere o PDF.</small></div><b>→</b></button>
      <button className="finance-action-card" onClick={() => setDialog({ mode: "income" })}><span><ArrowUpRight /></span><div><strong>Registrar receita</strong><small>Venda, serviço ou valor a receber.</small></div><b>→</b></button>
      <button className="finance-action-card expense" onClick={() => setDialog({ mode: "expense" })}><span><ArrowDownRight /></span><div><strong>Registrar despesa</strong><small>Controle pagamentos e vencimentos.</small></div><b>→</b></button>
    </section>

    <section className="panel page-panel finance-table-panel">
      <div className="finance-toolbar"><div><strong>Movimentações</strong><small>{filtered.length} de {rows.length} registro(s)</small></div><div className="finance-toolbar-controls"><div className="finance-filters">{([['all','Todos'],['income','Receitas'],['expense','Despesas'],['receipt','Recibos']] as Array<[Filter,string]>).map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div><Select value={status} onValueChange={setStatus}><SelectTrigger className="finance-status-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todas as situações</SelectItem>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
      {loading ? <FinanceEmpty title="Carregando dados financeiros..." /> : filtered.length === 0 ? <FinanceEmpty title={rows.length ? "Nenhum lançamento corresponde aos filtros" : "Comece registrando uma receita, despesa ou recibo"} action={!rows.length ? <Button className="primary-action" onClick={() => setDialog({ mode: "receipt" })}><ReceiptText size={16} /> Emitir primeiro recibo</Button> : undefined} /> : <div className="table-scroll"><Table><TableHeader><TableRow><TableHead>Documento / referência</TableHead><TableHead>Cliente</TableHead><TableHead>Movimento</TableHead><TableHead>Categoria</TableHead><TableHead>Data</TableHead><TableHead>Pagamento</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filtered.map((row) => <TableRow key={row.id}><TableCell><div className="finance-reference"><strong>{String(row.receiptNumber || row.reference)}</strong>{Boolean(row.receiptNumber) ? <span>{String(row.reference)}</span> : null}</div></TableCell><TableCell><div className="finance-customer"><strong>{String(row.customerName || "—")}</strong><span>{String(row.customerType || "Cadastrado")}</span></div></TableCell><TableCell><Badge className={row.entryType === "Despesa" ? "finance-badge expense" : "finance-badge income"}>{String(row.entryType || "Receita")}</Badge></TableCell><TableCell>{String(row.category || "Outros")}</TableCell><TableCell>{date(row.paidAt || row.dueDate)}</TableCell><TableCell>{String(row.paymentMethod || "Não informado")}</TableCell><TableCell><Status value={String(row.status || "Pendente")} /></TableCell><TableCell className={row.entryType === "Despesa" ? "finance-value expense" : "finance-value income"}>{row.entryType === "Despesa" ? "− " : "+ "}{money(row.amount)}</TableCell><TableCell><div className="row-actions">{Boolean(row.receiptNumber) && <Button variant="ghost" size="icon" title="Baixar recibo em PDF" aria-label="Baixar recibo em PDF" asChild><a href={`/api/documents/finance/${row.id}`}><Download size={16} /></a></Button>}{!row.receiptNumber && <Button variant="ghost" size="icon" title="Editar lançamento" aria-label="Editar lançamento" onClick={() => setDialog({ mode: row.entryType === "Despesa" ? "expense" : "income", record: row })}><Pencil size={16} /></Button>}<Button variant="ghost" size="icon" title="Excluir lançamento" aria-label="Excluir lançamento" onClick={() => onDelete(row)}><Trash2 size={16} /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>}
    </section>
    {dialog && <FinanceDialog key={`${dialog.mode}-${dialog.record?.id || "new"}`} mode={dialog.mode} record={dialog.record} customers={customers} saving={saving} onClose={() => setDialog(null)} onSave={async (values, id) => { const ok = await onSave(values, id); if (ok) setDialog(null); }} />}
  </>;
}

function FinanceMetric({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: React.ElementType; tone: string }) {
  return <article className={`finance-kpi ${tone}`}><div className="finance-kpi-top"><span>{label}</span><i><Icon /></i></div><strong>{value}</strong><small>{note}</small></article>;
}
function Status({ value }: { value: string }) {
  const tone = value === "Pago" ? "success" : ["Pendente", "Parcial", "Vencido"].includes(value) ? "warning" : "neutral";
  return <span className={`status-pill status-${tone}`}>{value}</span>;
}
function FinanceEmpty({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="empty-state finance-empty"><ShieldCheck /><strong>{title}</strong><span>Os indicadores exibem somente os dados realmente cadastrados.</span>{action}</div>;
}

function FinanceDialog({ mode, record, customers, saving, onClose, onSave }: {
  mode: EntryMode; record?: Row; customers: Row[]; saving: boolean; onClose: () => void;
  onSave: (values: Record<string, unknown>, id?: string) => Promise<void>;
}) {
  const receipt = mode === "receipt";
  const [customerType, setCustomerType] = React.useState(String(record?.customerType || "Cadastrado"));
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [values, setValues] = React.useState<Record<string, unknown>>({
    entryType: receipt || mode === "income" ? "Receita" : "Despesa", customerType: String(record?.customerType || "Cadastrado"),
    customerId: record?.customerId || "", customerName: record?.customerName || "", customerDocument: record?.customerDocument || "",
    customerPhone: record?.customerPhone || "", customerEmail: record?.customerEmail || "", saveCustomer: false,
    reference: record?.reference || "", category: record?.category || (receipt ? "Serviço avulso" : "Outros"), amount: record?.amount || "",
    dueDate: record?.dueDate || today(), status: receipt ? "Pago" : record?.status || "Pendente",
    paymentMethod: record?.paymentMethod || "Não informado", paidAt: receipt ? today() : record?.paidAt || "", notes: record?.notes || "", issueReceipt: receipt,
  });
  const matchingCustomers = customers.filter((customer) => {
    const needle = customerSearch.trim().toLocaleLowerCase("pt-BR");
    return !needle || [customer.name, customer.document, customer.phone, customer.email].some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(needle));
  }).slice(0, 8);
  function change(name: string, value: unknown) { setValues((current) => ({ ...current, [name]: value })); }
  function selectCustomer(customer: Row) { setValues((current) => ({ ...current, customerId: customer.id, customerName: customer.name || "", customerDocument: customer.document || "", customerPhone: customer.phone || "", customerEmail: customer.email || "" })); setCustomerSearch(String(customer.name || "")); }
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); await onSave({ ...values, customerType, amount: Number(values.amount) }, record?.id); }
  const title = record ? "Editar lançamento" : receipt ? "Emitir recibo rápido" : mode === "expense" ? "Registrar despesa" : "Registrar receita";

  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="sm:max-w-[850px] max-h-[92vh] overflow-y-auto"><form onSubmit={submit}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{receipt ? "O pagamento será registrado como receita paga e o recibo ficará disponível em PDF." : "Informe dados reais. Toda inclusão ou alteração é registrada na auditoria."}</DialogDescription></DialogHeader>
    {receipt && <div className="finance-receipt-banner"><FileCheck2 /><div><strong>Recibo com identificação automática</strong><span>O número será gerado pelo sistema após a confirmação.</span></div></div>}
    <div className="finance-customer-mode"><button type="button" className={customerType === "Cadastrado" ? "active" : ""} onClick={() => { setCustomerType("Cadastrado"); change("customerType", "Cadastrado"); }}>Cliente cadastrado</button><button type="button" className={customerType === "Ocasional" ? "active" : ""} onClick={() => { setCustomerType("Ocasional"); change("customerType", "Ocasional"); change("customerId", ""); }}>Cliente ocasional</button></div>
    {customerType === "Cadastrado" ? <div className="customer-lookup"><Label htmlFor="finance-customer-search">Buscar por nome, documento, telefone ou e-mail *</Label><div className="customer-search-input"><Search /><Input id="finance-customer-search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Digite para localizar um cliente" /></div><div className="customer-results">{matchingCustomers.length ? matchingCustomers.map((customer) => <button type="button" key={customer.id} className={values.customerId === customer.id ? "selected" : ""} onClick={() => selectCustomer(customer)}><span><strong>{String(customer.name)}</strong><small>{String(customer.document || customer.phone || customer.email || "Sem documento ou contato")}</small></span>{values.customerId === customer.id ? <b>Selecionado</b> : <b>Selecionar</b>}</button>) : <p>Nenhum cliente cadastrado corresponde à busca.</p>}</div></div> : <div className="form-grid finance-dialog-grid"><div><Label htmlFor="customerName">Nome ou razão social *</Label><Input id="customerName" value={String(values.customerName)} onChange={(event) => change("customerName", event.target.value)} required /></div><div><Label htmlFor="customerDocument">CPF ou CNPJ</Label><Input id="customerDocument" value={String(values.customerDocument)} onChange={(event) => change("customerDocument", event.target.value)} /></div><div><Label htmlFor="customerPhone">Telefone</Label><Input id="customerPhone" value={String(values.customerPhone)} onChange={(event) => change("customerPhone", event.target.value)} /></div><div><Label htmlFor="customerEmail">E-mail</Label><Input id="customerEmail" type="email" value={String(values.customerEmail)} onChange={(event) => change("customerEmail", event.target.value)} /></div><label className="consent-row field-span"><input type="checkbox" checked={Boolean(values.saveCustomer)} onChange={(event) => change("saveCustomer", event.target.checked)} /><span>Salvar este cliente ocasional no cadastro para atendimentos futuros.</span></label></div>}
    <div className="form-grid finance-dialog-grid"><div className="field-span"><Label htmlFor="financeReference">Descrição / referente a *</Label><Input id="financeReference" value={String(values.reference)} onChange={(event) => change("reference", event.target.value)} placeholder="Ex.: venda de equipamento ou serviço realizado" required /></div><div><Label>Categoria *</Label><Select value={String(values.category)} onValueChange={(value) => change("category", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="financeAmount">Valor (R$) *</Label><Input id="financeAmount" type="number" min="0.01" step="0.01" value={String(values.amount)} onChange={(event) => change("amount", event.target.value)} required /></div><div><Label htmlFor="financeDueDate">{receipt ? "Data do recebimento" : "Vencimento"} *</Label><Input id="financeDueDate" type="date" value={String(receipt ? values.paidAt : values.dueDate)} onChange={(event) => { if (receipt) { change("paidAt", event.target.value); change("dueDate", event.target.value); } else change("dueDate", event.target.value); }} required /></div><div><Label>Forma de pagamento</Label><Select value={String(values.paymentMethod)} onValueChange={(value) => change("paymentMethod", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>{!receipt && <div><Label>Situação</Label><Select value={String(values.status)} onValueChange={(value) => change("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>}<div className="field-span"><Label htmlFor="financeNotes">Observações</Label><Textarea id="financeNotes" value={String(values.notes)} onChange={(event) => change("notes", event.target.value)} rows={3} /></div></div>
    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" className="primary-action" disabled={saving || (customerType === "Cadastrado" && !values.customerId)}>{saving ? "Salvando..." : receipt ? "Confirmar e emitir recibo" : record ? "Salvar alterações" : "Registrar lançamento"}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}
