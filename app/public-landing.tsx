"use client";

import * as React from "react";
import {
  ArrowRight, ArrowUpRight, AtSign, BellRing, Camera, Check, ChevronRight, CircleCheck,
  Cpu, DoorOpen, Drone, Fence, House, Menu, MessageSquareText,
  MonitorSmartphone, Play, ScanFace, ShieldCheck, Sparkles, Video, Wrench, X, MapPin, CalendarDays, Images,
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import type { LandingContent, PublicPortfolioItem } from "../lib/site-content-shared";

const services = [
  { title: "Automação residencial", text: "Cenários de iluminação, dispositivos e rotinas integradas.", icon: House },
  { title: "Alarmes monitorados", text: "Planejamento de sensores, centrais e alertas para o imóvel.", icon: BellRing },
  { title: "Câmeras de segurança / CFTV", text: "Projetos de CFTV para visualização e registro de imagens.", icon: Camera },
  { title: "Controle de acesso", text: "Soluções para organizar e proteger entradas e áreas restritas.", icon: ScanFace },
  { title: "Concertinas", text: "Proteção perimetral dimensionada para cada local.", icon: Fence },
  { title: "Cercas elétricas", text: "Instalação e manutenção de sistemas de proteção perimetral.", icon: ShieldCheck },
  { title: "Desenvolvimento de aplicações", text: "Soluções digitais construídas para necessidades específicas.", icon: Cpu },
  { title: "Interfonia e vídeo porteiro", text: "Comunicação e identificação de visitantes com mais controle.", icon: Video },
  { title: "Motores automatizadores de portão", text: "Instalação e manutenção de motores e acessórios de portões.", icon: DoorOpen },
  { title: "Imagens de alta resolução com drone", text: "Captação de imagens aéreas em alta resolução.", icon: Drone },
];

const serviceNames = services.map((service) => service.title);

export function PublicLanding({ canOpenDashboard, content, portfolio }: { canOpenDashboard: boolean; content: LandingContent; portfolio: PublicPortfolioItem[] }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setResult(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"), phone: data.get("phone"), email: data.get("email"),
          city: data.get("city"), serviceMode: data.get("serviceMode"), serviceType: data.get("serviceType"),
          message: data.get("message"), consent: data.get("consent") === "on", website: data.get("website"),
        }),
      });
      const payload = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar sua solicitação.");
      form.reset();
      setResult({ type: "success", message: payload.message || "Solicitação recebida. A equipe poderá entrar em contato pelos dados informados." });
    } catch (error) {
      setResult({ type: "error", message: error instanceof Error ? error.message : "Não foi possível enviar sua solicitação." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="#inicio" aria-label="Security3C — início">
          <img src="/securitytc-logo.png" alt="" />
          <span><strong>SECURITY3C</strong><small>Soluções Inteligentes</small></span>
        </a>
        <nav className={`landing-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navegação principal">
          <a href="#solucoes" onClick={() => setMenuOpen(false)}>Soluções</a>
          <a href="#realizados" onClick={() => setMenuOpen(false)}>Serviços realizados</a>
          <a href="#processo" onClick={() => setMenuOpen(false)}>Como trabalhamos</a>
          <a href="#tecnologia" onClick={() => setMenuOpen(false)}>Tecnologia</a>
          <a href="#orcamento" onClick={() => setMenuOpen(false)}>Orçamento</a>
          <a className="nav-instagram" href="https://www.instagram.com/security3c/" target="_blank" rel="noreferrer"><AtSign size={17} /> Instagram</a>
        </nav>
        <div className="landing-header-actions">
          <a className="restricted-link" href={canOpenDashboard ? "/acesso-restrito" : "/login"}>{canOpenDashboard ? "Abrir painel" : "Acesso restrito"}<ArrowUpRight size={16} /></a>
          <button className="landing-menu-button" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="inicio">
          <div className="hero-backdrop" aria-hidden="true"><img src="/media/security-camera-hero.webp" alt="" /></div>
          <div className="hero-grid landing-container">
            <div className="hero-copy">
              <span className="landing-eyebrow"><span /> {content.heroEyebrow}</span>
              <h1>{content.heroTitle}</h1>
              <p>{content.heroDescription}</p>
              <div className="hero-actions">
                <a className="landing-button landing-button-primary" href="#orcamento">Solicitar orçamento <ArrowRight size={18} /></a>
                <a className="landing-button landing-button-secondary" href="#solucoes">Conhecer soluções</a>
              </div>
              <div className="hero-proof" aria-label="Diferenciais do atendimento">
                <span><CircleCheck /> Instalação e manutenção</span>
                <span><CircleCheck /> Proposta personalizada</span>
                <span><CircleCheck /> Registro do atendimento</span>
              </div>
            </div>
            <aside className="hero-panel">
              <span className="hero-panel-number">10</span>
              <span className="hero-panel-kicker">frentes de solução</span>
              <h2>Um atendimento integrado para cada ambiente.</h2>
              <ul>
                <li><Check /> Segurança e perímetro</li>
                <li><Check /> Acesso e comunicação</li>
                <li><Check /> Automação e conectividade</li>
                <li><Check /> Aplicações e imagens aéreas</li>
              </ul>
              <a href="#orcamento">Fale sobre seu projeto <ChevronRight /></a>
            </aside>
          </div>
        </section>

        <section className="landing-context-strip" aria-label="Áreas atendidas">
          <div className="landing-container context-grid">
            <div><House /><span><strong>Residências</strong><small>Proteção, conforto e automação</small></span></div>
            <div><DoorOpen /><span><strong>Condomínios</strong><small>Acesso, perímetro e comunicação</small></span></div>
            <div><MonitorSmartphone /><span><strong>Empresas</strong><small>Controle e continuidade operacional</small></span></div>
          </div>
        </section>

        <section className="landing-section services-section" id="solucoes">
          <div className="landing-container">
            <div className="section-heading">
              <div><span className="landing-eyebrow"><span /> Soluções</span><h2>{content.solutionsTitle}</h2></div>
              <p>{content.solutionsDescription}</p>
            </div>
            <div className="services-grid">
              {services.map(({ title, text, icon: Icon }, index) => (
                <article className="service-card" key={title}>
                  <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="service-icon"><Icon /></span>
                  <h3>{title}</h3><p>{text}</p>
                  <a href="#orcamento" aria-label={`Solicitar orçamento para ${title}`}>Solicitar avaliação <ArrowUpRight /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section portfolio-section" id="realizados">
          <div className="landing-container">
            <div className="section-heading">
              <div><span className="landing-eyebrow"><span /> Portfólio real</span><h2>{content.portfolioTitle}</h2></div>
              <p>{content.portfolioDescription}</p>
            </div>
            {portfolio.length > 0 ? (
              <Carousel opts={{ align: "start", loop: portfolio.length > 3 }} className="portfolio-carousel">
                <CarouselContent>
                  {portfolio.map((item) => (
                    <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                      <article className="portfolio-card">
                        <div className="portfolio-image"><img src={item.imageUrl} alt={item.altText} loading="lazy" />{item.featured && <span className="portfolio-featured">Destaque</span>}</div>
                        <div className="portfolio-card-body">
                          <div className="portfolio-tags"><span>{item.serviceMode}</span><span>{item.serviceType}</span></div>
                          <h3>{item.title}</h3>
                          <p>{item.summary}</p>
                          {(item.city || item.completedAt) && <div className="portfolio-meta">{item.city && <span><MapPin />{item.city}</span>}{item.completedAt && <span><CalendarDays />{new Intl.DateTimeFormat("pt-BR").format(new Date(`${item.completedAt}T12:00:00`))}</span>}</div>}
                        </div>
                      </article>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="portfolio-prev" />
                <CarouselNext className="portfolio-next" />
              </Carousel>
            ) : (
              <div className="portfolio-empty"><span><Images /></span><div><strong>Portfólio em preparação</strong><p>Projetos reais serão publicados aqui pela equipe Security3C após o cadastro na área restrita.</p></div></div>
            )}
          </div>
        </section>

        <section className="landing-section process-section" id="processo">
          <div className="landing-container process-layout">
            <div className="process-intro">
              <span className="landing-eyebrow"><span /> Como trabalhamos</span>
              <h2>{content.processTitle}</h2>
              <p>{content.processDescription}</p>
              <a className="text-link" href="#orcamento">Iniciar uma solicitação <ArrowRight /></a>
            </div>
            <ol className="process-list">
              <li><span>01</span><div><strong>Entendimento da necessidade</strong><p>Você informa o ambiente, o serviço e se precisa de instalação ou manutenção.</p></div></li>
              <li><span>02</span><div><strong>Avaliação e proposta</strong><p>O escopo é organizado para apresentação do orçamento e das condições do atendimento.</p></div></li>
              <li><span>03</span><div><strong>Execução e registro</strong><p>Após a aprovação, o serviço pode ser documentado em contrato e ordem de serviço.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="landing-section media-section" id="tecnologia">
          <div className="landing-container">
            <div className="section-heading light-heading">
              <div><span className="landing-eyebrow"><span /> Tecnologia em foco</span><h2>{content.technologyTitle}</h2></div>
              <p>{content.technologyDescription}</p>
            </div>
            <div className="media-grid">
              <figure className="media-video-card">
                <video controls playsInline preload="metadata" poster="/media/security-camera-hero.webp">
                  <source src="/media/security3c-visao.webm" type="video/webm" />
                  Seu navegador não oferece suporte à reprodução de vídeo.
                </video>
                <figcaption><span><Play /> Apresentação visual</span><small>Imagens ilustrativas de segurança eletrônica e automação.</small></figcaption>
              </figure>
              <figure className="media-image-card"><img src="/media/smart-access.webp" alt="Ilustração de automação residencial e controle de acesso" /><figcaption><strong>Automação e acesso</strong><span>Sistemas pensados para funcionar em conjunto.</span></figcaption></figure>
              <figure className="media-image-card"><img src="/media/security-camera-hero.webp" alt="Ilustração de câmera de segurança em uma residência" /><figcaption><strong>Câmeras e monitoramento</strong><span>Visualização de ambientes residenciais e empresariais.</span></figcaption></figure>
            </div>
            <a className="instagram-banner" href="https://www.instagram.com/security3c/" target="_blank" rel="noreferrer"><span><AtSign /><span><strong>@security3c</strong><small>Acompanhe vídeos, imagens e novidades publicadas pela empresa.</small></span></span><ArrowUpRight /></a>
          </div>
        </section>

        <section className="landing-section quote-section" id="orcamento">
          <div className="landing-container quote-layout">
            <div className="quote-copy">
              <span className="landing-eyebrow"><span /> Solicite seu orçamento</span>
              <h2>{content.quoteTitle}</h2>
              <p>{content.quoteDescription}</p>
              <div className="quote-feature"><MessageSquareText /><div><strong>Contato organizado</strong><span>Seu pedido será registrado como lead para acompanhamento.</span></div></div>
              <div className="quote-feature"><Wrench /><div><strong>Instalação ou manutenção</strong><span>O tipo de atendimento já segue identificado desde o primeiro contato.</span></div></div>
              <div className="quote-feature"><ShieldCheck /><div><strong>Uso responsável dos dados</strong><span>As informações são usadas para responder à solicitação e registrar o atendimento.</span></div></div>
            </div>
            <form className="lead-form" onSubmit={submitLead}>
              <div className="lead-form-heading"><span>Fale com a Security3C</span><h3>Solicitação de orçamento</h3><p>Campos com * são obrigatórios.</p></div>
              <div className="lead-form-grid">
                <label className="field-wide"><span>Nome ou empresa *</span><input name="name" autoComplete="name" required maxLength={120} placeholder="Como podemos identificar você?" /></label>
                <label><span>Telefone / WhatsApp *</span><input name="phone" autoComplete="tel" required maxLength={30} inputMode="tel" placeholder="(00) 00000-0000" /></label>
                <label><span>E-mail</span><input name="email" type="email" autoComplete="email" maxLength={160} placeholder="seuemail@exemplo.com" /></label>
                <label><span>Cidade / UF</span><input name="city" autoComplete="address-level2" maxLength={100} placeholder="Onde será o atendimento?" /></label>
                <label><span>Tipo de atendimento *</span><select name="serviceMode" required defaultValue=""><option value="" disabled>Selecione</option><option>Instalação</option><option>Manutenção</option></select></label>
                <label className="field-wide"><span>Solução desejada *</span><select name="serviceType" required defaultValue=""><option value="" disabled>Selecione o serviço principal</option>{serviceNames.map((service) => <option key={service}>{service}</option>)}</select></label>
                <label className="field-wide"><span>Explique sua necessidade</span><textarea name="message" maxLength={1200} rows={5} placeholder="Descreva o ambiente, o problema ou o resultado esperado." /></label>
                <label className="lead-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
                <label className="lead-consent field-wide"><input name="consent" type="checkbox" required /><span>Autorizo o uso destes dados para retorno e registro desta solicitação de orçamento. Li o <a href="#privacidade">aviso de privacidade</a>. *</span></label>
              </div>
              {result && <div className={`lead-result ${result.type}`} role={result.type === "error" ? "alert" : "status"}>{result.type === "success" ? <CircleCheck /> : <Sparkles />}<span>{result.message}</span></div>}
              <button className="landing-button landing-button-primary lead-submit" type="submit" disabled={sending}>{sending ? "Enviando solicitação..." : "Enviar solicitação"}<ArrowRight /></button>
            </form>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container footer-main">
          <div className="footer-brand"><img src="/securitytc-logo.png" alt="Security3C Soluções Inteligentes" /><div><strong>SECURITY3C</strong><span>{content.footerDescription}</span></div></div>
          <div className="footer-links"><strong>Navegação</strong><a href="#solucoes">Soluções</a><a href="#realizados">Serviços realizados</a><a href="#processo">Como trabalhamos</a><a href="#orcamento">Solicitar orçamento</a></div>
          <div className="footer-links"><strong>Redes e acesso</strong><a href="https://www.instagram.com/security3c/" target="_blank" rel="noreferrer">Instagram @security3c</a><a href="https://www.instagram.com/evertonandradetc/" target="_blank" rel="noreferrer">Instagram @evertonandradetc</a><a href={canOpenDashboard ? "/acesso-restrito" : "/login"}>Área restrita</a></div>
        </div>
        <div className="landing-container footer-privacy" id="privacidade"><strong>Aviso de privacidade</strong><p>Os dados enviados no formulário são usados para responder ao pedido de orçamento e registrar o atendimento comercial. Não informe senhas, documentos ou outros dados sensíveis no campo de mensagem. Para solicitar correção ou exclusão, use os canais oficiais da Security3C.</p></div>
        <div className="landing-container footer-bottom"><span>© {new Date().getFullYear()} Security3C Soluções Inteligentes.</span><span>Imagens ilustrativas.</span></div>
      </footer>
    </div>
  );
}
