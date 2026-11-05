# Fila desktop de avaliações (#122)

## Escopo

Consulta por data e professor, com estados de carregamento, vazio e erro. A tela usa a mesma semântica do contrato backend (`date=YYYY-MM-DD`, `teacherId`) e mantém o fuso da data como responsabilidade do backend.

## Fora de escopo

Não aprova/rejeita faixa nem inventa autorização; essas operações dependem dos endpoints e guards do backend.
