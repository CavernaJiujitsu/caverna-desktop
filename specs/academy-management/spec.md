# Gestão de academia no desktop

## Problema e objetivo

Administradores da plataforma precisam consultar cavernas, suas unidades e
gestores. Administradores de caverna e da plataforma precisam administrar
professores e matrículas de alunos, sempre com o token Bearer da sessão desktop
e com o backend como autoridade de escopo.

## Escopo

- ADMIN: listar cavernas, consultar unidades e gestores de uma caverna,
  criar/vincular e remover gestores.
- ADMIN e CAVE_ADMIN: listar, criar, editar, detalhar e remover professores;
  vincular e desvincular professores de unidades.
- ADMIN e CAVE_ADMIN: listar, vincular e desvincular alunos de uma unidade.
- Usar apenas os endpoints e DTOs contratados para essas operações.

Fora do escopo: edição de gestores, detalhe ou histórico administrativo de
alunos, histórico de unidade e qualquer operação não contratada.

## Requisitos funcionais

1. A rota de cavernas é visível somente no contexto de plataforma.
2. O detalhe de uma caverna consulta unidades e gestores pelos endpoints
   contratados; não consulta, suspende nem edita a caverna.
3. A lista de professores usa paginação, busca e `caveId` apenas quando o
   contexto confirmado é de academia.
4. O detalhe de professor permite PATCH, DELETE e os vínculos avulsos
   contratados. O formulário de criação envia `name`, `email`, `password` e,
   quando unidades específicas forem selecionadas, `caveUnitIds` como objetos
   `{ caveUnitId, caveName }`. Sem seleção, omite `caveUnitIds` para criar o
   vínculo no nível da caverna. O formulário de edição envia somente campos
   que a pessoa optou por atualizar.
5. Matrículas mostram somente alunos da unidade selecionada e permitem os dois
   comandos contratados.
6. Erros 403 aparecem como "Sem permissão". Outros erros podem mostrar
   exclusivamente a string `message` do envelope de erro, conforme contrato.

## Contratos

- Sucesso: `{ message?, data, timestamp }`.
- Lista paginada de professores: `data.data`, `data._meta`, `data._links`.
- Todos os IDs de rota e formulário são UUIDs validados no cliente. O cliente
  não conclui que um UUID pertence à caverna atual; a API decide isso em cada
  operação.

## Estados de interface

- Carregando, vazio, sucesso, erro e repetição para cada consulta.
- Formulários bloqueiam envio duplicado e preservam os valores em falha.
- 403: "Sem permissão"; 404, validação, rede e indisponibilidade têm feedback
  seguro.

## Critérios de aceite

- [ ] ADMIN lista cavernas e, ao abri-las, vê unidades e gestores.
- [ ] ADMIN cria/vincula e remove gestor sem oferecer PATCH.
- [ ] ADMIN e CAVE_ADMIN listam professores com o escopo de API apropriado.
- [ ] ADMIN e CAVE_ADMIN criam, alteram, removem e gerenciam vínculos de
      professores pelos endpoints contratados.
- [ ] ADMIN e CAVE_ADMIN listam, vinculam e desvinculam alunos por UUID de
      unidade, sem detalhe ou histórico administrativo.
- [ ] Rotas e ações respeitam a guarda de contexto de UX; a API continua sendo
      a autoridade.

## Testes

- Serviços: URL, query, payload e parsing do envelope/paginação.
- Componentes: carregamento, vazio, erro, busca/paginação, formulário e ações
  de vínculo.
- Rotas: acesso de plataforma versus academia e detalhe de professor.

## Decisões e dependências

- O seletor de criação usa `GET /caves/:caveId/units` no contexto da caverna
  ativa. O cliente valida os UUIDs selecionados e a API continua responsável
  por autorizar a operação.
- A criação de professor em escopo de caverna omite `caveUnitIds`. O backend
  deve associar o professor às unidades existentes e futuras.
- O formulário de criação de horário lista professores e unidades pelo nome.
  `teacherId` é obrigatório; `caveUnitId` é opcional e sua omissão deve fazer o
  backend usar o escopo autenticado da caverna e todas as unidades existentes
  e futuras.
- O backend ainda precisa aceitar `caveUnitIds` como objetos e aplicar os
  comportamentos de caverna descritos acima.
- Os formulários de vínculo avulso e edição que ainda recebem
  `caveUnitId` continuam limitados pelos contratos atuais.
