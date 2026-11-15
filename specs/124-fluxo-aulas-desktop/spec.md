# Feature: fluxo desktop de aulas

## Context and problem

As telas atuais de horários e aulas não refletem o fluxo operacional fornecido: a academia precisa localizar encontros, criar uma aula pontual, consultar inscritos e registrar chamada. A plataforma precisa de uma visão tabular das academias da rede.

## Objective

Entregar uma navegação clara para plataforma, administrador de academia e professor, usando os contratos já existentes de aulas e inscrições.

## Scope and non-scope

- In scope: painel de academias, rota de aulas no contexto de academia, lista/filtros, criação/edição de aula, detalhe de inscritos e chamada.
- Out of scope: inventar métricas de aulas por academia, reservas manuais, ou novos contratos de autorização.

## Functional requirements

1. O contexto de academia abre “Aulas”, não o cadastro de horários recorrentes.
2. A lista mostra unidade, data, professor, vagas e ações de editar, inscritos e chamada.
3. A criação usa unidade, professor, data, tipo, horários, capacidade e faixas permitidas.
4. A chamada confirma presença por inscrição via contrato já integrado.
5. A plataforma lista as academias em tabela e permite abrir o detalhe real.
6. Professores consultam validações agendadas e só recebem a ação de aprovar quando o backend permite.
7. A vinculação de professor a unidade usa apenas unidades selecionáveis da caverna atual.
8. A gestão da caverna navega por Alunos, Professores, Administradores, Aulas e Unidades; usuários globais ficam restritos à plataforma.

## Interface states

- Carregando, vazio, erro com tentativa novamente, formulário inválido, envio pendente e sucesso.

## Acceptance criteria

- [ ] A navegação de academia leva à lista de aulas.
- [ ] Uma aula pode ser criada e editada sem sair da página.
- [ ] Inscritos e chamada são visíveis a partir da aula selecionada.
- [ ] A plataforma mostra dados reais de academias/unidades, sem números fictícios.

## Test strategy

- Cobrir criação, validação, vazio e ação de chamada usando hooks mockados; manter testes de serviço para os contratos HTTP.

## Dependencies and technical decisions

- O cadastro de aulas usa `/classes`; recorrência semanal continua em `/training/schedules` como uma operação distinta.
- O histórico administrativo de outro aluno depende de endpoint ainda ausente; não será preenchido com dados locais fictícios.
- Ao aprovar a validação, o backend cria a trilha da faixa aprovada; não há endpoint separado de liberação.
