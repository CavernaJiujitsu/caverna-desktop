# Finalização E2E do desktop

Referências: `docs/finalizacao-e2e/implementation-plan.md` (T-D01, T-D02,
T-D03, T-Q02, T-O01, aprovadas em 17/11/2026), `audit.md` §4 (Desktop) e o FRD
`docs/treinos-e-alunos/frd-treinos-e-alunos.md`, todos na raiz do workspace.

## Problema e objetivo

A auditoria encontrou fluxos que passam nos testes, mas falham contra a API
real:

- o nome do professor aparece sempre como "Professor não informado";
- a página Aulas perde aulas em silêncio;
- erros aparecem como lista vazia;
- avaliações param na primeira página;
- links levam o contexto `platform` para `/access-denied`;
- o período de Treinos maior que 31 dias é bloqueado em vez de limitado.

O objetivo é fechar esses fluxos e provar o resultado com e2e de navegador e
com CI.

## Escopo

- **T-D01:** o nome do professor vem de `teacher.user.name` em Aulas, Treinos e
  Horários. As fixtures seguem o payload real.
- **T-D02:**
  - Aulas envia `caveId` e pagina no servidor;
  - falha ao carregar unidades ou professores vira erro com "Tentar novamente";
  - o roster da unidade lista só vínculos ativos;
  - Avaliações pagina por `_meta`.
- **T-D03:**
  - período maior que 31 dias é limitado com aviso (FRD §7);
  - "Gerenciar aula" e "Validar faixa" só aparecem nos contextos que podem
    abrir a rota de destino (`canOpenRoute`, em `src/app/router/routes.ts`);
  - teste de `practitioner.service`.
- **Contrato e shared:**
  - `teacher.caveUnits[].caveId` aceita `null`;
  - mensagens de fallback do Axios em PT-BR;
  - `lang="pt-BR"`;
  - teste do interceptor de 401.
- **T-Q02:** Playwright em `e2e/` contra `npm run dev` e a API local.
- **T-O01:**
  - CI de PR (lint, typecheck, `test:run`, `format:check`, build);
  - deploy do SWA só em push para a branch principal;
  - headers de segurança básicos.

Fora do escopo: abrir `/classes` ou `/evaluations` para `platform` (seria uma
DEC), CSP (proposta numa DEC) e qualquer regra de negócio ou autorização no
cliente.

## Contratos

O backend é a fonte. O formato abaixo foi conferido com `curl` em 17/11/2026.

- Lista paginada: `{ message, data: { data: T[], _meta: { page, totalPage, total }, _links }, timestamp }`.
- Erro: `{ message, timestamp, path }`.
- **C1:** em `GET /classes`, `/classes/:id`, `/training/schedules` e
  `/training/schedules/:id`, o `teacher` vem como `{ id, user: { id, name } }`.
  Ainda não foi entregue pela frente backend: hoje o `teacher` vem sem `user`.
  A UI mantém "Professor não informado" quando `user` falta.
- **C2:** `GET /memberships/students/cave-units/:caveUnitId/practitioners` lista
  só vínculos ativos.
- `GET /classes` aceita `caveId`, `caveUnitId`, `from`, `to`, `page` e `limit`,
  e devolve `enrolledCount` e `presentCount`.
- `GET /belt-validations` é paginado (limite padrão 20).
- Query params vazios não são enviados, porque a API recusa string vazia em
  UUID.

## Estados de interface

Toda lista tem estados separados de carregando, erro (com "Tentar novamente"),
vazio e sucesso. Erro nunca aparece como vazio.

## Critérios de aceitação

1. Com C1 entregue, Aulas, Treinos e Horários mostram o nome real do
   professor, conferido com `curl`.
2. Aulas da caverna aparecem por página, sem filtro no cliente e sem
   `limit: 100`.
3. Falha em unidades ou professores mostra erro, não "Nenhuma aula
   encontrada".
4. Avaliações navega além das 20 primeiras.
5. Período de 40 dias vira 31 dias, com aviso.
6. No contexto `platform`, "Gerenciar aula" e "Validar faixa" não aparecem.
7. As jornadas Playwright de T-Q02 passam contra a API local.
8. `lint`, `typecheck`, `test:run`, `format:check` e `build` passam.

## Testes

- Vitest e RTL por estado: carregando, erro, vazio e sucesso.
- Fixtures copiadas de respostas reais.
- Regressões provadas quebrando o código.
- Playwright para as jornadas de navegador.

## Decisões em aberto

As decisões ficam em `docs/finalizacao-e2e/Decisions/desktop-decisions.d/`,
na raiz do workspace.
