# Recomendações de novas features — CodeWise

## Resumo executivo

O CodeWise já evoluiu de um gerenciador de projetos para uma plataforma de aprendizagem prática para desenvolvedores. Hoje ele conecta:

- catálogo e templates de projetos;
- workspace com tarefas, sprints, epics e backlog;
- trilhas e desafios práticos;
- Pull Request reviews humanas e assistidas por IA;
- mentoria com agendamento, objetivos e follow-up;
- notificações, GitHub e portfólio público.

A principal oportunidade não é adicionar mais recursos de gestão de projetos. É fechar o ciclo pedagógico:

> diagnóstico → plano recomendado → execução → feedback → correção → comprovação de competência

Os módulos necessários já existem, mas ainda armazenam e exibem seus dados de forma relativamente separada.

## Diagnóstico do projeto

### Pontos fortes

- A arquitetura permite evolução incremental: Next.js App Router, tRPC, Prisma, Clerk, Stripe, GitHub, Pusher e UploadThing já estão integrados e organizados por domínio (`src/server/api/root.ts`).
- O produto já possui uma jornada completa de execução: o aluno inicia um template, trabalha no workspace, envia um PR, recebe feedback e pode publicar o resultado no portfólio.
- A fila de atenção do mentor reúne PR reviews, exercícios, tarefas bloqueadas, alunos inativos e sessões de mentoria (`src/server/api/routers/mentorAttention/mentorAttention.router.ts`).
- O modelo de dados já preserva decisões importantes de segurança, idempotência financeira, histórico de review e privacidade de notas de mentoria.

### Lacunas principais

1. **Não existe um modelo compartilhado de competência.**
   Outcomes, milestones, desafios, findings de PR e avaliações de mentor não convergem para uma visão única do que o aluno sabe demonstrar (`prisma/models/projectBase.prisma`, `prisma/models/exercise.prisma`, `prisma/models/prReviewAnalysis.prisma`).
2. **A próxima ação ainda é operacional.**
   A regra atual prioriza tarefa urgente, exercício pendente, review com mudanças solicitadas ou projeto ativo (`src/features/dashboard/utils/nextAction.ts:13-68`). Ela não considera objetivo profissional, lacunas técnicas ou disponibilidade do aluno.
3. **O feedback nem sempre vira trabalho rastreável.**
   Uma review pode pedir mudanças, mas o produto ainda não transforma isso naturalmente em uma ação de aprendizagem que possa ser concluída e reavaliada.
4. **A capacidade do mentor é um gargalo provável.**
   A fila existe, mas ainda precisa de ownership, SLA, distribuição de carga e escalonamento.
5. **A documentação de produto está divergente.**
   `docs/planned-features.md` está vazio. Além disso, `NEW-FEATURES.MD` descreve alguns itens como concluídos e, em outros trechos, como pendentes. Isso dificulta decidir o que realmente deve ser construído.

## Features novas priorizadas

As recomendações abaixo excluem itens já presentes no backlog ou em implementação, como busca do catálogo, UI completa de sprints e epics, histórico de créditos, papéis de projeto, localização, notificações completas, multi-mentor, calendário externo, gamificação e E2E no CI.

### P0 — criar o núcleo pedagógico

#### 1. Diagnóstico inicial e objetivos do aluno

**Esforço:** médio
**Impacto:** muito alto

Antes de iniciar um projeto ou trilha, o aluno informa:

- objetivo profissional;
- nível percebido;
- tecnologias de interesse;
- disponibilidade semanal;
- experiência prévia relevante.

Um diagnóstico curto pode produzir uma linha de base e indicar um primeiro caminho. O objetivo não é criar uma prova extensa, mas reduzir o vazio entre cadastro e primeira ação útil.

**Dependências:** onboarding e uma taxonomia inicial de competências.

#### 2. Matriz de competências e progresso verificável

**Esforço:** médio/alto
**Impacto:** muito alto

