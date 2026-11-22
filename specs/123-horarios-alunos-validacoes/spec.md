# Feature: horários, alunos e fila de validações por caverna

## Context and problem

Administradores de caverna não conseguem concluir o cadastro de um horário quando não há professor vinculado à caverna, e a interface sugere incorretamente que um horário pode abranger toda a caverna embora o contrato atual exija uma unidade. A listagem de alunos já existe por unidade, mas a fila de faixas pendentes não é acessível pelo menu de gestão e nem é filtrável por caverna.

## Objective

Permitir que a gestão cadastre horários recorrentes em uma unidade com orientação clara sobre o professor necessário, consulte alunos matriculados e consulte alunos da própria caverna com validação de faixa pendente.

## Scope and non-scope

- In scope: alinhar o formulário de horários ao contrato de unidade obrigatória; indicar e acessar o cadastro de professor; expor a fila de validações pendentes no contexto de caverna; filtrar essa fila por caverna no backend; criar um seed local idempotente de aluno matriculado com validação pendente.
- Out of scope: criar aula avulsa, alterar regras de autorização, aprovar/rejeitar validações ou mudar os dados fornecidos para o seed.

## Functional requirements

1. O formulário exige uma unidade e um professor vinculado à caverna antes de enviar um horário recorrente; dia da semana e período descrevem a recorrência semanal.
2. Sem professores vinculados, a tela informa a ação necessária e oferece navegação ao cadastro de professores.
3. A tela de matrículas continua listando alunos ativos por unidade.
4. A tela de avaliações mostra, no contexto de caverna, validações `PENDING` de praticantes com matrícula ativa em qualquer unidade daquela caverna.
5. O seed local cria, ou reutiliza, o praticante `gabrielgodoi452@gmail.com`, sua matrícula ativa em uma unidade seed e uma validação `PENDING`, sem registrar a senha em versionamento.

## Non-functional requirements

- Manter Zod em respostas não confiáveis, acessibilidade semântica e estados de carregamento, vazio, erro e sem permissão.
- Não vazar senha em saída de teste, documentação ou dados de produção; o seed só pode executar em `NODE_ENV=local`/`test`.

## Data contracts

- `POST /training/schedules` requer `caveUnitId`, `teacherId`, título, dia, horário, período e capacidade.
- `GET /belt-validations` recebe `status=PENDING` e `caveId`; o backend aplica o vínculo ativo do praticante a uma unidade da caverna.
- A listagem de validações inclui o usuário do praticante para mostrar nome e e-mail.

## Interface states

- Horários: catálogos carregando, unidade/professor ausente, validação, erro HTTP e sucesso.
- Fila: carregando, vazia, erro, itens pendentes e contexto sem cave válida.

## Acceptance criteria

- [ ] Não existe opção de horário sem unidade incompatível com o backend.
- [ ] Um horário em toda segunda-feira é criado ao selecionar segunda-feira e o período desejado.
- [ ] A gestão consegue visualizar alunos matriculados por unidade.
- [ ] A gestão consegue visualizar validações `PENDING` de alunos ativos da caverna selecionada.
- [ ] O seed local idempotente fornece um aluno pendente com o e-mail solicitado, sem expor a senha.

## Test strategy

- Testes de formulário para unidade obrigatória, ausência de professor e envio válido.
- Testes de serviço/hook para filtros de validação.
- Teste de repositório/backend para filtro `caveId` e relação `practitioner.user`; executar typecheck, lint, testes e build proporcionais.

## Dependencies and technical decisions

- O backend atual exige unidade e professor em horários; o desktop não deve prometer escopo de caverna sem esse contrato.
- A validação pendente não possui aula; seu escopo de caverna é inferido pela matrícula ativa do praticante.
