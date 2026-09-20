# PRD v2 — SecurityTC Gestão

## Objetivo

Plataforma privada de gestão comercial, contratual, técnica e financeira da SecurityTC, com classificação transversal dos atendimentos em **Instalação** ou **Manutenção**, cadastros persistentes e trilha de auditoria.

## Perfis e segurança

- Acesso autenticado e privado.
- Identificação do responsável pelas alterações.
- Exclusão lógica: o registro deixa a operação, mas permanece na auditoria.
- Histórico de criação, edição e exclusão, com estado anterior e posterior preservados no banco.

## Módulos

### Clientes

Cadastro, consulta, edição e exclusão controlada de pessoa física ou jurídica, documento, contato, telefone, e-mail, endereço, cidade, situação e observações.

### Orçamentos

Propostas classificadas obrigatoriamente como Instalação ou Manutenção. Incluem cliente, tipo de serviço, escopo ou problema informado, valor, validade e situação comercial.

### Contratos

Controle por cliente, modalidade, serviço, vigência, valor, situação, condições de pagamento, garantia e multa de rescisão. A plataforma sugere uma base editável de cláusulas gerais e específicas por serviço, que deve ser revisada pela SecurityTC antes do uso.

O aceite eletrônico simples registra nome, documento e e-mail declarados pelo signatário, data/hora, usuário autenticado e hash SHA-256 do conteúdo aceito. Alterações em conteúdo relevante após a assinatura invalidam a evidência anterior e exigem novo aceite. A plataforma não declara equivalência a assinatura qualificada ICP-Brasil sem integração com um provedor certificado.

### Ordens de serviço

Registro de instalação ou manutenção, problema informado, diagnóstico ou solução, materiais e acessórios utilizados ou substituídos, garantia informada, agenda, técnico e situação. Cada ordem aceita até 10 fotos JPG, PNG ou WEBP, com 8 MB por arquivo, armazenadas fora do banco e vinculadas por metadados auditáveis.

### Documentos em PDF

Geração automática e sob demanda de orçamento, contrato e ordem de serviço em PDF A4, usando exclusivamente os dados persistidos. Contratos assinados exibem a evidência do aceite e o hash de integridade; ordens de serviço exibem a quantidade de fotos anexadas.

### Catálogo

Produtos e serviços aplicáveis a instalação, manutenção ou ambos, com categoria, unidade, preço de referência, garantia informada e situação.

### Financeiro

Lançamentos vinculados a referências comerciais ou técnicas, com cliente, vencimento, valor, situação e observações.

### Relatórios

Indicadores calculados exclusivamente a partir dos registros cadastrados: volumes por módulo, instalação versus manutenção e situação financeira.

### Auditoria

Consulta cronológica de inclusões, alterações e exclusões, identificando módulo, registro, ação, responsável e data/hora.

## Requisitos funcionais

- RF01: permitir cadastro, consulta, busca, edição e exclusão lógica nos módulos operacionais.
- RF02: exigir Instalação ou Manutenção em orçamentos, contratos e ordens de serviço.
- RF03: permitir Instalação, Manutenção ou Ambos no catálogo.
- RF04: manter dados persistentes após recarregamento e troca de sessão.
- RF05: registrar auditoria automática em toda criação, edição e exclusão.
- RF06: gerar números automáticos para orçamento, contrato e ordem de serviço.
- RF07: calcular indicadores apenas com dados armazenados, sem números fictícios.
- RF08: funcionar em desktop e dispositivos móveis.
- RF09: gerar PDFs de orçamento, contrato e ordem de serviço.
- RF10: gerar cláusulas editáveis conforme modalidade e serviço, sem presumir valores, prazos ou garantias.
- RF11: registrar aceite eletrônico simples com hash de integridade e evento de auditoria.
- RF12: anexar, consultar e remover até 10 fotos por ordem de serviço.

## Regras de integridade

- Valores monetários são armazenados em centavos.
- Campos obrigatórios são validados no navegador e no servidor.
- Exclusões não apagam a evidência histórica.
- Dados comerciais, garantias, multas, prazos e cláusulas somente serão utilizados quando cadastrados ou aprovados pela SecurityTC.
- Alteração de conteúdo relevante em contrato assinado remove a evidência vigente e retorna o contrato para “Aguardando assinatura”.
- Fotos são privadas e servidas somente após autenticação.

## Evoluções futuras

- Integração opcional com provedor de assinatura avançada ou qualificada.
- Perfis de acesso por função e permissões detalhadas.
- Modelos de itens e composições de preço por orçamento.
