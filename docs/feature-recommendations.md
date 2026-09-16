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

## Estado atual

A baseline das dez recomendações foi implementada. O detalhe operacional está em `docs/implemented-features.md`.

- **P0:** diagnóstico, matriz de competências e remediação.
- **P1:** follow-up de mentoria, ownership/SLA, recomendação adaptativa e checks de CI.
- **P2:** templates versionados, portfólio verificável, cohorts, projetos colaborativos e peer review moderado.
- **Operação:** métricas administrativas básicas, reset scripts, documentação de domínio e privacy boundaries.
- **Analytics da jornada:** eventos idempotentes, funil, taxas de conversão e tempos médios no dashboard administrativo.

As próximas features deste documento são incrementais sobre essa baseline, não substitutos dela.

## Diagnóstico do projeto

### Pontos fortes

- A arquitetura permite evolução incremental: Next.js App Router, tRPC, Prisma, Clerk, Stripe, GitHub, Pusher e UploadThing já estão integrados e organizados por domínio (`src/server/api/root.ts`).
- O produto já possui uma jornada completa de execução: o aluno inicia um template, trabalha no workspace, envia um PR, recebe feedback e pode publicar o resultado no portfólio.
- A fila de atenção do mentor reúne PR reviews, exercícios, tarefas bloqueadas, alunos inativos e sessões de mentoria (`src/server/api/routers/mentorAttention/mentorAttention.router.ts`).
- O modelo de dados já preserva decisões importantes de segurança, idempotência financeira, histórico de review e privacidade de notas de mentoria.

### Lacunas principais restantes

1. **A medição da jornada ainda exige evolução.**
   A baseline agora registra primeira ação, início de recomendação, remediação, segunda avaliação e resposta de review. O próximo passo é usar esses sinais para melhorar qualidade, diagnóstico e planos explícitos.
2. **O plano de aprendizagem precisa continuar sendo validado.**
   Já existe um plano atual por aluno, com ações ordenadas, dependências, prazos e motivo. A próxima evolução é observar se essa estrutura melhora a execução antes de adicionar automação.
3. **A qualidade de peer review ainda pode evoluir.**
   Rubricas, exemplos, checklist e calibração antes do envio agora existem. A próxima evolução é avaliar a qualidade pedagógica do feedback sem transformar reputação em nota de competência.
4. **O matching de reviewers precisa de apoio operacional.**
   O admin ainda decide reviewer e PR, mas sugestões automáticas devem considerar carga, competência, disponibilidade e conflitos.
5. **A cohort agora conduz o ciclo pedagógico básico.**
   O admin agenda kickoff, checkpoints, entregas, encerramento e retrospectiva como eventos bounded da turma. Membros veem a timeline, os eventos aparecem na agenda e podem ser adicionados explicitamente ao plano de aprendizagem.
6. **A cobertura editorial precisa ser monitorada.**
   Ainda é necessário identificar competências sem desafios, outcomes, milestones ou critérios de avaliação suficientes.

## Features novas priorizadas

As dez recomendações originais foram implementadas em uma baseline incremental. A próxima onda abaixo trata as lacunas que permanecem sem reabrir itens deliberadamente adiados, como gamificação, feed social, automação de aprovação e infraestrutura genérica.

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

A baseline foi implementada depois do SLA de mentoria e do ciclo de remediação: o admin vincula projetos `FREE` a uma turma, os membros ativos são inscritos respeitando `maxParticipants`, e peer reviews possuem denúncia, moderação e reputação derivada. Sugestões de matching administrativo agora consideram competência, carga, disponibilidade, autoria e conflitos de projeto; projetos pagos e reputação pedagógica continuam fora desta baseline.

## Próxima onda recomendada

A baseline já testa a tese central. A próxima entrega deve fechar o ciclo de medição e qualidade sem criar um produto paralelo.

### P0 — medir o que já existe — implementado

A jornada agora registra eventos de primeira ação, impressão e início de recomendação, conclusão de remediação, segunda avaliação e resposta de review. O dashboard administrativo exibe funil, taxas, tempos médios e itens atrasados. A instrumentação é idempotente, limitada e não bloqueia a ação principal quando o registro analítico falha.

### P1 — tornar o plano explícito — implementado

O aluno e o admin/mentor podem manter o plano atual do aluno, com objetivo, ações ordenadas, dependências, prazos e motivo. Tarefas, exercícios e remediações são vinculados por snapshot de destino; ações personalizadas e sessões de mentoria também são suportadas. A recomendação automática continua sendo uma sugestão, não uma obrigação.

### P1 — calibrar peer review — implementado

Reviewers consultam rubricas por categoria, exemplos de feedback útil e um checklist antes do envio. Novos reviewers respondem três cenários e precisam acertar pelo menos dois antes de submeter feedback. A moderação continua disponível para exceções.

### P1 — sugerir matching de reviewers — implementado

O procedimento administrativo sugere até dez reviewers considerando competências demonstradas relacionadas ao projeto e aos findings do PR, assignments ativos, disponibilidade semanal autodeclarada, autoria, acesso ao repositório privado, papel no projeto, revisões já feitas no mesmo projeto e calibração. A interface exibe os motivos e permite usar qualquer sugestão ou manter a escolha manual. O admin mantém a decisão final e pode substituir a sugestão.

### P2 — completar o ciclo da cohort — implementado

Cohorts agora possuem eventos bounded de kickoff, checkpoints, entregas, encerramento e retrospectiva. O admin pode agendar, atualizar, completar e consultar a timeline; concluir o evento de encerramento conclui a cohort atomicamente. Membros ativos veem esses eventos na própria timeline e na agenda. Eventos planejados também aparecem como candidatos `COHORT_EVENT` no plano de aprendizagem, preservando a decisão explícita do aluno em vez de criar obrigações automáticas.

### P2 — monitorar cobertura editorial

Criar uma visão administrativa das competências sem desafios, outcomes, milestones, critérios ou evidências recentes, priorizando lacunas que afetam recomendações reais.

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

A análise e a implementação foram feitas sobre o working tree atual, que contém alterações locais e protótipos não commitados.

- `npm run typecheck`: passou.
- `npx prisma validate`: passou.
- Biome passou nos arquivos TypeScript alterados pela implementação.
- `npx vitest run --maxWorkers=1 --minWorkers=1`: 279 testes passaram; 16 suítes falharam durante a coleta por variáveis de ambiente ausentes.

As suítes que não coletaram dependem de variáveis como `DATABASE_URL`, chaves de integração e secrets externos. As migrations ainda precisam ser aplicadas e validadas em um banco real antes de produção.

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
- `src/server/api/routers/cohort/cohort.router.ts`
- `src/features/cohorts/data/peerReviewCalibration.ts`
- `src/features/dashboard/utils/nextAction.ts`
- `prisma/models/project.prisma`
- `prisma/models/projectBase.prisma`
- `prisma/models/exercise.prisma`
- `prisma/models/mentorshipBooking.prisma`
- `prisma/models/prReviewAnalysis.prisma`
  1. analytics da jornada;
  2. plano de aprendizagem explícito;
  3. calibração de peer review;
  4. matching de reviewers;
  5. ciclo completo de cohorts;
  6. monitoramento de cobertura editorial.
