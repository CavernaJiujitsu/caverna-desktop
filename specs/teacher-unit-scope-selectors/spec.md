# Seletores de unidades para professores e horários

## Problema e objetivo

Os formulários de professor e horário pediam UUIDs de unidade/professor e não
funcionavam fora do contexto de caverna. Eles devem oferecer seletores
legíveis, derivados do escopo do contexto confirmado.

## Escopo

- Criar professor com nome, e-mail, senha inicial (mín. 8) e seleção opcional
  de unidades:
  - plataforma: escolher a caverna e depois as unidades (opcional);
  - caverna: unidades da própria caverna, com ao menos uma obrigatória.
- Detalhe do professor lista todas as unidades do escopo (todas as cavernas na
  plataforma, a própria caverna para o gestor) com caixas de seleção; marcar
  ou desmarcar vincula/desvincula imediatamente.
- Remover o professor remove somente o perfil (a conta é mantida se tiver
  outros acessos); 409 se houver aulas.
- Horários: no contexto de professor, o professor é fixo (a própria sessão) e
  as unidades vêm de `GET /teachers/:id`; no contexto de caverna, unidades da
  caverna e professores da caverna.

Fora do escopo: tornar um usuário existente professor (feito em "Usuários e
acessos" via `POST /platform/users/:id/access`).

## Contratos

- `GET /teachers` paginado `{ data, _meta, _links }`; item
  `{ id, userId, name, email, caveUnits: [{ id, name, caveId, caveName }] }`.
- `GET /teachers/:id` — mesmo item; fonte das unidades do professor.
- `POST /teachers { name, email, password, caveUnitIds? }`.
- `PATCH /teachers/:id { name?, email? }` (o desktop não usa `caveUnitIds`).
- `POST /memberships/teachers/cave-units { teacherId, caveUnitId }` e
  `DELETE /memberships/teachers/cave-units/:teacherId/:caveUnitId`.
- Unidades: plataforma `GET /platform/caves` (com `units`), caverna
  `GET /caves/:caveId/units`.

## Estados de interface

Carregando, vazio, erro com repetição e validação inline; erros do backend
(403/409) são exibidos com a mensagem retornada.

## Testes

- Criação exige unidade para gestor de caverna e não exige na plataforma.
- Serviço lê `caveUnits` de `GET /teachers/:id` e usa os endpoints de vínculo.
