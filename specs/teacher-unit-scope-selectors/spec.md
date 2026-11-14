# Seletores de unidades para professores e horários

## Problema e objetivo

Os formulários de professor e horário pedem UUIDs de unidade/professor,
forçando o administrador a conhecer identificadores internos. Os formulários
devem oferecer seletores legíveis e permitir escopo de caverna quando não
houver vínculo com uma unidade específica.

## Escopo

- Criar professor com seleção de várias unidades da caverna ativa.
- Permitir criar professor sem selecionar unidade; nesse caso, omitir
  `caveUnitIds` para que o backend associe o professor à caverna e a todas as
  unidades existentes e futuras.
- Criar horário com dropdown de professor e unidade da caverna ativa.
- Manter professor obrigatório no horário. A unidade é opcional; sem unidade
  selecionada, omitir `caveUnitId` e deixar o backend aplicar o escopo da
  caverna autenticada a todas as unidades existentes e futuras.
- Não alterar os identificadores persistidos nem expô-los nos formulários.

Fora do escopo: alterar o backend, editar vínculos de professor no detalhe,
selecionar unidades de outras cavernas e mudar os contratos de leitura de
horários.

## Requisitos

- A criação de professor exibe o checkbox “Adicionar a unidade”. Marcado,
  habilita um dropdown multi-select e exige uma ou mais unidades. Desmarcado,
  omite `caveUnitIds`.
- O tooltip explica que marcar a opção vincula o professor somente às unidades
  selecionadas.
- A criação de horário lista professores e unidades pelo nome; ambos são
  carregados do escopo da caverna ativa.
- Unidades e professor são enviados por seus IDs internamente.
- Carregamento, erro, ausência de unidades e ausência de professores têm
  estados explícitos; falha ao carregar o catálogo não pode ser confundida com
  uma caverna sem unidades.
- Edição de horário mantém unidade e professor imutáveis, conforme o contrato
  atual.

## Contratos e tipos

- Unidades: `GET /caves/:caveId/units`, já usado pelo serviço de academias.
- Professores: `GET /teachers` com `caveId`, paginação e busca; o seletor
  carrega todas as páginas do catálogo da caverna.
- Criação de professor: `POST /teachers` recebe `name`, `email`, `password`
  e, somente quando houver unidades específicas, `caveUnitIds` como array de
  `{ caveUnitId, caveName }`.
- Criação de horário: `POST /training/schedules` recebe os campos existentes,
  `teacherId` obrigatório e `caveUnitId` somente quando uma unidade for
  selecionada.
- O backend deve inferir a caverna do contexto autenticado e interpretar a
  omissão de `caveUnitIds`/`caveUnitId` como vínculo à caverna inteira, incluindo
  unidades futuras. Esta aplicação contém somente o desktop; essa adaptação e
  sua validação permanecem dependência do backend.

## Estados de interface

- Carregando, vazio, sucesso, erro com repetição e validação.
- Sem unidades: informar que o escopo será a caverna e permitir criar sem
  `caveUnitIds`/`caveUnitId`.
- Sem professores: informar que é necessário cadastrar um professor antes do
  horário e impedir o envio.
- Erros de mutação preservam valores e usam as mensagens seguras já adotadas.

## Critérios de aceite

- [ ] Nenhum UUID precisa ser digitado para criar professor ou horário.
- [ ] Selecionar unidades envia seus IDs e o nome da caverna no formato
      confirmado.
- [ ] Desmarcar “Adicionar a unidade” omite `caveUnitIds`.
- [ ] Sem unidades, o formulário permite criação em escopo de caverna sem
      enviar UUID de unidade.
- [ ] O formulário de horário mostra nomes, exige professor e permite unidade
      vazia.
- [ ] Falhas ao consultar unidades/professores são visíveis e não simulam lista
      vazia.

## Testes

- Testes de formulário verificam seleção, validação, payloads com/sem unidade,
  e estados de carregamento/erro/vazio.
- Testes de serviço verificam o novo DTO de criação de professor.
- Executar lint, typecheck, testes e build.

## Dependências e decisões

- Confirmado pelo responsável: campo `caveUnitIds` é um array de
  `{ caveUnitId, caveName }`.
- Confirmado pelo responsável: professor é obrigatório no horário.
- Confirmado pelo responsável: seletores mostram apenas unidades da caverna
  ativa; o backend identifica a caverna pelo contexto autenticado.
- Backend ainda precisa aceitar os novos objetos e tratar omissão de IDs como
  escopo de caverna, incluindo unidades futuras.
