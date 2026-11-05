# Testes

- `bun run lint`: passou.
- `bun run typecheck`: passou.
- `bun run test:run`: 20 arquivos, 33 testes passaram.
- O service de professores cobre o parsing do envelope e UUID real.
- Service/página usam API real; o cliente Axios anexa Bearer em memória e há teste de login, request autenticado e limpeza. Teste HTTP manual com API/usuário seedados permanece pendente.
