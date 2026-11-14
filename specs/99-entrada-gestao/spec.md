# Especificação técnica — Entrada e contexto da gestão

Origem: [PRD](prd.md) · [Trello #99](https://trello.com/c/1oAZ32Rz/99-fe-criar-entrada-desktop-e-sele%C3%A7%C3%A3o-de-contexto-da-gest%C3%A3o) · Estado: implementação inicial concluída, dependente de confirmação de contratos com #78 e #98

## Estado atual e proposta

Na branch atual, `src/features/auth/pages/login-page.tsx` envia credenciais ao serviço de autenticação e carrega os contextos da gestão; `src/app/router/protected-route.tsx` exige sessão verificada e contexto selecionado; `src/shared/lib/axios.ts` centraliza HTTP e normaliza 401/403 com um interceptor que encaminha para expiração de sessão ou acesso negado. A camada de sessão compartilhada fica em `src/shared/session/` e os serviços de autenticação e contexto de gestão ficam em `src/features/auth/services/` e `src/features/management/services/`, respectivamente. Os endpoints estão marcados como `CONTRACT PENDING #78/#98` e não apontam para um backend real até os contratos serem confirmados.

Proposta sujeita ao contrato: `app` compõe rotas e layouts; a feature de autenticação mantém formulário, coordenação de sessão e serviço reutilizável; a seleção de contexto e navegação ficam em módulos de domínio apropriados. Hooks coordenam TanStack Query; serviços usam Axios centralizado e propagam AbortSignal quando aplicável. Validar formulários e respostas externas com Zod. Reutilizar componentes existentes após comparar as telas. Não criar armazenamento global para espelhar cache remoto ou duplicar tokens.

## Requisitos funcionais e estados

- Autenticar com credenciais pessoais usando contrato confirmado. Exibir validação, carregamento que impeça submissões repetidas, erro seguro de credenciais e falha de rede com nova tentativa.
- Com sessão verificada, carregar somente os contextos retornados pela API; apresentar carregamento, falha recuperável, lista e ausência de contextos. A ação concreta no estado vazio depende de decisão de produto.
- Não consultar dados de gestão antes de escolher um contexto autorizado; manter rotas fechadas enquanto sessão ou contexto não forem conhecidos. Após seleção, apresentar navegação apropriada ao papel.
- Na troca, impedir apresentação de dados do contexto anterior no novo contexto; chaves de consulta e invalidação/remoção devem respeitar a identidade de contexto. O tratamento de operações pendentes depende do contrato e decisão de produto.
- Tratar 401 de sessão expirada e 403 de acesso negado separadamente, sem expor dados sensíveis; suportar saída conforme contrato confirmado. A proteção de recursos e validação de contexto são responsabilidade do servidor em cada operação.
- Interface responsiva, semântica e acessível por teclado, com rótulos, foco e mensagens de estado perceptíveis. Evitar segredos em logs e mensagens.

## Revisão visual da seleção de contexto (2026-11-14)

Problema observado: a tela `/management` era a única entrada de gestão fora da superfície escura usada no login e no painel. Além disso, cada cartão exibia o papel (`Administrar plataforma`, `Gerenciar academia`) em vez do `label` retornado pela API; com mais de um contexto, o nome da caverna ou do professor ficava oculto. Com um único contexto, o cartão também ocupava a largura inteira sem uma composição de página.

Escopo desta revisão:

- Aplicar a superfície escura, os destaques laranja/verde-água e a marca Caverna já usados no login e na gestão.
- Compor a escolha em uma coluna central: cabeçalho da página, painel “Seus contextos”, contagem de acessos disponíveis e nota de troca posterior.
- Usar `context.label` como título do cartão, o papel como categoria e `context.detail` como complemento, com ícone específico por papel.
- Manter o cartão inteiro como botão, com foco visível, indicador “Acessar”, estado pendente “Validando…” e opções desabilitadas durante a confirmação.
- Disponibilizar saída no cabeçalho da página, além da ação existente no estado vazio.
- Preservar carregamento, erro recuperável, erro de troca, estado vazio e seleção por teclado.

Fora do escopo: contratos da API, destinos por papel, regras de autorização e mudanças no backend. O contrato usado continua sendo `GET /api/v1/management/contexts`, cujo `label` identifica a caverna ou o professor, e `POST /api/v1/management/contexts/switch` para confirmar a escolha.

Critérios de aceite:

- [x] O nome do contexto retornado pela API aparece como informação principal; o papel aparece como categoria.
- [x] A tela usa a mesma superfície escura e identidade visual do login/gestão em larguras pequenas e grandes.
- [x] Os estados de carregamento, erro, vazio, pendente e sucesso continuam visíveis e operáveis por teclado.
- [x] A saída da sessão está acessível na página e não interfere na escolha do contexto.

Testes: cobrir os rótulos dos contextos e o estado pendente no teste do componente; manter os testes de página para seleção, erro de troca e estado vazio; executar lint, typecheck, testes e build.

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

Usar testes de componente e integração com API simulada; validar manualmente as jornadas e o visual após acesso aos designs. Os testes de unidade foram executados e passam; antes de entregar a implementação final, executar lint, typecheck, testes e build previstos pelo projeto — todos passaram nesta entrega.

## Rastreabilidade de entrega

- Implementação de interface: `src/features/auth/components/login-form.tsx`, `src/features/auth/pages/`, `src/features/management/` e rotas em `src/app/router/`. A prévia local em `/preview/management` continua usando exemplos fictícios; `/login` envia credenciais ao serviço de autenticação e carrega contextos; `/management` seleciona o contexto autorizado e navega pelo papel; `/dashboard` e `/academies` exigem sessão e contexto selecionados.
- Testes de interface: formulário, serviço de autenticação, serviço de contextos, sessão compartilhada e página de seleção de contexto. Integração com API real, isolamento de cache real e autorização por operação continuam pendentes do backend #98 e da confirmação do contrato #78.
- Revisão visual: os quadros 01, 02 e 18 foram vistos no navegador em 2026-10-29 e a interface adotou a composição escura com destaques laranja e verde-água. O conector Figma solicitou reautenticação, portanto não houve acesso aos detalhes de tokens, componentes ou assets; a correspondência visual fina permanece pendente.
- PR: pendente. Antes de entregar, executar lint, typecheck, testes e build — todos passaram nesta entrega.
