export type LandingContent = {
  heroEyebrow: string; heroTitle: string; heroDescription: string;
  solutionsTitle: string; solutionsDescription: string;
  portfolioTitle: string; portfolioDescription: string;
  processTitle: string; processDescription: string;
  technologyTitle: string; technologyDescription: string;
  quoteTitle: string; quoteDescription: string; footerDescription: string;
};

export type PublicPortfolioItem = {
  id: string; title: string; area: string; serviceType: string; serviceMode: string; city: string; completedAt: string;
  summary: string; altText: string; featured: boolean; sortOrder: number; status?: string; imageName?: string; imageUrl: string;
};

export const defaultLandingContent: LandingContent = {
  heroEyebrow: "Segurança eletrônica • Automação • Tecnologia",
  heroTitle: "Tecnologia que protege, conecta e simplifica.",
  heroDescription: "Projetos de instalação e manutenção pensados para residências, condomínios e empresas — do diagnóstico à documentação do serviço.",
  solutionsTitle: "Proteção e tecnologia sob medida para o seu espaço.",
  solutionsDescription: "Escolha a necessidade principal. Na proposta, o serviço é detalhado como instalação ou manutenção, com escopo e condições definidos.",
  portfolioTitle: "Serviços realizados pela Security3C.",
  portfolioDescription: "Conheça registros reais publicados pela equipe, com o tipo de serviço e o atendimento executado.",
  processTitle: "Do primeiro contato à execução, com clareza em cada etapa.",
  processDescription: "O orçamento nasce da necessidade informada e separa corretamente o tipo de atendimento, os serviços e o escopo.",
  technologyTitle: "Tecnologia integrada para diferentes ambientes.",
  technologyDescription: "Conheça recursos visuais e soluções que podem compor projetos de segurança eletrônica, automação e conectividade.",
  quoteTitle: "Conte o que você precisa. A solicitação entra direto na gestão comercial.",
  quoteDescription: "Preencha os dados essenciais para a equipe entender o serviço. Nenhum valor ou prazo é presumido no envio.",
  footerDescription: "Soluções em segurança eletrônica, automação e tecnologia, com atendimento organizado para instalação e manutenção.",
};

export function parseLandingContent(value: unknown): LandingContent {
  if (!value || typeof value !== "object") return defaultLandingContent;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.entries(defaultLandingContent).map(([key, fallback]) => {
    const candidate = String(input[key] ?? "").trim(); return [key, candidate || fallback];
  })) as LandingContent;
}
