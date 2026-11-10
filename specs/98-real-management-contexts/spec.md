# Correção — #98 — [BE] Autorizar acessos por perfil, academia e professor responsável

Tipo: correção de lacuna em card existente, com reabertura autorizada pelo PO. Status: Fazendo; este incremento de integração desktop não encerra as policies legadas pendentes. O PO pediu histórico simples em Notion, atualizado antes da implementação; título literal e tipo de trabalho em cada aviso de card.

## Base e contrato confirmado

Fetch em 10/11/2026, America/Sao_Paulo: desktop dev `e4fa126a60b3a40046150187a74bccd9f66f14fa`, sem commits remotos pendentes. Branch fix/98-real-management-contexts. Backend dependente do PR #22, commit `98a6cf394e9ab3b5c4e6679364cab8276f6f6a18`, revisado em auth/dto/login-response.dto.ts, management/controller, DTO, policies e docs/management-contexts.md. Nenhum endpoint inventado.

POST auth/login conserva envelope/JWT 7200s e pode omitir practitionerId para conta docente/gestão. GET management/contexts retorna array de contextos próprios; roles platform/academy/teacher, ID UUID do grant, label/detail e caveId/caveUnitId/teacherId conforme papel. POST contexts/switch recebe contextId e retorna contexto revalidado; sem estado global no servidor. Operações protegidas enviam X-Management-Context. Lista vazia é válida, 401 expira identidade atual, 403 recusa contexto/operação. Backend ainda não protege todas as operações antigas; este PR não declara isolamento integral dessas rotas.

## Objetivo e critérios de aceite

1. Login docente/gestão sem aluno é válido; encaminha para seleção, sem contexto automático nem fallback local. Credenciais inválidas aparecem no formulário sem redirecionar para sessão expirada.
2. Contextos remotos pertencem ao Query cache por identidade, sem cópia em SessionContext. Loading, vazio, falha/retry, saída e nomes das cavernas/unidades visíveis.
3. Confirmar seleção exige resposta válida e mesmo ID escolhido. Falha ou revogação não abre área protegida. Bloquear duplo envio e impedir resposta tardia de selecionar contexto após saída/troca de conta.
4. HTTP usa token/contexto atuais; login público não herda Bearer/contexto; logout limpa ambos. Contextos de controle são consultados sem header antigo. Cada operação protegida envia seletor atual; servidor continua autoridade.
5. Troca/saída remove cache de dados anterior e cancela queries com signal. Contexto selecionado é só estado de UI; grants não são claims nem persistência local. Token continua em memória.
6. 401/403 atrasados de outra sessão/contexto não redirecionam a conta atual. Consulta/switch tratam 403 localmente para permitir nova escolha/retry. 401 corrente limpa sessão antes de redirecionar; 403 de operação corrente invalida seleção e encaminha a acesso negado.
7. Reutilizar UI, serviços, QueryClient, tipos e normalizador. Sem dependência nova, acesso direto a Axios em componentes, store paralela ou bypass do backend.
8. Executar lint, tipos, Vitest, build, testes reais no navegador com API local e evidências sanitizadas antes de publicar draft para dev. Fetch/comparar novamente antes da publicação. Destino dev segue fluxo da equipe confirmado nesta conversa, prevalecendo sobre template genérico de PR para main.
9. O workflow existente só atende main e faz deploy. Acrescentar check de qualidade para PRs em dev (lint, tipos, testes e build), sem deploy, para que a equipe possa revisar este incremento com CI antes de integrar.

## Desenho e reuso

- auth schema: practitionerId opcional. LoginPage só estabelece sessão e abre /management; lista/switch em hook da feature management com Query e AbortSignal.
- management-context service: Zod por papel para IDs coerentes; validar envelope do switch e ID correspondente. Remover buildLocalFallbackContext. ContextSelection usa nomes reais, pending e mensagens acessíveis.
- SessionProvider mantém identidade e seleção, removendo contexts/setContexts. Sincroniza token e contextId na infraestrutura compartilhada, limpa Query cache em troca/saída. Nenhum import shared → feature/app.
- Axios aplica/remover headers atuais em todo request; não confiar em defaults antigos. app coordena handlers de resposta com SessionProvider e router; shared não navega nem importa app.
- ManagementShell oferece Trocar contexto, limpando seleção/cache antes de abrir seletor; botão Sair no seletor inclusive sem contextos.
- Ajuste de integração do catálogo: a coleção global teachers exige plataforma no backend. Professor usa seu teacherId do contexto validado e lê a unidade pelo endpoint protegido management/caves/.../units/...; não consultar a coleção global para montar dropdown docente. Gestor usa unidades da sua cave e não recebe um catálogo docente global fictício; cadastro por caverna continua pendente do contrato específico. A consulta de aulas do professor envia sua unidade explícita, inclusive ao limpar filtros; essa apresentação não substitui a policy do backend legado.
- Lista de academias do gestor consulta somente GET caves/:caveId do contexto e não oferece cadastro global de caverna. Papel docente não entra na rota Academias; navegação oculta esse destino e a rota valida papel para UX. São ajustes de apresentação sobre descoberta pública existente, não prova de isolamento no servidor; o backend legado ainda precisa das policies.
- Testes: contrato sem practitioner; erro/vazio/retry na lista; switch recusado e pending; navegação por papel; cache/headers limpos; requests públicas e respostas atrasadas; fluxo real com professor, gestor e aluno sem gestão.

## Limites e riscos

Demais policies de backend, CRUD específico de gestor e revisão de vínculos legados continuam no plano da correção. Não converter filtro/rota do frontend em autorização. Nenhum merge, deploy ou movimento de Trello é presumido. PRs anteriores permanecem drafts da equipe; não reescrever branches de terceiros. Notion recebe descrições curtas do início e resultado deste incremento, sem dados pessoais ou segredos.
