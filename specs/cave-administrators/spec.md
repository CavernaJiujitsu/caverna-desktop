# Feature: Administradores de caverna

Source task/spec: solicitação do produto em 14/11/2026.

## Problem and objective

Administradores globais e gestores de uma caverna precisam conceder e revogar
somente o acesso de gestão da caverna, sem criar uma interface para promoção
global ou exclusão de contas.

## Scope and non-scope

- In: página **Administradores**, escolha de caverna para contexto `platform`,
  caverna fixa para contexto `academy`, listagem, criação de conta, vínculo de
  conta existente e revogação confirmada.
- Out: busca de usuários, permissões granulares, edição de administrador,
  promoção a `ADMIN` global e exclusão de conta.

## Requirements

- Functional: o contexto `platform` lista cavernas e escolhe uma antes de
  carregar seus administradores; `academy` usa apenas a caverna fornecida pelo
  contexto. POST aceita os dois DTOs contratados e DELETE remove somente o
  vínculo. Mutações invalidam a lista.
- Non-functional: chamadas passam pelo Axios central com Bearer token; Zod
  valida envelope e formulário; modal, abas, formulários e confirmação são
  acessíveis; senha não é renderizada depois do envio.

## Contracts and types

- Confirmed endpoint/DTO/auth evidence: `GET /management/contexts`,
  `GET /platform/caves`, `GET|POST /platform/caves/:caveId/admins` e
  `DELETE /platform/caves/:caveId/admins/:adminId`, todos sob `/api/v1` e
  envelope `{ message?, data, timestamp }`.
- Context `academy` precisa incluir `caveId` para fixar o escopo. O cliente
  também aceita o `caveId` já presente na sessão como compatibilidade com o
  contrato de login existente. Se ambos faltarem, a página informa que não é
  possível identificar a caverna, em vez de adivinhar um id.

## Interface and error states

Carregando cavernas/lista, nenhuma caverna selecionada, lista vazia, erro com
nova tentativa, erro de formulário e toasts de sucesso/erro. 401 é tratado
globalmente como sessão expirada; 403 mostra a mensagem específica. Depois de
revogar o próprio vínculo, um 403 no próximo carregamento leva a pessoa de
volta aos contextos para revalidar a sessão.

## Acceptance criteria

- [ ] ADMIN escolhe uma caverna e CAVE_ADMIN não pode trocá-la.
- [ ] A lista mostra nome, e-mail e revogação confirmada sem excluir conta.
- [ ] As abas aceitam nova conta (senha mínima de 8) e UUID de conta existente.
- [ ] POST/DELETE atualizam a lista e apresentam retorno de 400, 403, 404 e
      409 de forma segura.
- [ ] Não há UI ou chamada para promover ADMIN global, editar admins ou buscar
      usuários.

## Test plan

Testar o contrato HTTP/envelope e payloads dos dois POSTs; testar a página nos
estados de seleção, vazio, validação, criação, confirmação e erro de
permissão com hooks simulados. Executar lint, typecheck, testes e build.

## Dependencies and decisions

A autenticação Bearer e o redirecionamento global de 401 já pertencem ao Axios
e aos interceptores da aplicação. Não há endpoint de busca para o `userId`;
o campo permanece textual e validado como UUID.
