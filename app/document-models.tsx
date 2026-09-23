"use client";

import { ClipboardList, FileCheck2, FileText, ReceiptText, ShieldCheck } from "lucide-react";

const models = [
  { title: "Orçamento", detail: "Proposta, escopo, validade e investimento", icon: FileText, code: "ORC" },
  { title: "Contrato", detail: "Cláusulas, garantias, vigência e assinatura", icon: FileCheck2, code: "CTR" },
  { title: "Ordem de serviço", detail: "Solicitação, diagnóstico, materiais e garantia", icon: ClipboardList, code: "OS" },
  { title: "Recibo", detail: "Pagamento, referência e forma de recebimento", icon: ReceiptText, code: "REC" },
  { title: "Relatório", detail: "Consolidação gerencial dos dados cadastrados", icon: ShieldCheck, code: "REL" },
];

export function DocumentModelsView() {
  return <>
    <div className="page-heading"><div><span className="eyebrow">Identidade documental</span><h1>Modelos oficiais da Security3C</h1><p>Padrão visual aplicado automaticamente aos arquivos PDF e Word gerados pela plataforma.</p></div></div>
    <section className="document-standard panel">
      <div className="document-standard-copy"><span className="eyebrow">Padrão institucional</span><h2>Uma identidade única em todos os documentos</h2><p>O cabeçalho utiliza a logo oficial, verde-escuro e dourado. O conteúdo mantém fundo branco, títulos em verde-oliva, quadros de informação e rodapé institucional.</p><div className="document-format-list"><span><b>PDF</b> pronto para envio e impressão</span><span><b>Word</b> editável quando houver necessidade</span><span><b>Dados reais</b> preenchidos a partir de cada cadastro</span></div></div>
      <div className="document-brand-panel"><img src="/securitytc-logo.png" alt="Logo oficial da Security3C" /><strong>SECURITY3C</strong><span>SOLUÇÕES INTELIGENTES</span><small>Segurança eletrônica • Automação • Tecnologia</small><div><i className="color-olive" title="Verde oliva"/><i className="color-gold" title="Dourado"/><i className="color-black" title="Preto"/><i className="color-white" title="Branco"/></div></div>
    </section>
    <section className="document-model-grid">{models.map((model) => <article className="document-model-card" key={model.code}><div className="document-paper"><div className="document-paper-header"><img src="/securitytc-logo.png" alt="" /><span><b>SECURITY3C</b><small>SOLUÇÕES INTELIGENTES</small></span></div><div className="document-paper-title"><strong>{model.title.toUpperCase()}</strong><small>{model.code}-ANO-NÚMERO</small></div><div className="document-paper-grid"><i/><i/><i/><i/></div><div className="document-paper-line wide"/><div className="document-paper-line"/><div className="document-paper-highlight"/><div className="document-paper-footer">www.security3c.com.br</div></div><div className="document-model-info"><span><model.icon /></span><div><strong>{model.title}</strong><small>{model.detail}</small></div><b>PDF + Word</b></div></article>)}</section>
    <p className="document-model-note">Os arquivos são gerados nos respectivos módulos após o cadastro do documento. Este painel apresenta somente o padrão visual e não cria informações de exemplo.</p>
  </>;
}
