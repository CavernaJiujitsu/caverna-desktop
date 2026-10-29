# Especificação técnica — Entrada e contexto da gestão

Origem: [PRD](prd.md) · [Trello #99](https://trello.com/c/1oAZ32Rz/99-fe-criar-entrada-desktop-e-sele%C3%A7%C3%A3o-de-contexto-da-gest%C3%A3o) · Estado: proposta, dependente de revisão de contratos

## Estado atual e proposta

Na branch atual, `src/features/auth/pages/login-page.tsx` é um placeholder; `src/app/router/protected-route.tsx` mantém rotas fechadas; `src/shared/lib/axios.ts` centraliza HTTP e normaliza 401/403, mas não configura credenciais ou CSRF. A página inicial usa adaptador de academias em memória, não uma API de gestão. O estado do cartão #78 não comprova integração neste repositório.

Proposta sujeita ao contrato: `app` compõe rotas e layouts; a feature de autenticação mantém formulário, coordenação de sessão e serviço reutilizável; a seleção de contexto e navegação ficam em módulos de domínio apropriados. Hooks coordenam TanStack Query; serviços usam Axios centralizado e propagam AbortSignal quando aplicável. Validar formulários e respostas externas com Zod. Reutilizar componentes existentes após comparar as telas. Não criar armazenamento global para espelhar cache remoto ou duplicar tokens.

## Requisitos funcionais e estados

- Autenticar com credenciais pessoais usando contrato confirmado. Exibir validação, carregamento que impeça submissões repetidas, erro seguro de credenciais e falha de rede com nova tentativa.
- Com sessão verificada, carregar somente os contextos retornados pela API; apresentar carregamento, falha recuperável, lista e ausência de contextos. A ação concreta no estado vazio depende de decisão de produto.
- Não consultar dados de gestão antes de escolher um contexto autorizado; manter rotas fechadas enquanto sessão ou contexto não forem conhecidos. Após seleção, apresentar navegação apropriada ao papel.
- Na troca, impedir apresentação de dados do contexto anterior no novo contexto; chaves de consulta e invalidação/remoção devem respeitar a identidade de contexto. O tratamento de operações pendentes depende do contrato e decisão de produto.
- Tratar 401 de sessão expirada e 403 de acesso negado separadamente, sem expor dados sensíveis; suportar saída conforme contrato confirmado. A proteção de recursos e validação de contexto são responsabilidade do servidor em cada operação.
- Interface responsiva, semântica e acessível por teclado, com rótulos, foco e mensagens de estado perceptíveis. Evitar segredos em logs e mensagens.

## Contratos e decisões pendentes

Não há endpoint, DTO, formato de perfil/contexto ou mecanismo de seleção confirmado nesta análise. Confirmar com #78 e #98: autenticação e verificação de sessão; resposta e identidade dos contextos; como enviá-los em cada operação; logout, expiração, renovação, revogação, 401/403; transporte de credenciais, armazenamento, CORS e CSRF quando aplicáveis. Não inventar endpoints ou regras de autorização. Confirmar rotas, capacidades por perfil, ausência/seleção única de contexto e tratamento de retorno à sessão. A revisão visual dos quadros Figma também permanece pendente nesta análise.

Leitura posterior do backend local em 2026-10-29: `POST /api/v1/auth/login` é um contrato existente **para praticantes**. O serviço atual rejeita com 403 uma conta sem `practitioner`; o JWT não carrega permissões e as demais rotas ainda não exigem autorização. Portanto, esse contrato não satisfaz a entrada da gestão do cartão #99. A interface desta branch não o chama.

## Rastreabilidade e plano de testes

| Critério                                        | Origem                                         | Verificação planejada                                                                                                                              |
| ----------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login com validação, carregamento e erro        | #99                                            | Testes de formulário: campos inválidos, envio único, sucesso, credenciais inválidas e rede.                                                        |
| Apenas contextos da API; escolha antes de dados | #99                                            | Integração com fronteiras simuladas: múltiplos contextos, vazio, falha e nenhuma consulta de gestão antes da escolha.                              |
| Navegação por plataforma, academia e professor  | #99                                            | Testes de rota e navegação para cada papel, após confirmação dos destinos.                                                                         |
| Expiração, saída, troca e acesso negado         | #99                                            | Testes de 401/403, logout, troca e isolamento de dados em cache; simular contexto revogado conforme contrato.                                      |
| Reutilizar integração e não recriar login móvel | #99                                            | Revisão de código e contrato com responsáveis de #78.                                                                                              |
| Teclado e segurança                             | Proposta; validação de teclado prevista em #99 | Testar foco e operação por teclado; verificar guarda fechada e ausência de dados de outro contexto. Autorização real requer testes de backend #98. |

Usar testes de componente e integração com API simulada; validar manualmente as jornadas e o visual após acesso aos designs. Antes de entregar implementação, executar lint, typecheck, testes e build previstos pelo projeto. Nenhum teste de implementação foi executado nesta etapa documental.

## Rastreabilidade de entrega

- Implementação de interface: `src/features/auth/components/login-form.tsx`, `src/features/auth/pages/`, `src/features/management/` e rotas em `src/app/router/`. A prévia local em `/preview/management` usa exemplos explicitamente fictícios; `/login` valida campos, mas não envia credenciais. `/dashboard` e `/academies` continuam fechadas.
- Testes de interface: formulário, estados da seleção de contexto e navegação ilustrativa por papel. Integração com API, isolamento de cache real, autenticação e autorização continuam pendentes do backend #98 e da revisão do contrato #78.
- Revisão visual: os quadros 01, 02 e 18 foram vistos no navegador em 2026-10-29 e a interface adotou a composição escura com destaques laranja e verde-água. O conector Figma solicitou reautenticação, portanto não houve acesso aos detalhes de tokens, componentes ou assets; a correspondência visual fina permanece pendente.
- PR: pendente.
