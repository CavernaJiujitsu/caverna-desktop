# Gestão desktop de aulas e inscritos

## Contexto e objetivo

O card Trello [#102](https://trello.com/c/tTDpHjAd/102-fe-implementar-gest%C3%A3o-desktop-de-aulas-e-inscritos) solicita a casca desktop para consultar encontros, criar/editar aulas e visualizar inscritos. Os contratos do backend #101 ainda não estão disponíveis; por isso a primeira entrega usa um adapter local tipado e mantém a integração HTTP como dependência explícita.

## Escopo

- Em escopo: listagem por unidade/data, criação/edição de encontro, lotação, elegibilidade, movimentos e detalhe de inscritos.
- Fora de escopo: CRUD de academia/unidade/professor, fila de avaliações #122, avaliação individual #106, recorrência e exclusão destrutiva.

## Requisitos funcionais

1. Filtrar encontros por unidade e data.
2. Mostrar horário, professor, tipo, capacidade e ocupação atual.
3. Criar e editar unidade, professor, data, início/fim, capacidade, tipo, faixas elegíveis e movimentos selecionados.
4. Abrir o detalhe de inscritos de um encontro.
5. Mostrar estados de carregamento, vazio, erro e sucesso.
6. Preservar dados do formulário em erro e impedir submissão duplicada.
7. Não oferecer ações que dependam de autorização ainda não confirmada.

## Contrato provisório

O adapter local usa `Class`, `ClassInput`, `Enrollment` e `ClassFilters`. Os nomes representam o contrato esperado, mas não são contrato oficial do backend. A troca para Axios deverá ocorrer apenas após confirmação de endpoints, autenticação, DTOs e erros pelo backend.

## Critérios de aceite

- [ ] Filtrar encontros por unidade/data e consultar inscritos.
- [ ] Criar/editar os campos previstos pelo card.
- [ ] Mostrar erros sem perder preenchimento.
- [ ] Mostrar lotação atual e respeitar estados de acesso.
- [ ] Cobrir loading, vazio, erro, sucesso e duplo envio.
- [ ] Selecionar movimentos por ID sem duplicidade e separar elegibilidade.
- [ ] Manter conteúdo efetivo da ocorrência no detalhe.

## Estratégia de testes

Testes de serviço para o adapter e testes de página para filtros, vazio, edição, criação, detalhe, validação e estados assíncronos. Nenhum teste chama API real.

## Decisões abertas

- Endpoints, DTOs e transporte de sessão do backend #101.
- Semântica final de `class_belts`, movimentos já creditados e conflitos `409`.
- Permissões por contexto e ações disponíveis para cada perfil.
