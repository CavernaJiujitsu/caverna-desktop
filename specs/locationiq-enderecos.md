# Endereços assistidos no desktop

Fonte de requisitos: `../backend/docs/locationiq-enderecos/frd-locationiq-enderecos.md`.

## Escopo e contrato

- Criação/edição de unidade, criação de caverna com unidades iniciais e cadastro de aluno oferecem busca textual com escolha explícita, GPS com endereço reverso para confirmação e entrada manual de endereço e coordenadas quando necessário.
- `GET /api/v1/practitioners/addresses/search?q=...` devolve lista de `{ address, latitude, longitude }`; `GET /api/v1/practitioners/addresses/reverse?latitude=...&longitude=...` devolve um resultado ou `null`. Ambos requerem JWT de `ADMIN` ou `CAVE_ADMIN`. A aplicação não recebe a chave LocationIQ.
- Endereço (até 500 caracteres) e ambas as coordenadas válidas são obrigatórios nesses formulários; `0,0` não é localização válida. Bairro da unidade permanece opcional e editável. O backend aceita `address` opcional junto com `coordinates` no `POST /practitioners`, preservando o onboarding mobile sem endereço.
- Nenhuma sugestão é salva sem seleção. Respostas atrasadas não substituem alterações subsequentes; erros de GPS ou do provedor permitem entrada manual. Ao editar unidade, salvar sem alterações não deve apagar a localização existente.

## Aceitação e verificação

- Seleção atualiza endereço e coordenadas da unidade correta; alterar endereço selecionado invalida as coordenadas antigas.
- GPS apresenta endereço provável para escolha; se o reverso falha, permite digitar endereço com as coordenadas obtidas. Sem GPS, todos os campos podem ser preenchidos manualmente.
- Testes dos três formulários, do componente e do cliente de API cobrem os fluxos acima. Executar `npm run lint`, `npm run typecheck`, `npm run test:run` e `npm run build` antes da entrega.

## Dependência operacional

O backend deve ser publicado com a migration 043 aplicada antes de publicar o desktop; push em `dev` sozinho não publica o site.
