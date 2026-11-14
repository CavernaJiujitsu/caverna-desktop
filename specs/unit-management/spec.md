# Gerenciamento de unidades

## Problema e objetivo

Administradores precisam consultar e manter unidades da caverna autorizada no
desktop, incluindo unidades arquivadas, sem permitir que o escopo dependa de um
`caveId` arbitrário.

## Escopo e não escopo

- Inclui listar, buscar e paginar unidades; criar, consultar, editar, arquivar e
  reativar unidades; coordenadas informadas manualmente ou capturadas por GPS.
- Inclui entrada na navegação de gestão para `CAVE_ADMIN` e `ADMIN`.
- Não inclui mapa ou geocodificação: o desktop não possui componente/biblioteca
  de mapas e nenhum serviço externo foi aprovado.
- Não inclui descoberta de unidades próximas. O desktop rejeita contas
  `STUDENT` e exige contexto de gestão; após confirmação do responsável,
  autenticação e área de aluno permanecem inalteradas e a descoberta fica fora
  desta entrega.

## Requisitos

### Funcionais

- `CAVE_ADMIN` usa exclusivamente o `caveId` do contexto de gestão confirmado.
- `ADMIN` global escolhe a caverna entre as cavernas retornadas pela API
  administrativa; a escolha não é aceita como id livre informado pelo usuário.
- A listagem inclui unidades ativas e arquivadas e exibe nome, endereço,
  bairro, coordenadas e estado.
- A listagem oferece busca e paginação do backend.
- Criar exige nome e coordenadas válidas; endereço e bairro são opcionais.
- Editar envia somente os campos modificados.
- Arquivar exige confirmação e chama o DELETE lógico do backend.
- Reativar usa PATCH com `active: true`.
- A localização pode ser capturada pela Geolocation API do navegador; sem
  permissão ou disponibilidade, as coordenadas podem ser preenchidas
  manualmente.
- Chamadas usam o cliente HTTP centralizado e o JWT da sessão.

### Não funcionais

- Manter limites de domínio e autorização no backend.
- Manter acessibilidade, feedbacks de carregamento/vazio/erro e mensagens
  seguras para erros 401/403/API conforme os componentes existentes.
- Atualizar/inutilizar consultas relacionadas após mutações.

## Contratos e tipos

- `POST /caves/:id/units`: `{ name, address?, neighborhood?, latitude, longitude }`.
- `GET /caves/:id/units`: resposta paginada em `data.data`, com `_meta` e
  `_links`; parâmetros de listagem `page`, `limit` e `search`.
- `GET /caves/:id/units/:unitId`: consulta de unidade.
- `PATCH /caves/:id/units/:unitId`: atualização parcial, incluindo
  `{ active: true }` para reativação.
- `DELETE /caves/:id/units/:unitId`: arquivamento lógico.
- Autorização final permanece no backend; guardas de rota são apenas UX.
- Descoberta em `/practitioners/:practitionerId/home` não é consumida nesta
  entrega por decisão de produto registrada acima.

## Interface e estados

- Página de unidades dentro do shell de gestão.
- Contexto academy/CAVE_ADMIN: caverna definida pelo contexto selecionado.
- Contexto platform/ADMIN: seletor de cavernas alimentado pela API existente.
- Formulário de criação/edição com validação acessível, botão para obter GPS e
  campos de coordenadas.
- Lista com paginação, campo de busca, indicador ativo/arquivado e ações.
- Estados iniciais, carregamento, vazio, erro recuperável, sucesso e validação.

## Critérios de aceite

- [ ] Usuário sem contexto válido não consegue acessar a página protegida.
- [ ] CAVE_ADMIN não escolhe nem envia uma caverna diferente da selecionada no
      contexto confirmado.
- [ ] ADMIN escolhe apenas cavernas retornadas pela API autorizada.
- [ ] A lista administrativa distingue unidades ativas e arquivadas e respeita
      busca e paginação.
- [ ] Criar valida nome/coordenadas e envia os valores numéricos válidos.
- [ ] Editar envia somente os campos alterados.
- [ ] Arquivar pede confirmação e só apresenta sucesso após resposta da API.
- [ ] Reativar envia PATCH com `active: true` e atualiza a lista.
- [ ] Erros de API, inclusive 401 e 403, usam mensagens/feedbacks padrão.
- [ ] GPS indisponível ou negado não bloqueia a entrada manual de coordenadas.

## Estratégia de testes

- Testes de serviço verificam rotas, parâmetros, DTOs e parsing da paginação.
- Testes de schema/form verificam required fields, limites de coordenadas,
  envio numérico e PATCH parcial.
- Testes de hook/página cobrem invalidação, contexto/escopo, busca/paginação,
  status ativo/arquivado, confirmação de arquivamento, reativação e estados de
  carregamento, lista vazia e erro.
- Testes são isolados da API real.

## Dependências e decisões

- API de unidades fornecida no pedido; o backend continua responsável por
  autorização e arquivamento lógico.
- Reutilizar `ManagementShell`, contexto de sessão, serviço de cavernas, Axios,
  React Query, Zod, React Hook Form, componentes de feedback e notificações.
- A escolha do responsável de produto foi preservar a política desktop atual:
  não habilitar estudantes nesta entrega e não expor proximidade a uma rota de
  gestão.
