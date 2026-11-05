# Implementação

Criada a rota `/preview/management/evaluations` com filtros por data e professor, estados de loading/erro/vazio e lista acessível de avaliações. O serviço usa Axios centralizado, parsing Zod do envelope e `GET /belt-validations` com `date`/`teacherId`; o catálogo de professores vem de `GET /teachers` e só envia UUIDs reais.
