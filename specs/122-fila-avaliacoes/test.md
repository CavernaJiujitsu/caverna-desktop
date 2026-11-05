# Testes

- `bun run lint`: passou.
- `bun run typecheck`: passou.
- `bun run test:run`: 15 arquivos, 26 testes passaram.
- O service de professores cobre o parsing do envelope e UUID real.
- Service/página usam API real; teste HTTP autenticado/manual permanece pendente porque o contrato de sessão do desktop ainda está bloqueado conforme `docs/api-integration.md`.
