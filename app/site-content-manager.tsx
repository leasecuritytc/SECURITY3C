"use client";

import * as React from "react";
import { ExternalLink, Eye, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { defaultLandingContent, type LandingContent, type PublicPortfolioItem } from "@/lib/site-content-shared";

const serviceTypes = [
  "Automação residencial", "Alarmes monitorados", "Câmeras de segurança / CFTV", "Controle de acesso",
  "Concertinas", "Cercas elétricas", "Desenvolvimento de aplicações", "Interfonia e vídeo porteiro",
  "Motores automatizadores de portão", "Imagens de alta resolução com drone",
];

const contentFields: Array<{ key: keyof LandingContent; label: string; hint: string; large?: boolean }> = [
  { key: "heroEyebrow", label: "Linha de destaque", hint: "Texto curto acima do título principal" },
  { key: "heroTitle", label: "Título principal", hint: "Mensagem central da primeira dobra", large: true },
  { key: "heroDescription", label: "Apresentação principal", hint: "Descrição abaixo do título", large: true },
  { key: "solutionsTitle", label: "Título de soluções", hint: "Apresentação dos serviços", large: true },
  { key: "solutionsDescription", label: "Descrição de soluções", hint: "Orientação sobre instalação e manutenção", large: true },
  { key: "portfolioTitle", label: "Título do portfólio", hint: "Cabeçalho dos serviços realizados", large: true },
  { key: "portfolioDescription", label: "Descrição do portfólio", hint: "Explique o que os visitantes verão", large: true },
  { key: "processTitle", label: "Título do processo", hint: "Como a empresa trabalha", large: true },
  { key: "processDescription", label: "Descrição do processo", hint: "Resumo do fluxo de atendimento", large: true },
  { key: "technologyTitle", label: "Título de tecnologia", hint: "Seção audiovisual", large: true },
  { key: "technologyDescription", label: "Descrição de tecnologia", hint: "Contexto para imagens e vídeo", large: true },
  { key: "quoteTitle", label: "Título do orçamento", hint: "Chamada do formulário", large: true },
  { key: "quoteDescription", label: "Descrição do orçamento", hint: "Explique o próximo passo", large: true },
  { key: "footerDescription", label: "Descrição do rodapé", hint: "Resumo institucional", large: true },
];

type PortfolioAdminItem = PublicPortfolioItem & { status: string; imageName: string };
type PortfolioDraft = {
  id?: string; title: string; serviceType: string; serviceMode: string; city: string; completedAt: string;
  summary: string; altText: string; status: string; sortOrder: number; featured: boolean; imageName?: string; imageUrl?: string;
};
const blankPortfolio: PortfolioDraft = { title: "", serviceType: "", serviceMode: "Instalação", city: "", completedAt: "", summary: "", altText: "", status: "Rascunho", sortOrder: 0, featured: false };

export function SiteContentManager({ onAuditChanged }: { onAuditChanged?: () => Promise<void> | void }) {
  const [content, setContent] = React.useState<LandingContent>(defaultLandingContent);
  const [items, setItems] = React.useState<PortfolioAdminItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingContent, setSavingContent] = React.useState(false);
  const [editor, setEditor] = React.useState<PortfolioDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PortfolioAdminItem | null>(null);
  const [savingItem, setSavingItem] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/site-content/admin", { cache: "no-store" });
      const result = await response.json() as { content?: LandingContent; portfolio?: PortfolioAdminItem[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar o conteúdo");
      setContent(result.content || defaultLandingContent); setItems(result.portfolio || []);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar conteúdo"); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function saveContent() {
    setSavingContent(true);
    try {
      const response = await fetch("/api/site-content/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar os textos");
      toast.success("Textos da página atualizados e auditados"); await onAuditChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao salvar os textos"); }
    finally { setSavingContent(false); }
  }

  async function savePortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editor) return;
    setSavingItem(true);
    try {
      const form = new FormData(event.currentTarget);
      if (editor.id) form.set("id", editor.id);
      form.set("featured", String(editor.featured));
      const response = await fetch("/api/site-content/admin", { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar o serviço realizado");
      toast.success(editor.id ? "Serviço atualizado e auditado" : "Serviço cadastrado e auditado");
      setEditor(null); await load(); await onAuditChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao salvar o serviço"); }
    finally { setSavingItem(false); }
  }

  async function removeItem() {
    if (!deleteTarget) return; setSavingItem(true);
    try {
      const response = await fetch("/api/site-content/admin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTarget.id }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir o serviço");
      toast.success("Serviço removido e registrado na auditoria"); setDeleteTarget(null); await load(); await onAuditChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao excluir o serviço"); }
    finally { setSavingItem(false); }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">Conteúdo exclusivo</span><h1>Gestão da página pública</h1><p>Somente a conta administrativa autorizada pode inserir, editar, publicar ou apagar estes conteúdos.</p></div><Button variant="outline" asChild><a href="/" target="_blank"><Eye size={17} /> Visualizar página <ExternalLink size={14} /></a></Button></div>
    <Tabs defaultValue="portfolio" className="site-content-tabs">
      <TabsList><TabsTrigger value="portfolio">Serviços realizados</TabsTrigger><TabsTrigger value="texts">Textos da página</TabsTrigger></TabsList>
      <TabsContent value="portfolio">
        <section className="panel page-panel"><div className="panel-head"><div><span className="eyebrow">Carrossel profissional</span><h2>Portfólio de serviços reais</h2><p>Cadastre somente trabalhos efetivamente executados e imagens autorizadas para publicação.</p></div><Button className="primary-action" onClick={() => setEditor({ ...blankPortfolio })}><Plus size={17} /> Novo serviço realizado</Button></div>
          {loading ? <div className="cms-loading"><Loader2 className="animate-spin" /> Carregando conteúdo...</div> : items.length === 0 ? <div className="cms-empty"><ImagePlus /><strong>Nenhum serviço publicado</strong><p>O carrossel público permanecerá sem trabalhos fictícios até o primeiro cadastro real.</p><Button onClick={() => setEditor({ ...blankPortfolio })}><Plus size={16} /> Cadastrar primeiro serviço</Button></div> : <div className="portfolio-admin-grid">{items.map((item) => <article className="portfolio-admin-card" key={item.id}><div className="portfolio-admin-image"><img src={item.imageUrl} alt={item.altText} /><Badge className={item.status === "Publicado" ? "cms-status-published" : "cms-status-draft"}>{item.status}</Badge></div><div className="portfolio-admin-body"><div><small>{item.serviceMode} • {item.serviceType}</small><h3>{item.title}</h3><p>{item.summary}</p></div><div className="portfolio-admin-footer"><span>Ordem {item.sortOrder}{item.featured ? " • Destaque" : ""}</span><div><Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditor({ ...item })}><Pencil size={16} /></Button><Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => setDeleteTarget(item)}><Trash2 size={16} /></Button></div></div></div></article>)}</div>}
        </section>
      </TabsContent>
      <TabsContent value="texts">
        <section className="panel page-panel"><div className="panel-head"><div><span className="eyebrow">Editor institucional</span><h2>Textos da landing page</h2><p>Altere as mensagens principais sem editar o código. Os serviços oferecidos permanecem padronizados.</p></div><Button className="primary-action" onClick={() => void saveContent()} disabled={savingContent}>{savingContent ? <Loader2 className="animate-spin" /> : <Save size={17} />} Salvar textos</Button></div>
          <div className="cms-content-form">{contentFields.map((field) => <div className={field.large ? "cms-field wide" : "cms-field"} key={field.key}><Label htmlFor={`content-${field.key}`}>{field.label}</Label><small>{field.hint}</small>{field.large ? <Textarea id={`content-${field.key}`} value={content[field.key]} maxLength={700} onChange={(event) => setContent((current) => ({ ...current, [field.key]: event.target.value }))} /> : <Input id={`content-${field.key}`} value={content[field.key]} maxLength={700} onChange={(event) => setContent((current) => ({ ...current, [field.key]: event.target.value }))} />}</div>)}</div>
        </section>
      </TabsContent>
    </Tabs>

    <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && setEditor(null)}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editor?.id ? "Editar serviço realizado" : "Cadastrar serviço realizado"}</DialogTitle><DialogDescription>Use uma foto real, informe o atendimento executado e publique somente após revisar o conteúdo.</DialogDescription></DialogHeader>{editor && <form id="portfolio-form" className="cms-portfolio-form" onSubmit={savePortfolio}><div className="cms-field wide"><Label htmlFor="portfolio-title">Título</Label><Input id="portfolio-title" name="title" required maxLength={120} defaultValue={editor.title} placeholder="Ex.: Instalação de CFTV em condomínio" /></div><div className="cms-field"><Label>Tipo de atendimento</Label><Select name="serviceMode" defaultValue={editor.serviceMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Instalação">Instalação</SelectItem><SelectItem value="Manutenção">Manutenção</SelectItem></SelectContent></Select></div><div className="cms-field"><Label>Tipo de serviço</Label><Select name="serviceType" defaultValue={editor.serviceType}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{serviceTypes.map((service) => <SelectItem value={service} key={service}>{service}</SelectItem>)}</SelectContent></Select></div><div className="cms-field"><Label htmlFor="portfolio-city">Cidade/UF</Label><Input id="portfolio-city" name="city" maxLength={100} defaultValue={editor.city} /></div><div className="cms-field"><Label htmlFor="portfolio-date">Data de conclusão</Label><Input id="portfolio-date" name="completedAt" type="date" defaultValue={editor.completedAt} /></div><div className="cms-field wide"><Label htmlFor="portfolio-summary">Descrição objetiva</Label><Textarea id="portfolio-summary" name="summary" required maxLength={500} defaultValue={editor.summary} placeholder="Descreva apenas o serviço realmente executado." /></div><div className="cms-field wide"><Label htmlFor="portfolio-alt">Descrição da imagem para acessibilidade</Label><Input id="portfolio-alt" name="altText" required maxLength={180} defaultValue={editor.altText} placeholder="Descreva o que aparece na foto, sem informações sensíveis." /></div><div className="cms-field wide"><Label htmlFor="portfolio-image">Foto real {editor.id ? "(opcional para substituir)" : ""}</Label><label className="cms-upload" htmlFor="portfolio-image"><UploadCloud /><span><strong>{editor.imageName || "Selecionar JPG, PNG ou WEBP"}</strong><small>Até 8 MB. Evite rostos, placas e dados pessoais sem autorização.</small></span></label><Input id="portfolio-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!editor.id} className="sr-only" /></div><div className="cms-field"><Label>Situação</Label><Select name="status" defaultValue={editor.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Rascunho">Rascunho</SelectItem><SelectItem value="Publicado">Publicado</SelectItem></SelectContent></Select></div><div className="cms-field"><Label htmlFor="portfolio-order">Ordem de exibição</Label><Input id="portfolio-order" name="sortOrder" type="number" min="0" max="9999" defaultValue={editor.sortOrder} /></div><div className="cms-switch wide"><div><Label htmlFor="portfolio-featured">Destacar no carrossel</Label><small>Itens destacados aparecem antes dos demais.</small></div><Switch id="portfolio-featured" checked={editor.featured} onCheckedChange={(value) => setEditor((current) => current ? { ...current, featured: value } : current)} /></div></form>}<DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>Cancelar</Button><Button form="portfolio-form" type="submit" disabled={savingItem}>{savingItem ? <Loader2 className="animate-spin" /> : <Save size={16} />} Salvar serviço</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir este serviço realizado?</AlertDialogTitle><AlertDialogDescription>A foto sairá do carrossel e o conteúdo ficará registrado na auditoria. Esta ação não pode ser desfeita pela interface.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void removeItem()} disabled={savingItem}>{savingItem ? "Excluindo..." : "Excluir serviço"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
