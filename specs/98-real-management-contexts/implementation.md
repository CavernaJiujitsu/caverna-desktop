# Implementação — correção do #98 — [BE] Autorizar acessos por perfil, academia e professor responsável

Este incremento remove o acesso provisório do desktop e usa o contrato real do backend PR #22. É correção de card existente, não card novo; o card permanece Fazendo enquanto houver policies legadas pendentes. Nenhum movimento de Trello ou merge foi executado.

## Entregas

- Login aceita conta sem practitionerId e abre seleção, sem escolher primeiro contexto ou inventar fallback.
- Listagem vive em Query cache por usuário, com cancelamento e loading/vazio/erro/retry. SessionProvider mantém só identidade e seleção, com token em memória.
- Switch exige resposta válida, papel/escopo coerente e mesmo ID solicitado. Lock impede duplo envio; resposta tardia após sair/trocar sessão não restaura contexto.
- HTTP envia credenciais atuais, remove defaults antigos, não herda Bearer no login nem contexto antigo nos endpoints de controle. Interceptores de app coordenam limpeza/redirecionamento e ignoram respostas de conta/contexto anterior.
- Troca/saída remove dados de queries anteriores. Lista de contextos permanece remota; nenhuma store paralela ou cópia de cache foi criada.
- Seleção mostra nomes da caverna/unidade, estado de validação e saída. A orientação de perfil de aluno só aparece se o login informou practitionerId.
- Catálogo docente usa vínculo próprio e leitura protegida da unidade, evitando a coleção global teachers restrita à plataforma. Gestor consulta somente metadata da cave escolhida; docente não entra em Academias; cadastro global só aparece para plataforma. Esses controles de UX não são apresentados como autorização do backend legado.
- Check de qualidade para PR em dev executa lint, tipos, Vitest e build em Node 24, sem deploy. Workflow de release para main preservado.

## Base e decisões

Desktop dev `e4fa126a60b3a40046150187a74bccd9f66f14fa`, conferida por fetch antes do trabalho e antes da publicação. Branch fix/98-real-management-contexts. O destino dev segue o fluxo da equipe confirmado na conversa, prevalecendo sobre template antigo de PR para main.

Backend e mobile foram conferidos e preservados. A dependência é o backend PR #22 e seus PRs anteriores de grants/autorização; não foi alterado contrato nem criada URL alternativa. O catálogo precisou de adaptação porque GET teachers global agora exige plataforma; não inventamos permissão para gestor/professor. Cadastro docente por academia segue pendente do contrato próprio.

## Registro e limites

O histórico simples foi acrescentado à página de Notion indicada pelo PO antes deste incremento, com nova entrada do início da correção; o resultado e link do PR serão acrescentados após publicação. AGENTS documenta título literal, distinção correção/card novo e atualização cronológica, sem expor URL privada de workspace no repositório.

Restam permissões das operações legadas no backend, gestão específica por caverna e revisão de vínculos históricos. Consultas antigas ainda não autorizadas não são tornadas seguras por filtros do frontend. O catálogo global de unidades mantém o limite preexistente de 100; paginação/contagens completas são trabalho próprio. Sem nova dependência, persistência de token, alteração nativa, alegação de fidelidade Figma ou deploy.