Criar uma lista editorial curta de competências, como React, testes, Git, modelagem de dados, arquitetura e acessibilidade. Relacionar cada competência a:

- desafios;
- learning outcomes;
- milestones;
- critérios de aceitação;
- categorias de review;
- avaliações do mentor.

O aluno deve visualizar estados como `não avaliado`, `em desenvolvimento` e `demonstrado`, sempre acompanhados da evidência que justificou o estado.

Não criar inicialmente um grafo genérico ou uma plataforma de certificação. Uma matriz simples, com poucas competências bem definidas, é mais útil e mais fácil de validar.

**Dependências:** diagnóstico, conteúdo editorial e regras de avaliação.

#### 3. Ciclo de remediação após feedback

**Esforço:** médio
**Impacto:** alto

Quando um mentor aceita um finding ou solicita mudanças em um exercício, o aluno recebe uma ação explícita:

1. entender o problema;
2. corrigir o código;
3. executar um exercício ou tarefa complementar;
4. enviar novamente para avaliação;
5. fechar a ação quando a evidência for aprovada.

A primeira versão deve suportar apenas os destinos necessários — tarefa, exercício ou pauta de mentoria — em vez de criar um workflow genérico configurável.

**Dependências:** PR review, exercise review, notificações e matriz de competências.

### P1 — melhorar a execução e a operação

#### 4. Follow-up de mentoria acionável

**Esforço:** pequeno/médio
**Impacto:** alto

O modelo de mentoria já possui objetivo, follow-up, prazo e status de ação (`prisma/models/mentorshipBooking.prisma:19-42`). A evolução natural é permitir que a ação:

- seja vinculada a uma tarefa ou desafio;
- tenha um responsável e prazo;
- apareça no dashboard e na agenda;
- gere lembrete apenas quando houver uma ação útil;
- seja revisada na próxima sessão.

Isso transforma uma anotação de sessão em continuidade de aprendizagem.

#### 5. SLA e ownership da fila do mentor

**Esforço:** médio
**Impacto:** alto

Adicionar à fila existente:

- ação de assumir/liberar item;
- mentor responsável;
- idade e prazo de atendimento;
- limite de itens por mentor;
- escalonamento de reviews atrasadas;
- métricas de tempo até primeira resposta e conclusão.

A primeira versão pode funcionar com um único tipo de mentor. O objetivo é tornar a capacidade visível antes de introduzir uma estrutura complexa de permissões.

#### 6. Plano de aprendizagem adaptativo

**Esforço:** alto
**Impacto:** muito alto

Depois de existir diagnóstico, matriz de competências e remediação, o dashboard pode recomendar o próximo passo usando:

- objetivo do aluno;
- competência mais importante ainda não demonstrada;
- feedback recente;
- tempo disponível;
- atividade atual;
- dependências do projeto.

A recomendação deve explicar o motivo: “faça este desafio porque seu último review apontou falta de testes de integração”. Não deve ser uma caixa-preta nem depender de IA na primeira versão.

**Dependências:** features 1, 2 e 3.

#### 7. Gate de CI para exercícios

**Esforço:** médio/alto
**Impacto:** alto

Usar a integração GitHub para mostrar checks obrigatórios do repositório de exercícios e sinalizar claramente quando testes ou lint falham antes da revisão humana.

O sistema não deve aprovar automaticamente. O objetivo é eliminar verificações mecânicas e dar ao mentor mais contexto antes de abrir o código.

**Dependências:** GitHub App, convenção de checks e política de segurança para execução de código.

### P2 — diferenciação e escala

#### 8. Templates versionados e revisão editorial

**Esforço:** médio
**Impacto:** médio/alto

Manter versões publicadas de templates, com revisão editorial antes da publicação e histórico de alterações. Projetos já iniciados continuam usando seu snapshot, enquanto novos alunos recebem somente uma versão aprovada.

Isso reduz o risco de um conteúdo publicado mudar silenciosamente e dificulta comparar resultados entre gerações de alunos.

