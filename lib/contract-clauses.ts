const serviceClauses: Record<string, string> = {
  "Automação residencial": "Os dispositivos, integrações, cenários e acessos serão limitados ao escopo aprovado. A compatibilidade com equipamentos de terceiros será validada antes da ativação.",
  "Alarmes monitorados": "Sensores, zonas, meios de comunicação, contatos de emergência e rotina de testes serão definidos no escopo. O cliente manterá os contatos autorizados atualizados.",
  "Câmeras de segurança / CFTV": "Pontos de captura, retenção, acesso às imagens e conectividade obedecerão ao escopo. O cliente é responsável pela finalidade legítima das gravações e pelas autorizações aplicáveis.",
  "Controle de acesso": "Perfis, credenciais, horários e responsáveis pela autorização serão definidos pelo cliente. Inclusões e revogações de usuários deverão ser solicitadas por pessoa autorizada.",
  "Concertinas": "A instalação respeitará o perímetro aprovado, as condições físicas do local e as regras vigentes. Adequações estruturais não previstas dependerão de aprovação adicional.",
  "Cercas elétricas": "O perímetro, a sinalização, o aterramento e os dispositivos de proteção seguirão o escopo e as exigências técnicas vigentes. A energização ocorrerá após os testes previstos.",
  "Desenvolvimento de aplicações": "Funcionalidades, entregáveis, critérios de aceite, ambientes e limites de suporte serão os descritos no escopo. Solicitações fora do escopo serão avaliadas e orçadas separadamente.",
  "Interfonia e vídeo porteiro": "Pontos, ramais, unidades, fechaduras e integrações serão os previstos no escopo. A qualidade dependerá também da infraestrutura e conectividade disponíveis no local.",
  "Motores automatizadores de portão": "O dimensionamento considerará peso, ciclos, estrutura e condições do portão. Correções civis, serralheria ou alimentação elétrica não previstas dependerão de autorização adicional.",
  "Imagens de alta resolução com drone": "A operação dependerá das condições meteorológicas, segurança do local e autorizações vigentes. O cliente informará restrições de acesso e obterá consentimentos relativos ao imóvel e às pessoas sob sua responsabilidade.",
};

export function buildContractClauses(serviceMode: string, serviceType: string) {
  const modeClause = serviceMode === "Manutenção"
    ? "A manutenção abrangerá diagnóstico e execução exclusivamente dos itens aprovados. Peças, materiais e serviços adicionais dependerão de autorização do cliente."
    : "A instalação compreenderá montagem, configuração, testes e orientação de uso exclusivamente dos itens descritos no escopo aprovado.";
  const specific = serviceClauses[serviceType] ?? "As condições específicas do serviço serão as descritas no escopo aprovado pelas partes.";
  return [
    "1. OBJETO — Prestação do serviço identificado neste contrato, conforme escopo, modalidade e valores registrados.",
    `2. MODALIDADE — ${modeClause}`,
    `3. CONDIÇÃO ESPECÍFICA — ${specific}`,
    "4. ACESSO E COOPERAÇÃO — O cliente disponibilizará acesso seguro ao local, informações corretas e responsável autorizado para acompanhamento e aceite.",
    "5. MATERIAIS E EQUIPAMENTOS — Somente os itens expressamente aprovados integram o valor. Substituições serão registradas na ordem de serviço.",
    "6. PRAZOS E ACEITE — Datas dependem da disponibilidade acordada, do acesso ao local e dos materiais. O aceite será registrado após a entrega ou atendimento.",
    "7. PAGAMENTO — Aplicam-se as condições de pagamento preenchidas neste contrato. Atrasos e encargos somente serão cobrados quando expressamente previstos e permitidos.",
    "8. GARANTIA — Aplicam-se exclusivamente o prazo e as condições de garantia preenchidos neste contrato e na ordem de serviço, observadas as exclusões informadas.",
    "9. DADOS E CONFIDENCIALIDADE — Dados pessoais e credenciais serão tratados apenas para execução, suporte, segurança, comprovação e obrigações aplicáveis, com acesso restrito.",
    "10. RESCISÃO — A rescisão deverá ser comunicada por meio verificável. A multa, quando preenchida, incidirá nos limites do contrato e da legislação aplicável, sem afastar valores já vencidos ou serviços executados.",
    "11. RESPONSABILIDADES — Cada parte responderá pelas informações, autorizações, acessos e obrigações sob sua responsabilidade. Eventos fora do controle razoável serão documentados.",
    "12. REGISTROS — Orçamentos, ordens de serviço, fotos autorizadas, aceite eletrônico e trilha de auditoria poderão integrar a comprovação da execução.",
  ].join("\n\n");
}
