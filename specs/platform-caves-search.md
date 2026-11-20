# Pesquisa na lista de academias

Pedido: filtrar a tabela "Academias da rede" por nome de caverna, sem alterar os números globais do resumo.

O endpoint autenticado `GET /platform/caves` já retorna a lista completa, sem paginação. A pesquisa é local sobre a lista carregada: ignora maiúsculas, acentos e espaços nas pontas; permite limpar a busca; mostra contagem e estado "nenhum resultado" sem substituir a mensagem de lista originalmente vazia. Não altera backend, permissões ou operações da tabela.

## Lista de aulas da academia

Na página de detalhes de uma caverna, cada unidade pode trazer dezenas de aulas. Exibir inicialmente 8 aulas por unidade e permitir avançar/voltar entre páginas, sem ocultar a contagem total ou alterar a consulta existente. Cada unidade mantém sua página independentemente; ao mudar a data na URL, volta à primeira página. O objetivo é reduzir a altura visual, não paginar o endpoint.
