# Testes — #98 — [BE] Autorizar acessos por perfil, academia e professor responsável

Validação em 10/11/2026, America/Sao_Paulo. Node 24.19.0, dependências existentes do lockfile; API real Nest/Bun em 3100 com banco dedicado caverna_http, desktop Vite em 5173, Chromium 154 em 1366×900. Banco da API separado das suítes backend que fazem TRUNCATE.

| Check                  | Resultado                                       |
| ---------------------- | ----------------------------------------------- |
| npm run lint           | Passou                                          |
| npm run typecheck      | Passou                                          |
| npm run test:run       | 24 arquivos / 66 testes passaram                |
| npm run build          | Passou; Vite gerou dist                         |
| Navegador com API real | 14 verificações passaram; browser-evidence.json |

## Aceite automatizado

- Login sem practitioner aceito e encaminhado para seleção, sem buscar dados privados antecipadamente.
- Validação Zod por papel; UUID/IDs de escopo; payload de switch ausente ou ID diferente recusados.
- Lista remota vazia, loading, erro e retry, sem fallback nem seleção automática.
- Switch recusado mantém área protegida fechada; duplo clique dispara uma única confirmação; navegação usa papel devolvido pelo servidor.
- Logout durante seleção pendente não permite redirecionamento tardio nem restauração do contexto.
- Troca de conta/contexto limpa dados e headers; lista não é duplicada em SessionContext; cache do contexto anterior não segue na nova seleção.
- HTTP público remove Bearer e seletor antigos; controle de contextos usa só token; operações usam seletor atual.
- 401/403 de outra conta e 403 do contexto anterior não redirecionam a conta/contexto atual. Login 401 permanece no formulário; 401 corrente expira sessão; 403 corrente limpa seleção; 403 de switch/lista permanece recuperável.
- Catálogo docente não consulta identidades globais; lê unidade pelo endpoint protegido. Query de aulas mantém a unidade docente ao limpar/forjar filtro. Gestor usa findOne da cave, sem chamar listagem global.
- Orientação de aluno não é fabricada para uma conta somente administrativa/docente. Seleção tem nome acessível e suporte a teclado.

O teste novo do login sem practitioner falhou antes da alteração, reproduzindo a rejeição indevida do schema. Log local: /workspace/scratch/98-desktop-before.log. Testes anteriores que aprovavam fallback foram substituídos pelo comportamento real exigido, sem remover os cenários de erro.

## Navegador real

1. Aluno sem grant entra e vê lista vazia, sem request de gestão inventada.
2. Senha incorreta fica no login com mensagem segura, sem rota de sessão expirada.
3. Falha 503 controlada de contextos exibe erro e retry; não abre área protegida.
4. Conta real com perfis academia/professor mostra duas escolhas com nomes de caverna/unidade.
5. Switch 403 controlado permanece no seletor.
6. Professor entra em Aulas; leitura real da unidade é 200 no contrato protegido e não consulta GET teachers global.
7. Request de aulas contém unidade e seletor docente confirmados.
8. Gestor entra em Academias consultando somente a cave escolhida; outra cave e formulário de criação global não aparecem.
9. Resposta real de switch retida pelo harness, seguida de logout: liberar resposta não restaura navegação/sessão.
10. Plataforma com um único contexto também exige confirmação explícita.
11. Plataforma navega para destino correto e pode ver o cadastro global.
12. Revogação real do vínculo docente no banco de QA: switch responde 403; atualizar contextos remove a escolha revogada.
13. Nenhum login público herda Bearer ou contexto anterior.
14. Conta sem aluno não recebe a seção Seu perfil de aluno.

Somente falhas/atraso foram controlados no navegador. Login, listagem, confirmação, leitura de unidade e consulta de metadata usaram a API real. Usuários/aluno já sintéticos criados via API; grants de gestão e revogação foram preparados por repositório TypeORM restrito explicitamente ao host local, NODE_ENV=test e caverna_http. Não há endpoint de bootstrap público nem credencial de produção. A restauração de fixture para repetir QA usa a raiz backend para preservar a configuração de decorators do Bun.

Logs finais locais: /workspace/scratch/98-desktop-browser-verified.log, 98-desktop-release-tests.log e 98-desktop-release-build.log. Scripts temporários fora do repo: 98-desktop-ui.cjs e 98-desktop-screenshot.cjs. Evidência versionada sem token: browser-evidence.json; capturas contexts.png e academy.png.

## Ocorrências e limites

Na preparação do harness, uma asserção consultou o título do shell antes da resposta da academia; outra consultou a lista antes do refresh de revogação. Foram ajustadas para aguardar a resposta/renderização correspondente, mantendo as verificações de escopo. Uma restauração de fixture executada na pasta errada falhou no transpile dos decorators; a rodada final usa a raiz backend. Não são apresentados como bugs do produto corrigidos por relaxar testes.

Para reproduzir: subir backend com dependências do PR #22 e banco de QA dedicado; definir VITE_API_BASE_URL=http://127.0.0.1:3100 e executar npm run dev -- --host 0.0.0.0 --port 5173. Testar aluno sem contexto, professor/gestor/plataforma, erro/retry, escolha recusada e logout durante confirmação. No Chromium local, permitir local-network-access. Nunca executar suíte backend com o mesmo banco da API.

Sem revisão visual contra Figma, teste de infraestrutura Azure ou implantação. Backend legado ainda precisa de policies; filtros/guardas de UI não comprovam isolamento no servidor. Card inteiro permanece Fazendo.
