# Pesquisa na lista de academias

Pedido: filtrar a tabela "Academias da rede" por nome de caverna, sem alterar os números globais do resumo.

O endpoint autenticado `GET /platform/caves` já retorna a lista completa, sem paginação. A pesquisa é local sobre a lista carregada: ignora maiúsculas, acentos e espaços nas pontas; permite limpar a busca; mostra contagem e estado "nenhum resultado" sem substituir a mensagem de lista originalmente vazia. Não altera backend, permissões ou operações da tabela.

## Lista de aulas da academia

Na página de detalhes de uma caverna, cada unidade pode trazer dezenas de aulas. Exibir inicialmente 8 aulas por unidade e permitir avançar/voltar entre páginas, sem ocultar a contagem total ou alterar a consulta existente. Cada unidade mantém sua página independentemente; ao mudar a data na URL, volta à primeira página. O objetivo é reduzir a altura visual, não paginar o endpoint.

## Detalhes da caverna — unidades (refinamento)

Problema: os cartões de unidade com aulas embutidas empurram a gestão dos vínculos para baixo e deixam a página excessivamente longa. A lista de unidades deve vir **depois** dos gestores, em tabela compacta e responsiva.

- Usar a listagem de unidades já carregada pelo endpoint existente; sem novos contratos ou mudanças no backend. Buscar por nome (sem distinção entre maiúsculas/acentos), com botão de limpar e resultado vazio específico. Paginar o resultado filtrado em 10 unidades por página; mostrar faixa/total e controles anterior/próxima. Zerar a página ao pesquisar.
- Colunas: nome, endereço, situação e ações. Preservar a criação de unidade e o arquivamento, com confirmação existente. Cada linha permite **mostrar/ocultar aulas**; carregar as aulas apenas da unidade aberta, em vez de abrir todas as aulas de todas as unidades ao entrar. Conservar a prévia paginada de 8 aulas e o filtro `date` da URL; erro da consulta deve permitir tentar novamente.
- Estados de lista: carregando, falha com retry, nenhuma unidade cadastrada e nenhuma unidade correspondente à pesquisa. Resumo de gestores permanece acima da tabela; tabela precisa de rótulos acessíveis, botões operáveis por teclado e rolagem horizontal em telas pequenas.
- Aceite: pesquisa e paginação não alteram dados do servidor; fechar a unidade reduz a tela novamente; mudar a data mostra aulas atualizadas; ações não desaparecem. Testar filtragem, paginação, expansão e estados da prévia; executar lint, typecheck, testes e build.
