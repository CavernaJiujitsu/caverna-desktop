# PRD — Entrada desktop e seleção de contexto da gestão

> Registro histórico da interface inicial. A integração corrente com contrato backend confirmado está em [../98-real-management-contexts/spec.md](../98-real-management-contexts/spec.md); não há mais contexto local de fallback no fluxo de produto.

Fonte: [Trello #99](https://trello.com/c/1oAZ32Rz/99-fe-criar-entrada-desktop-e-sele%C3%A7%C3%A3o-de-contexto-da-gest%C3%A3o) · Revisão: 2026-10-29 · Estado: implementação inicial concluída; revisão de contratos pendente

Cartão em **In Progress**, etiqueta FRONT, responsável Gabriel Godoi. Não há checklists, comentários ou anexos no cartão; os critérios estão na descrição.

## Problema e objetivo

Pessoas que atuam na gestão precisam entrar no desktop com seu login pessoal e trabalhar no contexto de plataforma, academia ou professor ao qual têm acesso. O resultado desejado é selecionar um contexto autorizado antes de consultar dados, com navegação adequada ao perfil.

## Escopo

- Entrada desktop, estados de autenticação e seleção entre contextos fornecidos pela API.
- Navegação distinta para plataforma, academia e professor; troca de contexto, saída, sessão expirada e acesso negado.
- Coordenação com a [integração de login #78](https://trello.com/c/MFcsqzLc), reutilizando seus contratos quando disponíveis. Não recriar a tela de login móvel.
- Fora do escopo: recorrência, matrícula fixa semanal, check-in do aluno, marketplace, comunidade e campeonatos; implementação das regras de autorização no backend.

## Fluxo pretendido

1. A pessoa informa suas credenciais pessoais na entrada desktop. Validação, envio e falhas ficam visíveis.
2. Após autenticação e obtenção dos contextos disponíveis, a pessoa escolhe academia/perfil antes de consultar dados de gestão.
3. A navegação corresponde ao contexto escolhido. A pessoa pode trocar de contexto ou sair; sessão expirada e acesso negado recebem tratamento específico.

O comportamento com nenhum ou apenas um contexto, retomada de sessão e destinos concretos permanecem decisões abertas; o fluxo acima não presume seleção automática.

## Critérios de aceite originais

- [x] Login desktop com carregamento, validação de campos e erro de credenciais. (Interface pronta; envio real depende do contrato da API #78.)
- [ ] Mostrar só contextos retornados pela API; escolher academia/perfil antes de consultar dados. (Interface pronta; consumo da API depende do contrato #98.)
- [x] Navegação distinta para plataforma, academia e professor. (Interface pronta; destinos reais dependem do contrato #98.)
- [ ] Tratar sessão expirada, saída, troca de contexto e acesso negado. (Páginas de expiração e acesso negado prontas; lógica de sessão real depende do contrato #78.)
- [x] Não recriar a tela de login móvel; coordenar com a integração existente #78. (Login móvel não foi recriado.)

Validar navegação por teclado e sessão de cada papel, incluindo usuário com vários contextos, conforme o cartão. Critérios adicionais propostos e sua verificação estão na [especificação técnica](spec.md).

## Status da implementação (branch feat/99-entrada-desktop-contexto-gestao)

- Interface de entrada (`/login`), seleção de contexto (`/management`), sessão expirada (`/session-expired`) e acesso negado (`/access-denied`) implementadas.
- Rotas `dashboard` e `academies` protegidas por sessão e contexto selecionado.
- Tratamento global de 401 (expiração) e 403 (acesso negado) via interceptor HTTP.
- Os contratos de API (endpoints, DTOs, transporte de credenciais, CSRF, logout, renovação) estão marcados como `CONTRACT PENDING #78/#98` nos serviços e não apontam para um backend real até serem confirmados.
- Testes de serviço, sessão, login e seleção de contexto implementados e passando.
- Lint, typecheck e build passam.

- [x] Implementação da interface: concluída nesta entrega.
- [ ] PR: pendente (abrir após confirmação dos contratos #78 e #98).

## Design e dependências

- Figma: [01 Entrar na gestão](https://www.figma.com/design/cElkXHrDPF0phVvMdIyExb/Caverna-jiujitsu?node-id=319-75), [02 Escolher contexto](https://www.figma.com/design/cElkXHrDPF0phVvMdIyExb/Caverna-jiujitsu?node-id=319-76), [18 Acesso negado](https://www.figma.com/design/cElkXHrDPF0phVvMdIyExb/Caverna-jiujitsu?node-id=319-92). Os links são referências do cartão; os quadros não foram inspecionados nesta análise. Segundo o cartão, a revisão visual final das telas 11–18 está pendente.
- [Backend #98](https://trello.com/c/5srH5hR2/98-be-autorizar-acessos-por-perfil-academia-e-professor-respons%C3%A1vel), em To do na leitura: deve retornar contextos e validá-los no servidor em cada operação. Depende da modelagem [#97](https://trello.com/c/UXUqm8J9/97-be-modelar-perfis-gest%C3%A3o-de-academia-e-unidade-de-origem-do-aluno).
- #78 aparece em Done no Trello, mas a branch atual deste repositório contém apenas uma tela de login provisória e guarda fechada; localização e possibilidade de reutilização da integração devem ser confirmadas.

## Decisões para revisão

- Qual o comportamento para zero ou um contexto, contexto revogado e troca durante trabalho em andamento?
- Quais destinos e opções de navegação pertencem a cada perfil? Como apresentar os contextos e eventuais nomes duplicados?
- Qual a experiência exata para 401, 403, saída e retorno após expiração? Qual texto e ação para ausência de acesso?
- Confirmar contratos, transporte e ciclo de vida da sessão com os responsáveis por #78 e #98 antes da implementação dependente.

Implementação e PR: ainda não existem nesta entrega.