#### 9. Portfólio verificável por competência

**Esforço:** médio
**Impacto:** alto

Evoluir o portfólio existente para mostrar:

- competências demonstradas;
- projetos e desafios que servem como evidência;
- milestones concluídos;
- avaliação ou selo do mentor;
- links públicos com consentimento explícito.

O portfólio passa a funcionar como um relatório de evidências, não apenas como uma página de projetos (`prisma/models/project.prisma:22-30`).

**Dependências:** matriz de competências e controle de privacidade.

#### 10. Cohorts e peer review

**Esforço:** alto
**Impacto:** médio/alto

Criar grupos recorrentes de alunos, projetos colaborativos e revisões entre pares. Essa feature pode aumentar retenção e reduzir dependência do mentor, mas exige moderação, reputação e regras contra feedback de baixa qualidade.

Só deve ser priorizada depois de resolver SLA de mentoria e o ciclo de remediação.

## Primeira entrega recomendada

Eu começaria por um único vertical slice:

1. definir de 8 a 12 competências;
2. adicionar um diagnóstico curto no onboarding;
3. mapear um track de exercícios e um template de projeto para essas competências;
4. registrar evidências aprovadas;
5. mostrar uma lacuna no dashboard;
6. transformar uma decisão de review em uma ação de remediação;
7. medir se a ação foi concluída e reavaliada.

Essa entrega testa a tese central sem exigir um novo produto paralelo.

## Métricas de sucesso

- tempo entre cadastro e primeira ação relevante;
- percentual de alunos que iniciam uma atividade recomendada;
- percentual de ações de remediação concluídas;
- percentual de remediações aprovadas na segunda avaliação;
- tempo médio de resposta e conclusão de reviews;
- evolução entre diagnóstico inicial e evidência aprovada;
- número de alunos com pelo menos uma competência demonstrada;
- carga média e itens atrasados por mentor.

Não usar quantidade de tarefas concluídas ou velocity como métrica principal de aprendizagem. Elas medem atividade, não domínio.

## O que não priorizar agora

- reescrever o tRPC para REST sem um consumidor externo real;
- criar um event bus genérico;
- introduzir uma camada genérica de repositories apenas para reorganizar arquivos;
- adicionar mais recursos de Kanban antes de fechar a jornada pedagógica;
- automatizar aprovação de código com IA;
- criar gamificação antes de existir uma definição confiável de progresso;
- criar um feed social ou chat geral sem uma hipótese clara de aprendizagem;
- executar código arbitrário de alunos dentro do processo da aplicação.

## Estado de verificação do repositório

A análise foi feita sobre o working tree atual, que contém alterações locais e protótipos não commitados.

- `bun run typecheck`: passou.
- `bun run test --run`: 208 testes passaram; 17 suítes falharam durante a inicialização por variáveis de ambiente ausentes.
- `bun run lint`: falhou no estado atual.
- `bunx biome lint src prisma`: encontrou 7 problemas, principalmente parsing da sintaxe Tailwind no CSS e ordenação de classes.

Essas falhas não impedem a recomendação de produto, mas devem ser resolvidas antes de usar a saúde do repositório como sinal de prontidão para produção.

## Fontes analisadas

- `README.md`
- `CONTEXT.md`
- `NEW-FEATURES.MD`
- `docs/current-features.md`
- `docs/planned-features.md`
- `docs/technical/design.md`
- `docs/technical/query.md`
- `docs/technical/authentication.md`
- `docs/adr/0004-internal-mentorship-scheduling.md`
- `src/server/api/root.ts`
- `src/server/api/routers/mentorAttention/mentorAttention.router.ts`
- `src/features/dashboard/utils/nextAction.ts`
- `prisma/models/project.prisma`
- `prisma/models/projectBase.prisma`
- `prisma/models/exercise.prisma`
- `prisma/models/mentorshipBooking.prisma`
- `prisma/models/prReviewAnalysis.prisma`
